from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.db import transaction
from api.models import Election, Candidate, Vote
import logging

# Create your views here.
logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def blockchain_status(request):
    """Check blockchain connection status"""
    try:
        from .services.ethereum_service import EthereumService
        eth_service = EthereumService()
        
        # Check if we can connect to the blockchain by getting the current block number
        block_number = eth_service.w3.eth.block_number
        
        return Response({
            "connected": True,
            "block_number": block_number,
            "network": eth_service.w3.net.version,
            "message": "Blockchain connection is active"
        })
    except Exception as e:
        return Response({
            "connected": False,
            "error": str(e),
            "message": "Failed to connect to blockchain"
        })

@api_view(['POST'])
@permission_classes([IsAdminUser])
def blockchain_sync(request):
    """Manually synchronize with the blockchain"""
    try:
        from .services.ethereum_service import EthereumService
        eth_service = EthereumService()
        
        # Get the current block number to confirm connection
        block_number = eth_service.w3.eth.block_number
        
        # Actual blockchain synchronization implementation
        logger.info("Starting blockchain synchronization...")
        
        # Step 1: Get all elections that have a contract address (deployed on blockchain)
        elections = Election.objects.filter(
            contract_address__isnull=False
        ).exclude(contract_address='')
        
        logger.info(f"Found {elections.count()} elections with contract addresses to sync")
        
        sync_results = {
            "elections_synced": 0,
            "candidates_synced": 0,
            "votes_verified": 0,
            "errors": []
        }
        
        for election in elections:
            try:
                logger.info(f"Syncing election {election.id} ({election.title}) with contract {election.contract_address}")
                
                # Get election info from blockchain
                election_info = eth_service.get_election_info(election.contract_address)
                
                # Update election data from blockchain if needed
                with transaction.atomic():
                    # Update election details (only if needed)
                    updated = False
                    
                    # Check if election is active on the blockchain
                    is_active = eth_service.check_election_active(election.contract_address)
                    
                    # Sync election status with blockchain
                    if election.is_active != is_active:
                        election.is_active = is_active
                        updated = True
                    
                    # You might want to sync other data like start/end times
                    # if they're different from the blockchain values
                    
                    if updated:
                        election.save()
                
                # Sync candidate data
                blockchain_candidates = eth_service.get_all_candidates(election.contract_address)
                
                # Get local candidates for this election
                candidates = Candidate.objects.filter(election_id=election.id)
                
                # Update vote counts for candidates from blockchain
                for bc_candidate in blockchain_candidates:
                    try:
                        local_candidate = candidates.filter(blockchain_id=bc_candidate['id']).first()
                        if local_candidate:
                            # Update vote count if different
                            if local_candidate.vote_count != bc_candidate['vote_count']:
                                local_candidate.vote_count = bc_candidate['vote_count']
                                local_candidate.save()
                                sync_results["candidates_synced"] += 1
                    except Exception as candidate_error:
                        error_message = f"Error syncing candidate {bc_candidate['id']}: {str(candidate_error)}"
                        logger.error(error_message)
                        sync_results["errors"].append(error_message)
                
                # Now verify individual votes for this election
                votes = Vote.objects.filter(
                    election_id=election.id, 
                    blockchain_tx_hash__isnull=False
                ).exclude(blockchain_tx_hash='')
                
                for vote in votes:
                    try:
                        # Skip votes without candidate information
                        if not vote.candidate_id or not vote.voter_eth_address:
                            continue
                            
                        # Verify the vote on the blockchain
                        verification = eth_service.verify_vote(
                            election.contract_address,
                            vote.blockchain_tx_hash,
                            vote.voter_eth_address,
                            vote.candidate.blockchain_id
                        )
                        
                        # Update verification status
                        if vote.is_verified != verification['verified']:
                            vote.is_verified = verification['verified']
                            vote.save()
                            sync_results["votes_verified"] += 1
                    except Exception as vote_error:
                        error_message = f"Error verifying vote {vote.id}: {str(vote_error)}"
                        logger.error(error_message)
                        sync_results["errors"].append(error_message)
                
                sync_results["elections_synced"] += 1
                
            except Exception as election_error:
                error_message = f"Error syncing election {election.id}: {str(election_error)}"
                logger.error(error_message)
                sync_results["errors"].append(error_message)
        
        # Return detailed synchronization results
        return Response({
            "success": True,
            "block_number": block_number,
            "sync_details": sync_results,
            "message": f"Blockchain synchronization completed. Synced {sync_results['elections_synced']} elections, {sync_results['candidates_synced']} candidates, and verified {sync_results['votes_verified']} votes."
        })
    except Exception as e:
        logger.error(f"Blockchain sync error: {str(e)}")
        
        return Response({
            "success": False,
            "error": str(e),
            "message": "Failed to synchronize with blockchain"
        }, status=500)
