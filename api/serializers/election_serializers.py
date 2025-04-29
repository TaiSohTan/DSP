from rest_framework import serializers
from api.models import Election, Candidate, Vote
from django.utils import timezone                  
import pytz
from blockchain.services.ethereum_service import EthereumService
from blockchain.utils.time_utils import (
    get_current_time, 
    system_to_blockchain_time, 
    blockchain_to_system_time,
    datetime_to_blockchain_timestamp
)
from django.conf import settings
import logging


class CandidateSerializer(serializers.ModelSerializer):
    election_id = serializers.UUIDField(write_only=True, required=True)
    
    class Meta:
        model = Candidate
        fields = ['id', 'name', 'description', 'blockchain_id', 'election_id']
        read_only_fields = ['id', 'blockchain_id']
        
    def create(self, validated_data):
        # Extract election_id and look up the related Election object
        election_id = validated_data.pop('election_id')
        try:
            election = Election.objects.get(id=election_id)
        except Election.DoesNotExist:
            raise serializers.ValidationError({"election_id": "Election not found"})
            
        # Create the candidate with the election relationship
        candidate = Candidate.objects.create(
            election=election,
            **validated_data
        )
        return candidate

# Serializer for regular users (without blockchain details)
class PublicElectionSerializer(serializers.ModelSerializer):
    candidates = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    results = serializers.SerializerMethodField()
    
    class Meta:
        model = Election
        fields = ['id', 'title', 'description', 'start_date', 'end_date', 
                  'is_active', 'candidates', 'status', 'results', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_candidates(self, obj):
        # Return candidates without blockchain_id for regular users
        candidates_data = []
        for candidate in obj.candidates.all():
            candidates_data.append({
                'id': candidate.id,
                'name': candidate.name,
                'description': candidate.description
            })
        return candidates_data

    def get_status(self, obj):
        now = get_current_time()
        
        # Debug logging to understand what's happening
        logger = logging.getLogger(__name__)
        logger.info(f"Calculating status for election {obj.id} ({obj.title})")
        logger.info(f"  Current time: {now}")
        logger.info(f"  Election start_date: {obj.start_date}")
        logger.info(f"  Election end_date: {obj.end_date}")
        logger.info(f"  Is active flag: {obj.is_active}")
        
        # Adjust the comparison times using standardized utility functions
        adjusted_start_date = system_to_blockchain_time(obj.start_date)
        adjusted_end_date = system_to_blockchain_time(obj.end_date)
        
        logger.info(f"  Adjusted start_date: {adjusted_start_date}")
        logger.info(f"  Adjusted end_date: {adjusted_end_date}")
        
        if not obj.is_active:
            logger.info(f"  Status: inactive (is_active flag is False)")
            return "inactive"
        elif adjusted_start_date > now:
            logger.info(f"  Status: upcoming (adjusted_start_date > now)")
            return "upcoming"
        elif adjusted_end_date < now:
            logger.info(f"  Status: completed (adjusted_end_date < now)")
            return "completed"  # Changed from "closed" to "completed" to match frontend expectations
        else:
            logger.info(f"  Status: active (within adjusted time range)")
            return "active"

    def get_results(self, obj):
        now = get_current_time()
        # Apply the same timezone adjustment using standardized utility function
        adjusted_end_date = system_to_blockchain_time(obj.end_date)
        
        if adjusted_end_date < now and obj.contract_address:
            try:
                ethereum_service = EthereumService()
                return ethereum_service.get_election_results(obj.contract_address)
            except Exception as e:
                logger = logging.getLogger(__name__)
                logger.error(f"Failed to get election results: {str(e)}")
                return None
        return None

# Full serializer with blockchain details for admins
class ElectionSerializer(serializers.ModelSerializer):
    candidates = CandidateSerializer(many=True, read_only=True)
    candidate_data = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=True,  # Changed to True so it shows up in forms
        help_text="List of candidates to create with the election. Each candidate needs name and description."
    )
    deploy_contract = serializers.BooleanField(
        write_only=True,
        required=False,
        default=False,
        help_text="Whether to automatically deploy the blockchain contract"
    )
    
    class Meta:
        model = Election
        fields = ['id', 'title', 'description', 'start_date', 'end_date', 
                  'is_active', 'contract_address', 'candidates', 'candidate_data', 
                  'deploy_contract', 'created_at']
        read_only_fields = ['id', 'contract_address', 'created_at']
    
    def validate(self, attrs):
        # Ensure start date is in the future for new elections
        if not self.instance and attrs['start_date'] <= timezone.now():
            raise serializers.ValidationError({"start_date": "Start date must be in the future."})
        
        # Ensure end date is after start date
        if attrs['end_date'] <= attrs['start_date']:
            raise serializers.ValidationError({"end_date": "End date must be after start date."})
        
        # If creating a new election, ensure at least one candidate is provided
        if not self.instance and 'candidate_data' not in attrs:
            raise serializers.ValidationError({"candidate_data": "At least one candidate is required when creating an election."})
            
        # If candidate data is provided, validate that there's at least one
        if 'candidate_data' in attrs and not attrs['candidate_data']:
            raise serializers.ValidationError({"candidate_data": "At least one candidate is required when creating an election."})
        
        return attrs
    
    def create(self, validated_data):
        # Extract candidate data and deployment flag
        candidate_data_list = validated_data.pop('candidate_data', [])
        deploy_contract = validated_data.pop('deploy_contract', False)
        
        # Create the election
        election = Election.objects.create(**validated_data)
        
        # Create candidates for this election
        candidates = []
        for candidate_data in candidate_data_list:
            candidate = Candidate.objects.create(
                election=election,
                name=candidate_data.get('name'),
                description=candidate_data.get('description', '')
            )
            candidates.append(candidate)
        
        # Automatically deploy the contract if requested and we have a user context
        if deploy_contract and 'request' in self.context and self.context['request'].user.is_authenticated:
            try:                 
                from blockchain.services.ethereum_service import EthereumService
                from django.conf import settings
                import logging
                
                logger = logging.getLogger(__name__)
                
                admin_user = self.context['request'].user
                private_key = None
                
                # First try to get user's private key
                if hasattr(admin_user, 'ethereum_private_key') and admin_user.ethereum_private_key:
                    private_key = admin_user.ethereum_private_key
                # Fall back to the admin wallet from settings if available
                elif settings.ADMIN_WALLET_PRIVATE_KEY:
                    private_key = settings.ADMIN_WALLET_PRIVATE_KEY
                
                if private_key:                    # Initialize Ethereum service
                    ethereum_service = EthereumService()
                    
                    # Convert datetime to blockchain timestamps using standardized utility function
                    start_time = datetime_to_blockchain_timestamp(election.start_date)
                    end_time = datetime_to_blockchain_timestamp(election.end_date)
                    
                    # Log the timestamps for debugging
                    logger.info(f"Converting election times to blockchain UTC timestamps:")
                    logger.info(f"  Original start: {election.start_date} → Blockchain timestamp: {start_time}")
                    logger.info(f"  Original end: {election.end_date} → Blockchain timestamp: {end_time}")
                    
                    # Validate private key before using it
                    if not private_key:
                        logger.error(f"Cannot deploy contract for election {election.id}: No valid private key found")
                        raise ValueError("No valid private key available for contract deployment")
                      # Get the account address from the private key
                    account = ethereum_service.get_account_from_private_key(private_key)
                    
                    # Ensure admin_address is a proper string, not an empty object
                    if not account or not hasattr(account, 'address'):
                        raise ValueError("Invalid account object - could not get address")
                    
                    # Convert the address to string explicitly to avoid Web3.Empty objects
                    admin_address = str(account.address) if account.address else None
                    
                    if not admin_address:
                        raise ValueError("Empty address returned from account")
                    
                    # Check balance and fund if necessary 
                    balance = ethereum_service.w3.eth.get_balance(admin_address)
                    if balance < ethereum_service.w3.to_wei(1, 'ether'):  # If less than 1 ETH
                        logger.info(f"Funding admin wallet {admin_address} before contract deployment")
                        # Use one of the Ganache accounts to fund the admin wallet
                        ethereum_service.fund_user_wallet(admin_address, amount_ether=5.0)
                    
                    # Deploy the contract
                    tx_hash, contract_address = ethereum_service.deploy_election_contract(
                        private_key=private_key,
                        title=election.title,
                        description=election.description,
                        start_time=start_time,
                        end_time=end_time
                    )
                    
                    # Update election with contract address
                    election.contract_address = contract_address
                    election.save(update_fields=['contract_address'])
                      # Add candidates to the contract
                    for candidate in candidates:
                        candidate_id = candidate.id.int % 1000000  # Generate blockchain ID from UUID
                        candidate_tx = ethereum_service.add_candidate(
                            private_key=private_key,  # Use the same private key we validated earlier
                            contract_address=contract_address,
                            candidate_id=candidate_id,
                            name=candidate.name,
                            description=candidate.description  # Using description directly now that contract field name matches
                        )
                        
                        # Update candidate with blockchain ID
                        candidate.blockchain_id = candidate_id
                        candidate.save(update_fields=['blockchain_id'])
                        
                    # Activate the election if it should be active
                    if election.start_date <= timezone.now() and election.end_date > timezone.now():
                        election.is_active = True
                        election.save(update_fields=['is_active'])
            except Exception as e:
                # Log error but don't fail creation
                logger.error(f"Failed to deploy contract for election {election.id}: {e}")
                
        return election

