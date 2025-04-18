from typing import Dict, Tuple, Union, Optional
from verification.models import VerificationUser
from django.db.models import Q
from django.contrib.auth import get_user_model
from verification.signals import user_verified

User = get_user_model()

class VerificationService:
    """
    Service for verifying user details against the authentication database.
    This is used during registration to ensure only legitimate users can create accounts.
    """
    
    @staticmethod
    def verify_user_details(
        full_name: str,
        government_id: str,
        email: str,
        phone_number: str,
        date_of_birth: Optional[str] = None
    ) -> Tuple[bool, Dict[str, str]]:
        """
        Verify user details against the authentication database.
        
        Args:
            full_name: The full name of the user
            government_id: Government-issued ID number
            email: User's email address
            phone_number: User's phone number
            date_of_birth: User's date of birth (optional)
            
        Returns:
            Tuple containing:
                - Boolean indicating if verification passed
                - Dictionary with error messages for failed fields
        """
        errors = {}
        
        # Try to find a matching user record
        try:
            # Look for exact match on government ID (primary identifier)
            user = VerificationUser.objects.filter(government_id=government_id).first()
            
            if not user:
                # No match found, try looking by email or phone as fallback
                user = VerificationUser.objects.filter(
                    Q(email=email) | Q(phone_number=phone_number)
                ).first()
                
                if not user:
                    errors['government_id'] = "No matching record found. Please ensure your government ID is correct."
                    return False, errors
                else:
                    # Found by email or phone, but government ID doesn't match
                    errors['government_id'] = "Government ID doesn't match our records."
                    return False, errors
            
            # Check if user is eligible to vote
            if not user.is_eligible_voter:
                errors['eligibility'] = "You are not eligible to vote according to our records."
                return False, errors
            
            # Verify full name (case-insensitive)
            if user.full_name.lower() != full_name.lower():
                errors['full_name'] = "Full name doesn't match our records."
            
            # Verify email
            if user.email.lower() != email.lower():
                errors['email'] = "Email doesn't match our records."
            
            # Verify phone number (normalize by removing spaces, dashes, etc.)
            clean_phone = ''.join(c for c in phone_number if c.isdigit() or c == '+')
            clean_db_phone = ''.join(c for c in user.phone_number if c.isdigit() or c == '+')
            if clean_db_phone != clean_phone:
                errors['phone_number'] = "Phone number doesn't match our records."
            
            # Verify date of birth if provided
            if date_of_birth and hasattr(user, 'date_of_birth'):
                # Convert string date to date object for comparison
                from datetime import datetime
                try:
                    # Assuming date_of_birth is in YYYY-MM-DD format
                    parsed_dob = datetime.strptime(date_of_birth, '%Y-%m-%d').date()
                    if user.date_of_birth != parsed_dob:
                        errors['date_of_birth'] = "Date of birth doesn't match our records."
                except ValueError:
                    errors['date_of_birth'] = "Invalid date format. Please use YYYY-MM-DD."
            
            # If there are any errors, verification failed
            if errors:
                return False, errors
              # All checks passed
            # Find if there's a Django user with this email
            try:
                user = User.objects.get(email=email)
                # Send signal that user has been verified
                user_verified.send(
                    sender=VerificationService,
                    user=user,
                    verification_data={
                        'full_name': full_name,
                        'government_id': government_id,
                        'email': email,
                        'phone_number': phone_number,
                        'verification_record': user
                    }
                )
            except User.DoesNotExist:
                # No Django user exists with this email yet
                pass
                
            return True, {}
            
        except Exception as e:
            # Log the error but don't expose details to the client
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Verification error: {str(e)}")
            return False, {"general": "An error occurred during verification. Please try again later."}