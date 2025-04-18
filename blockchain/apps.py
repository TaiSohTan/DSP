from django.apps import AppConfig


class BlockchainConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'blockchain'

# In blockchain/apps.py
def ready(self):
    import blockchain.signals  # Import signals

    