from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
import uuid
import random 
import string
from .fields import AESEncryptedTextField, AESEncryptedCharField

class CustomUserManager(BaseUserManager):
    def create_user(self, email, government_id, full_name, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        if not government_id:
            raise ValueError('The Government ID field must be set')
        if not full_name:
            raise ValueError('The Full Name field must be set')
        
        email = self.normalize_email(email)
        user = self.model(
            email=email,
            government_id=government_id,
            full_name=full_name,
            **extra_fields
        )
        
        # Generate a system username
        username_prefix = ''.join(e[0] for e in full_name.split())
        random_suffix = ''.join(random.choices(string.digits, k=6))
        user.system_username = f"{username_prefix}{random_suffix}"
        
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, government_id, full_name, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_verified', True)
        extra_fields.setdefault('role', 'ADMIN')
        
        user = self.create_user(email, government_id, full_name, password, **extra_fields)
          # Create Ethereum wallet for superuser
        try:
            import uuid
            import os
            from blockchain.models import EthereumWallet
            from blockchain.services.ethereum_service import EthereumService
            from dotenv import load_dotenv, set_key
            
            # Generate a secure random password for the wallet
            wallet_password = uuid.uuid4().hex
            
            # Create and save the wallet
            wallet = EthereumWallet.create_wallet(user, wallet_password)
            # Fund the wallet with 10000 ETH (higher amount for admins but within Ganache limits)
            service = EthereumService()
            service.fund_user_wallet(wallet.address, amount_ether=10000)
            
            # Store wallet details in .env file for recovery (not secure for production)
            env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
            
            # Make sure .env exists
            if not os.path.exists(env_path):
                with open(env_path, 'a') as f:
                    pass
                    
            # Load existing variables
            load_dotenv(env_path)
            
            # Add or update variables in .env file
            set_key(env_path, f"ADMIN_WALLET_ADDRESS_{user.email.replace('@', '_AT_')}", wallet.address)
            set_key(env_path, f"ADMIN_WALLET_PASSWORD_{user.email.replace('@', '_AT_')}", wallet_password)
            
            # Also set as main admin wallet if none exists
            if not os.getenv('ADMIN_WALLET_PRIVATE_KEY'):
                private_key = wallet.decrypt_private_key(wallet_password)
                set_key(env_path, "ADMIN_WALLET_PRIVATE_KEY", private_key)
                set_key(env_path, "ADMIN_WALLET_ADDRESS", wallet.address)
            
            # Log wallet creation
            import logging
            logger = logging.getLogger(__name__)
            logger.info(f"Created wallet for admin {user.email}: {wallet.address}")
            logger.info(f"IMPORTANT: Admin wallet password: {wallet_password} (Saved to .env file)")
        except Exception as e:
            # Log the error but don't prevent superuser creation
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to create Ethereum wallet for admin {user.email}: {str(e)}")
        
        return user

class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ('ADMIN', 'Administrator'),
        ('VOTER', 'Voter'),
        ('OBSERVER', 'Observer'),
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    government_id = AESEncryptedCharField(max_length=100, unique=True)  # Encrypted
    full_name = models.CharField(max_length=100)
    system_username = models.CharField(max_length=50, unique=True)
    phone_number = AESEncryptedCharField(max_length=50, unique=True)  # Encrypted
    
    # Former UserProfile fields
    government_id_type = models.CharField(max_length=20, choices=[
        ('PASSPORT', 'Passport'),
        ('NATIONAL_ID', 'National ID'),
        ('DRIVERS_LICENSE', 'Driver\'s License'),
    ], default='NATIONAL_ID')
    
    # Address fields
    address = AESEncryptedTextField(blank=True)  # Encrypted
    postal_code = models.CharField(max_length=15, blank=True)
    city = models.CharField(max_length=50, blank=True)
    country = models.CharField(max_length=50, blank=True)
    
    # Account status
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='VOTER')
    date_joined = models.DateTimeField(default=timezone.now)
    last_login = models.DateTimeField(null=True, blank=True)
    account_creation_date = models.DateTimeField(auto_now_add=True)
    cooldown_end_date = models.DateTimeField(null=True, blank=True)
    is_eligible_to_vote = models.BooleanField(default=False)
    
    # Voting statistics
    votes_cast = models.PositiveIntegerField(default=0)
    last_activity = models.DateTimeField(auto_now=True)
    
    # Ethereum fields
    ethereum_address = models.CharField(max_length=42, blank=True, null=True)
    ethereum_private_key = AESEncryptedTextField(blank=True, null=True)  # Encrypted with AES
    
    objects = CustomUserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['government_id', 'full_name']
    
    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
    
    def __str__(self):
        return self.email
    
    def is_administrator(self):
        return self.role == 'ADMIN'
    
    def is_observer(self):
        return self.role == 'OBSERVER'
        
    def save(self, *args, **kwargs):
        """Override save to set cooldown_end_date when creating a new user."""
        if not self.pk:  # New instance
            # Set cooldown to 24 hours from account creation
            self.cooldown_end_date = timezone.now() + timezone.timedelta(hours=24)
        super().save(*args, **kwargs)
    
    @property
    def can_vote(self):
        """Check if the user is eligible to vote (verified and cooldown period passed)."""
        now = timezone.now()
        return (self.is_verified and 
                self.is_eligible_to_vote and 
                self.cooldown_end_date and 
                now >= self.cooldown_end_date)

