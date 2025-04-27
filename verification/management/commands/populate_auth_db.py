import random
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from verification.models import VerificationUser
from django.utils import timezone
from django.db import connections
import uuid

class Command(BaseCommand):
    help = 'Populates the authentication database with sample verified users. We are trying to model a realistic scenario where a users provided data is cross-checked against a government database '

    def add_arguments(self, parser):
        parser.add_argument('--count', type=int, default=50, help='Number of sample users to generate')
    def handle(self, *args, **options):
        count = options['count']
        self.stdout.write(self.style.SUCCESS(f'Generating {count} verified users...'))
        
        # Check if the table exists in the database before trying to delete
        cursor = connections['auth_db'].cursor()
        
        try:
            # Try to create the table if it doesn't exist
            self.stdout.write(self.style.WARNING('Ensuring verification_users table exists...'))
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS verification_users (
                    id UUID PRIMARY KEY,
                    full_name VARCHAR(100) NOT NULL,
                    date_of_birth DATE NOT NULL,
                    government_id VARCHAR(20) UNIQUE NOT NULL,
                    government_id_type VARCHAR(20) NOT NULL,
                    address TEXT NOT NULL,
                    postal_code VARCHAR(15) NOT NULL,
                    city VARCHAR(50) NOT NULL,
                    country VARCHAR(50) NOT NULL,
                    email VARCHAR(254) UNIQUE NOT NULL,
                    phone_number VARCHAR(15) UNIQUE NOT NULL,
                    is_eligible_voter BOOLEAN NOT NULL DEFAULT TRUE,
                    verification_date TIMESTAMP WITH TIME ZONE NOT NULL
                )
            """
            )
            connections['auth_db'].commit()
            
            self.stdout.write(self.style.SUCCESS('Table verified/created successfully'))
            
            # Now try to delete existing records
            self.stdout.write(self.style.WARNING('Clearing existing records...'))
            cursor.execute('DELETE FROM verification_users')
            connections['auth_db'].commit()
            self.stdout.write(self.style.SUCCESS('Existing records cleared'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error setting up database table: {e}'))
            self.stdout.write(self.style.WARNING('Continuing with record creation...'))
        
        # Generate sample data
        government_id_types = ['PASSPORT', 'NATIONAL_ID', 'DRIVERS_LICENSE']
        countries = ['United Kingdom']
        cities = {
            'United Kingdom': ['London', 'Manchester', 'Birmingham', 'Edinburgh', 'Glasgow','Bristol', 'Leeds', 'Liverpool', 'Sheffield', 'Newcastle', 'Preston', 'Cardiff', 'Coventry', 'Nottingham', 'Belfast', 'Brighton', 'Southampton', 'Derby', 'Stoke-on-Trent', 'Wolverhampton'],
        }
        
        # UK postcode prefixes for each city
        uk_postcode_prefixes = {
            'London': ['E', 'EC', 'N', 'NW', 'SE', 'SW', 'W', 'WC'],
            'Manchester': ['M'],
            'Birmingham': ['B'],
            'Edinburgh': ['EH'],
            'Glasgow': ['G'],
            'Bristol': ['BS'],
            'Leeds': ['LS'],
            'Liverpool': ['L'],
            'Sheffield': ['S'],
            'Newcastle': ['NE'],
            'Preston': ['PR'],
            'Cardiff': ['CF'],
            'Coventry': ['CV'],
            'Nottingham': ['NG'],
            'Belfast': ['BT'],
            'Brighton': ['BN'],
            'Southampton': ['SO'],
            'Derby': ['DE'],
            'Stoke-on-Trent': ['ST'],
            'Wolverhampton': ['WV']
        }
        
        # Generate realistic UK postcode
        def generate_uk_postcode(city):
            prefix = random.choice(uk_postcode_prefixes[city])
            
            # First part of postcode (outward code)
            if len(prefix) == 1:
                outward = f"{prefix}{random.randint(1, 99)}"
            else:
                outward = f"{prefix}{random.randint(1, 9)}"
            
            # Second part of postcode (inward code)
            # Format: number + two letters
            inward = f"{random.randint(0, 9)}{chr(random.randint(65, 90))}{chr(random.randint(65, 90))}"
            
            return f"{outward} {inward}"
        
        # First names and last names for more realistic data
        first_names = ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Mary', 
                       'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Susan', 'Jessica', 'Sarah', 'Karen']
        last_names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 
                     'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore']
        
        # Realistic UK street names
        street_names = [
            'High Street', 'Station Road', 'Church Street', 'Park Road', 'Victoria Road', 'Green Lane',
            'Manor Road', 'Church Lane', 'Park Avenue', 'The Avenue', 'Queens Road', 'New Road',
            'King Street', 'Main Street', 'Mill Lane', 'London Road', 'School Lane', 'Fairview Road', 
            'Richmond Road', 'Windsor Road', 'York Road', 'Springfield Road', 'George Street',
            'Victoria Street', 'Albert Road', 'Queens Avenue', 'Kings Road', 'Grange Road',
            'Highfield Road', 'Mill Road', 'Alexander Road', 'The Crescent', 'Meadow Lane',
            'The Green', 'Grove Road', 'Bridge Road', 'West Street', 'North Street', 'East Street', 
            'South Street', 'St. John\'s Road', 'Oxford Street', 'Regent Street', 'Kensington Road',
            'Piccadilly', 'Abbey Road', 'Baker Street', 'Bond Street', 'Carnaby Street',
            'Downing Street', 'Fleet Street', 'Jermyn Street', 'Lombard Street', 'Savile Row', 'Shaftesbury Avenue'
        ]
        
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
                
                # Generate a realistic UK postcode based on the city
                postal_code = generate_uk_postcode(city)
                
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
                phone = f"+44{random.randint(1000000000, 9999999999)}"
                
                # Generate a realistic address with random house number and street name
                address = f"{random.randint(1, 999)} {random.choice(street_names)}"
                
                # Create the verified user                
                user = VerificationUser(
                    id=uuid.uuid4(),
                    full_name=full_name,
                    date_of_birth=date_of_birth,
                    government_id=gov_id,
                    government_id_type=gov_id_type,
                    address=address,
                    postal_code=postal_code,
                    city=city,
                    country=country,
                    email=email,
                    phone_number=phone,
                    is_eligible_voter=random.random() > 0.05,  # 5% chance of not being eligible
                    verification_date=timezone.now() - timedelta(days=random.randint(1, 365))
                )
                # Save to the auth_db database
                user.save(using='auth_db')
                users_created += 1
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error creating user: {e}'))
        
        self.stdout.write(self.style.SUCCESS(f'Successfully created {users_created} verified users in the authentication database'))