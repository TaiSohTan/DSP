from django.db import models
from .utils.encryption import AES256Encryption

class AESEncryptedTextField(models.TextField):
    """TextField that automatically encrypts/decrypts data using AES-256"""
    
    description = "TextField that encrypts its values with AES-256"
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
    def from_db_value(self, value, expression, connection):
        if value is None:
            return value
        return AES256Encryption.decrypt(value)
    
    def to_python(self, value):
        if value is None:
            return value
        # If already decrypted or newly set value, return as is
        if not isinstance(value, str) or not value.startswith('eyJ'):
            return value
        return AES256Encryption.decrypt(value)
        
    def get_prep_value(self, value):
        if value is None:
            return value
        # Only encrypt if not already encrypted
        if isinstance(value, str) and not value.startswith('eyJ'):
            return AES256Encryption.encrypt(value)
        return value

class AESEncryptedCharField(models.CharField):
    """CharField that automatically encrypts/decrypts data using AES-256"""
    
    description = "CharField that encrypts its values with AES-256"
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
    def from_db_value(self, value, expression, connection):
        if value is None:
            return value
        return AES256Encryption.decrypt(value)
    
    def to_python(self, value):
        if value is None:
            return value
        # If already decrypted or newly set value, return as is
        if not isinstance(value, str) or not value.startswith('eyJ'):
            return value
        return AES256Encryption.decrypt(value)
        
    def get_prep_value(self, value):
        if value is None:
            return value
        # Only encrypt if not already encrypted
        if isinstance(value, str) and not value.startswith('eyJ'):
            return AES256Encryption.encrypt(value)
        return value
