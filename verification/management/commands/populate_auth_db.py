import random
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from verification.models import VerificationUser
from django.utils import timezone
import uuid

class Command(BaseCommand):
    help = 'Populates the authentication database with sample verified users. We are trying to model a realistic scenario where a users provided data is cross-checked against a government database '

    def add_arguments(self, parser):
        parser.add_argument('--count', type=int, default=50, help='Number of sample users to generate')

    def handle(self, *args, **options):
        count = options['count']
        self.stdout.write(self.style.SUCCESS(f'Generating {count} verified users...'))
        
        # Delete existing users if any
        VerificationUser.objects.all().delete()
        
        # Generate sample data
        government_id_types = ['PASSPORT', 'NATIONAL_ID', 'DRIVERS_LICENSE']
        countries = ['United Kingdom']
        cities = {
            'United Kingdom': ['London', 'Manchester', 'Birmingham', 'Edinburgh', 'Glasgow','Bristol', 'Leeds', 'Liverpool', 'Sheffield', 'Newcastle', 'Preston', 'Cardiff', 'Coventry', 'Nottingham', 'Belfast', 'Brighton', 'Southampton', 'Derby', 'Stoke-on-Trent', 'Wolverhampton'],
        }
        
        # First names and last names for more realistic data
        first_names = ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Mary', 
                       'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Susan', 'Jessica', 'Sarah', 'Karen']
        last_names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 
                     'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore']
        
        users_created = 0
        
        # Generate sample users
        for i in range(count):
            try:
                first_name = random.choice(first_names)
                last_name = random.choice(last_names)
                full_name = f"{first_name} {last_name}"
                
                # Generate a date of birth for someone between 18 and 85 years old
                days_old = random.randint(18*365, 85*365)
                date_of_birth = (timezone.now() - timedelta(days=days_old)).date()
                
                country = random.choice(countries)
                city = random.choice(cities[country])
                
                # Generate a somewhat realistic government ID
                gov_id_type = random.choice(government_id_types)
                if gov_id_type == 'PASSPORT':
                    gov_id = f"P{random.randint(10000000, 99999999)}"
                elif gov_id_type == 'NATIONAL_ID':
                    gov_id = f"ID{random.randint(1000000, 9999999)}"
                else:  # Driver's License
                    gov_id = f"DL{random.randint(100000, 999999)}"
                
                # Generate a unique email based on name
                email = f"{first_name.lower()}.{last_name.lower()}{random.randint(1, 999)}@example.com"
                
                # Generate a phone number
                phone = f"+{random.randint(1, 99)}{random.randint(1000000000, 9999999999)}"
                
                # Create the verified user
                user = VerificationUser(
                    id=uuid.uuid4(),
                    full_name=full_name,
                    date_of_birth=date_of_birth,
                    government_id=gov_id,
                    government_id_type=gov_id_type,
                    address=f"{random.randint(1, 999)} {last_name} Street",
                    postal_code=f"{random.randint(10000, 99999)}",
                    city=city,
                    country=country,
                    email=email,
                    phone_number=phone,
                    is_eligible_voter=random.random() > 0.05,  # 5% chance of not being eligible
                    verification_date=timezone.now() - timedelta(days=random.randint(1, 365))
                )
                user.save()
                users_created += 1
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error creating user: {e}'))
        
        self.stdout.write(self.style.SUCCESS(f'Successfully created {users_created} verified users in the authentication database'))