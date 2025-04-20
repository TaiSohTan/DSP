from django.db import migrations, models
import django.utils.timezone
import uuid

def migrate_profile_data_to_user(apps, schema_editor):
    """
    Copy data from UserProfile model to User model
    """
    User = apps.get_model('api', 'User')
    UserProfile = apps.get_model('api', 'UserProfile')
    
    # Get all profiles
    profiles = UserProfile.objects.all()
    
    # For each profile, update the corresponding user
    for profile in profiles:
        user = profile.user
        user.government_id_type = profile.government_id_type
        user.address = profile.address
        user.postal_code = profile.postal_code
        user.city = profile.city
        user.country = profile.country
        user.is_eligible_to_vote = profile.is_eligible_to_vote
        user.votes_cast = profile.votes_cast
        user.cooldown_end_date = profile.cooldown_end_date
        # Don't overwrite is_verified if user model already has it
        if not user.is_verified and profile.is_verified:
            user.is_verified = profile.is_verified
        user.save()

class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_alter_vote_options'),
    ]

    operations = [
        # Add new fields from UserProfile to User model
        migrations.AddField(
            model_name='user',
            name='government_id_type',
            field=models.CharField(choices=[('PASSPORT', 'Passport'), ('NATIONAL_ID', 'National ID'), ('DRIVERS_LICENSE', "Driver's License")], default='NATIONAL_ID', max_length=20),
        ),
        migrations.AddField(
            model_name='user',
            name='address',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='user',
            name='postal_code',
            field=models.CharField(blank=True, max_length=15),
        ),
        migrations.AddField(
            model_name='user',
            name='city',
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AddField(
            model_name='user',
            name='country',
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AddField(
            model_name='user',
            name='account_creation_date',
            field=models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='user',
            name='cooldown_end_date',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='user',
            name='is_eligible_to_vote',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='user',
            name='votes_cast',
            field=models.PositiveIntegerField(default=0),
        ),
        
        # Run the data migration
        migrations.RunPython(migrate_profile_data_to_user),
    ]
