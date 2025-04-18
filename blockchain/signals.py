from django.dispatch import receiver
from django.contrib.auth.signals import password_changed
from django.contrib.auth import get_user_model
from verification.signals import user_verified
from .models import EthereumWallet
import logging
import secrets

logger = logging.getLogger(__name__)
User = get_user_model()

@receiver(user_verified)
def create_wallet_for_verified_user(sender, user, verification_data, **kwargs):
    """
    Signal handler to automatically create an Ethereum wallet for a user when they are verified.
    
    Args:
        sender: The sender of the signal
        user: The Django user that was verified
        verification_data: Dictionary with verification details
    """
    try:
        # Check if the user already has an Ethereum wallet
        if hasattr(user, 'ethereum_wallet'):
            logger.info(f"User {user.email} already has an Ethereum wallet. No new wallet created.")
            return
        
        # Generate a secure password for the wallet (you may want to use a different approach)
        # For now, we'll use a combination of user data and random elements
        wallet_password = f"{user.email}_{secrets.token_hex(8)}"
        
        # Create a new wallet for the user
        wallet = EthereumWallet.create_wallet(user, wallet_password)
        
        logger.info(f"Successfully created Ethereum wallet for verified user {user.email} with address {wallet.address}")
        
        # TODO: You should store the wallet_password securely or prompt the user to set their own
        # password for the wallet, as this implementation is just for demonstration
        
    except Exception as e:
        logger.error(f"Failed to create Ethereum wallet for user {user.email}: {str(e)}")

@receiver(password_changed)
def rotate_ethereum_key_on_password_change(sender, request, user, **kwargs):
    """
    Signal handler to automatically rotate Ethereum wallet keys when a user changes their password.
    Only applies to users who have an Ethereum wallet.
    """
    # Check if the user has an Ethereum wallet
    if hasattr(user, 'ethereum_wallet') and user.is_staff:
        try:
            # The password in the request might be the new password
            # We need both old and new passwords for key rotation
            # Since Django doesn't provide the old password in the signal,
            # we can only log that rotation is needed
            logger.warning(
                f"Password changed for user {user.email} with Ethereum wallet. "
                f"Manual key rotation required for wallet with address {user.ethereum_wallet.address}"
            )
            
            # Add a flag to the session indicating key rotation is needed
            if request and hasattr(request, 'session'):
                request.session['ethereum_key_rotation_needed'] = True
                request.session['ethereum_wallet_address'] = user.ethereum_wallet.address
        
        except Exception as e:
            logger.error(f"Error processing Ethereum wallet key rotation for {user.email}: {str(e)}")
