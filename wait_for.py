#!/usr/bin/env python
"""
Wait for a port to be available.
"""
import socket
import time
import sys

def is_port_open(host, port, timeout=5.0):
    """Check if the given port is open on the host."""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        result = sock.connect_ex((host, int(port)))
        sock.close()
        return result == 0
    except Exception as e:
        print(f"Error checking port: {e}")
        return False

def wait_for_port(host, port, retries=60, delay=1.0):
    """Wait for a port to be available."""
    print(f"Waiting for {host}:{port} to be available...")
    
    for i in range(retries):
        if is_port_open(host, port):
            print(f"Port {host}:{port} is now available!")
            return True
        
        print(f"Waiting for {host}:{port}... ({i+1}/{retries})")
        time.sleep(delay)
    
    print(f"Timed out waiting for {host}:{port} after {retries} attempts.")
    return False

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(f"Usage: {sys.argv[0]} HOST PORT [RETRIES] [DELAY]")
        sys.exit(1)
    
    host = sys.argv[1]
    port = sys.argv[2]
    retries = int(sys.argv[3]) if len(sys.argv) > 3 else 60
    delay = float(sys.argv[4]) if len(sys.argv) > 4 else 1.0
    
    if not wait_for_port(host, port, retries, delay):
        sys.exit(1)