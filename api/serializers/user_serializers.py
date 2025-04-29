from rest_framework import serializers
from api.models import User
from verification.services.verification_service import VerificationService
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from eth_account import Account
import secrets

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    confirm_password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    # Removed phone_otp field as it will be handled separately
    
    class Meta:
        model = User
        fields = ['email', 'full_name', 'government_id', 'phone_number', 'password', 'confirm_password']
        extra_kwargs = {
            'email': {'required': True},
            'full_name': {'required': True},
            'government_id': {'required': True},
            'phone_number': {'required': True}
        }
    
    def validate(self, attrs):
        # Check if passwords match
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Password fields didn't match."})
        
        # Validate password strength
        try:
            validate_password(attrs['password'])
        except ValidationError as e:
            raise serializers.ValidationError({"password": list(e.messages)})
        
        # Verify user details against the authentication database
        is_verified, errors = VerificationService.verify_user_details(
            full_name=attrs['full_name'],
            government_id=attrs['government_id'],
            email=attrs['email'],
            phone_number=attrs['phone_number']
        )
        
        if not is_verified:
            raise serializers.ValidationError(errors)
        
        return attrs
    
    def create(self, validated_data):
        # Remove confirm_password from validated data
        validated_data.pop('confirm_password')
        
        # Create the user - but set is_verified to False initially
        user = User.objects.create_user(
            email=validated_data['email'],
            government_id=validated_data['government_id'],
            full_name=validated_data['full_name'],
            phone_number=validated_data['phone_number'],
            password=validated_data['password'],
            is_verified=False,  # User is not verified until OTP confirmation
            is_eligible_to_vote=False  # Not eligible to vote initially
        )
        
        # Generate Ethereum wallet for the user
        private_key_hex = secrets.token_hex(32)
        account = Account.from_key(private_key_hex)
        
        # Store Ethereum address and private key
        user.ethereum_address = account.address
        user.ethereum_private_key = private_key_hex
        
        # Default government_id_type if not provided
        if not hasattr(user, 'government_id_type') or not user.government_id_type:
            user.government_id_type = 'NATIONAL_ID'
            
        user.save()
        
        return user

class OTPVerificationSerializer(serializers.Serializer):
    phone_number = serializers.CharField(required=True)
    otp = serializers.CharField(required=True)

class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, style={'input_type': 'password'})

class UserDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for user details, now using the merged User model.
    Previously named UserProfileSerializer before the User/UserProfile model merge.
    """    
    is_admin = serializers.SerializerMethodField()
    role = serializers.CharField(read_only=True)
    # Add fields for wallet information
    ethereum_address = serializers.CharField(read_only=True)
    wallet_balance = serializers.SerializerMethodField()
    private_key_last_four = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['email', 'full_name', 'government_id', 'government_id_type', 'phone_number',
                 'address', 'postal_code', 'city', 'country', 'is_verified', 
                 'is_eligible_to_vote', 'can_vote', 'cooldown_end_date', 'is_admin', 'role',
                 'ethereum_address', 'wallet_balance', 'private_key_last_four']
        read_only_fields = ['email', 'government_id', 'is_verified', 'is_eligible_to_vote', 
                           'cooldown_end_date', 'is_admin', 'role', 'ethereum_address', 
                           'wallet_balance', 'private_key_last_four']
    
    def get_is_admin(self, obj):
        return obj.is_staff or obj.is_superuser
    
    def get_wallet_balance(self, obj):
        """Get the Ethereum wallet balance in ETH."""
        if hasattr(obj, 'ethereum_address') and obj.ethereum_address:
            # Import here to prevent circular imports
            try:
                from blockchain.services.ethereum_service import EthereumService
                service = EthereumService()
                balance_wei = service.w3.eth.get_balance(obj.ethereum_address)
                return service.w3.from_wei(balance_wei, 'ether')
            except Exception as e:
                # Log the error but don't break the API
                import logging
                logging.error(f"Error fetching wallet balance: {str(e)}")
                return 0
        return 0
    
    def get_private_key_last_four(self, obj):
        """Return only the last 4 characters of the private key."""
        if hasattr(obj, 'ethereum_private_key') and obj.ethereum_private_key:
            # Return only the last 4 characters
            return obj.ethereum_private_key[-4:] if len(obj.ethereum_private_key) >= 4 else ''
        return ''

class PasswordResetRequestSerializer(serializers.Serializer):
    """
    Serializer for password reset requests.
    """
    email = serializers.EmailField(required=True)

class PasswordResetSerializer(serializers.Serializer):
    """
    Serializer for password reset with token verification.
    """
    email = serializers.EmailField(required=True)
    token = serializers.CharField(required=True)
    password = serializers.CharField(required=True, style={'input_type': 'password'})
    
    def validate_password(self, value):
        """
        Validate the password strength.
        """
        try:
            # We'll use an empty user model for validation since we don't have the actual user yet
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

class CompleteRegistrationSerializer(serializers.Serializer):
    """
    Serializer for completing registration after OTP verification.
    """
    registration_id = serializers.CharField(required=True)
    phone_number = serializers.CharField(required=True)
    otp = serializers.CharField(required=True)