class Election(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField()
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    contract_address = models.CharField(max_length=42, blank=True, null=True)  # Ethereum contract address
    is_active = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='api_created_elections')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Merkle tree fields
    merkle_root = models.CharField(max_length=64, blank=True, null=True)
    last_merkle_update = models.DateTimeField(null=True, blank=True)
    merkle_tree_published = models.BooleanField(default=False)
    merkle_publication_tx = models.CharField(max_length=66, blank=True, null=True)  # Tx hash if published to blockchain

    def __str__(self):
        return self.title

class Candidate(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    election = models.ForeignKey(Election, on_delete=models.CASCADE, related_name='candidates')
    name = models.CharField(max_length=100)
    description = models.TextField()
    blockchain_id = models.PositiveIntegerField(null=True, blank=True)  # ID in the smart contract
    
    def __str__(self):
        return f"{self.name} - {self.election.title}"

class Vote(models.Model):
    voter = models.ForeignKey(User, on_delete=models.PROTECT, related_name='api_votes')
    election = models.ForeignKey(Election, on_delete=models.CASCADE, related_name='votes')
    candidate = models.ForeignKey(Candidate, on_delete=models.CASCADE, related_name='votes')
    timestamp = models.DateTimeField(auto_now_add=True)
    transaction_hash = models.CharField(max_length=255, blank=True, null=True)
    is_confirmed = models.BooleanField(default=False)
    confirmation_timestamp = models.DateTimeField(blank=True, null=True)
    merkle_proof = models.JSONField(blank=True, null=True)
    
    # Nullification fields for DPA 2018 compliance
    NULLIFICATION_STATUS_CHOICES = (
        ('none', 'None'),
        ('pending', 'Pending'),
        ('nullified', 'Nullified'),
        ('rejected', 'Rejected'),
    )
    nullification_status = models.CharField(
        max_length=10,
        choices=NULLIFICATION_STATUS_CHOICES,
        default='none'
    )
    nullification_requested_at = models.DateTimeField(blank=True, null=True)
    nullification_reason = models.TextField(blank=True, null=True)
    nullification_approved_at = models.DateTimeField(blank=True, null=True)
    nullification_approved_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, 
        blank=True, 
        null=True,
        related_name='approved_nullifications'
    )
    nullification_rejected_at = models.DateTimeField(blank=True, null=True)
    nullification_rejected_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, 
        blank=True, 
        null=True,
        related_name='rejected_nullifications'
    )
    nullification_rejection_reason = models.TextField(blank=True, null=True)
    nullification_transaction_hash = models.CharField(max_length=255, blank=True, null=True)
    
    class Meta:
        ordering = ['id'] ## Default Ordering for Paginator
        unique_together = ('voter', 'election')  # Ensure one vote per election per voter
    
    def __str__(self):
        return f"{self.voter} voted in {self.election.title}"