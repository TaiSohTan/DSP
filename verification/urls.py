from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    VerifyUserAPIView,
    VerificationUserViewSet,
    search_verification_users,
    verify_citizen_exists,
    clear_auth_db
)

# Set up router for ViewSets
router = DefaultRouter()
router.register(r'admin/auth-users', VerificationUserViewSet, basename='admin-auth-users')

urlpatterns = [
    path('verify-user/', VerifyUserAPIView.as_view(), name='verify-user'),
    
    # Admin endpoints for auth database CRUD operations
    path('', include(router.urls)),
    path('admin/auth-search/', search_verification_users, name='admin-auth-search'),
    path('admin/verify-citizen/', verify_citizen_exists, name='admin-verify-citizen'),
    path('admin/clear-auth-db/', clear_auth_db, name='admin-clear-auth-db'),
]