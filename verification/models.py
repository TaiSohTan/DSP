from django.db import models
import uuid
from django.utils import timezone

class VerificationUser(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    full_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    government_id = models.CharField(max_length=20, unique=True)
    government_id_type = models.CharField(max_length=20, choices=[
        ('PASSPORT', 'Passport'),
        ('NATIONAL_ID', 'National ID'),
        ('DRIVERS_LICENSE', 'Driver\'s License'),
    ])
    address = models.TextField()
    postal_code = models.CharField(max_length=15)
    city = models.CharField(max_length=50)
    country = models.CharField(max_length=50)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=15, unique=True)
    is_eligible_voter = models.BooleanField(default=True)
    verification_date = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'verification_users'
        managed = True
        app_label = 'verification'
        db_tablespace = 'auth_db'
        verbose_name = 'Verified User'
        verbose_name_plural = 'Verified Users'
        
    def __str__(self):
        return f"{self.full_name} ({self.government_id})"