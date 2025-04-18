from django.urls import path
from . import views_wallet

urlpatterns = [
    path('api/wallet/rotate-key/', views_wallet.rotate_ethereum_key, name='rotate_ethereum_key'),
]
