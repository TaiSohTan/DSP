# Generated by Django 5.0.2 on 2025-04-24 15:31

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_systemsettings'),
    ]

    operations = [
        migrations.AddField(
            model_name='vote',
            name='receipt_hash',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]
