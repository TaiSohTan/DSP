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
            
        Raises:
            ValueError: If the private key is None or invalid
        """
        if private_key is None:
            raise ValueError("Private key cannot be None")
            
        if not isinstance(private_key, str):
            raise ValueError(f"Private key must be a string, got {type(private_key)}")
            
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
    def create_user_wallet(self, initial_funding=1.0):
        """
        Create a new Ethereum wallet for a user and fund it with ETH.
        
        Args:
            initial_funding (float): Amount of ETH to initially fund the wallet with
            
        Returns:
            Tuple[str, str]: A tuple containing (address, private_key)
        """
        # Generate a new Ethereum account
        account = self.w3.eth.account.create()
        private_key = account.key.hex()
        address = account.address
        
        logger.info(f"Created new Ethereum wallet with address: {address}")
        
        # Fund the new wallet with initial ETH
        if initial_funding > 0:
            try:
                tx_hash = self.fund_user_wallet(address, amount_ether=initial_funding)
                if tx_hash:
                    logger.info(f"Funded new wallet {address} with {initial_funding} ETH. Transaction: {tx_hash}")
                else:
                    logger.warning(f"Failed to fund new wallet {address}")
            except Exception as e:
                logger.error(f"Error funding new wallet {address}: {str(e)}")
        
        return address, private_key    
    
    def fund_user_wallet(self, to_address, amount_ether=0.1, from_private_key=None):
        """
        Fund a user wallet with ETH from a funded account.
        
        Args:
            to_address (str): The address to send ETH to
            amount_ether (float): Amount of ETH to send
            from_private_key (str, optional): Private key of the funding account.
                If not provided, uses the first account from the Ganache node.
                
        Returns:
            str: Transaction hash if successful, None otherwise
        """
        try:
            # Try to get Ganache accounts with retries
            retry_count = 0
            accounts = []
            
            while retry_count < 3 and not accounts:
                try:
                    # Get accounts from the Ganache node
                    accounts = self.w3.eth.accounts
                    if accounts:
                        # Log all available accounts and their balances for debugging
                        logger.info(f"Found {len(accounts)} accounts on Ganache")
                        for i, acc in enumerate(accounts):
                            bal = self.w3.eth.get_balance(acc)
                            bal_eth = self.w3.from_wei(bal, 'ether')
                            logger.info(f"Account {i}: {acc} - Balance: {bal_eth} ETH")
                except Exception as e:
                    logger.warning(f"Error connecting to Ganache (attempt {retry_count+1}/3): {str(e)}")
                
                retry_count += 1
                if not accounts and retry_count < 3:
                    import time
                    time.sleep(2)  # Wait longer between retries
              # Find a funded account to use
            use_unlocked_account = False
            from_address = None
            
            # Option 1: Use provided private key
            if from_private_key:
                funding_account = self.w3.eth.account.from_key(from_private_key)
                from_address = funding_account.address
                use_unlocked_account = False
                logger.info(f"Using provided private key account: {from_address}")
            
            # Option 2: Find a funded Ganache account
            elif accounts:
                # Try to find an account with sufficient funds
                for acc in accounts:
                    bal = self.w3.eth.get_balance(acc)
                    amount_wei = self.w3.to_wei(amount_ether, 'ether')
                    if bal >= amount_wei:
                        from_address = acc
                        use_unlocked_account = True
                        logger.info(f"Using funded Ganache account: {from_address} with {self.w3.from_wei(bal, 'ether')} ETH")
                        break
                
                # If no account has enough funds, use the one with highest balance
                if not from_address and accounts:
                    balances = [(acc, self.w3.eth.get_balance(acc)) for acc in accounts]
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
                gas_price = self.w3.eth.gas_price
                
                tx = {
                    'from': from_address,
                    'to': to_address,
                    'value': amount_wei,
                    'nonce': nonce,
                    'gas': 21000,  # Standard gas limit for ETH transfers
                    'gasPrice': gas_price,
                    'chainId': self.w3.eth.chain_id
                }
                
                # Sign and send the transaction
                signed_tx = self.w3.eth.account.sign_transaction(tx, from_private_key)
                tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
                
                # Wait for transaction receipt
                receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            
            logger.info(f"Funded user wallet {to_address} with {amount_ether} ETH. Transaction hash: {receipt['transactionHash'].hex()}")
            
            return receipt['transactionHash'].hex()
            
        except Exception as e:
            logger.error(f"Error funding user wallet: {str(e)}")
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
            # Get current blockchain time
            latest_block = self.w3.eth.get_block('latest')
            block_timestamp = latest_block.timestamp
            
            # Get contract start and end times
            start_time = contract.functions.startTime().call()
            end_time = contract.functions.endTime().call()
            
            # Convert to datetime objects for better logging
            import datetime 
            block_datetime = datetime.datetime.fromtimestamp(block_timestamp)
            start_datetime = datetime.datetime.fromtimestamp(start_time)
            end_datetime = datetime.datetime.fromtimestamp(end_time)
            
            # Check if election is active
            is_active = block_timestamp >= start_time and block_timestamp <= end_time
            
            # Log detailed information for debugging timezone issues
            logger.info(f"Election at {contract_address} active status check:")
            logger.info(f"  Blockchain time: {block_timestamp} ({block_datetime} UTC)")
            logger.info(f"  Election start: {start_time} ({start_datetime} UTC)")
            logger.info(f"  Election end: {end_time} ({end_datetime} UTC)")
            logger.info(f"  Is active: {is_active}")
            logger.info(f"  Time conditions: {block_timestamp >= start_time} AND {block_timestamp <= end_time}")
            if not is_active:
                if block_timestamp < start_time:
                    mins_until_start = (start_time - block_timestamp) / 60
                    logger.info(f"  Election will start in {mins_until_start:.2f} minutes")
                else:
                    logger.info("  Election has ended")
            
            return is_active
            logger.info(f"  Election end: {end_time} ({datetime.datetime.fromtimestamp(end_time)} UTC)")
            logger.info(f"  Is active: {is_active}")
            logger.info(f"  Time condition: {block_timestamp} >= {start_time} = {block_timestamp >= start_time} AND {block_timestamp} <= {end_time} = {block_timestamp <= end_time}")
            
            return is_active
            
        except Exception as e:
            logger.error(f"Error checking if election is active: {str(e)}")
            raise e
