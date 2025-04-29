# Standard library imports
import logging
import os
import sys
import json
import time
from datetime import datetime, timedelta

# Third-party imports
from django.contrib.auth import get_user_model
from django.core.paginator import Paginator, EmptyPage
from django.db.models import Count, Sum, F, Q
from django.http import JsonResponse, HttpResponse
from django.utils import timezone

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status

# Local application imports
from .models import User, Election, Candidate, Vote, SystemSettings
from verification.models import VerificationUser

from blockchain.models import EthereumWallet
from blockchain.services.ethereum_service import EthereumService

User = get_user_model()

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_users(request):
    """
    Get user list for admin with pagination and optional filtering
    """
    try:
        page = int(request.query_params.get('page', 1))
        limit = int(request.query_params.get('limit', 10))
        
        # Calculate offset for pagination
        offset = (page - 1) * limit
        
        # Apply any filters
        query_filter = Q()
        
        # Example filters that could be added:
        if request.query_params.get('verified') == 'true':
            query_filter &= Q(is_verified=True)
        elif request.query_params.get('verified') == 'false':
            query_filter &= Q(is_verified=False)
        
        # Get users with pagination
        users = User.objects.filter(query_filter).order_by('-date_joined')
        total_count = users.count()
        
        try:
            pending_verifications = User.objects.filter(is_verified=False).count()
        except:
            pending_verifications = 0
        
        # Get the users for this page
        paginated_users = users[offset:offset + limit]
        
        # Prepare the response data
        user_data = []
        for user in paginated_users:
            # Always include these fields without checking hasattr
            user_dict = {
                'id': user.id,
                'email': user.email,
                'is_staff': user.is_staff,
                'date_joined': user.date_joined,
                'full_name': user.full_name,
                'is_verified': user.is_verified,
                'government_id_type': user.government_id_type,
                'is_eligible_to_vote': user.is_eligible_to_vote
            }
            
            # Only check ethereum_address as it might not exist in older records
            if hasattr(user, 'ethereum_address') and user.ethereum_address:
                user_dict['ethereum_address'] = user.ethereum_address
                
            user_data.append(user_dict)
        
        return Response({
            'count': total_count,
            'pending_verifications': pending_verifications,
            'next': page + 1 if offset + limit < total_count else None,
            'previous': page - 1 if page > 1 else None,
            'results': user_data,
            'users': user_data  # Adding users key for frontend compatibility
        })
    except Exception as e:
        logger = logging.getLogger(__name__)
        logger.error(f"Error in admin_users endpoint: {str(e)}")
        # Return empty results with error message
        return Response({
            'count': 0,
            'pending_verifications': 0,
            'next': None,
            'previous': None,
            'results': [],
            'users': [],  # Empty array to prevent "users is not iterable" error
            'error': str(e)
        })

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAdminUser])
def admin_user_detail(request, user_id):
    """
    Get, update or delete a single user by ID (admin only)
    """
    try:
        # Find user by ID
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        
        if request.method == 'GET':
            # Return user details
            user_data = {
                'id': user.id,
                'email': user.email,
                'full_name': user.full_name,
                'government_id': user.government_id,
                'government_id_type': user.government_id_type,
                'phone_number': user.phone_number,
                'is_staff': user.is_staff,
                'is_verified': user.is_verified,
                'is_eligible_to_vote': user.is_eligible_to_vote,
                'role': user.role,
                'date_joined': user.date_joined,
                'address': user.address,
                'postal_code': user.postal_code,
                'city': user.city,
                'country': user.country
            }
            
            # Add Ethereum address if it exists
            if hasattr(user, 'ethereum_address') and user.ethereum_address:
                user_data['ethereum_address'] = user.ethereum_address
                
            return Response(user_data)
            
        elif request.method == 'PUT':
            # Update user fields that are allowed to be changed by admins
            if 'is_staff' in request.data:
                user.is_staff = request.data['is_staff']
            if 'is_verified' in request.data:
                user.is_verified = request.data['is_verified']
            if 'is_eligible_to_vote' in request.data:
                user.is_eligible_to_vote = request.data['is_eligible_to_vote']
            if 'role' in request.data:
                user.role = request.data['role']
                
            # Save user and return updated data
            user.save()
            return Response({"message": "User updated successfully"})
            
        elif request.method == 'DELETE':
            # Delete the user
            user.delete()
            return Response({"message": "User deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
            
    except Exception as e:
        logger = logging.getLogger(__name__)
        logger.error(f"Error in admin_user_detail endpoint: {str(e)}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_verify_user(request, user_id):
    """
    Manually verify a user (admin only)
    """
    try:
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        
        user.is_verified = True
        user.save()
        
        return Response({"message": "User verified successfully"})
    except Exception as e:
        logger = logging.getLogger(__name__)
        logger.error(f"Error in admin_verify_user endpoint: {str(e)}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def system_status(request):
    """Check if the system is operational"""
    try:
        # If database is accessible, system is operational
        User.objects.first()  # Simple query to test database
        
        return Response({
            "status": "operational",
            "message": "All systems operational"
        })
    except Exception as e:
        return Response({
            "status": "error",
            "message": f"System experiencing issues: {str(e)}"
        })