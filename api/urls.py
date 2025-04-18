from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    UserRegistrationView,
    UserLoginView,
    UserProfileView,
    SendPhoneOTPView,
    SendEmailOTPView,
    VerifyPhoneOTPView,
    CompleteRegistrationView,
    ResendRegistrationOTPView,
)
from .views_election import (
    ElectionViewSet,
    CandidateViewSet,
    VoteViewSet,
)

# Create a router for ViewSets
router = DefaultRouter()
router.register(r'elections', ElectionViewSet)
router.register(r'candidates', CandidateViewSet)
router.register(r'votes', VoteViewSet)

urlpatterns = [
    # User authentication & registration
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('register/complete/', CompleteRegistrationView.as_view(), name='complete-registration'),
    path('resend-registration-otp/', ResendRegistrationOTPView.as_view(), name='resend-registration-otp'),
    path('login/', UserLoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    
    # OTP verification
    path('send-phone-otp/', SendPhoneOTPView.as_view(), name='send-phone-otp'),
    path('send-email-otp/', SendEmailOTPView.as_view(), name='send-email-otp'),
    path('verify-phone-otp/', VerifyPhoneOTPView.as_view(), name='verify-phone-otp'),
    
    # Include router URLs
    path('', include(router.urls)),
]