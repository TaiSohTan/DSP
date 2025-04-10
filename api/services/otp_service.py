import pyotp
import logging
import os
from typing import Dict, Tuple, Optional
from django.core.mail import send_mail
from django.conf import settings
from django.core.cache import cache
from datetime import datetime, timedelta
import hashlib
from twilio.rest import Client

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
    
    # Twilio configuration - set these in settings.py or environment variables
    TWILIO_ACCOUNT_SID = getattr(settings, 'TWILIO_ACCOUNT_SID', os.environ.get('TWILIO_ACCOUNT_SID'))
    TWILIO_AUTH_TOKEN = getattr(settings, 'TWILIO_AUTH_TOKEN', os.environ.get('TWILIO_AUTH_TOKEN'))
    TWILIO_PHONE_NUMBER = getattr(settings, 'TWILIO_PHONE_NUMBER', os.environ.get('TWILIO_PHONE_NUMBER'))
    
    # Flag to control service usage vs. logging (for development)
    USE_SMS_SERVICE = getattr(settings, 'USE_SMS_SERVICE', False)
    
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
      # Email configuration - set these in settings.py or environment variables
    USE_EMAIL_SERVICE = getattr(settings, 'USE_EMAIL_SERVICE', True)
    
    @classmethod
    def send_email_otp(cls, email: str, purpose: str = "verification") -> bool:
        """
        Generate and send OTP via email.
        Also logs the OTP for development purposes.
        
        Args:
            email: Email address to send OTP to
            purpose: Purpose of the OTP (for the email subject)
            
        Returns:
            True if the email was sent successfully or logged, False otherwise
        """
        otp = cls.generate_otp()
        cache_key = cls._get_cache_key(email, is_email=True)
        
        # Store OTP in cache
        cache.set(
            cache_key, 
            otp,
            timeout=cls.OTP_VALIDITY_MINUTES * 60
        )
        
        # Always log OTP for development purposes
        logger.info(f"EMAIL OTP for {email}: {otp}")
        print(f"DEBUG EMAIL OTP for {email}: {otp}")
        
        # Create email content
        subject = f"Your Verification Code for E-Voting Platform"
        message = (
            f"Your verification code for {purpose} is: {otp}\n\n"
            f"This code will expire in {cls.OTP_VALIDITY_MINUTES} minutes.\n\n"
            f"If you did not request this code, please ignore this email."
        )
        
        # Only attempt to send email if service is enabled
        if cls.USE_EMAIL_SERVICE:
            try:
                # Send plain text email
                sent = send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [email],
                    fail_silently=False,
                )
                
                if sent > 0:
                    logger.info(f"Email sent successfully to {email}")
                    return True
                else:
                    logger.warning(f"Failed to send email to {email}")
                    # Even if email fails, we've logged the OTP for development
                    return True
                    
            except Exception as e:
                logger.error(f"Failed to send email OTP: {str(e)}")
                # Even if email fails, we've logged the OTP for development
                return True
        else:
            logger.info("Email service not configured, using log-based OTP only")
            # Return True since we're using the logged OTP for verification
            return True
    
    @classmethod
    def send_sms_otp(cls, phone_number: str, purpose: str = "verification") -> bool:
        """
        Generate and send OTP via SMS using Twilio.
        Also logs the OTP for development purposes.
        
        Args:
            phone_number: Phone number to send OTP to
            purpose: Purpose of the OTP (for the SMS text)
            
        Returns:
            True if the SMS was sent successfully or logged, False otherwise
        """
        otp = cls.generate_otp()
        cache_key = cls._get_cache_key(phone_number, is_email=False)
        
        # Store OTP in cache
        cache.set(
            cache_key, 
            otp,
            timeout=cls.OTP_VALIDITY_MINUTES * 60
        )
        
        # Always log OTP for development purposes
        logger.info(f"SMS OTP for {phone_number}: {otp}")
        print(f"DEBUG SMS OTP for {phone_number}: {otp}")
        
        # Message text
        message = f"Your verification code for {purpose} is: {otp}. This code will expire in {cls.OTP_VALIDITY_MINUTES} minutes."
        
        # If Twilio integration is enabled and credentials are available
        if cls.USE_SMS_SERVICE and cls.TWILIO_ACCOUNT_SID and cls.TWILIO_AUTH_TOKEN and cls.TWILIO_PHONE_NUMBER:
            try:
                # Initialize Twilio client
                client = Client(cls.TWILIO_ACCOUNT_SID, cls.TWILIO_AUTH_TOKEN)
                
                # Send SMS
                twilio_message = client.messages.create(
                    body=message,
                    from_=cls.TWILIO_PHONE_NUMBER,
                    to=phone_number
                )
                
                logger.info(f"Twilio SMS sent with SID: {twilio_message.sid}")
                return True
                
            except Exception as e:
                logger.error(f"Failed to send SMS via Twilio: {str(e)}")
                # Even if Twilio fails, we've logged the OTP for development
                return True
        else:
            logger.info("Twilio service not configured, using log-based OTP only")
            # Return True since we're using the logged OTP for verification
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