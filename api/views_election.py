from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction
from .models import Election, Candidate, Vote
from .serializers.election_serializers import (
    ElectionSerializer,
    CandidateSerializer,
    VoteSerializer,
    VoteReceiptSerializer
)
from blockchain.services.ethereum_service import EthereumService
from .services.otp_service import OTPService
import hashlib

class ElectionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for elections.
    Provides CRUD operations and additional actions for election management.
    """
    queryset = Election.objects.all()
    serializer_class = ElectionSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['start_date', 'end_date', 'created_at']
    ordering = ['-start_date']
    
    def get_queryset(self):
        """Filter elections based on query parameters."""
        queryset = Election.objects.all()
        
        # Filter by active status
        active = self.request.query_params.get('active')
        if active is not None:
            is_active = active.lower() == 'true'
            now = timezone.now()
            if is_active:
                queryset = queryset.filter(start_date__lte=now, end_date__gte=now, is_active=True)
            else:
                queryset = queryset.exclude(start_date__lte=now, end_date__gte=now, is_active=True)
        
        return queryset
    
    def perform_create(self, serializer):
        """Set the created_by field to the current user when creating an election."""
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def deploy_contract(self, request, pk=None):
        """
        Deploy the election contract to the Ethereum blockchain.
        Only administrators can deploy contracts.
        """
        election = self.get_object()
        
        # Check if contract is already deployed
        if election.contract_address:
            return Response(
                {'error': 'Contract already deployed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get admin's Ethereum private key
        admin_user = request.user
        if not admin_user.ethereum_private_key:
            return Response(
                {'error': 'Admin does not have an Ethereum wallet'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Deploy contract
        try:
            ethereum_service = EthereumService()
            
            # Convert datetime to Unix timestamps for the smart contract
            start_time = int(election.start_date.timestamp())
            end_time = int(election.end_date.timestamp())
            
            # Deploy the contract
            tx_hash, contract_address = ethereum_service.deploy_election_contract(
                private_key=admin_user.ethereum_private_key,
                title=election.title,
                description=election.description,
                start_time=start_time,
                end_time=end_time
            )
            
            # Update election with contract address
            election.contract_address = contract_address
            election.is_active = True
            election.save()
            
            # Add candidates to the contract
            for candidate in election.candidates.all():
                candidate_id = candidate.blockchain_id or candidate.id.int % 1000000  # Use existing ID or generate one
                
                ethereum_service.add_candidate(
                    private_key=admin_user.ethereum_private_key,
                    contract_address=contract_address,
                    candidate_id=candidate_id,
                    name=candidate.name,
                    party=''  # No party field in our model, could add later
                )
                
                # Update candidate with blockchain ID
                candidate.blockchain_id = candidate_id
                candidate.save()
            
            return Response({
                'message': 'Contract deployed successfully',
                'contract_address': contract_address,
                'transaction_hash': tx_hash
            })
        
        except Exception as e:
            return Response(
                {'error': f'Failed to deploy contract: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def results(self, request, pk=None):
        """
        Get the results of an election from the blockchain.
        """
        election = self.get_object()
        
        # Check if contract is deployed
        if not election.contract_address:
            return Response(
                {'error': 'Election contract not deployed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get results from blockchain
        try:
            ethereum_service = EthereumService()
            results = ethereum_service.get_election_results(election.contract_address)
            
            return Response(results)
        
        except Exception as e:
            return Response(
                {'error': f'Failed to get election results: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class CandidateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for candidates.
    Provides CRUD operations for candidate management.
    """
    queryset = Candidate.objects.all()
    serializer_class = CandidateSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        """Filter candidates by election."""
        queryset = Candidate.objects.all()
        
        # Filter by election
        election_id = self.request.query_params.get('election')
        if election_id:
            queryset = queryset.filter(election_id=election_id)
        
        return queryset

class VoteViewSet(viewsets.ModelViewSet):
    """
    ViewSet for votes.
    Provides vote creation and retrieval.
    """
    queryset = Vote.objects.all()
    serializer_class = VoteSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        """Return different serializers based on the action."""
        if self.action == 'retrieve' or self.action == 'list':
            return VoteReceiptSerializer
        return VoteSerializer
    
    def get_queryset(self):
        """Filter votes to only show the user's votes."""
        return Vote.objects.filter(voter=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """Cast a vote on the blockchain."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Get validated data
        election_id = serializer.validated_data.get('election_id')
        candidate_id = serializer.validated_data.get('candidate_id')
        email_otp = serializer.validated_data.get('email_otp')
        
        # Verify email OTP
        if not OTPService.verify_otp(request.user.email, email_otp, is_email=True):
            return Response(
                {'error': 'Invalid or expired OTP'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get election and candidate
        try:
            election = Election.objects.get(id=election_id)
            candidate = Candidate.objects.get(id=candidate_id, election=election)
        except (Election.DoesNotExist, Candidate.DoesNotExist):
            return Response(
                {'error': 'Election or candidate not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if election is active and contract is deployed
        if not election.is_active or not election.contract_address:
            return Response(
                {'error': 'Election is not active or contract not deployed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if candidate has a blockchain ID
        if not candidate.blockchain_id:
            return Response(
                {'error': 'Candidate not properly registered on blockchain'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Cast vote on blockchain
        try:
            ethereum_service = EthereumService()
            
            # Get user's Ethereum private key
            user = request.user
            if not user.ethereum_private_key:
                return Response(
                    {'error': 'User does not have an Ethereum wallet'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Cast vote on blockchain
            tx_hash = ethereum_service.cast_vote(
                private_key=user.ethereum_private_key,
                contract_address=election.contract_address,
                candidate_id=candidate.blockchain_id
            )
            
            # Generate vote receipt hash
            receipt_data = f"{user.id}:{election.id}:{candidate.id}:{tx_hash}"
            receipt_hash = hashlib.sha256(receipt_data.encode()).hexdigest()
            
            # Create vote record
            with transaction.atomic():
                vote = Vote.objects.create(
                    voter=user,
                    election=election,
                    candidate=candidate,
                    transaction_hash=tx_hash,
                    is_confirmed=True
                )
                
                # Update user's votes cast count
                profile = user.profile
                profile.votes_cast += 1
                profile.save()
            
            return Response({
                'message': 'Vote cast successfully',
                'transaction_hash': tx_hash,
                'receipt_hash': receipt_hash,
                'vote_id': vote.id
            }, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            return Response(
                {'error': f'Failed to cast vote: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )