from rest_framework import serializers
from api.models import User, UserProfile
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
            is_verified=False  # User is not verified until OTP confirmation
        )
        
        # Generate Ethereum wallet for the user
        private_key_hex = secrets.token_hex(32)
        account = Account.from_key(private_key_hex)
        
        # Store Ethereum address and private key
        user.ethereum_address = account.address
        user.ethereum_private_key = private_key_hex
        user.save()
        
        # Create UserProfile with is_verified and is_eligible_to_vote set to False initially
        profile = UserProfile.objects.create(
            user=user,
            government_id=validated_data['government_id'],
            government_id_type='NATIONAL_ID',
            phone_number=validated_data['phone_number'],
            is_verified=False,
            is_eligible_to_vote=False
        )
        
        return user

class OTPVerificationSerializer(serializers.Serializer):
    phone_number = serializers.CharField(required=True)
    otp = serializers.CharField(required=True)

class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, style={'input_type': 'password'})

class UserProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    full_name = serializers.CharField(source='user.full_name', read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ['email', 'full_name', 'government_id', 'government_id_type', 'phone_number',
                 'address', 'postal_code', 'city', 'country', 'is_verified', 
                 'is_eligible_to_vote', 'can_vote', 'cooldown_end_date']
        read_only_fields = ['is_verified', 'is_eligible_to_vote', 'cooldown_end_date']