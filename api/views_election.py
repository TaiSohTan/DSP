from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction
from django.db.models import F
from .models import Election, Candidate, Vote
from .serializers.election_serializers import (
    ElectionSerializer,
    PublicElectionSerializer,
    CandidateSerializer,
    VoteSerializer,
    VoteReceiptSerializer,
    VoteConfirmationSerializer
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
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['start_date', 'end_date', 'created_at']
    ordering = ['-start_date']
    
    def get_serializer_class(self):
        """
        Return different serializers based on user permissions.
        - Admin users get the full serializer with blockchain details
        - Regular users get the public serializer without sensitive details
        """
        if self.request.user.is_staff:
            return ElectionSerializer
        return PublicElectionSerializer
    
    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        - GET requests are allowed for any authenticated user
        - POST, PUT, PATCH, DELETE are restricted to admin users only
        """
        if self.action in ['list', 'retrieve', 'results']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAdminUser]
        return [permission() for permission in permission_classes]
    
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
              # Convert datetime to UTC Unix timestamps for the smart contract
            # Explicitly ensure we're using UTC timestamps to align with blockchain time
            import datetime
            from django.utils import timezone
            
            # Convert aware datetime to UTC, then get timestamp
            start_time_utc = int(timezone.localtime(election.start_date, timezone.utc).timestamp())
            end_time_utc = int(timezone.localtime(election.end_date, timezone.utc).timestamp())
            
            # Log the timestamps for debugging
            import logging
            logger = logging.getLogger(__name__)
            logger.info(f"Deploying contract for election {election.title}")
            logger.info(f"Original start time: {election.start_date}")
            logger.info(f"UTC timestamp: {start_time_utc}")
            
            # Deploy the contract
            tx_hash, contract_address = ethereum_service.deploy_election_contract(
                private_key=admin_user.ethereum_private_key,
                title=election.title,
                description=election.description,
                start_time=start_time_utc,
                end_time=end_time_utc
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
                candidate.blockchain_id = candidate_id
                candidate.save()

            # Re-fetch updated election and candidates
            election.refresh_from_db()
            candidates = list(election.candidates.all().values('id', 'name', 'description', 'blockchain_id'))

            return Response({
                'message': 'Contract deployed successfully',
                'contract_address': contract_address,
                'transaction_hash': tx_hash,
                'candidates': candidates
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
        """Create an unconfirmed vote and send OTP for confirmation."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Get validated data
        election_id = serializer.validated_data.get('election_id')
        candidate_id = serializer.validated_data.get('candidate_id')
        
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
        
        # Get user
        user = request.user
        
        try:
            # Check if user has already voted in this election
            if Vote.objects.filter(voter=user, election=election, is_confirmed=True).exists():
                return Response(
                    {'error': 'You have already cast a confirmed vote in this election'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Delete any previous unconfirmed votes for this user in this election
            Vote.objects.filter(voter=user, election=election, is_confirmed=False).delete()
              # Create unconfirmed vote
            vote = Vote.objects.create(
                voter=user,
                election=election,
                candidate=candidate,
                is_confirmed=False
            )
            
            # Send OTP for confirmation
            OTPService.send_email_otp(user.email, purpose='vote_confirmation')
            
            return Response({
                'message': 'Vote created successfully. Please confirm with OTP sent to your email.',
                'vote_id': vote.id,
                'election_title': election.title,
                'candidate_name': candidate.name
            }, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            return Response(
                {'error': f'Failed to create vote: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    @action(detail=False, methods=['post'])
    def confirm(self, request):
        """Confirm a vote with OTP and cast it on the blockchain."""
        serializer = VoteConfirmationSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        # Get validated data
        vote = serializer.validated_data['vote']
        email_otp = serializer.validated_data['email_otp']
        
        # Store election and candidate for reference, but delete the vote if blockchain fails
        election = vote.election
        candidate = vote.candidate
        user = request.user
        
        # OTP is already verified in the serializer, no need to verify again here
        
        # Cast vote on blockchain
        try:
            ethereum_service = EthereumService()
            
            # Just get the user without attempting to create a wallet
            # The wallet should already have been created during verification
            
            # Ensure the user has a wallet before proceeding
            if not user.ethereum_address or not user.ethereum_private_key:
                # This should not happen since wallet creation is handled during verification
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"User {user.email} has no Ethereum wallet even after verification")
                # Delete the unconfirmed vote to allow retry
                vote.delete()
                return Response(
                    {'error': 'User has no Ethereum wallet. Please contact support.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Check user's wallet balance and fund if necessary
            user_address = request.user.ethereum_address
            if user_address:
                balance = ethereum_service.w3.eth.get_balance(user_address)
                min_required = ethereum_service.w3.to_wei(0.01, 'ether')  # 0.01 ETH minimum for voting
                
                if balance < min_required:
                    # User has insufficient funds, auto-fund their wallet
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.info(f"User {request.user.email} has insufficient funds ({ethereum_service.w3.from_wei(balance, 'ether')} ETH). Auto-funding wallet.")
                    
                    # Fund with 0.5 ETH (enough for several votes)
                    ethereum_service.fund_user_wallet(user_address, amount_ether=0.5)
            
            # Check if the election is active on the blockchain before casting vote
            try:
                is_active_on_chain = ethereum_service.check_election_active(
                    contract_address=election.contract_address
                )
                
                if not is_active_on_chain:
                    # Delete the unconfirmed vote to allow retry when election becomes active
                    vote.delete()
                    return Response(
                        {'error': 'This election is not currently active on the blockchain. Voting is not possible at this time.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error checking election active status: {str(e)}")
                # Delete the unconfirmed vote to allow retry
                vote.delete()
                return Response(
                    {'error': 'Could not verify election status. Please try again later.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
            # Cast vote on blockchain
            try:
                tx_hash = ethereum_service.cast_vote(
                    private_key=request.user.ethereum_private_key,
                    contract_address=election.contract_address,
                    candidate_id=candidate.blockchain_id
                )
                
                # Generate vote receipt hash
                receipt_data = f"{request.user.id}:{election.id}:{candidate.id}:{tx_hash}"
                receipt_hash = hashlib.sha256(receipt_data.encode()).hexdigest()
                
                # Update vote record only after blockchain transaction succeeds
                with transaction.atomic():
                    vote.is_confirmed = True
                    vote.transaction_hash = tx_hash
                    vote.receipt_hash = receipt_hash
                    vote.save()
                
                # Return success response with vote receipt
                receipt_serializer = VoteReceiptSerializer(vote)
                return Response({
                    'message': 'Vote confirmed and cast on blockchain successfully.',
                    'receipt': receipt_serializer.data
                }, status=status.HTTP_200_OK)
            
            except Exception as e:
                logger = logging.getLogger(__name__)
                logger.error(f"Failed to cast vote on blockchain: {str(e)}")
                # Delete the unconfirmed vote to allow retry
                vote.delete()
                return Response(
                    {'error': f'Failed to confirm vote on the blockchain: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except Exception as e:
            # Delete the unconfirmed vote to allow retry
            vote.delete()
            return Response(
                {'error': f'Failed to process vote: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )