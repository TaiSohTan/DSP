# Generated by Django 5.0.2 on 2025-04-24 10:38

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('verification', '0002_verificationuser_blacklist_date_and_more'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='verificationuser',
            options={'managed': False, 'verbose_name': 'Verified User', 'verbose_name_plural': 'Verified Users'},
        ),
    ]
