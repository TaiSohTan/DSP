from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAdminUser
from django.db.models import Q
from django.shortcuts import get_object_or_404
from .models import VerificationUser
from .services.verification_service import VerificationService
from .serializers.auth_serializers import VerificationUserSerializer

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
            })
        else:
            return Response({
                'success': False,
                'errors': errors
            }, status=status.HTTP_400_BAD_REQUEST)

# Admin-only views for auth database management
class IsAdminOrSuperUser(permissions.BasePermission):
    """
    Custom permission to only allow admin or superusers to access.
    """
    def has_permission(self, request, view):
        return request.user and (request.user.is_staff or request.user.is_superuser)

class VerificationUserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for handling CRUD operations on the VerificationUser model in the auth database.
    Only accessible by admin users.
    """
    queryset = VerificationUser.objects.using('auth_db').all()
    serializer_class = VerificationUserSerializer
    permission_classes = [IsAdminOrSuperUser]

    def get_queryset(self):
        """
        Optionally filter queryset based on query parameters.
        """
        queryset = VerificationUser.objects.using('auth_db').all()
        
        # Support filtering by parameters
        name = self.request.query_params.get('name', None)
        gov_id = self.request.query_params.get('government_id', None)
        email = self.request.query_params.get('email', None)
        phone = self.request.query_params.get('phone_number', None)
        
        if name:
            queryset = queryset.filter(full_name__icontains=name)
        if gov_id:
            queryset = queryset.filter(government_id__iexact=gov_id)
        if email:
            queryset = queryset.filter(email__iexact=email)
        if phone:
            queryset = queryset.filter(phone_number__iexact=phone)
            
        return queryset
    
    def perform_create(self, serializer):
        """Ensure the object is saved to the auth_db database."""
        serializer.save(using='auth_db')
        
@api_view(['GET'])
@permission_classes([IsAdminOrSuperUser])
def search_verification_users(request):
    """
    Search for verification users by query parameters.
    Allows for more complex searches across multiple fields.
    """
    query = request.query_params.get('q', '')
    
    if not query:
        return Response({"error": "Search query is required"}, status=status.HTTP_400_BAD_REQUEST)
    
    users = VerificationUser.objects.using('auth_db').filter(
        Q(full_name__icontains=query) |
        Q(government_id__icontains=query) |
        Q(email__icontains=query) |
        Q(phone_number__icontains=query)
    )
    
    serializer = VerificationUserSerializer(users, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAdminOrSuperUser])
def verify_citizen_exists(request):
    """
    Verify if a citizen exists in the auth database based on provided details.
    Useful for quickly checking if someone is eligible to register.
    """
    full_name = request.query_params.get('full_name')
    government_id = request.query_params.get('government_id')
    email = request.query_params.get('email')
    phone_number = request.query_params.get('phone_number')
    
    # Require at least some parameters to search
    if not any([full_name, government_id, email, phone_number]):
        return Response(
            {"error": "At least one search parameter is required"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Build query filters based on provided parameters
    filters = Q()
    if full_name:
        filters |= Q(full_name__iexact=full_name)
    if government_id:
        filters |= Q(government_id__iexact=government_id)
    if email:
        filters |= Q(email__iexact=email)
    if phone_number:
        filters |= Q(phone_number__iexact=phone_number)
    
    # Check if user exists
    user_exists = VerificationUser.objects.using('auth_db').filter(filters).exists()
    
    return Response({
        "exists": user_exists,
        "is_eligible": user_exists and VerificationUser.objects.using('auth_db').filter(filters, is_eligible_voter=True).exists()
    })

@api_view(['DELETE'])
@permission_classes([IsAdminOrSuperUser])
def clear_auth_db(request):
    """
    Clear all records from the auth database.
    Useful for resetting during testing or development.
    Requires admin privileges.
    """
    try:
        count = VerificationUser.objects.using('auth_db').count()
        VerificationUser.objects.using('auth_db').all().delete()
        return Response({
            "message": f"Successfully deleted all {count} records from the authentication database",
            "deleted_count": count
        })
    except Exception as e:
        return Response(
            {"error": f"Failed to clear auth database: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
