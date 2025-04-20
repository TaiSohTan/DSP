from django.shortcuts import render
from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.core.cache import cache
import logging 
import uuid
import json
import os
from django.conf import settings
from .models import User
from .serializers.user_serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserDetailSerializer,
    OTPVerificationSerializer
)
from .services.otp_service import OTPService
from django.utils import timezone
from datetime import timedelta
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from .models import Vote

# Configure logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

class UserRegistrationView(generics.CreateAPIView):
    """
    API view for user registration - first step.
    Validates user details and sends OTP for verification.
    Does NOT create the user record until OTP verification.
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = UserRegistrationSerializer
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            # Generate a temporary registration ID
            registration_id = str(uuid.uuid4())
            
            # Store validated data in cache for 10 minutes
            registration_data = serializer.validated_data.copy()
            # Remove the confirm_password field as it's not needed for user creation
            if 'confirm_password' in registration_data:
                registration_data.pop('confirm_password')
            
            phone_number = registration_data.get('phone_number')
            
            # Store data in cache with 10-minute expiration
            cache_key = f"registration:{registration_id}"
            cache.set(cache_key, json.dumps({
                'data': {k: str(v) for k, v in registration_data.items()},
                'phone_number': phone_number
            }), timeout=600)  # 10 minutes
            
            # Send OTP to user's phone
            OTPService.send_sms_otp(phone_number, purpose="registration")
            
            return Response({
                'message': 'Registration initiated successfully. Please verify your phone number with the OTP sent.',
                'registration_id': registration_id,
                'phone_number': phone_number,
                'expires_in': 600  # seconds
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CompleteRegistrationView(APIView):
    """
    API view for completing user registration - second step.
    Verifies the OTP and creates the user account if valid.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request, *args, **kwargs):
        registration_id = request.data.get('registration_id')
        phone_number = request.data.get('phone_number')
        otp = request.data.get('otp')
        
        if not all([registration_id, phone_number, otp]):
            return Response({
                'error': 'Registration ID, phone number and OTP are required.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get registration data from cache
        cache_key = f"registration:{registration_id}"
        cached_data = cache.get(cache_key)
        
        if not cached_data:
            return Response({
                'error': 'Registration session expired or not found. Please register again.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Parse the cached data
        registration_info = json.loads(cached_data)
        registration_data = registration_info.get('data', {})
        
        # Verify the phone number matches
        if registration_info.get('phone_number') != phone_number:
            return Response({
                'error': 'Phone number does not match registration data.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify OTP
        if not OTPService.verify_otp(phone_number, otp, is_email=False):
            return Response({
                'error': 'Invalid or expired OTP.'
            }, status=status.HTTP_400_BAD_REQUEST)
          # Create the user now that OTP is verified
        try:
            # Get the email and government_id from registration data
            email = registration_data.get('email')
            government_id = registration_data.get('government_id')
            
            # Fetch the complete user details from the auth database
            from verification.models import VerificationUser
            try:
                # Try to find the user in the auth database by matching both email and government ID
                auth_user = VerificationUser.objects.using('auth_db').filter(
                    email=email,
                    government_id=government_id
                ).first()
                
                if not auth_user:
                    return Response({
                        'error': 'User details not found in verification database. Please contact support.'
                    }, status=status.HTTP_400_BAD_REQUEST)
                    
                # Log the auth_user details for debugging
                logger.info(f"Auth user found: {auth_user.full_name}, ID: {auth_user.government_id}, Type: {auth_user.government_id_type}")
                
            except Exception as e:
                logger.error(f"Error fetching user from auth database: {str(e)}")
                return Response({
                    'error': 'Error verifying user identity. Please try again later.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Convert registration data back from strings for user creation
            user_data = {
                'email': email,
                'password': registration_data.get('password'),
                'full_name': auth_user.full_name,  # Use auth DB value
                'government_id': auth_user.government_id,  # Use auth DB value
                'phone_number': auth_user.phone_number,  # Use auth DB value
                'is_verified': True  # User is verified from the start
            }
              # Create the user with all data from auth database
            user_data.update({
                'government_id_type': auth_user.government_id_type,  # Use correct type from auth DB
                'address': auth_user.address,  # Copy address from auth DB
                'postal_code': auth_user.postal_code,  # Copy postal code from auth DB
                'city': auth_user.city,  # Copy city from auth DB
                'country': auth_user.country,  # Copy country from auth DB
                'is_eligible_to_vote': auth_user.is_eligible_voter  # Use eligibility from auth DB
            })
            user = User.objects.create_user(**user_data)
            
            # Create Ethereum wallet for the verified user
            try:
                from blockchain.services.ethereum_service import EthereumService
                from blockchain.models import EthereumWallet
                  # Generate a new Ethereum address and private key
                eth_service = EthereumService()
                wallet_data = eth_service.create_user_wallet()
                wallet_address = wallet_data['address']
                private_key = wallet_data['private_key']
                
                # Create a random password for wallet encryption (in production, use a more secure method)
                wallet_password = uuid.uuid4().hex
                  # Encrypt and store the wallet
                salt = os.urandom(16)
                encrypted_key = EthereumWallet._encrypt_private_key(private_key, wallet_password, salt)
                
                wallet = EthereumWallet.objects.create(
                    user=user,
                    address=wallet_address,
                    encrypted_private_key=encrypted_key,
                    salt=salt
                )
                
                # Update the user model with the wallet details
                user.ethereum_address = wallet_address
                user.ethereum_private_key = private_key
                user.save(update_fields=['ethereum_address', 'ethereum_private_key'])
                
                # Fund the wallet with test ETH (for development/testing only)
                if settings.DEBUG:
                    tx_hash = eth_service.fund_user_wallet(wallet_address)
                    if tx_hash:
                        logger.info(f"Funded new user wallet {wallet_address} with test ETH. Transaction: {tx_hash}")
                    else:
                        logger.warning(f"Failed to fund new user wallet {wallet_address}")
                
                logger.info(f"Created Ethereum wallet for user {user.id}: {wallet_address}")
                
            except Exception as e:
                # Log the error but don't prevent registration from completing
                logger.error(f"Failed to create Ethereum wallet for user {user.id}: {str(e)}")
            
            # Clear the cache entry
            cache.delete(cache_key)
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'message': 'Registration completed successfully.',
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'full_name': user.full_name,
                }
            })
            
        except Exception as e:
            return Response({
                'error': f'Failed to create user account: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserLoginView(APIView):
    """
    API view for user login.
    Authenticates user credentials and returns JWT tokens.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request, *args, **kwargs):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data.get('email')
            password = serializer.validated_data.get('password')
            
            user = authenticate(request, username=email, password=password)
            
            if user is not None:
                refresh = RefreshToken.for_user(user)
                return Response({
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'user': {
                        'id': user.id,
                        'email': user.email,
                        'full_name': user.full_name,
                    }
                })
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserDetailView(generics.RetrieveUpdateAPIView):
    """
    API view for retrieving and updating user information.
    Uses the merged User model that now contains all profile fields.
    Previously named UserProfileView before the User/UserProfile model merge.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserDetailSerializer
    
    def get_object(self):
        return self.request.user
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

class SendPhoneOTPView(APIView):
    """
    API view for sending OTP to user's phone for verification.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request, *args, **kwargs):
        phone_number = request.data.get('phone_number')
        
        if not phone_number:
            return Response(
                {'error': 'Phone number is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if phone number is already in use
        if User.objects.filter(phone_number=phone_number).exists():
            return Response(
                {'error': 'Phone number is already registered'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Send OTP
        success = OTPService.send_sms_otp(phone_number, purpose="registration")
        
        if success:
            return Response({
                'message': 'OTP sent successfully',
                'expires_in': OTPService.OTP_VALIDITY_MINUTES
            })
        else:
            return Response(
                {'error': 'Failed to send OTP'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class SendEmailOTPView(APIView):
    """
    API view for sending OTP to user's email for vote confirmation.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        user = request.user
        
        # Send OTP
        success = OTPService.send_email_otp(user.email, purpose="vote confirmation")
        
        if success:
            return Response({
                'message': 'OTP sent successfully',
                'expires_in': OTPService.OTP_VALIDITY_MINUTES
            })
        else:
            return Response(
                {'error': 'Failed to send OTP'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class VerifyPhoneOTPView(APIView):
    """
    API view for verifying phone OTP.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request, *args, **kwargs):
        phone_number = request.data.get('phone_number')
        otp = request.data.get('otp')
        
        if not phone_number or not otp:
            return Response(
                {'error': 'Phone number and OTP are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify OTP
        is_valid = OTPService.verify_otp(phone_number, otp, is_email=False)
        
        if is_valid:
            return Response({'message': 'OTP verified successfully'})
        else:
            return Response(
                {'error': 'Invalid or expired OTP'},
                status=status.HTTP_400_BAD_REQUEST
            )

class ResendRegistrationOTPView(APIView):
    """
    API view for resending OTP during registration process.
    If the original OTP expired or wasn't received, users can request a new one.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request, *args, **kwargs):
        registration_id = request.data.get('registration_id')
        
        if not registration_id:
            return Response({
                'error': 'Registration ID is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get registration data from cache
        cache_key = f"registration:{registration_id}"
        cached_data = cache.get(cache_key)
        
        if not cached_data:
            return Response({
                'error': 'Registration session expired or not found. Please register again.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Parse the cached data
        registration_info = json.loads(cached_data)
        phone_number = registration_info.get('phone_number')
        
        if not phone_number:
            return Response({
                'error': 'Phone number not found in registration data'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Reset the expiration time by storing the data again
        cache.set(cache_key, cached_data, timeout=600)  # 10 more minutes
        
        # Generate and send a new OTP
        success = OTPService.send_sms_otp(phone_number, purpose="registration")
        
        if success:
            return Response({
                'message': 'New OTP sent successfully',
                'registration_id': registration_id,
                'phone_number': phone_number,
                'expires_in': 600  # seconds
            })
        else:
            return Response({
                'error': 'Failed to send new OTP'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class RequestPasswordResetView(APIView):
    """
    API view for requesting password reset.
    Sends a password reset link with a token to the user's email.
    Uses the OTPService for token generation and email sending.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        
        if not email:
            return Response({
                'error': 'Email is required.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if the user exists
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Don't reveal whether the user exists or not for security
            return Response({
                'message': 'If your email exists in our system, you will receive password reset instructions.'
            })
        
        # Generate a reset token using OTPService
        reset_token = OTPService.generate_password_reset_token(email)
        
        # Send reset email using OTPService
        success = OTPService.send_password_reset_email(email, reset_token)
        
        if not success:
            logger.error(f"Failed to send password reset email to {email}")
            
        # Return generic success message for security (don't reveal if email exists)
        return Response({
            'message': 'If your email exists in our system, you will receive password reset instructions.'
        })

class ResetPasswordView(APIView):
    """
    API view for resetting user password with a valid token.
    Uses OTPService to verify reset tokens.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request, *args, **kwargs):
        token = request.data.get('token')
        password = request.data.get('password')
        email = request.data.get('email')
        
        if not token or not password or not email:
            return Response({
                'error': 'Token, email, and new password are required.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate the token using OTPService
        is_valid = OTPService.verify_password_reset_token(email, token)
        
        if not is_valid:
            return Response({
                'error': 'Invalid or expired token. Please request a new password reset link.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Find the user
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({
                'error': 'User not found.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate password strength
        try:
            from django.contrib.auth.password_validation import validate_password
            validate_password(password, user)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update the password
        user.set_password(password)
        user.save()
        
        # Token is already invalidated by verify_password_reset_token if valid
        
        return Response({
            'message': 'Password reset successful. You can now log in with your new password.'
        })

@api_view(['GET'])
@permission_classes([IsAdminUser])
def nullification_requests(request):
    """Get all pending vote nullification requests."""
    election_id = request.query_params.get('election_id')
    
    # Base query - get votes with nullification_status='pending'
    query = Vote.objects.filter(nullification_status='pending')
    
    # Filter by election if provided
    if election_id:
        query = query.filter(election_id=election_id)
        
    # Order by requested date
    query = query.order_by('-nullification_requested_at')
    
    # Prepare response data
    result = []
    for vote in query:
        result.append({
            'vote_id': vote.id,
            'voter_id': vote.voter.id,
            'voter_name': f"{vote.voter.first_name} {vote.voter.last_name}",
            'voter_email': vote.voter.email,
            'election_id': vote.election.id,
            'election_title': vote.election.title,
            'candidate_id': vote.candidate.id,
            'candidate_name': vote.candidate.name,
            'vote_timestamp': vote.timestamp,
            'requested_at': vote.nullification_requested_at,
            'reason': vote.nullification_reason,
        })
    
    return Response(result)