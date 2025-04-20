import hashlib
from typing import List, Dict, Any, Optional

class MerkleTree:
    """
    Real-time Merkle tree implementation for vote verification and tampering detection.
    This implementation supports dynamically adding leaves and generating proofs.
    """
    
    def __init__(self, leaves: List[str] = None):
        """Initialize the Merkle Tree with optional leaf nodes."""
        self.leaves = leaves or []
        self.leaf_hashes = []
        self.tree = []
        
        if leaves:
            # If leaves provided, immediately build the tree
            self.build_tree()
    
    @staticmethod
    def hash_node(value: str) -> str:
        """Hash a value using SHA-256."""
        return hashlib.sha256(value.encode()).hexdigest()
    
    @staticmethod
    def hash_pair(left: str, right: str) -> str:
        """Hash a pair of nodes together."""
        return hashlib.sha256(f"{left}{right}".encode()).hexdigest()
    
    def build_tree(self) -> None:
        """Build the Merkle tree from leaf nodes."""
        # Hash leaves if they're not already hashed
        self.leaf_hashes = [self.hash_node(leaf) for leaf in self.leaves]
        
        # Clear any existing tree
        self.tree = [self.leaf_hashes]
        
        # Build the tree by hashing pairs of nodes
        while len(self.tree[-1]) > 1:
            current_level = self.tree[-1]
            next_level = []
            
            # Process pairs of nodes
            for i in range(0, len(current_level), 2):
                left = current_level[i]
                # If there's no right node (odd number), duplicate the left node
                right = current_level[i + 1] if i + 1 < len(current_level) else left
                next_level.append(self.hash_pair(left, right))
            
            self.tree.append(next_level)
    
    def add_leaf(self, leaf_data: str) -> Dict[str, Any]:
        """Add a new leaf and update the tree."""
        # Add new leaf
        self.leaves.append(leaf_data)
        
        # Rebuild tree
        self.build_tree()
        
        # Generate proof for the new leaf
        leaf_index = len(self.leaves) - 1
        proof = self.get_proof(leaf_index)
        
        return {
            'index': leaf_index,
            'leaf_hash': self.leaf_hashes[leaf_index],
            'merkle_proof': proof,
            'merkle_root': self.get_root()
        }
    
    def get_root(self) -> str:
        """Get the Merkle root hash."""
        if not self.tree or not self.tree[-1]:
            return ""
        return self.tree[-1][0]
    
    def get_proof(self, leaf_index: int) -> List[Dict[str, str]]:
        """Generate a Merkle proof for a specific leaf."""
        if not self.tree or leaf_index >= len(self.leaves):
            return []
        
        proof = []
        for level_idx in range(len(self.tree) - 1):
            level = self.tree[level_idx]
            is_right_node = leaf_index % 2 == 1
            sibling_idx = leaf_index - 1 if is_right_node else leaf_index + 1
            
            # Handle the case where there's no right sibling
            if sibling_idx >= len(level):
                sibling_idx = leaf_index  # Use the same node as its sibling
            
            proof.append({
                'position': 'right' if is_right_node else 'left',
                'value': level[sibling_idx]
            })
            
            # Move to the parent node for the next level
            leaf_index = leaf_index // 2
            
        return proof
    
    @staticmethod
    def verify_proof(leaf_value: str, proof: List[Dict[str, str]], root_hash: str) -> bool:
        """Verify a Merkle proof for a leaf against the root hash."""
        # Start with the leaf hash
        current_hash = MerkleTree.hash_node(leaf_value)
        
        # Apply each step in the proof
        for step in proof:
            if step['position'] == 'left':
                # The sibling is on the left, so we're on the right
                current_hash = MerkleTree.hash_pair(step['value'], current_hash)
            else:
                # The sibling is on the right, so we're on the left
                current_hash = MerkleTree.hash_pair(current_hash, step['value'])
        
        # Check if the computed hash matches the root
        return current_hash == root_hash