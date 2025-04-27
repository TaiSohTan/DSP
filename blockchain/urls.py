from django.urls import path
from . import views
from .views_wallet import rotate_ethereum_key, rotate_user_wallet_key

urlpatterns = [
    # Wallet management
    path('wallet/rotate-key/', rotate_ethereum_key, name='rotate-wallet-key'),
    path('wallet/rotate-user-key/', rotate_user_wallet_key, name='rotate-user-wallet-key'),
    
    # Blockchain status and operations
    path('blockchain/status/', views.blockchain_status, name='blockchain-status'),
    path('blockchain/sync/', views.blockchain_sync, name='blockchain-sync'),
]
