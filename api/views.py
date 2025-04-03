from django.shortcuts import render
from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import User, UserProfile
from .serializers.user_serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserProfileSerializer
)
from .services.otp_service import OTPService
from django.utils import timezone
from datetime import timedelta

class UserRegistrationView(generics.CreateAPIView):
    """
    API view for user registration.
    Handles user creation, verification against the auth database,
    and OTP verification.
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = UserRegistrationSerializer
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            # Verify phone OTP
            phone_otp = serializer.validated_data.get('phone_otp')
            if not OTPService.verify_otp(
                serializer.validated_data.get('phone_number'), 
                phone_otp, 
                is_email=False
            ):
                return Response(
                    {'error': 'Invalid or expired OTP.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create user
            user = serializer.save()
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'full_name': user.full_name,
                }
            }, status=status.HTTP_201_CREATED)
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

class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    API view for retrieving and updating user profile information.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserProfileSerializer
    
    def get_object(self):
        try:
            return UserProfile.objects.get(user=self.request.user)
        except UserProfile.DoesNotExist:
            return None
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        if not instance:
            return Response(
                {'error': 'Profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
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
