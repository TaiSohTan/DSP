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
                
                # NEW CODE: Check if user is eligible and add them to eligible voters if not
                try:
                    is_eligible = ethereum_service.is_eligible_voter(
                        contract_address=election.contract_address,
                        voter_address=user_address
                    )
                    
                    # If not eligible, use admin's private key to add user to eligible voters
                    if not is_eligible:
                        import logging
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
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f"Error checking or updating voter eligibility: {str(eligibility_error)}")
                    # Continue anyway - the transaction might still succeed if the user is already eligible
                
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error checking election active status: {str(e)}")
                # Delete the unconfirmed vote to allow retry
                vote.delete()
                return Response(
                    {'error': 'Could not verify election status. Please try again later.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )            # Cast vote on blockchain
            try:
                # Enhanced logging for debugging
                import logging
                import sys
                logger = logging.getLogger(__name__)
                
                # Configure a console handler for immediate visibility during development
                if not logger.handlers:
                    console_handler = logging.StreamHandler(sys.stdout)
                    console_handler.setLevel(logging.DEBUG)
                    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
                    console_handler.setFormatter(formatter)
                    logger.addHandler(console_handler)
                    
                logger.info(f"==== VOTE CONFIRMATION DEBUG ====")
                logger.info(f"Attempting to cast vote for user ID: {request.user.id}, email: {request.user.email}")
                logger.info(f"Election ID: {election.id}, Candidate ID: {candidate.id}")
                
                # Check if private key exists
                private_key = request.user.ethereum_private_key
                
                # Debug private key without exposing actual content
                if private_key is None:
                    logger.error(f"CRITICAL ERROR: Private key is None for user {request.user.id}")
                    vote.delete()
                    return Response(
                        {'error': 'Missing wallet private key. Please contact support.'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
                
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
            
            # Create comprehensive receipt
            receipt_data = {
                'vote_id': vote.id,
                'voter': {
                    'id': request.user.id,
                    'address': request.user.ethereum_address,
                },
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
                    'block_number': tx_receipt['blockNumber'],
                    'block_hash': tx_receipt['blockHash'].hex(),
                    'block_timestamp': block['timestamp'],
                    'gas_used': tx_receipt['gasUsed'],
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
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to generate detailed receipt: {str(e)}")
            return Response(
                {'error': f'Failed to generate detailed receipt: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def receipt_pdf(self, request, pk=None):
        """
        Generate and return a PDF receipt with verification instructions.
        """
        vote = self.get_object()
        
        # Check if vote exists and is confirmed
        if not vote.is_confirmed or not vote.transaction_hash:
            return Response(
                {'error': 'Vote is not confirmed or missing transaction hash'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Generate PDF receipt
        try:
            from reportlab.lib.pagesizes import letter
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib import colors
            from io import BytesIO
            import qrcode
            from django.http import HttpResponse
            from django.conf import settings
            import os
            
            # Get transaction details
            ethereum_service = EthereumService()
            tx_receipt = ethereum_service.get_transaction_receipt(vote.transaction_hash)
            
            # Create a QR code with verification URL
            verify_url = f"{settings.FRONTEND_URL}/verify-vote/{vote.id}"
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECTION_L,
                box_size=10,
                border=4,
            )
            qr.add_data(verify_url)
            qr.make(fit=True)
            qr_img = qr.make_image(fill_color="black", back_color="white")
            
            # Save QR code to BytesIO
            qr_buffer = BytesIO()
            qr_img.save(qr_buffer)
            qr_buffer.seek(0)
            
            # Create PDF
            buffer = BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=letter)
            styles = getSampleStyleSheet()
            
            # Add custom styles
            styles.add(ParagraphStyle(
                name='Title',
                parent=styles['Heading1'],
                fontSize=18,
                alignment=1,  # Center
                spaceAfter=20
            ))
            
            # Build document content
            content = []
            
            # Title
            content.append(Paragraph("Official Vote Receipt", styles['Title']))
            content.append(Spacer(1, 20))
            
            # Vote Information table
            vote_data = [
                ['Vote ID', str(vote.id)],
                ['Election', vote.election.title],
                ['Candidate', vote.candidate.name],
                ['Timestamp', vote.timestamp.strftime('%Y-%m-%d %H:%M:%S UTC')],
                ['Transaction Hash', vote.transaction_hash],
                ['Block Number', str(tx_receipt['blockNumber'])],
                ['Status', 'Confirmed' if tx_receipt['status'] == 1 else 'Failed']
            ]
            
            vote_table = Table(vote_data, colWidths=[120, 300])
            vote_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
                ('TEXTCOLOR', (0, 0), (0, -1), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            content.append(vote_table)
            content.append(Spacer(1, 30))
            
            # Blockchain verification information
            content.append(Paragraph("Verification Instructions", styles['Heading2']))
            content.append(Spacer(1, 10))
            
            verification_text = """
            This receipt provides cryptographic proof of your vote. To verify your vote:
            
            1. Scan the QR code below or visit the URL to access the verification page
            2. Your vote transaction can be verified on any Ethereum blockchain explorer by using the transaction hash
            3. The receipt hash provides tamper-proof evidence of your vote selection
            
            If you encounter any issues with verification, please contact the election administrator.
            """
            
            content.append(Paragraph(verification_text, styles['Normal']))
            content.append(Spacer(1, 20))
            
            # Add QR code
            content.append(Paragraph("Scan to Verify:", styles['Heading3']))
            content.append(Spacer(1, 10))
            
            # Add QR code image
            qr_img = Image(qr_buffer, width=150, height=150)
            content.append(qr_img)
            content.append(Spacer(1, 10))
            
            # Add verification URL
            content.append(Paragraph(f"Verification URL: {verify_url}", styles['Normal']))
            content.append(Spacer(1, 20))
            
            # Add receipt hash
            content.append(Paragraph("Receipt Hash:", styles['Heading3']))
            content.append(Paragraph(vote.receipt_hash, styles['Normal']))
            
            # Build the PDF
            doc.build(content)
            buffer.seek(0)
            
            # Create HTTP response with PDF
            response = HttpResponse(buffer.read(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename=vote_receipt_{vote.id}.pdf'
            
            return response
            
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to generate PDF receipt: {str(e)}")
            return Response(
                {'error': f'Failed to generate PDF receipt: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def verify(self, request, pk=None):
        """
        Verify a vote on the blockchain and check if it has been counted correctly.
        """
        vote = self.get_object()
        
        # Check if vote exists and is confirmed
        if not vote.is_confirmed or not vote.transaction_hash:
            return Response(
                {'error': 'Vote is not confirmed or missing transaction hash'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Perform verification
        try:
            ethereum_service = EthereumService()
            
            # Get transaction receipt
            tx_receipt = ethereum_service.get_transaction_receipt(vote.transaction_hash)
            
            # Verify the transaction exists and was successful
            if not tx_receipt or tx_receipt['status'] != 1:
                return Response({
                    'verified': False,
                    'message': 'Transaction failed or does not exist on the blockchain',
                    'details': {
                        'transaction_exists': bool(tx_receipt),
                        'status': tx_receipt['status'] if tx_receipt else None
                    }
                }, status=status.HTTP_200_OK)
            
            # Verify vote was counted for the correct candidate
            verification_result = ethereum_service.verify_vote(
                contract_address=vote.election.contract_address,
                transaction_hash=vote.transaction_hash,
                voter_address=request.user.ethereum_address,
                candidate_id=vote.candidate.blockchain_id
            )
            
            # Check if receipt hash matches
            receipt_data = f"{request.user.id}:{vote.election.id}:{vote.candidate.id}:{vote.transaction_hash}"
            calculated_hash = hashlib.sha256(receipt_data.encode()).hexdigest()
            hash_valid = calculated_hash == vote.receipt_hash
            
            # Check if the vote has been counted in the election results
            try:
                # Get election results from blockchain
                results = ethereum_service.get_election_results(vote.election.contract_address)
                
                # Check if candidate's vote count includes this vote
                candidate_found = False
                for candidate_result in results['candidates']:
                    if int(candidate_result['id']) == vote.candidate.blockchain_id:
                        candidate_found = True
                        break
                
                if not candidate_found:
                    verification_result['verified'] = False
                    verification_result['details']['candidate_in_results'] = False
            except Exception as e:
                # Log but continue with verification
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error checking election results: {str(e)}")
                verification_result['details']['results_verification_error'] = str(e)
            
            # Combine all verification results
            final_result = {
                'verified': verification_result['verified'] and hash_valid,
                'message': 'Vote successfully verified' if (verification_result['verified'] and hash_valid) else 'Vote verification failed',
                'details': {
                    'transaction_verified': verification_result['verified'],
                    'receipt_hash_valid': hash_valid,
                    'blockchain_details': verification_result['details'] if 'details' in verification_result else {},
                    'election_contract': vote.election.contract_address,
                    'transaction_hash': vote.transaction_hash,
                    'block_number': tx_receipt['blockNumber'] if tx_receipt else None,
                }
            }
            
            return Response(final_result, status=status.HTTP_200_OK)
            
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to verify vote: {str(e)}")
            return Response(
                {'error': f'Failed to verify vote: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def request_nullification(self, request, pk=None):
        """Request to nullify a vote."""
        try:
            vote = self.get_object()
            
            # Check if this vote belongs to the requesting user
            if vote.voter != request.user:
                return Response(
                    {"error": "You can only request nullification of your own votes"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Check if vote is already nullified or pending nullification
            if vote.nullification_status in ['nullified', 'pending']:
                return Response(
                    {"error": f"Vote is already in '{vote.nullification_status}' state"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if vote is confirmed on blockchain
            if not vote.is_confirmed or not vote.transaction_hash:
                return Response(
                    {"error": "Only confirmed votes can be nullified"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Set nullification status to pending
            vote.nullification_status = 'pending'
            vote.nullification_requested_at = timezone.now()
            vote.nullification_reason = request.data.get('reason', '')
            vote.save()
            
            # TODO: Notify admins about nullification request
            # This would be implemented based on your notification system
            
            return Response({
                "message": "Nullification request submitted successfully",
                "vote_id": vote.id,
                "status": vote.nullification_status
            })
            
        except Exception as e:
            return Response(
                {"error": f"Failed to request nullification: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def approve_nullification(self, request, pk=None):
        """Approve a vote nullification request (admin only)."""
        try:
            # Check if user is admin
            if not request.user.is_staff:
                return Response(
                    {"error": "Only administrators can approve nullification requests"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            vote = self.get_object()
            
            # Check if vote is pending nullification
            if vote.nullification_status != 'pending':
                return Response(
                    {"error": "This vote is not pending nullification"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get the ethereum service
            from blockchain.services.ethereum_service import EthereumService
            ethereum_service = EthereumService()
            
            # Nullify vote on blockchain
            tx_hash = ethereum_service.nullify_vote(
                contract_address=vote.election.contract_address,
                voter_address=vote.voter.ethereum_address
            )
            
            # Update vote status
            vote.nullification_status = 'nullified'
            vote.nullification_approved_at = timezone.now()
            vote.nullification_approved_by = request.user
            vote.nullification_transaction_hash = tx_hash
            vote.save()
            
            # Update the Merkle tree
            from blockchain.services.merkle_service import MerkleService
            MerkleService.handle_nullified_vote(vote.id)
            
            # TODO: Notify voter that they can now cast a new vote
            # This would be implemented based on your notification system
            
            return Response({
                "message": "Vote nullification approved successfully",
                "vote_id": vote.id,
                "transaction_hash": tx_hash,
                "status": vote.nullification_status
            })
            
        except Exception as e:
            return Response(
                {"error": f"Failed to approve nullification: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def reject_nullification(self, request, pk=None):
        """Reject a vote nullification request (admin only)."""
        try:
            # Check if user is admin
            if not request.user.is_staff:
                return Response(
                    {"error": "Only administrators can reject nullification requests"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            vote = self.get_object()
            
            # Check if vote is pending nullification
            if vote.nullification_status != 'pending':
                return Response(
                    {"error": "This vote is not pending nullification"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Update vote status
            vote.nullification_status = 'rejected'
            vote.nullification_rejected_at = timezone.now()
            vote.nullification_rejected_by = request.user
            vote.nullification_rejection_reason = request.data.get('reason', '')
            vote.save()
            
            # TODO: Notify voter that their request was rejected
            # This would be implemented based on your notification system
            
            return Response({
                "message": "Vote nullification request rejected",
                "vote_id": vote.id,
                "status": vote.nullification_status
            })
            
        except Exception as e:
            return Response(
                {"error": f"Failed to reject nullification: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )