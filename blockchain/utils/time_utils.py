from django.utils import timezone
import pytz
import logging
import datetime

logger = logging.getLogger(__name__)

def to_blockchain_timestamp(datetime_obj):
    """
    Converts a Django datetime object to a Unix timestamp in UTC
    for consistent use with blockchain operations.
    
    Args:
        datetime_obj: A datetime object (naive or timezone-aware)
        
    Returns:
        int: Unix timestamp in UTC
    """
    # Make sure the datetime is timezone-aware (if it's not already)
    if timezone.is_naive(datetime_obj):
        datetime_obj = timezone.make_aware(datetime_obj)
    
    # Convert to UTC using pytz.UTC instead of timezone.utc
    utc_time = timezone.localtime(datetime_obj, pytz.UTC)
    
    # Convert to timestamp
    timestamp = int(utc_time.timestamp())
    
    logger.debug(f"Converting {datetime_obj} to blockchain timestamp: {timestamp}")
    
    return timestamp

def get_current_time():
    """
    Get the current time in the system timezone.
    
    Returns:
        datetime: Current time as timezone-aware datetime
    """
    return timezone.now()

def system_to_blockchain_time(system_time):
    """
    Convert system time (UTC+1) to blockchain time (UTC+0)
    For comparisons and blockchain operations.
    
    Args:
        system_time: A datetime object representing system time
        
    Returns:
        datetime: Adjusted datetime for blockchain comparison
    """
    # Ensure the datetime is timezone-aware
    if timezone.is_naive(system_time):
        system_time = timezone.make_aware(system_time)
        
    # Subtract 1 hour to convert from system time (UTC+1) to blockchain time (UTC+0)
    blockchain_time = system_time - timezone.timedelta(hours=1)
    
    logger.debug(f"Converting system time {system_time} to blockchain time: {blockchain_time}")
    
    return blockchain_time

def blockchain_to_system_time(blockchain_time):
    """
    Convert blockchain time (UTC+0) to system time (UTC+1)
    When reading values from blockchain.
    
    Args:
        blockchain_time: Either a datetime object or Unix timestamp (int)
        
    Returns:
        datetime: Adjusted datetime in system time
    """
    # If blockchain_time is a timestamp (int), convert to datetime first
    if isinstance(blockchain_time, int):
        blockchain_time = datetime.datetime.fromtimestamp(blockchain_time, tz=pytz.UTC)
    elif timezone.is_naive(blockchain_time):
        blockchain_time = timezone.make_aware(blockchain_time)
        
    # Add 1 hour to convert from blockchain time (UTC+0) to system time (UTC+1)
    system_time = blockchain_time + timezone.timedelta(hours=1)
    
    logger.debug(f"Converting blockchain time {blockchain_time} to system time: {system_time}")
    
    return system_time

def datetime_to_blockchain_timestamp(dt):
    """
    Convert a datetime to a blockchain-compatible UTC timestamp
    with timezone adjustment for blockchain time.
    
    Args:
        dt: A datetime object
        
    Returns:
        int: Unix timestamp adjusted for blockchain
    """
    # First use the existing function to convert to UTC timestamp
    timestamp = to_blockchain_timestamp(dt)
    
    # Subtract one hour (3600 seconds) to adjust for blockchain time
    adjusted_timestamp = timestamp - 3600
    
    logger.debug(f"Adjusting timestamp {timestamp} to blockchain timestamp: {adjusted_timestamp}")
    
    return adjusted_timestamp
