from rest_framework import serializers
from verification.models import VerificationUser

class VerificationUserSerializer(serializers.ModelSerializer):
    """
    Serializer for the VerificationUser model in the auth database.
    Used for admin-side CRUD operations.
    """
    class Meta:
        model = VerificationUser
        fields = [
            'id', 'full_name', 'date_of_birth', 'government_id',
            'government_id_type', 'address', 'postal_code', 'city',
            'country', 'email', 'phone_number', 'is_eligible_voter',
            'verification_date'
        ]
