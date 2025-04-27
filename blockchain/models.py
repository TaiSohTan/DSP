from django.db import models
from django.conf import settings
from django.utils import timezone
import uuid
from eth_account import Account
import secrets
import binascii
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
import os
from django.contrib.auth import get_user_model

User = get_user_model()

class EthereumWallet(models.Model):
    """
    Model to store user's Ethereum wallet information.
    Private keys are encrypted before storage.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ethereum_wallet')
    address = models.CharField(max_length=42, unique=True)
    encrypted_private_key = models.BinaryField()
    salt = models.BinaryField()  # Salt used for key encryption
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Ethereum Wallet"
        verbose_name_plural = "Ethereum Wallets"

    def __str__(self):
        return f"Wallet for {self.user.email} ({self.address})"

    @classmethod
    def create_wallet(cls, user, password):
        """Creates a new Ethereum wallet for a user."""
        # Generate a random private key
        private_key_hex = secrets.token_hex(32)
        account = Account.from_key(private_key_hex)

        # Generate a salt for encryption
        salt = os.urandom(16)

        # Encrypt the private key with the user's password
        encrypted_key = cls._encrypt_private_key(private_key_hex, password, salt)       
        # Create and save the wallet
        wallet = cls(
            user=user,
            address=account.address,
            encrypted_private_key=encrypted_key,
            salt=salt
        )
        wallet.save()
        
        # Update the user's ethereum fields
        user.ethereum_address = account.address
        user.ethereum_private_key = private_key_hex
        user.save(update_fields=['ethereum_address', 'ethereum_private_key'])

        return wallet

    @staticmethod
    def _encrypt_private_key(private_key_hex, password, salt):
        """Encrypts a private key with a password and salt."""
        # Convert password to bytes
        password_bytes = password.encode()

        # Derive an encryption key from the password and salt
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password_bytes))

        # Create a Fernet cipher using the derived key
        cipher = Fernet(key)

        # Encrypt the private key
        encrypted_key = cipher.encrypt(private_key_hex.encode())

        return encrypted_key    
    
    def decrypt_private_key(self, password):
        """Decrypts the private key using the provided password."""
        try:
            # Convert password to bytes
            password_bytes = password.encode()

            # Derive the key from the password and salt
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=self.salt,
                iterations=100000,
            )
            key = base64.urlsafe_b64encode(kdf.derive(password_bytes))

            # Create a Fernet cipher using the derived key
            cipher = Fernet(key)
            
            # Decrypt the private key
            decrypted_key = cipher.decrypt(self.encrypted_private_key)
            return decrypted_key.decode()
        except Exception as e:
            # Handle decryption failures (wrong password, corrupted data, etc.)
            raise ValueError(f"Failed to decrypt private key: {str(e)}")
            
    def rotate_encryption_key(self, old_password, new_password):
        """
        Re-encrypt the private key with a new password.
        
        Args:
            old_password: Current password used to encrypt the private key
            new_password: New password to use for encryption
            
        Returns:
            bool: True if rotation was successful
            
        Raises:
            ValueError: If decryption with old password fails
        """
        # First decrypt with the old password
        try:
            private_key_hex = self.decrypt_private_key(old_password)
            
            # Generate new salt for enhanced security
            new_salt = os.urandom(16)
            
            # Encrypt the private key with the new password and salt
            new_encrypted_key = self._encrypt_private_key(private_key_hex, new_password, new_salt)
            
            # Update the wallet with new encrypted data
            self.encrypted_private_key = new_encrypted_key
            self.salt = new_salt
            self.updated_at = timezone.now()
            self.save(update_fields=['encrypted_private_key', 'salt', 'updated_at'])
            
            return True
        except ValueError as e:
            raise ValueError(f"Key rotation failed: {str(e)}")
        except Exception as e:
            raise ValueError(f"Unexpected error during key rotation: {str(e)}")