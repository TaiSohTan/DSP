import os
import sys
import json
from web3 import Web3
import django
import datetime

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dsp.settings')
django.setup()

from api.models import Election
from blockchain.utils.time_utils import (
    get_current_time,
    system_to_blockchain_time,
    blockchain_to_system_time,
    datetime_to_blockchain_timestamp
)

def check_blockchain_time():
    # Connect to Ganache
    w3 = Web3(Web3.HTTPProvider('http://ganache:8545'))
    
    if not w3.is_connected():
        print("Error: Could not connect to Ethereum node")
        return
    
    # Get current block
    latest_block = w3.eth.get_block('latest')
    
    # Get blockchain timestamp
    block_timestamp = latest_block.timestamp
    
    # Convert to datetime for easier reading
    block_datetime = datetime.datetime.fromtimestamp(block_timestamp)
    
    # Get system time using our utility function
    system_time = get_current_time()
    utc_time = datetime.datetime.utcnow()
    
    # Convert blockchain time to system time using our utility function
    blockchain_time_adjusted = blockchain_to_system_time(block_timestamp)
    
    # Print comparison
    print(f"Blockchain timestamp: {block_timestamp}")
    print(f"Blockchain datetime: {block_datetime}")
    print(f"Blockchain time adjusted to system time: {blockchain_time_adjusted}")
    print(f"System time: {system_time}")
    print(f"System UTC time: {utc_time}")
    
    # Get your election times from database
    try:
        # Get the first active election
        election = Election.objects.filter(is_active=True).first()
        
        if election:
            print("\nElection details:")
            print(f"Title: {election.title}")
            print(f"Start time (system): {election.start_date}")
            print(f"End time (system): {election.end_date}")
            
            # Convert election times to blockchain times using our utility function
            start_blockchain_time = system_to_blockchain_time(election.start_date)
            end_blockchain_time = system_to_blockchain_time(election.end_date)
            
            print(f"Start time (adjusted for blockchain): {start_blockchain_time}")
            print(f"End time (adjusted for blockchain): {end_blockchain_time}")
            
            # Convert to timestamps for comparison
            start_blockchain_timestamp = int(start_blockchain_time.timestamp())
            end_blockchain_timestamp = int(end_blockchain_time.timestamp())
            
            print(f"Start blockchain timestamp: {start_blockchain_timestamp}")
            print(f"End blockchain timestamp: {end_blockchain_timestamp}")
            
            # Check if election is active based on blockchain time
            is_active = block_timestamp >= start_blockchain_timestamp and block_timestamp <= end_blockchain_timestamp
            print(f"\nIs election active according to blockchain time? {is_active}")
            print(f"Blockchain time >= Start time? {block_timestamp >= start_blockchain_timestamp}")
            print(f"Blockchain time <= End time? {block_timestamp <= end_blockchain_timestamp}")
            
            # Time difference in minutes
            if block_timestamp < start_blockchain_timestamp:
                minutes_until_start = (start_blockchain_timestamp - block_timestamp) / 60
                print(f"\nElection starts in {minutes_until_start:.2f} minutes according to blockchain time")
            
        else:
            print("No active elections found in database")
            
    except Exception as e:
        print(f"Error accessing database: {e}")

if __name__ == "__main__":
    check_blockchain_time()
