from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from eth_account import Account
import secrets
from blockchain.services.ethereum_service import EthereumService

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

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def rotate_user_wallet_key(request):
    """
    API endpoint for users to rotate their Ethereum wallet key.
    Generates a new private key and updates the user's wallet.
    Requires password confirmation for security.
    """
    user = request.user
    
    # Extract password from request for confirmation
    password = request.data.get('password')
    
    if not password:
        return Response(
            {"error": "Password confirmation is required for security."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Verify password
    if not user.check_password(password):
        return Response(
            {"error": "Invalid password."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Store the old address
        old_address = user.ethereum_address
        old_private_key = user.ethereum_private_key
        
        # Generate a new Ethereum private key
        new_private_key = secrets.token_hex(32)
        new_account = Account.from_key(new_private_key)
        new_address = new_account.address
        
        # Try to transfer any existing ETH to the new wallet
        eth_service = EthereumService()
        try:
            # Check if there's a balance to transfer
            balance_wei = eth_service.w3.eth.get_balance(old_address)
            
            if balance_wei > 0:
                # Transfer balance minus gas fees
                eth_service.transfer_all_eth(old_address, new_address, old_private_key)
        except Exception as transfer_error:
            # Log the error but continue with key rotation
            import logging
            logging.error(f"Error transferring ETH during wallet key rotation: {str(transfer_error)}")
        
        # Update user's wallet information
        user.ethereum_address = new_address
        user.ethereum_private_key = new_private_key
        user.save()
        
        return Response({
            "message": "Wallet key successfully rotated.",
            "ethereum_address": new_address,
            "private_key_last_four": new_private_key[-4:],
            "wallet_balance": eth_service.w3.from_wei(eth_service.w3.eth.get_balance(new_address), 'ether')
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        import logging
        logging.error(f"Error rotating wallet key: {str(e)}")
        return Response(
            {"error": "Failed to rotate wallet key. Please try again later."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
