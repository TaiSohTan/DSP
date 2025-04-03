import pyotp
import logging
import os
from typing import Dict, Tuple, Optional
from django.core.mail import send_mail
from django.conf import settings
from django.core.cache import cache
from datetime import datetime, timedelta
import hashlib

logger = logging.getLogger(__name__)

class OTPService:
    """
    Service for generating and verifying One-Time Passwords (OTP)
    for both SMS and Email verification.
    """
    
    # OTP validity period in minutes
    OTP_VALIDITY_MINUTES = 10
    
    # Cache key prefixes
    EMAIL_OTP_PREFIX = "email_otp_"
    SMS_OTP_PREFIX = "sms_otp_"
    
    @classmethod
    def generate_otp(cls, length: int = 6) -> str:
        """
        Generate a random OTP of specified length.
        
        Args:
            length: Length of the OTP (default: 6)
        
        Returns:
            A random OTP string
        """
        totp = pyotp.TOTP(pyotp.random_base32())
        otp = totp.now()
        
        # Ensure OTP has the exact desired length
        return otp.zfill(length)[-length:]
    
    @classmethod
    def _get_cache_key(cls, identifier: str, is_email: bool = True) -> str:
        """
        Get the cache key for storing OTP.
        
        Args:
            identifier: Email or phone number
            is_email: Whether the identifier is an email (True) or phone (False)
            
        Returns:
            Cache key string
        """
        # Normalize and hash the identifier for security
        normalized = identifier.lower().strip()
        hashed = hashlib.sha256(normalized.encode()).hexdigest()[:16]
        
        prefix = cls.EMAIL_OTP_PREFIX if is_email else cls.SMS_OTP_PREFIX
        return f"{prefix}{hashed}"
    
    @classmethod
    def send_email_otp(cls, email: str, purpose: str = "verification") -> bool:
        """
        Generate and send OTP via email.
        
        Args:
            email: Email address to send OTP to
            purpose: Purpose of the OTP (for the email subject)
            
        Returns:
            True if the email was sent successfully, False otherwise
        """
        otp = cls.generate_otp()
        cache_key = cls._get_cache_key(email, is_email=True)
        
        # Store OTP in cache
        cache.set(
            cache_key, 
            otp,
            timeout=cls.OTP_VALIDITY_MINUTES * 60
        )
        
        # Send email
        subject = f"Your Verification Code for E-Voting Platform"
        message = (
            f"Your verification code for {purpose} is: {otp}\n\n"
            f"This code will expire in {cls.OTP_VALIDITY_MINUTES} minutes.\n\n"
            f"If you did not request this code, please ignore this email."
        )
        
        try:
            sent = send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
            return sent > 0
        except Exception as e:
            logger.error(f"Failed to send email OTP: {str(e)}")
            return False
    
    @classmethod
    def send_sms_otp(cls, phone_number: str, purpose: str = "verification") -> bool:
        """
        Generate and send OTP via SMS.
        
        Args:
            phone_number: Phone number to send OTP to
            purpose: Purpose of the OTP (for the SMS text)
            
        Returns:
            True if the SMS was sent successfully, False otherwise
        """
        otp = cls.generate_otp()
        cache_key = cls._get_cache_key(phone_number, is_email=False)
        
        # Store OTP in cache
        cache.set(
            cache_key, 
            otp,
            timeout=cls.OTP_VALIDITY_MINUTES * 60
        )
        
        # Twilio integration would go here
        # For now, we'll just log the OTP (in a real system, we'd use Twilio or another SMS provider)
        message = f"Your verification code for {purpose} is: {otp}. This code will expire in {cls.OTP_VALIDITY_MINUTES} minutes."
        logger.info(f"SMS OTP for {phone_number}: {otp}")
        
        # In a real implementation, we would send the SMS here
        # For development, we'll just pretend we sent it and return success
        # In production, replace with actual SMS sending code
        return True
    
    @classmethod
    def verify_otp(cls, identifier: str, otp: str, is_email: bool = True) -> bool:
        """
        Verify an OTP against the stored value.
        
        Args:
            identifier: Email or phone number
            otp: The OTP to verify
            is_email: Whether the identifier is an email (True) or phone (False)
            
        Returns:
            True if OTP is valid, False otherwise
        """
        cache_key = cls._get_cache_key(identifier, is_email)
        stored_otp = cache.get(cache_key)
        
        if not stored_otp:
            return False
        
        # Check if OTP matches
        is_valid = stored_otp == otp
        
        # If valid, invalidate the OTP to prevent reuse
        if is_valid:
            cache.delete(cache_key)
            
        return is_valid