from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAdminUser
from django.contrib.auth.hashers import check_password
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes

from .models import SystemSettings, User
from .serializers.system_serializers import SystemSettingsSerializer

class SystemSettingsView(APIView):
    """
    API view for managing system settings.
    Only administrators can access these endpoints.
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        """
        Get the current system settings.
        """
        # Load settings from the singleton, creating it if it doesn't exist
        settings_obj = SystemSettings.load()
        serializer = SystemSettingsSerializer(settings_obj)
        return Response(serializer.data)
    
    def put(self, request):
        """
        Update system settings. Requires password confirmation for security.
        """
        # Ensure password is provided for confirmation
        password = request.data.get('password')
        if not password:
            return Response(
                {"detail": "Password confirmation is required to update system settings."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify the admin user's password
        user = request.user
        if not check_password(password, user.password):
            return Response(
                {"detail": "Invalid password. Settings update canceled."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get settings data from the request
        settings_data = request.data.get('settings')
        if not settings_data:
            return Response(
                {"detail": "No settings data provided."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get or create the settings object
        settings_obj = SystemSettings.load()
        
        # Update the settings
        serializer = SystemSettingsSerializer(settings_obj, data=settings_data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ResetSystemSettingsView(APIView):
    """
    API view for resetting system settings to defaults.
    Only administrators can access this endpoint.
    """
    permission_classes = [IsAdminUser]
    
    def post(self, request):
        """
        Reset system settings to default values.
        """
        # Delete existing settings (it will be recreated with defaults)
        SystemSettings.objects.all().delete()
        
        # Get the new settings with default values
        settings_obj = SystemSettings.load()
        serializer = SystemSettingsSerializer(settings_obj)
        
        return Response({
            "detail": "System settings have been reset to default values.",
            **serializer.data
        })


@api_view(['GET'])
@permission_classes([IsAdminUser])
def system_status(request):
    """Check if the system is operational"""
    try:
        # If database is accessible, system is operational
        from django.contrib.auth import get_user_model
        User = get_user_model()
        User.objects.first()  # Simple query to test database
        
        return Response({
            "status": "operational",
            "message": "All systems operational"
        })
    except Exception as e:
        return Response({
            "status": "error",
            "message": f"System experiencing issues: {str(e)}"
        })