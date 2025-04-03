from django.urls import path
from .views import VerifyUserAPIView

urlpatterns = [
    path('verify-user/', VerifyUserAPIView.as_view(), name='verify-user'),
]