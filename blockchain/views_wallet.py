from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.contrib.auth import get_user_model

User = get_user_model()

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def rotate_ethereum_key(request):
    """
    API endpoint for admins to rotate their Ethereum wallet encryption key.
    Requires old_password and new_password in the request data.
    """
    user = request.user
    
    # Check if user has an Ethereum wallet
    if not hasattr(user, 'ethereum_wallet'):
        return Response(
            {"error": "No Ethereum wallet found for this user."},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Extract passwords from request
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')
    
    if not old_password or not new_password:
        return Response(
            {"error": "Both old_password and new_password are required."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Attempt to rotate the key
        wallet = user.ethereum_wallet
        success = wallet.rotate_encryption_key(old_password, new_password)
        
        if success:
            return Response(
                {"message": "Ethereum wallet key successfully rotated.",
                 "address": wallet.address},
                status=status.HTTP_200_OK
            )
    except ValueError as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {"error": f"An unexpected error occurred: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