class VoteSerializer(serializers.ModelSerializer):
    election_id = serializers.UUIDField(write_only=True)
    candidate_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = Vote
        fields = ['id', 'election_id', 'candidate_id', 'timestamp', 
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
        
        # Check if election is active using standardized time utility functions
        now = get_current_time()
        adjusted_start_date = system_to_blockchain_time(election.start_date)
        adjusted_end_date = system_to_blockchain_time(election.end_date)
        
        if not election.is_active:
            raise serializers.ValidationError({"election_id": "This election is not active."})
        elif adjusted_start_date > now:
            raise serializers.ValidationError({"election_id": "This election has not started yet."})
        elif adjusted_end_date < now:
            raise serializers.ValidationError({"election_id": "This election has already ended."})
        
        # Check if user has already voted in this election
        # Exclude nullified votes to allow re-voting after nullification
        if Vote.objects.filter(
            voter=user, 
            election=election, 
            is_confirmed=True,
            nullification_status__in=['none', 'pending', 'rejected']
        ).exists():
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
    election = PublicElectionSerializer(read_only=True)
    candidate = CandidateSerializer(read_only=True)
    verified = serializers.SerializerMethodField()
    
    class Meta:
        model = Vote
        fields = ['id', 'election', 'candidate', 'timestamp', 
                  'transaction_hash', 'is_confirmed', 'verified']
        read_only_fields = ['id', 'election', 'candidate', 'timestamp', 
                            'transaction_hash', 'is_confirmed', 'verified']
    
    def get_verified(self, obj):
        # A vote is considered verified if it has a transaction hash and is confirmed
        return bool(obj.is_confirmed and obj.transaction_hash)

class VoteConfirmationSerializer(serializers.Serializer):
    vote_id = serializers.UUIDField(required=True)
    email_otp = serializers.CharField(required=True)
    
    def validate(self, attrs):
        request = self.context.get('request')
        user = request.user
        
        # Get the vote
        try:
            vote = Vote.objects.get(id=attrs['vote_id'], voter=user)
        except Vote.DoesNotExist:
            raise serializers.ValidationError({"vote_id": "Vote not found."})
        
        # Check if vote is already confirmed
        if vote.is_confirmed:
            raise serializers.ValidationError({"vote_id": "This vote is already confirmed."})
        
        # Validate OTP
        from api.services.otp_service import OTPService
        otp_service = OTPService()
        if not otp_service.verify_otp(user.email, attrs['email_otp']):
            raise serializers.ValidationError({"email_otp": "Invalid OTP."})
        
        # Store vote for confirm method
        attrs['vote'] = vote
        
        return attrs
    
    def confirm(self, validated_data):
        vote = validated_data['vote']
        
        # Mark vote as confirmed
        vote.is_confirmed = True
        vote.save()
        
        # Push to blockchain here (will be handled by the viewset)
        
        return vote