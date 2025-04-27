from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    UserRegistrationView,
    UserLoginView,
    UserDetailView,
    SendPhoneOTPView,
    SendEmailOTPView,
    VerifyPhoneOTPView,
    CompleteRegistrationView,
    ResendRegistrationOTPView,
    RequestPasswordResetView, 
    ResetPasswordView,
    AdminDashboardView,
    nullification_requests
)
from .views_election import (
    ElectionViewSet,
    CandidateViewSet,
    VoteViewSet,
    election_stats,
    direct_pdf_download
)
from .views_admin import admin_users, admin_user_detail, admin_verify_user, system_status
from .views_settings import SystemSettingsView, ResetSystemSettingsView

# Create a router for ViewSets
router = DefaultRouter()
router.register(r'elections', ElectionViewSet)
router.register(r'candidates', CandidateViewSet)
router.register(r'votes', VoteViewSet)

urlpatterns = [
    # User authentication & registration
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('register/confirm/', CompleteRegistrationView.as_view(), name='complete-registration'),
    path('resend-registration-otp/', ResendRegistrationOTPView.as_view(), name='resend-registration-otp'),
    path('login/', UserLoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', UserDetailView.as_view(), name='profile'),
    
    # OTP verification
    path('send-phone-otp/', SendPhoneOTPView.as_view(), name='send-phone-otp'),
    path('send-email-otp/', SendEmailOTPView.as_view(), name='send-email-otp'),
    path('verify-phone-otp/', VerifyPhoneOTPView.as_view(), name='verify-phone-otp'),

    ## Password Request and Reset 
    path('users/request-password-reset/', RequestPasswordResetView.as_view(), name='request-password-reset'),
    path('users/reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    
    # Admin endpoints
    path('admin/dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
    path('admin/nullification-requests/', nullification_requests, name='nullification-requests'),
    path('admin/settings/', SystemSettingsView.as_view(), name='system-settings'),
    path('admin/settings/reset/', ResetSystemSettingsView.as_view(), name='reset-system-settings'),
    path('admin/status/', system_status, name='system_status'),
    path('admin/election-stats/', election_stats, name='election_stats'),
    path('admin/users/', admin_users, name='admin-users'),
    path('admin/users/<str:user_id>/', admin_user_detail, name='admin-user-detail'),
    path('admin/users/<str:user_id>/verify/', admin_verify_user, name='admin-verify-user'),
    
    # Public verification endpoints
    path('votes/<uuid:pk>/public_receipt/', VoteViewSet.as_view({'get': 'public_receipt'}), name='public-vote-receipt'),
    path('votes/<uuid:pk>/public_verify/', VoteViewSet.as_view({'get': 'public_verify'}), name='public-vote-verify'),
    
    # Explicitly register custom actions
    path('votes/<uuid:pk>/receipt_pdf/', VoteViewSet.as_view({'get': 'receipt_pdf'}), name='vote-receipt-pdf'),
    path('votes/<uuid:pk>/verify/', VoteViewSet.as_view({'get': 'verify'}), name='vote-verify'),
    
    # Direct PDF download endpoint with token in URL path
    path('direct-download/votes/<uuid:vote_id>/pdf/<str:token>/', direct_pdf_download, name='direct-pdf-download'),
    
    # Include router URLs
    path('', include(router.urls)),
]