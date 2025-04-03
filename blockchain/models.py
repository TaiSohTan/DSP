from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import uuid
from eth_account import Account
import secrets
from django.conf import settings
import binascii
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
import os

class EthereumWallet(models.Model):
    """
    Model to store user's Ethereum wallet information.
    Private keys are encrypted before storage.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='ethereum_wallet')
    address = models.CharField(max_length=42, unique=True)
    encrypted_private_key = models.BinaryField()
    salt = models.BinaryField()  # Salt used for key encryption
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Ethereum Wallet"
        verbose_name_plural = "Ethereum Wallets"
    
    def __str__(self):
        return f"Wallet for {self.user.username} ({self.address})"
    
    @classmethod
    def create_wallet(cls, user, password):
        """
        Creates a new Ethereum wallet for a user.
        
        Args:
            user: The User object to create a wallet for
            password: The password to encrypt the private key with
            
        Returns:
            EthereumWallet: The created wallet instance
        """
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
        
        return wallet
    
    @staticmethod
    def _encrypt_private_key(private_key_hex, password, salt):
        """
        Encrypts a private key with a password and salt.
        """
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
        """
        Decrypts the private key using the provided password.
        
        Args:
            password: The password to decrypt the private key with
            
        Returns:
            str: The decrypted private key in hex format
            
        Raises:
            ValueError: If the password is incorrect
        """
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
            decrypted_key = cipher.decrypt(self.encrypted_private_key).decode()
            
            return decrypted_key
        except Exception as e:
            raise ValueError("Failed to decrypt private key: incorrect password or corrupted key")

class Election(models.Model):
    """
    Model to store information about elections.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField()
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_elections')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    smart_contract_address = models.CharField(max_length=42, null=True, blank=True)
    
    # Election status
    is_published = models.BooleanField(default=False)
    is_deployed = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = "Election"
        verbose_name_plural = "Elections"
        ordering = ['-start_date']
    
    def __str__(self):
        return self.title
    
    @property
    def status(self):
        now = timezone.now()
        if not self.is_published:
            return "Draft"
        elif not self.is_deployed:
            return "Published (not deployed)"
        elif now < self.start_date:
            return "Upcoming"
        elif now >= self.start_date and now <= self.end_date:
            return "Active"
        else:
            return "Concluded"
    
    @property
    def is_active(self):
        now = timezone.now()
        return (self.is_published and self.is_deployed and 
                self.start_date <= now <= self.end_date)

class Candidate(models.Model):
    """
    Model to store information about candidates in an election.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    election = models.ForeignKey(Election, on_delete=models.CASCADE, related_name='candidates')
    name = models.CharField(max_length=255)
    party = models.CharField(max_length=255, blank=True)
    bio = models.TextField(blank=True)
    image_url = models.URLField(blank=True)
    candidate_id = models.PositiveIntegerField(help_text="ID used in the smart contract")
    
    class Meta:
        verbose_name = "Candidate"
        verbose_name_plural = "Candidates"
        unique_together = [['election', 'candidate_id']]
        ordering = ['candidate_id']
    
    def __str__(self):
        return f"{self.name} ({self.election.title})"

class Vote(models.Model):
    """
    Model to store information about votes cast by users.
    The actual vote is stored on the blockchain, this just keeps a record of it.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    election = models.ForeignKey(Election, on_delete=models.PROTECT, related_name='votes')
    voter = models.ForeignKey(User, on_delete=models.PROTECT, related_name='votes')
    transaction_hash = models.CharField(max_length=66, unique=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    # For vote receipt
    receipt_hash = models.CharField(max_length=64, unique=True)
    
    class Meta:
        verbose_name = "Vote"
        verbose_name_plural = "Votes"
        unique_together = [['election', 'voter']]
    
    def __str__(self):
        return f"Vote by {self.voter.username} in {self.election.title}"
