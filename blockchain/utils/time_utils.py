from django.utils import timezone
import logging

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
    
    # Convert to UTC
    utc_time = timezone.localtime(datetime_obj, timezone.utc)
    
    # Convert to timestamp
    timestamp = int(utc_time.timestamp())
    
    logger.debug(f"Converting {datetime_obj} to blockchain timestamp: {timestamp}")
    
    return timestamp
