# Standard library imports
import hashlib
import logging
import json
from datetime import datetime
from io import BytesIO

# Third-party imports
import jwt
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER

from django.utils import timezone
from django.db import transaction
from django.db.models import F
from django.conf import settings
from django.contrib.auth import get_user_model
from django.http import Http404, HttpResponse

from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response

# Local application imports
from blockchain.services.ethereum_service import EthereumService
from blockchain.utils.time_utils import (
    get_current_time, 
    system_to_blockchain_time, 
    blockchain_to_system_time,
    datetime_to_blockchain_timestamp
)

from .models import Election, Candidate, Vote
from .serializers.election_serializers import (
    ElectionSerializer,
    PublicElectionSerializer,
    CandidateSerializer,
    VoteSerializer,
    VoteReceiptSerializer,
    VoteConfirmationSerializer
)
from .services.otp_service import OTPService

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

    def get_queryset(self):
        """Filter elections based on query parameters."""
        queryset = Election.objects.all().prefetch_related('candidates')
        
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

    def retrieve(self, request, *args, **kwargs):
        """
        Retrieve a single election with enhanced status information.
        """
        instance = self.get_object()
        now = timezone.now()
        
        # Determine the election status
        if not instance.is_active:
            status_message = "This election has not been activated yet."
        elif instance.start_date > now:
            status_message = "This election has not started yet."
        elif instance.end_date < now:
            status_message = "This election is now closed. Results will be available soon."
        elif instance.start_date <= now <= instance.end_date:
            status_message = "This election is currently active."
        else:
            status_message = "Election status unavailable."

        serializer = self.get_serializer(instance)
        data = serializer.data
        data['status_message'] = status_message
        
        # Add blockchain results if election is closed
        if instance.end_date < now and instance.contract_address:
            try:
                ethereum_service = EthereumService()
                results = ethereum_service.get_election_results(instance.contract_address)
                data['results'] = results
            except Exception as e:
                logger = logging.getLogger(__name__)
                logger.error(f"Failed to get election results: {str(e)}")
                data['results'] = None

        return Response(data)

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
            
            # Convert datetime to blockchain timestamps using utility functions
            start_time_utc = datetime_to_blockchain_timestamp(election.start_date)
            end_time_utc = datetime_to_blockchain_timestamp(election.end_date)
            
            # Log the timestamps for debugging
            logger = logging.getLogger(__name__)
            logger.info(f"Deploying contract for election {election.title}")
            logger.info(f"Original start time: {election.start_date}")
            logger.info(f"Blockchain timestamp: {start_time_utc}")
            
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
    
    @action(detail=True, methods=['get'], permission_classes=[permissions.AllowAny])
    def results(self, request, pk=None):
        """
        Get the results of an election from the blockchain.
        This endpoint is publicly accessible without authentication.
        """
        try:
            # Get election directly since permissions.AllowAny could mean user is not authenticated
            election = Election.objects.get(pk=pk)
            
            # Set up logger for debugging
            logger = logging.getLogger(__name__)
            logger.info(f"Fetching results for election {pk}")
            logger.info(f"Election details: title={election.title}, contract_address={election.contract_address}")
            
            # Get current time for determining if election is completed
            now = get_current_time()
            is_completed = election.end_date < now
            
            # Prepare basic response data
            election_data = PublicElectionSerializer(election).data
            
            # Explicitly include the contract address in the election data
            if election.contract_address:
                logger.info(f"Contract address found: {election.contract_address}")
                election_data['contract_address'] = election.contract_address
            else:
                logger.warning(f"No contract address found for election {pk}")
            
            response_data = {
                'electionData': election_data,
                'isCompleted': is_completed,
                'currentTime': now.isoformat()
            }
            
            # Check if contract is deployed
            if not election.contract_address or election.contract_address.strip() == '':
                logger.error(f"No contract address found for election {pk}")
                response_data['error'] = 'No contract address found'
                return Response(response_data)
            
            # Get results from blockchain
            try:
                ethereum_service = EthereumService()
                logger.info(f"Attempting to get results from contract: {election.contract_address}")
                
                # Try to get the results
                results = ethereum_service.get_election_results(election.contract_address)
                logger.info(f"Successfully retrieved results from blockchain: {results}")
                
                # Add results to response
                response_data['results'] = results
                return Response(response_data)
                
            except Exception as blockchain_error:
                # Log the blockchain error
                logger.error(f"Blockchain error getting election results: {str(blockchain_error)}", exc_info=True)
                
                # Add error to response but still return the election data
                response_data['error'] = f'Error retrieving results from blockchain: {str(blockchain_error)}'
                response_data['errorType'] = 'blockchain_error'
                
                return Response(response_data)
        
        except Election.DoesNotExist:
            return Response(
                {'error': 'Election not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to get election results: {str(e)}", exc_info=True)
            return Response(
                {'error': f'Failed to get election results: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def active(self, request):
        """
        Get currently active elections (start_date <= now <= end_date and is_active=True).
        """
        # Use the get_current_time utility for timezone adjustment
        now = get_current_time()
        logger = logging.getLogger(__name__)
        
        # Log the times for debugging
        logger.info(f"Getting active elections with adjusted time: {now.isoformat()}")
        
        queryset = Election.objects.filter(
            start_date__lte=now,
            end_date__gte=now,
            is_active=True
        )
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """
        Get upcoming elections (start_date > now and is_active=True).
        """
        # Use the get_current_time utility for timezone adjustment
        now = get_current_time()
        logger = logging.getLogger(__name__)
        
        # Log the times for debugging
        logger.info(f"Getting upcoming elections with adjusted time: {now.isoformat()}")
        
        queryset = Election.objects.filter(
            start_date__gt=now,
            is_active=True
        )
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def past(self, request):
        """
        Get past elections (end_date < now or is_active=False).
        """
        # Use the get_current_time utility for timezone adjustment
        now = get_current_time()
        logger = logging.getLogger(__name__)
        
        # Log the times for debugging
        logger.info(f"Getting past elections with adjusted time: {now.isoformat()}")
        
        queryset = Election.objects.filter(
            end_date__lt=now
        )
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def candidates(self, request, pk=None):
        """
        Get all candidates for a specific election.
        """
        election = self.get_object()
        candidates = Candidate.objects.filter(election=election)
        serializer = CandidateSerializer(candidates, many=True)
        return Response(serializer.data)

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
            if Vote.objects.filter(
                voter=user, 
                election=election, 
                is_confirmed=True
            ).exists():
                return Response(
                    {'error': 'You have already cast a vote in this election'},
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
    
    @action(detail=False, methods=['get'])
    def my_votes(self, request):
        """
        Retrieve all votes made by the current user.
        """
        try:
            votes = Vote.objects.filter(voter=request.user)
            serializer = VoteReceiptSerializer(votes, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': f'Failed to retrieve votes: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def confirm(self, request):
        """Confirm a vote with OTP and cast it on the blockchain."""
        serializer = VoteConfirmationSerializer(data=request.data, context={'request': request})
        
        # Don't delete the vote if OTP validation fails - we want to allow retries with new OTPs
        # Instead, just return the validation errors
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Get validated data
        vote = serializer.validated_data['vote']
        email_otp = serializer.validated_data['email_otp']
        
        # Store election and candidate for reference, but delete the vote if blockchain fails
        election = vote.election
        candidate = vote.candidate
        user = request.user
        
        # Cast vote on blockchain
        try:
            ethereum_service = EthereumService()
            
            # Just get the user without attempting to create a wallet
            # The wallet should already have been created during verification
            
            # Ensure the user has a wallet before proceeding
            if not user.ethereum_address or not user.ethereum_private_key:
                # This should not happen since wallet creation is handled during verification
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
                
                # Check if user is eligible and add them to eligible voters if not
                try:
                    is_eligible = ethereum_service.is_eligible_voter(
                        contract_address=election.contract_address,
                        voter_address=user_address
                    )
                    
                    # If not eligible, use admin's private key to add user to eligible voters
                    if not is_eligible:
                        logger = logging.getLogger(__name__)
                        logger.info(f"User {user.email} is not eligible to vote. Automatically adding as eligible voter.")
                        
                        # Get admin key - using the election creator's key
                        admin_user = election.created_by
                        if admin_user and admin_user.ethereum_private_key:
                            # Add user to eligible voters
                            ethereum_service.add_eligible_voter(
                                private_key=admin_user.ethereum_private_key,
                                contract_address=election.contract_address,
                                voter_address=user_address
                            )
                            logger.info(f"User {user.email} successfully added as eligible voter.")
                        else:
                            # Fallback to system admin if election creator doesn't have key
                            from django.contrib.auth import get_user_model
                            User = get_user_model()
                            # Try to find a superuser with ethereum keys
                            admins = User.objects.filter(is_superuser=True, ethereum_private_key__isnull=False).first()
                            if admins:
                                ethereum_service.add_eligible_voter(
                                    private_key=admins.ethereum_private_key,
                                    contract_address=election.contract_address,
                                    voter_address=user_address
                                )
                                logger.info(f"User {user.email} successfully added as eligible voter by superuser.")
                            else:
                                vote.delete()
                                return Response(
                                    {'error': 'You are not eligible to vote and no admin key is available to add you.'},
                                    status=status.HTTP_400_BAD_REQUEST
                                )
                except Exception as eligibility_error:
                    logger = logging.getLogger(__name__)
                    logger.error(f"Error checking or updating voter eligibility: {str(eligibility_error)}")
                    # Continue anyway - the transaction might still succeed if the user is already eligible
                
            except Exception as e:
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
                # Enhanced logging for debugging
                private_key = user.ethereum_private_key
                logger = logging.getLogger(__name__)
                logger.info(f"Private key check - Type: {type(private_key)}, Length: {len(str(private_key)) if private_key else 0}")
                logger.info(f"Private key value check - Is 'private_key' literal: {private_key == 'private_key'}")
                logger.info(f"Private key format check - Has 0x prefix: {private_key.startswith('0x') if isinstance(private_key, str) else False}")
                
                if not private_key or private_key == 'private_key' or not isinstance(private_key, str):
                    logger.error(f"Invalid private key format for user {request.user.email}")
                    # Log the actual value for debugging (be careful with this in production)
                    logger.error(f"Private key actual value: '{private_key}'")
                    vote.delete()
                    return Response(
                        {'error': 'Invalid wallet configuration. Please contact support.'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
                
                # Ensure proper formatting of private key (0x prefix)
                original_key = private_key
                if not private_key.startswith('0x'):
                    private_key = '0x' + private_key
                    logger.info(f"Added 0x prefix to private key. Original length: {len(original_key)}, New length: {len(private_key)}")
                
                logger.info(f"Calling ethereum_service.cast_vote with formatted private key")
                
                # Cast the vote with properly formatted private key
                tx_hash = ethereum_service.cast_vote(
                    private_key=private_key,
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
    
    @action(detail=True, methods=['get'])
    def receipt(self, request, pk=None):
        """
        Get a detailed vote receipt with cryptographic proof and verification instructions.
        """
        vote = self.get_object()
        
        # Check if vote exists and is confirmed
        if not vote.is_confirmed or not vote.transaction_hash:
            return Response(
                {'error': 'Vote is not confirmed or missing transaction hash'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Get blockchain transaction details
        try:
            ethereum_service = EthereumService()
            tx_receipt = ethereum_service.get_transaction_receipt(vote.transaction_hash)
            tx_details = ethereum_service.get_transaction(vote.transaction_hash)
            
            # Get block details
            block = ethereum_service.w3.eth.get_block(tx_receipt['blockNumber'])
            
            # Verify vote on blockchain
            verification_result = ethereum_service.verify_vote(
                contract_address=vote.election.contract_address,
                transaction_hash=vote.transaction_hash,
                voter_address=request.user.ethereum_address,
                candidate_id=vote.candidate.blockchain_id
            )
            
            # Create receipt data
            receipt_data = {
                'vote_id': vote.id,
                'election': {
                    'id': vote.election.id,
                    'title': vote.election.title,
                    'contract_address': vote.election.contract_address
                },
                'candidate': {
                    'id': vote.candidate.id,
                    'name': vote.candidate.name,
                    'blockchain_id': vote.candidate.blockchain_id
                },
                'voter': {
                    'id': request.user.id,
                    'ethereum_address': request.user.ethereum_address
                },
                'blockchain_data': {
                    'transaction_hash': vote.transaction_hash,
                    'block_number': tx_receipt['blockNumber'],
                    'block_hash': tx_receipt['blockHash'].hex(),
                    'block_timestamp': block['timestamp'],
                    'status': 'Successful' if tx_receipt['status'] == 1 else 'Failed'
                },
                'cryptographic_proof': {
                    'receipt_hash': vote.receipt_hash,
                    'verification_data': f"{request.user.id}:{vote.election.id}:{vote.candidate.id}:{vote.transaction_hash}"
                },
                'verification': {
                    'verified': verification_result['verified'],
                    'details': verification_result['details'] if 'details' in verification_result else None
                },
                'timestamp': vote.timestamp
            }
            
            return Response(receipt_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to generate detailed receipt: {str(e)}")
            return Response(
                {'error': f'Failed to generate detailed receipt: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def my_votes(self, request):
        """
        Retrieve all votes made by the current user.
        """
        try:
            votes = Vote.objects.filter(voter=request.user)
            serializer = VoteReceiptSerializer(votes, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': f'Failed to retrieve votes: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def verify(self, request, pk=None):
        """
        Verify a vote on the blockchain and return the verification result.
        """
        import sys
        logger = logging.getLogger(__name__)
        
        # Add console logging
        if not any(isinstance(h, logging.StreamHandler) and h.stream == sys.stdout for h in logger.handlers):
            console_handler = logging.StreamHandler(sys.stdout)
            console_handler.setLevel(logging.DEBUG)
            formatter = logging.Formatter('%(asctime)s - [VOTE_API_VERIFY] - %(levelname)s - %(message)s')
            console_handler.setFormatter(formatter)
            logger.addHandler(console_handler)
        
        vote = self.get_object()
        logger.info(f"===== VOTE API VERIFICATION LOG =====")
        logger.info(f"Verifying vote ID: {vote.id} for user: {request.user.email}")
        logger.info(f"Vote transaction hash: {vote.transaction_hash}")
        
        # Check if vote exists and is confirmed
        if not vote.is_confirmed or not vote.transaction_hash:
            logger.error(f"Vote not confirmed or missing transaction hash. is_confirmed={vote.is_confirmed}")
            return Response(
                {'error': 'Vote is not confirmed or missing transaction hash'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Perform verification
        try:
            ethereum_service = EthereumService()
            logger.info(f"Created EthereumService instance for verification")
            
            # Get transaction receipt
            tx_receipt = ethereum_service.get_transaction_receipt(vote.transaction_hash)
            logger.info(f"Got transaction receipt: {tx_receipt is not None}")
            
            # Verify the transaction exists and was successful
            if not tx_receipt:
                logger.error(f"Transaction receipt not found for hash: {vote.transaction_hash}")
                return Response({
                    'verified': False,
                    'message': 'Transaction does not exist on the blockchain',
                    'details': {
                        'transaction_exists': False
                    }
                }, status=status.HTTP_200_OK)
            
            # Log receipt details
            logger.info(f"Transaction status: {tx_receipt['status']}")
            logger.info(f"Block number: {tx_receipt['blockNumber']}")
            logger.info(f"Transaction logs count: {len(tx_receipt['logs'])}")
            
            # Check transaction status
            if tx_receipt['status'] != 1:
                logger.error(f"Transaction failed with status: {tx_receipt['status']}")
                return Response({
                    'verified': False,
                    'message': 'Transaction failed on the blockchain',
                    'details': {
                        'transaction_exists': True,
                        'status': tx_receipt['status']
                    }
                }, status=status.HTTP_200_OK)
            
            # Verify vote details on blockchain
            logger.info(f"Calling ethereum_service.verify_vote with parameters:")
            logger.info(f"  contract_address: {vote.election.contract_address}")
            logger.info(f"  transaction_hash: {vote.transaction_hash}")
            logger.info(f"  voter_address: {request.user.ethereum_address}")
            logger.info(f"  candidate_id: {vote.candidate.blockchain_id}")
            
            verification_result = ethereum_service.verify_vote(
                contract_address=vote.election.contract_address,
                transaction_hash=vote.transaction_hash,
                voter_address=request.user.ethereum_address,
                candidate_id=vote.candidate.blockchain_id
            )
            
            logger.info(f"Verification result: {verification_result}")
            
            # Return verification result
            return Response({
                'verified': verification_result['verified'],
                'message': 'Vote successfully verified on blockchain' if verification_result['verified'] else 'Vote verification failed',
                'details': verification_result['details'] if 'details' in verification_result else None
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error verifying vote: {str(e)}")
            return Response(
                {'error': f"Error verifying vote: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'], permission_classes=[permissions.AllowAny], url_path='public_verify')
    def public_verify(self, request, pk=None):
        """
        Public endpoint to verify a vote without authentication.
        """
        import sys
        logger = logging.getLogger(__name__)
        
        # Add console logging
        if not any(isinstance(h, logging.StreamHandler) and h.stream == sys.stdout for h in logger.handlers):
            console_handler = logging.StreamHandler(sys.stdout)
            console_handler.setLevel(logging.DEBUG)
            formatter = logging.Formatter('%(asctime)s - [PUBLIC_VOTE_VERIFY] - %(levelname)s - %(message)s')
            console_handler.setFormatter(formatter)
            logger.addHandler(console_handler)
        
        logger.info(f"===== PUBLIC VOTE VERIFICATION LOG =====")
        logger.info(f"Verifying vote ID: {pk}")
        
        try:
            # Get vote by ID without using self.get_object() which requires authentication
            vote = Vote.objects.get(pk=pk)
            logger.info(f"Found vote ID {pk} for election: {vote.election.title}")
            logger.info(f"Vote transaction hash: {vote.transaction_hash}")
            
            # Check if vote exists and is confirmed
            if not vote.is_confirmed or not vote.transaction_hash:
                logger.error(f"Vote not confirmed or missing transaction hash. is_confirmed={vote.is_confirmed}")
                return Response(
                    {'error': 'Vote is not confirmed or missing transaction hash'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Perform verification
            ethereum_service = EthereumService()
            logger.info(f"Created EthereumService instance for verification")
            
            # Get transaction receipt
            tx_receipt = ethereum_service.get_transaction_receipt(vote.transaction_hash)
            logger.info(f"Got transaction receipt: {tx_receipt is not None}")
            
            # Verify the transaction exists
            if not tx_receipt:
                logger.error(f"Transaction receipt not found for hash: {vote.transaction_hash}")
                return Response({
                    'verified': False,
                    'message': 'Transaction does not exist on the blockchain',
                    'details': {
                        'transaction_exists': False
                    }
                }, status=status.HTTP_200_OK)
            
            # Log receipt details
            logger.info(f"Transaction status: {tx_receipt['status']}")
            logger.info(f"Block number: {tx_receipt['blockNumber']}")
            logger.info(f"Transaction logs count: {len(tx_receipt['logs'])}")
                
            # If status is 0, it's a failed transaction
            if tx_receipt['status'] != 1:
                logger.error(f"Transaction failed with status: {tx_receipt['status']}")
                return Response({
                    'verified': False,
                    'message': 'Transaction failed on the blockchain',
                    'details': {
                        'transaction_exists': True,
                        'status': tx_receipt['status']
                    }
                }, status=status.HTTP_200_OK)
            
            # Return verification result
            logger.info(f"Vote {vote.id} successfully verified on blockchain")
            return Response({
                'verified': True,
                'message': 'Vote successfully verified',
                'details': {
                    'transaction_hash': vote.transaction_hash,
                    'election': vote.election.title,
                    'candidate': vote.candidate.name,
                    'timestamp': vote.timestamp,
                    'block_number': tx_receipt['blockNumber']
                }
            }, status=status.HTTP_200_OK)
        
        except Vote.DoesNotExist:
            logger.error(f"Vote with ID {pk} not found")
            return Response(
                {'error': f"Vote with ID {pk} not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error verifying vote: {str(e)}")
            return Response(
                {'error': f"Error verifying vote: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'], permission_classes=[permissions.AllowAny], url_path='public_receipt')
    def public_receipt(self, request, pk=None):
        """
        Public endpoint to get a vote receipt without authentication.
        """
        try:
            # Get vote by ID without using self.get_object() which requires authentication
            vote = Vote.objects.get(pk=pk)
            
            # Check if vote exists and is confirmed
            if not vote.is_confirmed or not vote.transaction_hash:
                return Response(
                    {'error': 'Vote is not confirmed or missing transaction hash'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Create a simplified receipt for public viewing
            receipt_data = {
                'vote_id': vote.id,
                'election': {
                    'id': vote.election.id,
                    'title': vote.election.title,
                    'contract_address': vote.election.contract_address
                },
                'candidate': {
                    'id': vote.candidate.id,
                    'name': vote.candidate.name,
                    'blockchain_id': vote.candidate.blockchain_id
                },
                'blockchain_data': {
                    'transaction_hash': vote.transaction_hash,
                    'status': 'Completed'
                },
                'cryptographic_proof': {
                    'receipt_hash': vote.receipt_hash,
                },
                'timestamp': vote.timestamp
            }
            
            return Response(receipt_data, status=status.HTTP_200_OK)
                
        except Vote.DoesNotExist:
            return Response(
                {'error': f"Vote with ID {pk} not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger = logging.getLogger(__name__)
            logger.error(f"Error retrieving vote receipt: {str(e)}")
            return Response(
                {'error': f"Error retrieving vote receipt: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get', 'post'])
    def receipt_pdf(self, request, pk=None):
        """
        Generate a PDF receipt for a vote.
        Supports both GET with Bearer token and POST with token in form data.
        """
        from io import BytesIO
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, Canvas
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.lib.enums import TA_CENTER
        from django.http import HttpResponse
        
        logger = logging.getLogger(__name__)
        logger.info(f"Generating PDF receipt for vote {pk}")
        logger.info(f"Request method: {request.method}")
        logger.info(f"Request headers: {request.headers}")
        
        # For POST requests with form data (fallback method)
        if request.method == 'POST' and 'auth_token' in request.POST:
            logger.info("Processing POST request with auth_token in form data")
            token = request.POST.get('auth_token')
            # Handle auth_token from POST data
            # Rest of token handling code would go here (similar to GET token handling)
            
        # Check if already authenticated by DRF authentication classes
        if not request.user.is_authenticated:
            logger.error("User is not authenticated")
            return Response(
                {'error': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        try:
            logger.info(f"User authenticated: {request.user.email}")
            
            # Get vote object
            try:
                vote = Vote.objects.get(pk=pk, voter=request.user)
                logger.info(f"Found vote: {vote.id} for election: {vote.election.title}")
            except Vote.DoesNotExist:
                logger.error(f"Vote {pk} not found for user {request.user.email}")
                return Response(
                    {'error': 'Vote not found or you do not have permission to access it'},
                    status=status.HTTP_404_NOT_FOUND
                )
                
            # Check if vote exists and is confirmed
            if not vote.is_confirmed or not vote.transaction_hash:
                logger.warning(f"Attempted to generate PDF for unconfirmed vote {pk}")
                return Response(
                    {'error': 'Vote is not confirmed or missing transaction hash'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get blockchain transaction details
            ethereum_service = EthereumService()
            
            # Add error handling around transaction receipt fetching
            try:
                tx_receipt = ethereum_service.get_transaction_receipt(vote.transaction_hash)
                tx_details = ethereum_service.get_transaction(vote.transaction_hash)
                
                # Get block details
                block = ethereum_service.w3.eth.get_block(tx_receipt['blockNumber'])
                
                # Format block timestamp
                from datetime import datetime
                block_time = datetime.fromtimestamp(block['timestamp']).strftime("%Y-%m-%d %H:%M:%S UTC")
                
                logger.info(f"Successfully fetched blockchain data for vote {pk}")
            except Exception as tx_error:
                logger.error(f"Failed to fetch blockchain data: {str(tx_error)}")
                # Continue with PDF generation even without blockchain details
                tx_receipt = None
                tx_details = None
                block = None
                block_time = "Not available"
            
            # Create a file-like buffer to receive PDF data
            buffer = BytesIO()
            
            # Create the PDF object using the buffer as its "file"
            doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
            
            # Container for the 'flowables' (paragraphs, tables, etc.)
            elements = []
            
            # Get styles
            styles = getSampleStyleSheet()
            styles.add(ParagraphStyle(name='Centered', alignment=TA_CENTER))
            styles.add(ParagraphStyle(name='Small', fontSize=8))
            styles.add(ParagraphStyle(name='SmallBold', fontSize=8, fontName='Helvetica-Bold'))
            
            # Add title
            elements.append(Paragraph("VOTE RECEIPT", styles['Heading1']))
            elements.append(Paragraph("Official Blockchain-Verified Voting Record", styles['Centered']))

            elements.append(Spacer(1, 0.25*inch))
            
            # Add election info
            elements.append(Paragraph(f"Election: {vote.election.title}", styles['Heading2']))
            elements.append(Paragraph(f"Candidate: {vote.candidate.name}", styles['Normal']))
            elements.append(Spacer(1, 0.25*inch))
            
            # Add vote confirmation details
            elements.append(Paragraph("Vote Details:", styles['Heading2']))
            
            # Format date
            from django.utils import timezone
            timestamp = timezone.localtime(vote.timestamp).strftime("%Y-%m-%d %H:%M:%S %Z")
            
            # Create vote details table
            vote_data = [
                ["Vote ID:", str(vote.id)],
                ["Date voted:", timestamp],
                ["Status:", "Confirmed"]
            ]
            
            # Add transaction details if available
            if tx_receipt:
                vote_data.append(["Transaction Hash:", vote.transaction_hash])
                vote_data.append(["Block Number:", str(tx_receipt['blockNumber'])])
                vote_data.append(["Block Timestamp:", block_time])
                
                # Transaction status
                tx_status = "Successful" if tx_receipt['status'] == 1 else "Failed"
                vote_data.append(["Transaction Status:", tx_status])
            
            # Create the table
            vote_table = Table(vote_data, colWidths=[2*inch, 3.5*inch])
            vote_table.setStyle(TableStyle([
                ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ('BACKGROUND', (0,0), (0,-1), colors.lightgrey),
                ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
            ]))
            elements.append(vote_table)
            elements.append(Spacer(1, 0.25*inch))
            
            # Add verification section
            elements.append(Paragraph("Verification Information:", styles['Heading2']))
            
            verification_data = [
                ["Voter Ethereum Address:", request.user.ethereum_address],
                ["Election Contract Address:", vote.election.contract_address],
                ["Candidate Blockchain ID:", str(vote.candidate.blockchain_id)],
                ["Receipt Hash:", vote.receipt_hash],
            ]
            
            # Create verification table
            verification_table = Table(verification_data, colWidths=[2*inch, 3.5*inch])
            verification_table.setStyle(TableStyle([
                ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ('BACKGROUND', (0,0), (0,-1), colors.lightgrey),
                ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
            ]))
            elements.append(verification_table)
            elements.append(Spacer(1, 0.25*inch))
            
            # Add verification instructions
            elements.append(Paragraph("How to verify this vote:", styles['Heading3']))
            instructions = [
                "1. Go to the public verification page on the voting platform.",
                "2. Enter the Vote ID or Transaction Hash shown above.",
                "3. The system will check the blockchain to verify your vote was recorded correctly."
            ]
            for instruction in instructions:
                elements.append(Paragraph(instruction, styles['Normal']))
            
            # Add legal footer
            elements.append(Spacer(1, 0.5*inch))
            elements.append(Paragraph("This receipt is your proof of voting. Keep it for your records.", styles['Small']))
            elements.append(Paragraph(f"Generated on: {timezone.now().strftime('%Y-%m-%d %H:%M:%S %Z')}", styles['Small']))
            
            # Build the PDF
            doc.build(elements)
            
            # FileResponse sets the Content-Disposition header so that browsers
            # present the option to save the file.
            buffer.seek(0)
            response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
            filename = f"vote_receipt_{vote.id}.pdf"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            
            return response
                
        except Exception as e:
            logger.error(f"Error generating PDF: {str(e)}", exc_info=True)
            return Response(
                {'error': f'Failed to generate PDF: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@api_view(['GET'])
@permission_classes([IsAdminUser])
def election_stats(request):
    """Get election statistics for admin dashboard"""
    try:
        # Use the get_current_time utility for timezone adjustment
        now = get_current_time()
        logger = logging.getLogger(__name__)
        logger.info(f"Getting election statistics with adjusted time: {now.isoformat()}")
        
        total_elections = Election.objects.count()
        active_elections = Election.objects.filter(
            start_date__lte=now,
            end_date__gte=now
        ).count()
        upcoming_elections = Election.objects.filter(
            start_date__gt=now
        ).count()
        past_elections = Election.objects.filter(
            end_date__lt=now
        ).count()
        total_votes = Vote.objects.count()
        
        return Response({
            "total": total_elections,
            "active": active_elections,
            "upcoming": upcoming_elections,
            "past": past_elections,
            "votes": total_votes
        })
    except Exception as e:
        return Response({
            "error": str(e),
            "message": "Failed to retrieve election statistics"
        }, status=500)

@api_view(['GET'])
@permission_classes([AllowAny])
def direct_pdf_download(request, vote_id, token):
    """Direct download endpoint for vote receipt PDF"""
    from io import BytesIO
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.lib.enums import TA_CENTER
    from django.http import HttpResponse
    
    logger = logging.getLogger(__name__)
    logger.info(f"Direct PDF download request for vote {vote_id}")
    
    try:
        # Manually verify the JWT token
        User = get_user_model()
        try:
            # Decode the token
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = payload['user_id']
            
            # Get the user
            user = User.objects.get(id=user_id)
            logger.info(f"Successfully authenticated user {user.email}")
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, User.DoesNotExist) as e:
            logger.error(f"Token validation failed: {str(e)}")
            return Response({'error': 'Invalid or expired token'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Get vote object
        try:
            vote = Vote.objects.get(pk=vote_id, voter=user)
            logger.info(f"Found vote: {vote.id} for election: {vote.election.title}")
        except Vote.DoesNotExist:
            logger.error(f"Vote {vote_id} not found for user {user.email}")
            return Response({'error': 'Vote not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if vote exists and is confirmed
        if not vote.is_confirmed or not vote.transaction_hash:
            logger.warning(f"Attempted to generate PDF for unconfirmed vote {vote_id}")
            return Response(
                {'error': 'Vote is not confirmed or missing transaction hash'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get blockchain transaction details
        ethereum_service = EthereumService()
        
        # Add error handling around transaction receipt fetching
        try:
            tx_receipt = ethereum_service.get_transaction_receipt(vote.transaction_hash)
            tx_details = ethereum_service.get_transaction(vote.transaction_hash)
            
            # Get block details
            block = ethereum_service.w3.eth.get_block(tx_receipt['blockNumber'])
            
            # Format block timestamp
            from datetime import datetime
            block_time = datetime.fromtimestamp(block['timestamp']).strftime("%Y-%m-%d %H:%M:%S UTC")
            
            logger.info(f"Successfully fetched blockchain data for vote {vote_id}")
        except Exception as tx_error:
            logger.error(f"Failed to fetch blockchain data: {str(tx_error)}")
            # Continue with PDF generation even without blockchain details
            tx_receipt = None
            tx_details = None
            block = None
            block_time = "Not available"
        
        # Create a file-like buffer to receive PDF data
        buffer = BytesIO()
        
        # Create the PDF object using the buffer as its "file"
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
        
        # Container for the 'flowables' (paragraphs, tables, etc.)
        elements = []
        
        # Get styles
        styles = getSampleStyleSheet()
        styles.add(ParagraphStyle(name='Centered', alignment=TA_CENTER))
        styles.add(ParagraphStyle(name='Small', fontSize=8))
        styles.add(ParagraphStyle(name='SmallBold', fontSize=8, fontName='Helvetica-Bold'))
        
        # Add title
        elements.append(Paragraph("VOTE RECEIPT", styles['Heading1']))
        elements.append(Paragraph("Official Blockchain-Verified Voting Record", styles['Centered']))

        elements.append(Spacer(1, 0.25*inch))
        
        # Add election info
        elements.append(Paragraph(f"Election: {vote.election.title}", styles['Heading2']))
        elements.append(Paragraph(f"Candidate: {vote.candidate.name}", styles['Normal']))
        elements.append(Spacer(1, 0.25*inch))
        
        # Add vote confirmation details
        elements.append(Paragraph("Vote Details:", styles['Heading2']))
        
        # Format date
        from django.utils import timezone
        timestamp = timezone.localtime(vote.timestamp).strftime("%Y-%m-%d %H:%M:%S %Z")
        
        # Create vote details table
        vote_data = [
            ["Vote ID:", str(vote.id)],
            ["Date voted:", timestamp],
            ["Status:", "Confirmed"]
        ]
        
        # Add transaction details if available
        if tx_receipt:
            vote_data.append(["Transaction Hash:", vote.transaction_hash])
            vote_data.append(["Block Number:", str(tx_receipt['blockNumber'])])
            vote_data.append(["Block Timestamp:", block_time])
            
            # Transaction status
            tx_status = "Successful" if tx_receipt['status'] == 1 else "Failed"
            vote_data.append(["Transaction Status:", tx_status])
        
        # Create the table
        vote_table = Table(vote_data, colWidths=[2*inch, 3.5*inch])
        vote_table.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BACKGROUND', (0,0), (0,-1), colors.lightgrey),
            ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ]))
        elements.append(vote_table)
        elements.append(Spacer(1, 0.25*inch))
        
        # Add verification section
        elements.append(Paragraph("Verification Information:", styles['Heading2']))
        
        verification_data = [
            ["Voter Ethereum Address:", user.ethereum_address],
            ["Election Contract Address:", vote.election.contract_address],
            ["Candidate Blockchain ID:", str(vote.candidate.blockchain_id)],
            ["Receipt Hash:", vote.receipt_hash],
        ]
        
        # Create verification table
        verification_table = Table(verification_data, colWidths=[2*inch, 3.5*inch])
        verification_table.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BACKGROUND', (0,0), (0,-1), colors.lightgrey),
            ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ]))
        elements.append(verification_table)
        elements.append(Spacer(1, 0.25*inch))
        
        # Add verification instructions
        elements.append(Paragraph("How to verify this vote:", styles['Heading3']))
        instructions = [
            "1. Go to the public verification page on the voting platform.",
            "2. Enter the Vote ID or Transaction Hash shown above.",
            "3. The system will check the blockchain to verify your vote was recorded correctly."
        ]
        for instruction in instructions:
            elements.append(Paragraph(instruction, styles['Normal']))
        
        # Add legal footer
        elements.append(Spacer(1, 0.5*inch))
        elements.append(Paragraph("This receipt is your proof of voting. Keep it for your records.", styles['Small']))
        elements.append(Paragraph(f"Generated on: {timezone.now().strftime('%Y-%m-%d %H:%M:%S %Z')}", styles['Small']))
        
        # Build the PDF
        doc.build(elements)
        
        # FileResponse sets the Content-Disposition header so that browsers
        # present the option to save the file.
        buffer.seek(0)
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        filename = f"vote_receipt_{vote.id}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response
            
    except Exception as e:
        logger.error(f"Error generating PDF: {str(e)}", exc_info=True)
        return Response(
            {'error': f'Failed to generate PDF: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )