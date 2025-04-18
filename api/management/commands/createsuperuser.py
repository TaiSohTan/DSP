import os
from django.core.management.commands import createsuperuser
from django.contrib.auth import get_user_model
from blockchain.models import EthereumWallet
from django.db import transaction

User = get_user_model()

class Command(createsuperuser.Command):
    help = 'Create a superuser with an Ethereum wallet'

    def handle(self, *args, **options):
        # Call the original createsuperuser command
        super().handle(*args, **options)
        
        # Get the most recently created superuser (assuming it's the one just created)
        latest_superuser = User.objects.filter(is_superuser=True).order_by('-date_joined').first()
        
        if latest_superuser:
            # Check if this superuser already has a wallet
            if not hasattr(latest_superuser, 'ethereum_wallet'):
                try:
                    with transaction.atomic():
                        # Create a password for the wallet (using the user's password for simplicity)
                        # In production, you might want a separate secure password
                        wallet_password = latest_superuser.email  # Using email as a simple password source
                        
                        # Create a new Ethereum wallet for the superuser
                        wallet = EthereumWallet.create_wallet(latest_superuser, wallet_password)
                        
                        self.stdout.write(self.style.SUCCESS(
                            f'Ethereum wallet created for {latest_superuser.email} with address {wallet.address}'
                        ))
                        
                        # For development: Output the Ganache deterministic private key
                        # This is just for development convenience using the first Ganache account
                        if os.environ.get('DJANGO_SETTINGS_MODULE') == 'dsp.settings' and os.environ.get('DEBUG') == '1':
                            self.stdout.write(self.style.WARNING(
                                'DEVELOPMENT ONLY: Using deterministic private key from Ganache'
                            ))
                            # First account from Ganache when using --deterministic flag
                            deterministic_key = '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d'
                            self.stdout.write(self.style.WARNING(
                                f'Private key (DO NOT SHARE IN PRODUCTION): {deterministic_key}'
                            ))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(
                        f'Failed to create Ethereum wallet: {str(e)}'
                    ))
            else:
                self.stdout.write(self.style.WARNING(
                    f'Superuser {latest_superuser.email} already has an Ethereum wallet'
                ))
        else:
            self.stdout.write(self.style.ERROR(
                'No superuser found. Wallet creation failed.'
            ))
