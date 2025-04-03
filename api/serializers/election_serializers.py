from rest_framework import serializers
from api.models import Election, Candidate, Vote
from django.utils import timezone

class CandidateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Candidate
        fields = ['id', 'name', 'description', 'blockchain_id']
        read_only_fields = ['id', 'blockchain_id']

class ElectionSerializer(serializers.ModelSerializer):
    candidates = CandidateSerializer(many=True, read_only=True)
    
    class Meta:
        model = Election
        fields = ['id', 'title', 'description', 'start_date', 'end_date', 
                  'is_active', 'contract_address', 'candidates', 'created_at']
        read_only_fields = ['id', 'contract_address', 'created_at']
    
    def validate(self, attrs):
        # Ensure start date is in the future for new elections
        if not self.instance and attrs['start_date'] <= timezone.now():
            raise serializers.ValidationError({"start_date": "Start date must be in the future."})
        
        # Ensure end date is after start date
        if attrs['end_date'] <= attrs['start_date']:
            raise serializers.ValidationError({"end_date": "End date must be after start date."})
        
        return attrs

class VoteSerializer(serializers.ModelSerializer):
    election_id = serializers.UUIDField(write_only=True)
    candidate_id = serializers.UUIDField(write_only=True)
    email_otp = serializers.CharField(write_only=True)
    
    class Meta:
        model = Vote
        fields = ['id', 'election_id', 'candidate_id', 'email_otp', 'timestamp', 
                  'transaction_hash', 'is_confirmed']
        read_only_fields = ['id', 'voter', 'election', 'candidate', 'timestamp', 
                            'transaction_hash', 'is_confirmed']
    
    def validate(self, attrs):
        request = self.context.get('request')
        user = request.user
        
        # Get election and candidate
        try:
            election = Election.objects.get(id=attrs['election_id'])
            candidate = Candidate.objects.get(id=attrs['candidate_id'], election=election)
        except Election.DoesNotExist:
            raise serializers.ValidationError({"election_id": "Election not found."})
        except Candidate.DoesNotExist:
            raise serializers.ValidationError({"candidate_id": "Candidate not found for this election."})
        
        # Check if election is active
        if not election.is_active:
            raise serializers.ValidationError({"election_id": "This election is not active."})
        
        # Check if user has already voted in this election
        if Vote.objects.filter(voter=user, election=election).exists():
            raise serializers.ValidationError({"election_id": "You have already voted in this election."})
        
        # Store election and candidate for create method
        attrs['election'] = election
        attrs['candidate'] = candidate
        
        return attrs
    
    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user
        
        # Get election and candidate from validated data
        election = validated_data.pop('election')
        candidate = validated_data.pop('candidate')
        
        # Remove OTP and election_id/candidate_id from validated data
        validated_data.pop('email_otp', None)
        validated_data.pop('election_id', None)
        validated_data.pop('candidate_id', None)
        
        # Create vote instance
        vote = Vote.objects.create(
            voter=user,
            election=election,
            candidate=candidate,
            **validated_data
        )
        
        return vote

class VoteReceiptSerializer(serializers.ModelSerializer):
    election_title = serializers.CharField(source='election.title', read_only=True)
    candidate_name = serializers.CharField(source='candidate.name', read_only=True)
    
    class Meta:
        model = Vote
        fields = ['id', 'election_title', 'candidate_name', 'timestamp', 
                  'transaction_hash', 'is_confirmed']
        read_only_fields = fields