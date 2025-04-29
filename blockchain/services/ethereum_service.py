import json
import logging
import os
import time
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple, Union

from web3 import Web3
from web3.contract import Contract
from web3.exceptions import TransactionNotFound
from web3.middleware import geth_poa_middleware
from eth_account.account import Account
from eth_account.signers.local import LocalAccount

from django.conf import settings
from django.utils import timezone

from blockchain.utils.time_utils import (
    get_current_time, 
    system_to_blockchain_time, 
    blockchain_to_system_time, 
    datetime_to_blockchain_timestamp
)

logger = logging.getLogger(__name__)

class EthereumService:
    """
    Service for interacting with the Ethereum blockchain.
    Handles smart contract deployment, transactions, and data retrieval.
    """
    
    def __init__(self):
        """Initialize the Ethereum service with web3 connection."""
        # Get Ethereum node URL from settings
        ethereum_node_url = os.getenv('ETHEREUM_NODE_URL', 'http://ganache:8545')
        
        # Connect to Ethereum node
        self.w3 = Web3(Web3.HTTPProvider(ethereum_node_url))
        
        # Add middleware for POA chains like Goerli, Rinkeby, etc.
        self.w3.middleware_onion.inject(geth_poa_middleware, layer=0)
        
        # Load contract ABI and bytecode
        self.contract_abi = None
        self.contract_bytecode = None
        self._load_contract_abi()
        
    def _load_contract_abi(self):
        """Load the contract ABI from the compiled contract file."""
        try:
            # Path to compiled contract JSON file
            contract_path = os.path.join(
                settings.BASE_DIR, 'blockchain', 'contracts', 'compiled', 'EVoting.json'
            )
            
            if os.path.exists(contract_path):
                with open(contract_path, 'r') as f:
                    compiled_contract = json.load(f)
                    self.contract_abi = compiled_contract['abi']
                    self.contract_bytecode = compiled_contract['bytecode']
                logger.info("Contract ABI and bytecode loaded successfully")
            else:
                logger.warning(f"Compiled contract file not found at {contract_path}")
        except Exception as e:
            logger.error(f"Error loading contract ABI: {str(e)}")
    
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
        
        # Convert address to string if it's not already
        if contract_address and not isinstance(contract_address, str):
            contract_address = str(contract_address)
            
        return self.w3.eth.contract(address=contract_address, abi=self.contract_abi)
    
    def get_account_from_private_key(self, private_key: str) -> LocalAccount:
        """
        Get an account from a private key.
        
        Args:
            private_key: The private key to use
            
        Returns:
            The account
            
        Raises:
            ValueError: If the private key is invalid
        """
        if not private_key:
            raise ValueError("Private key must be provided")
            
        # Remove 0x prefix if present
        if private_key.startswith('0x'):
            private_key = private_key[2:]
            
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
        
        # Adjust timestamps if needed - log what we're using
        logger.info(f"Adjusted start_time: {start_time}")
        logger.info(f"Adjusted end_time: {end_time}")
        
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
        
        # Ensure contract_address is a string
        if contract_address and not isinstance(contract_address, str):
            contract_address = str(contract_address)
        
        return tx_hash.hex(), contract_address
        
    def add_candidate(
        self, 
        private_key: str, 
        contract_address: str, 
        candidate_id: int, 
        name: str, 
        description: str
    ) -> str:
        """
        Add a candidate to the election.
        
        Args:
            private_key: Private key of the admin
            contract_address: Address of the deployed contract
            candidate_id: ID of the candidate
            name: Name of the candidate
            description: Description of the candidate
            
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
        transaction = contract.functions.addCandidate(candidate_id, name, description).build_transaction({
            'from': account.address,
            'gas': 500000,  # Increased gas limit to prevent out of gas errors
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
        import sys
        # Enhanced debug logging
        logger.info("====== ETHEREUM SERVICE CAST_VOTE DEBUG ======")
        
        # Configure console handler for immediate visibility during development
        if not any(isinstance(h, logging.StreamHandler) and h.stream == sys.stdout for h in logger.handlers):
            console_handler = logging.StreamHandler(sys.stdout)
            console_handler.setLevel(logging.DEBUG)
            formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
            console_handler.setFormatter(formatter)
            logger.addHandler(console_handler)
        
        # Detailed debugging of private key (without exposing the actual key)
        logger.info(f"Private key info - Type: {type(private_key)}")
        logger.info(f"Private key info - Is None: {private_key is None}")
        logger.info(f"Private key info - Is Empty: {private_key == ''}")
        logger.info(f"Private key info - Is 'private_key' literal: {private_key == 'private_key'}")
        logger.info(f"Private key info - Length: {len(private_key) if isinstance(private_key, str) else 'not a string'}")
        
        if isinstance(private_key, str):
            logger.info(f"Private key format - First few chars: '{private_key[:4]}...'")
            logger.info(f"Private key format - Has 0x prefix: {private_key.startswith('0x')}")
        
        # Validate private key
        if not private_key or private_key == 'private_key':
            error_msg = "Invalid private key: Cannot be empty or 'private_key'"
            logger.error(error_msg)
            logger.error(f"Actual private key value: '{private_key}'")
            raise ValueError(error_msg)
            
        # Validate and normalize private key with detailed logging
        if isinstance(private_key, str) and private_key.startswith('0x'):
            normalized_private_key = private_key
            logger.info("Private key already has 0x prefix, no normalization needed")
        else:
            # If it doesn't start with 0x, add it
            if not isinstance(private_key, str):
                error_msg = f"Private key must be a string, got {type(private_key)}"
                logger.error(error_msg)
                raise ValueError(error_msg)
                
            normalized_private_key = f"0x{private_key}"
            logger.info(f"Added 0x prefix to private key. Original length: {len(private_key)}, New length: {len(normalized_private_key)}")
            logger.info(f"Normalized key format - First few chars: '{normalized_private_key[:6]}...'")
        
        # Get contract instance
        contract = self.get_contract_instance(contract_address)
        if not contract:
            error_msg = "Could not get contract instance"
            logger.error(error_msg)
            raise ValueError(error_msg)
            
        # The account creation will fail immediately if the key format is wrong
        try:
            # Get the account from the private key - very detailed logging here
            logger.info("Attempting to create account from private key...")
            logger.info(f"About to call get_account_from_private_key with key of length {len(normalized_private_key) if isinstance(normalized_private_key, str) else 'unknown'}")
            
            # Get the account from the private key
            account = self.get_account_from_private_key(normalized_private_key)
            
            # Log account address info (safe to log)
            logger.info(f"Successfully created account with address: {account.address}")
        except Exception as e:
            error_msg = f"Invalid private key format: {str(e)}"
            logger.error(error_msg)
            
            # Log hexadecimal representation for debugging
            if isinstance(normalized_private_key, str):
                try:
                    # Don't log the whole key, just check if it might be hexadecimal
                    is_hex = all(c in '0123456789abcdefABCDEF' for c in normalized_private_key.replace('0x', '', 1))
                    logger.error(f"Is key hexadecimal? {is_hex}")
                    logger.error(f"Key starts with: {normalized_private_key[:min(8, len(normalized_private_key))]}")
                except Exception as hex_err:
                    logger.error(f"Error analyzing key format: {str(hex_err)}")
            
            # Add more debugging for common private key issues
            logger.error(f"Full error details: {repr(e)}")
            raise ValueError(f"Invalid private key format: {str(e)}")
        
        # Get transaction count (nonce)
        nonce = self.w3.eth.get_transaction_count(account.address)
        
        # Build transaction
        transaction = contract.functions.castVote(candidate_id).build_transaction({
            'from': account.address,
            'gas': 150000,  # Gas limit
            'gasPrice': self.w3.eth.gas_price,
            'nonce': nonce,
        })

        # Sign transaction - use normalized private key here
        signed_txn = self.w3.eth.account.sign_transaction(transaction, private_key=normalized_private_key)
        
        # Send transaction
        tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        
        # Wait for transaction receipt
        self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
        
        return tx_hash.hex()
        
    def verify_vote(
        self,
        contract_address: str,
        transaction_hash: str,
        voter_address: str,
        candidate_id: int
    ) -> Dict[str, Any]:
        """
        Verify that a vote transaction was properly recorded on the blockchain.
        
        Args:
            contract_address: Address of the election contract
            transaction_hash: Hash of the vote transaction
            voter_address: Address of the voter
            candidate_id: ID of the candidate that was voted for
            
        Returns:
            Dictionary with verification results
            
        Raises:
            Exception: If the verification fails
        """
        # Set up enhanced logging for verification process
        import sys
        logger = logging.getLogger(__name__)
        logger.setLevel(logging.DEBUG)  # Ensure DEBUG level is set
        
        # Configure a stream handler for direct console output
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.DEBUG)
        formatter = logging.Formatter('%(asctime)s - [VOTE_VERIFY] - %(levelname)s - %(message)s')
        console_handler.setFormatter(formatter)
        
        # Add handler if not already present
        if not any(isinstance(h, logging.StreamHandler) and h.stream == sys.stdout for h in logger.handlers):
            logger.addHandler(console_handler)
        
        logger.info("======== VOTE VERIFICATION DEBUG LOG ========")
        logger.info(f"Verifying vote for transaction: {transaction_hash}")
        logger.info(f"Voter Address: {voter_address}")
        logger.info(f"Candidate ID: {candidate_id}")
        logger.info(f"Contract Address: {contract_address}")
        
        try:
            # Get contract instance
            contract = self.get_contract_instance(contract_address)
            if not contract:
                logger.error("Could not get contract instance")
                return {
                    'verified': False,
                    'details': {
                        'error': 'Could not get contract instance'
                    }
                }
            
            # Get transaction receipt
            tx_receipt = self.get_transaction_receipt(transaction_hash)
            if not tx_receipt:
                logger.error("Transaction receipt not found")
                return {
                    'verified': False,
                    'details': {
                        'error': 'Transaction receipt not found'
                    }
                }
            
            # Log receipt status
            logger.info(f"Transaction receipt status: {tx_receipt['status']}")
            logger.info(f"Block Number: {tx_receipt['blockNumber']}")
            logger.info(f"Logs count: {len(tx_receipt['logs'])}")
            
            # Check if transaction was successful
            if tx_receipt['status'] != 1:
                logger.error(f"Transaction status is failed: {tx_receipt['status']}")
                return {
                    'verified': False,
                    'message': 'Transaction failed on the blockchain',
                    'details': {
                        'error': 'Transaction failed',
                        'status': tx_receipt['status'],
                        'transaction_exists': True
                    }
                }
            
            # Get transaction details
            tx = self.get_transaction(transaction_hash)
            if not tx:
                logger.error("Transaction details not found")
                return {
                    'verified': False,
                    'message': 'Transaction not found',
                    'details': {
                        'error': 'Transaction not found'
                    }
                }
            
            # Verify that the transaction was sent by the voter
            tx_from = tx['from'].lower()
            voter_address_lower = voter_address.lower()
            logger.info(f"Transaction from: {tx_from}")
            logger.info(f"Expected voter: {voter_address_lower}")
            logger.info(f"Addresses match: {tx_from == voter_address_lower}")
            
            if tx_from != voter_address_lower:
                logger.error("Transaction sender does not match voter address")
                return {
                    'verified': False,
                    'message': 'Transaction sender does not match voter address',
                    'details': {
                        'error': 'Transaction sender does not match voter address',
                        'tx_sender': tx['from'],
                        'voter_address': voter_address
                    }
                }
            
            # Verify that the transaction was sent to the contract
            tx_to = tx['to'].lower()
            contract_address_lower = contract_address.lower()
            logger.info(f"Transaction to: {tx_to}")
            logger.info(f"Expected contract: {contract_address_lower}")
            logger.info(f"Addresses match: {tx_to == contract_address_lower}")
            
            if tx_to != contract_address_lower:
                logger.error("Transaction receiver does not match contract address")
                return {
                    'verified': False,
                    'message': 'Transaction was not sent to the correct contract',
                    'details': {
                        'error': 'Transaction receiver does not match contract address',
                        'tx_receiver': tx['to'],
                        'contract_address': contract_address
                    }
                }
            
            # Check if the voter has voted
            has_voted = contract.functions.hasVoted(voter_address).call()
            logger.info(f"Contract reports hasVoted = {has_voted}")
            
            if not has_voted:
                logger.error("Voter has not voted according to the contract")
                return {
                    'verified': False,
                    'message': 'Vote record not found in the blockchain contract',
                    'details': {
                        'error': 'Voter has not voted according to the contract'
                    }
                }
            
            # Verify that the transaction input data matches a vote for the specified candidate
            # This is a more detailed check that requires decoding the transaction input
            try:
                # Decode the function call from the transaction input
                func_obj, func_params = contract.decode_function_input(tx['input'])
                
                # Check if the function called was castVote
                func_name = func_obj.fn_name
                logger.info(f"Function called in transaction: {func_name}")
                logger.info(f"Function parameters: {func_params}")
                
                if func_name != 'castVote':
                    logger.error(f"Transaction called {func_name} instead of castVote")
                    return {
                        'verified': False,
                        'message': f'Transaction called {func_name} instead of castVote',
                        'details': {
                            'error': f'Transaction called {func_name} instead of castVote',
                            'function_name': func_name
                        }
                    }
                
                # Check if the candidate ID matches
                tx_candidate_id = None
                if 'candidateId' in func_params:
                    tx_candidate_id = func_params['candidateId']
                    logger.info(f"Transaction candidate ID: {tx_candidate_id}")
                    logger.info(f"Expected candidate ID: {candidate_id}")
                    logger.info(f"Candidate IDs match: {tx_candidate_id == candidate_id}")
                
                if tx_candidate_id is not None and tx_candidate_id != candidate_id:
                    logger.error("Transaction voted for a different candidate")
                    return {
                        'verified': False,
                        'message': 'Transaction voted for a different candidate than expected',
                        'details': {
                            'error': 'Transaction voted for a different candidate',
                            'tx_candidate_id': tx_candidate_id,
                            'expected_candidate_id': candidate_id
                        }
                    }
                
            except Exception as decode_error:
                # If we can't decode the transaction input, log it but continue with verification
                logger.warning(f"Could not decode transaction input: {str(decode_error)}")
            
            # If all checks pass, the vote is verified
            logger.info("All verification checks passed - vote is verified!")
            return {
                'verified': True,
                'message': 'Vote successfully verified on blockchain',
                'details': {
                    'transaction_hash': transaction_hash,
                    'block_number': tx_receipt['blockNumber'],
                    'voter_address': voter_address,
                    'candidate_id': candidate_id,
                    'has_voted_on_chain': has_voted,
                    'transaction_exists': True,
                    'status': tx_receipt['status']
                }
            }
            
        except Exception as e:
            logger.error(f"Error verifying vote: {str(e)}")
            return {
                'verified': False,
                'message': f'Error verifying vote: {str(e)}',
                'details': {
                    'error': f'Error verifying vote: {str(e)}'
                }
            }
    
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
        
        # Get blockchain times
        start_time_blockchain = info[2]
        end_time_blockchain = info[3]
        
        # Convert blockchain times to system times using our standardized utility function
        start_time_adjusted = blockchain_to_system_time(start_time_blockchain)
        end_time_adjusted = blockchain_to_system_time(end_time_blockchain)
        
        # Log the time adjustment for debugging
        logger.info(f"Converting blockchain times to system times:")
        logger.info(f"  Blockchain start: {start_time_blockchain} → System adjusted: {start_time_adjusted}")
        logger.info(f"  Blockchain end: {end_time_blockchain} → System adjusted: {end_time_adjusted}")
        
        # Parse the info with adjusted times
        return {
            'title': info[0],
            'description': info[1],
            'start_time': start_time_adjusted,  # Adjusted time
            'end_time': end_time_adjusted,      # Adjusted time
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
                'description': candidate[2],
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
                'description': candidate[2],
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
        Check if a voter has already voted.
        
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
    
    def create_user_wallet(self, initial_funding=1.0):
        """
        Create a new user wallet and fund it with ETH.
        
        Args:
            initial_funding: Amount of ETH to fund the wallet with
            
        Returns:
            Dictionary with private key and address
        """
        # Generate a new account
        account = Account.create()
        private_key = account.key.hex()
        address = account.address
        
        # Fund the account
        if initial_funding > 0:
            self.fund_user_wallet(address, amount_ether=initial_funding)
            
        return {
            'private_key': private_key,
            'address': address
        }
        
    def fund_user_wallet(self, to_address, amount_ether=0.1, from_private_key=None):
        """
        Fund a user wallet with ETH from another account.
        
        Args:
            to_address: Address to fund
            amount_ether: Amount of ETH to send
            from_private_key: Private key to use for funding, or None to use a Ganache account
            
        Returns:
            Transaction hash or None if failed
        """
        try:
            # Determine the funding account
            from_address = None
            use_unlocked_account = False
            funding_account = None
            
            # Option 1: Use provided private key
            if from_private_key:
                funding_account = self.w3.eth.account.from_key(from_private_key)
                from_address = funding_account.address
                use_unlocked_account = False
                logger.info(f"Using provided private key to fund wallet: {from_address}")
            
            # Option 2: Use one of the unlocked Ganache accounts with highest balance
            elif self.w3.provider.endpoint_uri.startswith(('http://ganache', 'http://localhost')):
                accounts = self.w3.eth.accounts
                
                if accounts:
                    # Find account with highest balance
                    balances = [(addr, self.w3.eth.get_balance(addr)) for addr in accounts]
                    balances.sort(key=lambda x: x[1], reverse=True)  # Sort by balance (highest first)
                    
                    from_address = balances[0][0]
                    use_unlocked_account = True
                    logger.info(f"Using account with highest balance: {from_address} with {self.w3.from_wei(balances[0][1], 'ether')} ETH")
                    
            # Option 3: Use admin wallet from settings (last resort)    
            elif hasattr(settings, 'ADMIN_WALLET_PRIVATE_KEY') and settings.ADMIN_WALLET_PRIVATE_KEY:
                from_private_key = settings.ADMIN_WALLET_PRIVATE_KEY
                funding_account = self.w3.eth.account.from_key(from_private_key)
                from_address = funding_account.address
                use_unlocked_account = False
                logger.info(f"Using admin wallet from settings: {from_address}")
            
            if not from_address:
                logger.error("No funding account available")
                return None
                
            # Convert ETH to Wei
            amount_wei = self.w3.to_wei(amount_ether, 'ether')
            
            # Check balance of funding account
            balance = self.w3.eth.get_balance(from_address)
            
            if balance < amount_wei:
                logger.error(f"Insufficient funds in funding account {from_address}. Balance: {self.w3.from_wei(balance, 'ether')} ETH")
                return None
            
            # Different transaction sending based on whether we're using an unlocked account
            if use_unlocked_account:
                # For unlocked accounts (like Ganache's default accounts), 
                # we can send the transaction directly
                tx_hash = self.w3.eth.send_transaction({
                    'from': from_address,
                    'to': to_address,
                    'value': amount_wei,
                    'gas': 21000,  # Standard gas limit for ETH transfers
                })
                
                # Wait for transaction receipt
                receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            else:
                # For accounts we have the private key for, sign and send
                # Prepare the transaction
                nonce = self.w3.eth.get_transaction_count(from_address)
                
                # Build transaction
                transaction = {
                    'from': from_address,
                    'to': to_address,
                    'value': amount_wei,
                    'gas': 21000,
                    'gasPrice': self.w3.eth.gas_price,
                    'nonce': nonce,
                }
                
                # Sign transaction
                signed_txn = self.w3.eth.account.sign_transaction(transaction, private_key=from_private_key)
                
                # Send transaction
                tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
                
                # Wait for transaction receipt
                receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
                
            return tx_hash.hex()
            
        except Exception as e:
            logger.error(f"Error funding wallet {to_address}: {str(e)}")
            return None
    
    def check_election_active(self, contract_address: str) -> bool:
        """
        Check if an election is currently active on the blockchain.
        
        Args:
            contract_address: Address of the deployed contract
            
        Returns:
            Boolean indicating whether the election is active
            
        Raises:
            Exception: If the contract call fails
        """
        # Get contract instance
        contract = self.get_contract_instance(contract_address)
        if not contract:
            raise ValueError("Could not get contract instance")
            
        # Call contract functions to get details
        try:
            # Get current SYSTEM time using utility function (returns datetime)
            current_time = get_current_time()
            
            # Convert current datetime to timestamp for comparison with blockchain timestamps
            current_timestamp = int(current_time.timestamp())
            
            # Get contract start and end times (these are integers/timestamps)
            start_time_blockchain = contract.functions.startTime().call()
            end_time_blockchain = contract.functions.endTime().call()
            
            # Convert blockchain timestamps to datetime objects for logging
            start_time = blockchain_to_system_time(start_time_blockchain)
            end_time = blockchain_to_system_time(end_time_blockchain)
            
            # Check if election is active based on timestamp comparison
            is_active = current_timestamp >= start_time_blockchain and current_timestamp <= end_time_blockchain
            
            # Log detailed information for debugging timezone issues
            logger.info(f"Election at {contract_address} active status check:")
            logger.info(f"  Current system time: {current_time} (timestamp: {current_timestamp})")
            logger.info(f"  Blockchain start time: {start_time_blockchain} → System adjusted: {start_time}")
            logger.info(f"  Blockchain end time: {end_time_blockchain} → System adjusted: {end_time}")
            logger.info(f"  Is active: {is_active}")
            logger.info(f"  Time conditions: {current_timestamp >= start_time_blockchain} AND {current_timestamp <= end_time_blockchain}")
            
            if not is_active:
                if current_timestamp < start_time_blockchain:
                    mins_until_start = (start_time_blockchain - current_timestamp) / 60
                    logger.info(f"  Election will start in {mins_until_start:.2f} minutes (using system time)")
                else:
                    logger.info("  Election has ended")
            
            return is_active
            
        except Exception as e:
            logger.error(f"Error checking if election is active: {str(e)}")
            raise e
    
    def get_transaction(self, tx_hash: str) -> Dict[str, Any]:
        """
        Get a transaction by hash.
        
        Args:
            tx_hash: Hash of the transaction
            
        Returns:
            Transaction details
            
        Raises:
            TransactionNotFound: If the transaction is not found
        """
        if not tx_hash.startswith('0x'):
            tx_hash = f'0x{tx_hash}'
            
        return self.w3.eth.get_transaction(tx_hash)
    
    def transfer_all_eth(self, from_address, to_address, private_key):
        """
        Transfer all ETH from one address to another, accounting for gas fees.
        
        Args:
            from_address (str): The address to transfer from
            to_address (str): The address to transfer to
            private_key (str): Private key of the from_address
        
        Returns:
            str: Transaction hash if successful, None otherwise
        """
        try:
            # Get the current balance
            balance = self.w3.eth.get_balance(from_address)
            
            # If balance is too low, don't try to transfer
            if balance <= 21000 * self.w3.eth.gas_price:
                logger.info(f"Balance too low to transfer: {balance} wei")
                return None
                
            # Calculate gas cost for a standard ETH transfer
            gas_limit = 21000  # Standard gas for simple ETH transfer
            gas_price = self.w3.eth.gas_price
            gas_cost = gas_limit * gas_price
            
            # Calculate amount to send (total balance minus gas cost)
            amount_to_send = balance - gas_cost
            
            logger.info(f"Transferring {self.w3.from_wei(amount_to_send, 'ether')} ETH from {from_address} to {to_address}")
            
            # Ensure private key has 0x prefix
            if not private_key.startswith('0x'):
                private_key = '0x' + private_key
            
            # Prepare transaction
            transaction = {
                'to': to_address,
                'value': amount_to_send,
                'gas': gas_limit,
                'gasPrice': gas_price,
                'nonce': self.w3.eth.get_transaction_count(from_address),
                'chainId': self.w3.eth.chain_id
            }
            
            # Sign transaction
            signed_tx = self.w3.eth.account.sign_transaction(transaction, private_key)
            
            # Send transaction
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
            
            # Wait for transaction receipt
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            
            logger.info(f"ETH transfer complete. Transaction hash: {tx_hash.hex()}")
            
            return tx_hash.hex()
        except Exception as e:
            logger.error(f"Error transferring ETH: {str(e)}")
            # Don't raise the exception, as we want key rotation to continue even if transfer fails
            return None

