import base64
import os
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
from Crypto.Random import get_random_bytes
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class AES256Encryption:
    """Utility for encrypting and decrypting data using AES-256"""
    
    @staticmethod
    def get_encryption_key():
        ## Get or generate the encryption key (32 bytes for AES-256)
        key = getattr(settings, 'DATABASE_ENCRYPTION_KEY', None)
        
        if not key:
            # For development only - in production, this should be set in environment
            if settings.DEBUG:
                key = base64.b64encode(get_random_bytes(32)).decode('utf-8')
                logger.warning("Generated temporary encryption key. In production, set DATABASE_ENCRYPTION_KEY.")
            else:
                raise ValueError("DATABASE_ENCRYPTION_KEY must be set in production")
                
        # Ensure key is correct length for AES-256 (32 bytes)
        if isinstance(key, str):
            key = base64.b64decode(key.encode('utf-8'))
            
        # If the key is not 32 bytes, derive a 32-byte key
        if len(key) != 32:
            from cryptography.hazmat.primitives import hashes
            from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
            
            salt = b'static_salt_for_key_derivation'  # In production, this should be securely stored
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
            )
            key = kdf.derive(key)
            
        return key
    
    @staticmethod
    def encrypt(text):
        """Encrypt data using AES-256 CBC mode"""
        if not text:
            return text
            
        # Convert to bytes if string
        if isinstance(text, str):
            text = text.encode('utf-8')
            
        try:
            # Get the encryption key
            key = AES256Encryption.get_encryption_key()
            
            # Generate a random IV (Initialization Vector)
            iv = get_random_bytes(16)
            
            # Create AES cipher in CBC mode
            cipher = AES.new(key, AES.MODE_CBC, iv)
            
            # Pad the data and encrypt
            padded_data = pad(text, AES.block_size)
            encrypted_data = cipher.encrypt(padded_data)
            
            # Combine IV and encrypted data for storage
            result = base64.b64encode(iv + encrypted_data).decode('utf-8')
            return result
            
        except Exception as e:
            logger.error(f"Encryption error: {str(e)}")
            raise
    
    @staticmethod
    def decrypt(encrypted_text):
        """Decrypt data that was encrypted with AES-256 CBC mode"""
        if not encrypted_text:
            return encrypted_text
            
        try:
            # Get the encryption key
            key = AES256Encryption.get_encryption_key()
            
            # Decode from base64
            raw_data = base64.b64decode(encrypted_text)
            
            # Extract IV (first 16 bytes) and encrypted data
            iv = raw_data[:16]
            encrypted_data = raw_data[16:]
            
            # Create AES cipher in CBC mode
            cipher = AES.new(key, AES.MODE_CBC, iv)
            
            # Decrypt and unpad
            decrypted_data = unpad(cipher.decrypt(encrypted_data), AES.block_size)
            
            # Convert bytes back to string
            return decrypted_data.decode('utf-8')
            
        except Exception as e:
            logger.error(f"Decryption error: {str(e)}")
            return None
