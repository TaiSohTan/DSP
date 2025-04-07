from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
import uuid
import random 
import string

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
        
        return self.create_user(email, government_id, full_name, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ('ADMIN', 'Administrator'),
        ('VOTER', 'Voter'),
        ('OBSERVER', 'Observer'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    government_id = models.CharField(max_length=20, unique=True)
    full_name = models.CharField(max_length=100)
    system_username = models.CharField(max_length=50, unique=True)
    phone_number = models.CharField(max_length=15, unique=True)
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='VOTER')
    
    date_joined = models.DateTimeField(default=timezone.now)
    last_login = models.DateTimeField(null=True, blank=True)
    
    ethereum_address = models.CharField(max_length=42, blank=True, null=True)
    ethereum_private_key = models.CharField(max_length=66, blank=True, null=True)
    
    objects = CustomUserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['government_id', 'full_name']
    
    def __str__(self):
        return self.email
    
    def is_administrator(self):
        return self.role == 'ADMIN'
    
    def is_observer(self):
        return self.role == 'OBSERVER'

class UserProfile(models.Model):
    """
    Extended user profile for the E-Voting system.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    
    # User verification fields
    is_verified = models.BooleanField(default=False)
    government_id = models.CharField(max_length=20, unique=True)
    government_id_type = models.CharField(max_length=20, choices=[
        ('PASSPORT', 'Passport'),
        ('NATIONAL_ID', 'National ID'),
        ('DRIVERS_LICENSE', 'Driver\'s License'),
    ])
    phone_number = models.CharField(max_length=15, unique=True)
    
    # Address fields
    address = models.TextField(blank=True)
    postal_code = models.CharField(max_length=15, blank=True)
    city = models.CharField(max_length=50, blank=True)
    country = models.CharField(max_length=50, blank=True)
    
    # Account status
    account_creation_date = models.DateTimeField(auto_now_add=True)
    cooldown_end_date = models.DateTimeField(null=True, blank=True)
    is_eligible_to_vote = models.BooleanField(default=False)
    
    # Voting statistics
    votes_cast = models.PositiveIntegerField(default=0)
    last_activity = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"
    
    def __str__(self):
        return f"Profile for {self.user.username}"
    
    def save(self, *args, **kwargs):
        """Override save to set cooldown_end_date when creating a new profile."""
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
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    voter = models.ForeignKey(User, on_delete=models.PROTECT, related_name='api_votes')
    election = models.ForeignKey(Election, on_delete=models.CASCADE, related_name='votes')
    candidate = models.ForeignKey(Candidate, on_delete=models.CASCADE, related_name='votes')
    timestamp = models.DateTimeField(auto_now_add=True)
    transaction_hash = models.CharField(max_length=66, blank=True, null=True)  # Ethereum tx hash
    is_confirmed = models.BooleanField(default=False)
    
    class Meta:
        unique_together = ('voter', 'election')  # Ensure one vote per election per voter
    
    def __str__(self):
        return f"{self.voter} voted in {self.election.title}"