import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
import pickle
import hashlib

from django.db.models import Q
from django.utils import timezone
from django.core.cache import cache

from api.models import Election, Vote
from blockchain.utils.merkle import MerkleTree

logger = logging.getLogger(__name__)

class MerkleService:
    """Service for managing real-time Merkle trees for vote verification and tampering detection."""
    
    CACHE_TIMEOUT = 86400  # 24 hours
    
    @staticmethod
    def get_tree_cache_key(election_id):
        """Get the cache key for an election's Merkle tree."""
        return f"merkle_tree_{election_id}"
    
    @staticmethod
    def get_or_create_tree(election_id):
        """
        Get or create a Merkle tree for an election.
        If there's a cached tree, use it, otherwise create a new one.
        """
        cache_key = MerkleService.get_tree_cache_key(election_id)
        
        # Try to get tree from cache
        cached_tree = cache.get(cache_key)
        if cached_tree:
            return pickle.loads(cached_tree)
        
        # No cached tree, create new one with existing votes
        tree = MerkleTree()
        
        # Get existing votes for this election
        votes = Vote.objects.filter(
            election_id=election_id,
            is_confirmed=True
        ).order_by('timestamp')
        
        # Add existing votes to tree
        for vote in votes:
            leaf_data = f"{vote.voter.id}:{election_id}:{vote.candidate.id}:{vote.transaction_hash}"
            result = tree.add_leaf(leaf_data)
            
            # Update vote with its proof
            if not vote.merkle_proof:
                vote.merkle_proof = result['merkle_proof']
                vote.save(update_fields=['merkle_proof'])
        
        # Cache the tree
        cache.set(cache_key, pickle.dumps(tree), MerkleService.CACHE_TIMEOUT)
        
        return tree
    
    @staticmethod
    def update_tree_for_vote(vote_id):
        """
        Update the Merkle tree for a newly confirmed vote.
        This should be called right after a vote is confirmed on the blockchain.
        """
        try:
            # Get the vote
            vote = Vote.objects.get(id=vote_id, is_confirmed=True)
            election_id = vote.election_id
            
            # Get or create the tree
            tree = MerkleService.get_or_create_tree(election_id)
            
            # Add vote to tree
            leaf_data = f"{vote.voter.id}:{election_id}:{vote.candidate.id}:{vote.transaction_hash}"
            result = tree.add_leaf(leaf_data)
            
            # Update vote with merkle proof
            vote.merkle_proof = result['merkle_proof']
            vote.save(update_fields=['merkle_proof'])
            
            # Update election with new root
            election = vote.election
            election.merkle_root = result['merkle_root']
            election.last_merkle_update = timezone.now()
            election.save(update_fields=['merkle_root', 'last_merkle_update'])
            
            # Update cache
            cache_key = MerkleService.get_tree_cache_key(election_id)
            cache.set(cache_key, pickle.dumps(tree), MerkleService.CACHE_TIMEOUT)
            
            return {
                'success': True,
                'vote_id': vote.id,
                'merkle_root': result['merkle_root'],
                'proof_length': len(result['merkle_proof'])
            }
        
        except Vote.DoesNotExist:
            logger.error(f"Vote {vote_id} not found for Merkle tree update")
            return {
                'success': False,
                'error': f"Vote {vote_id} not found"
            }
        except Exception as e:
            logger.error(f"Error updating Merkle tree for vote {vote_id}: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def verify_vote(vote_id):
        """
        Verify a vote using its stored Merkle proof.
        If the vote has been nullified, verifies using the nullification Merkle proof.
        Returns verification result with details.
        """
        try:
            # Get the vote
            vote = Vote.objects.get(id=vote_id, is_confirmed=True)
            
            # Special handling for nullified votes
            if vote.nullification_status == 'nullified' and vote.nullification_merkle_proof:
                # Reconstruct the nullified leaf data
                nullified_leaf = f"NULLIFIED:{vote.voter.id}:{vote.election.id}:{vote.candidate.id}:{vote.transaction_hash}"
                
                # Verify the nullification proof
                is_verified = MerkleTree.verify_proof(
                    leaf_value=nullified_leaf,
                    proof=vote.nullification_merkle_proof,
                    root_hash=vote.election.merkle_root
                )
                
                return {
                    'verified': is_verified,
                    'vote_id': vote.id,
                    'election_id': vote.election.id,
                    'merkle_root': vote.election.merkle_root,
                    'verification_time': timezone.now().isoformat(),
                    'is_nullified': True,
                    'message': 'Nullified vote successfully verified in Merkle tree' if is_verified else 'Nullified vote verification failed'
                }
            
            # Standard verification for non-nullified votes
            # Check if vote has a Merkle proof
            if not vote.merkle_proof:
                return {
                    'verified': False,
                    'error': 'No Merkle proof found for this vote'
                }
            
            # Check if election has a Merkle root
            if not vote.election.merkle_root:
                return {
                    'verified': False,
                    'error': 'No Merkle root found for this election'
                }
            
            # Reconstruct the leaf data
            leaf_data = f"{vote.voter.id}:{vote.election.id}:{vote.candidate.id}:{vote.transaction_hash}"
            
            # Verify the proof
            is_verified = MerkleTree.verify_proof(
                leaf_value=leaf_data,
                proof=vote.merkle_proof,
                root_hash=vote.election.merkle_root
            )
            
            return {
                'verified': is_verified,
                'vote_id': vote.id,
                'election_id': vote.election.id,
                'merkle_root': vote.election.merkle_root,
                'verification_time': timezone.now().isoformat(),
                'message': 'Vote successfully verified in Merkle tree' if is_verified else 'Vote verification failed'
            }
        
        except Vote.DoesNotExist:
            return {
                'verified': False,
                'error': f'Vote with ID {vote_id} not found'
            }
        except Exception as e:
            logger.error(f"Error verifying vote {vote_id} with Merkle proof: {str(e)}")
            return {
                'verified': False,
                'error': str(e)
            }
    
    @staticmethod
    def check_election_tampering(election_id):
        """
        Check for possible tampering in an election by rebuilding the Merkle tree 
        from scratch and comparing with the stored root.
        This method accounts for both regular and nullified votes.
        """
        try:
            election = Election.objects.get(id=election_id)
            
            # If no Merkle root is stored, we can't detect tampering
            if not election.merkle_root:
                return {
                    'checked': False,
                    'error': 'No Merkle root found for this election'
                }
            
            # Get all confirmed votes
            votes = Vote.objects.filter(
                election_id=election_id,
                is_confirmed=True
            ).order_by('timestamp')
            
            # Build a fresh tree
            verification_tree = MerkleTree()
            
            # Track counts for reporting
            regular_votes = 0
            nullified_votes = 0
            
            # First add regular votes
            for vote in votes:
                if vote.nullification_status != 'nullified':
                    leaf_data = f"{vote.voter.id}:{election_id}:{vote.candidate.id}:{vote.transaction_hash}"
                    verification_tree.add_leaf(leaf_data)
                    regular_votes += 1
            
            # Then add nullified votes to match the order they were added
            for vote in votes:
                if vote.nullification_status == 'nullified':
                    # Use the same format as in handle_nullified_vote
                    nullified_leaf = f"NULLIFIED:{vote.voter.id}:{vote.election.id}:{vote.candidate.id}:{vote.transaction_hash}"
                    verification_tree.add_leaf(nullified_leaf)
                    nullified_votes += 1
            
            # Get the fresh root
            fresh_root = verification_tree.get_root()
            
            # Compare with stored root
            tampering_detected = fresh_root != election.merkle_root
            
            result = {
                'checked': True,
                'tampering_detected': tampering_detected,
                'stored_root': election.merkle_root,
                'calculated_root': fresh_root,
                'votes_checked': votes.count(),
                'regular_votes': regular_votes,
                'nullified_votes': nullified_votes,
                'check_time': timezone.now().isoformat()
            }
            
            if tampering_detected:
                logger.warning(f"POTENTIAL TAMPERING DETECTED IN ELECTION {election_id}!")
                logger.warning(f"Stored root: {election.merkle_root}")
                logger.warning(f"Calculated root: {fresh_root}")
                result['message'] = 'WARNING: Potential vote tampering detected!'
            else:
                result['message'] = 'No tampering detected. All votes verified.'
            
            return result
        
        except Election.DoesNotExist:
            return {
                'checked': False,
                'error': f'Election with ID {election_id} not found'
            }
        except Exception as e:
            logger.error(f"Error checking for tampering in election {election_id}: {str(e)}")
            return {
                'checked': False,
                'error': str(e)
            }
    
    @staticmethod
    def handle_nullified_vote(vote_id):
        """
        Update the Merkle tree when a vote is nullified.
        This creates a special leaf that marks the vote as nullified.
        
        Args:
            vote_id: ID of the vote that was nullified
            
        Returns:
            Dictionary with success status and merkle root
        """
        try:
            from api.models import Vote
            vote = Vote.objects.get(id=vote_id)
            
            # Get the election's Merkle tree
            tree = MerkleService.get_or_create_tree(vote.election_id)
            
            # Create a nullification marker leaf
            # Format: "NULLIFIED:{voter_id}:{election_id}:{candidate_id}:{tx_hash}"
            nullified_leaf = f"NULLIFIED:{vote.voter.id}:{vote.election.id}:{vote.candidate.id}:{vote.transaction_hash}"
            
            # Add the nullification marker to the tree
            result = tree.add_leaf(nullified_leaf)
            
            # Update the election's Merkle root
            vote.election.merkle_root = result['merkle_root']
            vote.election.last_merkle_update = timezone.now()
            vote.election.save(update_fields=['merkle_root', 'last_merkle_update'])
            
            # Store the nullification record in the vote object
            vote.nullification_merkle_proof = result['merkle_proof']
            vote.save(update_fields=['nullification_merkle_proof'])
            
            # Update cache
            cache_key = MerkleService.get_tree_cache_key(vote.election_id)
            cache.set(cache_key, pickle.dumps(tree), MerkleService.CACHE_TIMEOUT)
            
            # Log the event
            logger.info(f"Updated Merkle tree for nullified vote {vote_id}, new root: {result['merkle_root']}")
            
            return {
                'success': True,
                'vote_id': vote_id,
                'merkle_root': result['merkle_root'],
                'proof_length': len(result['merkle_proof'])
            }
            
        except Vote.DoesNotExist:
            logger.error(f"Vote {vote_id} not found for nullification in Merkle tree")
            return {
                'success': False,
                'error': f"Vote {vote_id} not found"
            }
        except Exception as e:
            logger.error(f"Error updating Merkle tree for nullified vote {vote_id}: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }