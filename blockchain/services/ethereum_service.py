import json
import logging
import os
from typing import Any, Dict, List, Optional, Tuple, Union
from web3 import Web3
from web3.contract import Contract
from web3.exceptions import TransactionNotFound
from web3.middleware import geth_poa_middleware
from eth_account.account import Account
from eth_account.signers.local import LocalAccount
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)

class EthereumService:
    """
    Service for interacting with the Ethereum blockchain.
    Handles smart contract deployment, transactions, and data retrieval.
    """
    
    def __init__(self):
        """Initialize the Ethereum service with web3 connection."""
        # Get Ethereum node URL from settings
        ethereum_node_url = os.getenv('ETHEREUM_NODE_URL', 'http://localhost:8545')
        
        # Connect to Ethereum node
        self.w3 = Web3(Web3.HTTPProvider(ethereum_node_url))
        
        # Add middleware for POA chains like Goerli, Rinkeby, etc.
        self.w3.middleware_onion.inject(geth_poa_middleware, layer=0)
        
        # Load contract ABI
        self._load_contract_abi()
    
    def _load_contract_abi(self):
        """Load the contract ABI from the compiled contract file."""
        try:
            # Path to the compiled contract JSON file
            contract_path = os.path.join(settings.BASE_DIR, 'blockchain', 'contracts', 'compiled', 'EVoting.json')
            
            with open(contract_path, 'r') as file:
                compiled_contract = json.load(file)
                self.contract_abi = compiled_contract['abi']
                self.contract_bytecode = compiled_contract['bytecode']
                
        except FileNotFoundError:
            logger.error(f"Contract ABI file not found. Make sure the contract is compiled.")
            self.contract_abi = None
            self.contract_bytecode = None
    
    def is_connected(self) -> bool:
        """Check if connected to Ethereum node."""
        return self.w3.is_connected()
    
    def get_contract_instance(self, contract_address: str) -> Optional[Contract]:
        """
        Get an instance of the deployed contract.
        
        Args:
            contract_address: The address of the deployed contract
            
        Returns:
            Contract instance or None if ABI is not loaded
        """
        if not self.contract_abi:
            logger.error("Contract ABI not loaded.")
            return None
            
        return self.w3.eth.contract(address=contract_address, abi=self.contract_abi)
    
    def get_account_from_private_key(self, private_key: str) -> LocalAccount:
        """
        Create an Ethereum account from a private key.
        
        Args:
            private_key: Private key in hex format
            
        Returns:
            LocalAccount: Ethereum account
        """
        if not private_key.startswith('0x'):
            private_key = f'0x{private_key}'
            
        return Account.from_key(private_key)
    
    def deploy_election_contract(
        self, 
        private_key: str, 
        title: str, 
        description: str, 
        start_time: int, 
        end_time: int
    ) -> Tuple[str, str]:
        """
        Deploy the election contract to the blockchain.
        
        Args:
            private_key: Private key of the deployer
            title: Title of the election
            description: Description of the election
            start_time: Start time of the election (Unix timestamp)
            end_time: End time of the election (Unix timestamp)
            
        Returns:
            Tuple of (transaction_hash, contract_address)
            
        Raises:
            Exception: If the contract deployment fails
        """
        if not self.contract_abi or not self.contract_bytecode:
            raise ValueError("Contract ABI or bytecode not loaded")
            
        # Get the account from the private key
        account = self.get_account_from_private_key(private_key)
        
        # Create contract instance
        contract = self.w3.eth.contract(abi=self.contract_abi, bytecode=self.contract_bytecode)
        
        # Get transaction count (nonce)
        nonce = self.w3.eth.get_transaction_count(account.address)
        
        # Build transaction
        transaction = {
            'from': account.address,
            'gas': 4000000,  # Gas limit
            'gasPrice': self.w3.eth.gas_price,
            'nonce': nonce,
        }
        
        # Build constructor transaction
        constructor_txn = contract.constructor(title, description, start_time, end_time).build_transaction(transaction)
        
        # Sign transaction
        signed_txn = self.w3.eth.account.sign_transaction(constructor_txn, private_key=private_key)
        
        # Send transaction
        tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        
        # Wait for transaction receipt
        tx_receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
        
        # Get contract address
        contract_address = tx_receipt.contractAddress
        
        return tx_hash.hex(), contract_address
    
    def add_candidate(
        self, 
        private_key: str, 
        contract_address: str, 
        candidate_id: int, 
        name: str, 
        party: str
    ) -> str:
        """
        Add a candidate to the election.
        
        Args:
            private_key: Private key of the admin
            contract_address: Address of the deployed contract
            candidate_id: ID of the candidate
            name: Name of the candidate
            party: Party of the candidate
            
        Returns:
            Transaction hash
            
        Raises:
            Exception: If the transaction fails
        """
        # Get contract instance
        contract = self.get_contract_instance(contract_address)
        if not contract:
            raise ValueError("Could not get contract instance")
            
        # Get the account from the private key
        account = self.get_account_from_private_key(private_key)
        
        # Get transaction count (nonce)
        nonce = self.w3.eth.get_transaction_count(account.address)
        
        # Build transaction
        transaction = contract.functions.addCandidate(candidate_id, name, party).build_transaction({
            'from': account.address,
            'gas': 200000,  # Gas limit
            'gasPrice': self.w3.eth.gas_price,
            'nonce': nonce,
        })
        
        # Sign transaction
        signed_txn = self.w3.eth.account.sign_transaction(transaction, private_key=private_key)
        
        # Send transaction
        tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        
        # Wait for transaction receipt
        self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
        
        return tx_hash.hex()
    
    def add_eligible_voter(
        self, 
        private_key: str, 
        contract_address: str, 
        voter_address: str
    ) -> str:
        """
        Add an eligible voter to the election.
        
        Args:
            private_key: Private key of the admin
            contract_address: Address of the deployed contract
            voter_address: Ethereum address of the voter
            
        Returns:
            Transaction hash
            
        Raises:
            Exception: If the transaction fails
        """
        # Get contract instance
        contract = self.get_contract_instance(contract_address)
        if not contract:
            raise ValueError("Could not get contract instance")
            
        # Get the account from the private key
        account = self.get_account_from_private_key(private_key)
        
        # Get transaction count (nonce)
        nonce = self.w3.eth.get_transaction_count(account.address)
        
        # Build transaction
        transaction = contract.functions.addEligibleVoter(voter_address).build_transaction({
            'from': account.address,
            'gas': 100000,  # Gas limit
            'gasPrice': self.w3.eth.gas_price,
            'nonce': nonce,
        })
        
        # Sign transaction
        signed_txn = self.w3.eth.account.sign_transaction(transaction, private_key=private_key)
        
        # Send transaction
        tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        
        # Wait for transaction receipt
        self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
        
        return tx_hash.hex()
    
    def cast_vote(
        self, 
        private_key: str, 
        contract_address: str, 
        candidate_id: int
    ) -> str:
        """
        Cast a vote for a candidate.
        
        Args:
            private_key: Private key of the voter
            contract_address: Address of the deployed contract
            candidate_id: ID of the candidate to vote for
            
        Returns:
            Transaction hash
            
        Raises:
            Exception: If the transaction fails
        """
        # Get contract instance
        contract = self.get_contract_instance(contract_address)
        if not contract:
            raise ValueError("Could not get contract instance")
            
        # Get the account from the private key
        account = self.get_account_from_private_key(private_key)
        
        # Get transaction count (nonce)
        nonce = self.w3.eth.get_transaction_count(account.address)
        
        # Build transaction
        transaction = contract.functions.castVote(candidate_id).build_transaction({
            'from': account.address,
            'gas': 150000,  # Gas limit
            'gasPrice': self.w3.eth.gas_price,
            'nonce': nonce,
        })
        
        # Sign transaction
        signed_txn = self.w3.eth.account.sign_transaction(transaction, private_key=private_key)
        
        # Send transaction
        tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        
        # Wait for transaction receipt
        self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
        
        return tx_hash.hex()
    
    def get_election_info(self, contract_address: str) -> Dict[str, Any]:
        """
        Get information about the election.
        
        Args:
            contract_address: Address of the deployed contract
            
        Returns:
            Dictionary with election information
            
        Raises:
            Exception: If the transaction fails
        """
        # Get contract instance
        contract = self.get_contract_instance(contract_address)
        if not contract:
            raise ValueError("Could not get contract instance")
            
        # Call contract function
        info = contract.functions.getElectionInfo().call()
        
        # Parse the info
        return {
            'title': info[0],
            'description': info[1],
            'start_time': info[2],
            'end_time': info[3],
            'admin': info[4],
            'total_votes': info[5],
            'candidate_count': info[6]
        }
    
    def get_all_candidates(self, contract_address: str) -> List[Dict[str, Any]]:
        """
        Get all candidates in the election.
        
        Args:
            contract_address: Address of the deployed contract
            
        Returns:
            List of dictionaries with candidate information
            
        Raises:
            Exception: If the transaction fails
        """
        # Get contract instance
        contract = self.get_contract_instance(contract_address)
        if not contract:
            raise ValueError("Could not get contract instance")
            
        # Get candidate IDs
        candidate_ids = contract.functions.getAllCandidates().call()
        
        # Get candidate details
        candidates = []
        for cid in candidate_ids:
            candidate = contract.functions.getCandidate(cid).call()
            candidates.append({
                'id': candidate[0],
                'name': candidate[1],
                'party': candidate[2],
                'vote_count': candidate[3]
            })
            
        return candidates
    
    def get_election_results(self, contract_address: str) -> Dict[str, Any]:
        """
        Get the results of the election.
        
        Args:
            contract_address: Address of the deployed contract
            
        Returns:
            Dictionary with election results
            
        Raises:
            Exception: If the transaction fails
        """
        # Get contract instance
        contract = self.get_contract_instance(contract_address)
        if not contract:
            raise ValueError("Could not get contract instance")
            
        # Get election info
        info = self.get_election_info(contract_address)
        
        # Call contract function
        results = contract.functions.getElectionResults().call()
        
        # Parse the results
        candidate_results = []
        for i in range(len(results[0])):
            candidate_id = results[0][i]
            vote_count = results[1][i]
            
            # Get candidate details
            candidate = contract.functions.getCandidate(candidate_id).call()
            
            candidate_results.append({
                'id': candidate[0],
                'name': candidate[1],
                'party': candidate[2],
                'vote_count': vote_count
            })
            
        return {
            'title': info['title'],
            'description': info['description'],
            'total_votes': info['total_votes'],
            'results': candidate_results
        }
    
    def has_voted(self, contract_address: str, voter_address: str) -> bool:
        """
        Check if a voter has already cast a vote.
        
        Args:
            contract_address: Address of the deployed contract
            voter_address: Ethereum address of the voter
            
        Returns:
            Boolean indicating if the voter has voted
            
        Raises:
            Exception: If the transaction fails
        """
        # Get contract instance
        contract = self.get_contract_instance(contract_address)
        if not contract:
            raise ValueError("Could not get contract instance")
            
        # Call contract function
        return contract.functions.hasVoted(voter_address).call()
    
    def is_eligible_voter(self, contract_address: str, voter_address: str) -> bool:
        """
        Check if a voter is eligible to vote.
        
        Args:
            contract_address: Address of the deployed contract
            voter_address: Ethereum address of the voter
            
        Returns:
            Boolean indicating if the voter is eligible
            
        Raises:
            Exception: If the transaction fails
        """
        # Get contract instance
        contract = self.get_contract_instance(contract_address)
        if not contract:
            raise ValueError("Could not get contract instance")
            
        # Call contract function
        return contract.functions.eligibleVoters(voter_address).call()
    
    def is_election_active(self, contract_address: str) -> bool:
        """
        Check if the election is currently active.
        
        Args:
            contract_address: Address of the deployed contract
            
        Returns:
            Boolean indicating if the election is active
            
        Raises:
            Exception: If the transaction fails
        """
        # Get contract instance
        contract = self.get_contract_instance(contract_address)
        if not contract:
            raise ValueError("Could not get contract instance")
            
        # Call contract function
        return contract.functions.isElectionActive().call()
    
    def get_transaction_receipt(self, tx_hash: str) -> Dict[str, Any]:
        """
        Get the receipt of a transaction.
        
        Args:
            tx_hash: Hash of the transaction
            
        Returns:
            Transaction receipt
            
        Raises:
            TransactionNotFound: If the transaction is not found
        """
        if not tx_hash.startswith('0x'):
            tx_hash = f'0x{tx_hash}'
            
        return self.w3.eth.get_transaction_receipt(tx_hash)