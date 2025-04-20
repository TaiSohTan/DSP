from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_merge_user_profile_models'),
    ]

    operations = [
        # Remove the UserProfile model
        migrations.RemoveField(
            model_name='userprofile',
            name='user',
        ),
        migrations.DeleteModel(
            name='UserProfile',
        ),
    ]
