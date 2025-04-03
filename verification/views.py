from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .services.verification_service import VerificationService

class VerifyUserAPIView(APIView):
    """
    API endpoint for verifying user details against the authentication database.
    This is used during registration to validate user information.
    """
    permission_classes = [AllowAny]  # Allow anyone to test verification
    
    def post(self, request, *args, **kwargs):
        # Get user details from request
        full_name = request.data.get('full_name', '')
        government_id = request.data.get('government_id', '')
        email = request.data.get('email', '')
        phone_number = request.data.get('phone_number', '')
        date_of_birth = request.data.get('date_of_birth', None)
        
        # Verify user details
        is_verified, errors = VerificationService.verify_user_details(
            full_name=full_name,
            government_id=government_id,
            email=email,
            phone_number=phone_number,
            date_of_birth=date_of_birth
        )
        
        if is_verified:
            return Response({
                'success': True,
                'message': 'User details verified successfully.'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': False,
                'message': 'User verification failed.',
                'errors': errors
            }, status=status.HTTP_400_BAD_REQUEST)
