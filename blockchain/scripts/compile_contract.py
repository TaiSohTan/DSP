#!/usr/bin/env python
"""
Script to compile the Solidity smart contract and save it to the compiled directory.
"""
import os
import json
import subprocess
import sys

def compile_contract():
    """Compile the Solidity contract and save the ABI and bytecode."""
    # Get the directory of this script
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # Paths to the contract and output directory
    contracts_dir = os.path.join(base_dir, 'contracts')
    contract_path = os.path.join(contracts_dir, 'EVoting.sol')
    output_dir = os.path.join(contracts_dir, 'compiled')
    output_path = os.path.join(output_dir, 'EVoting.json')
    
    # Make sure output directory exists
    os.makedirs(output_dir, exist_ok=True)
    
    # Check if solc is installed
    try:
        solc_version = subprocess.check_output(['solc', '--version'], stderr=subprocess.STDOUT)
        print(f"Found solc: {solc_version.decode('utf-8').strip()}")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("Error: Solidity compiler (solc) not found or not working properly.")
        print("Please install solc using: npm install -g solc")
        sys.exit(1)
    
    # Compile the contract
    print(f"Compiling contract: {contract_path}")
    try:
        # Run solc to compile the contract
        result = subprocess.run(
            [
                'solc',
                '--optimize',
                '--combined-json', 'abi,bin',
                contract_path
            ],
            capture_output=True,
            text=True,
            check=True
        )
        
        # Parse the JSON output
        output = json.loads(result.stdout)
        
        # Extract the ABI and bytecode for the EVoting contract
        contract_name = next(iter(output['contracts'].keys())).split(':')[1]
        contract_data = list(output['contracts'].values())[0]
        
        abi = json.loads(contract_data['abi'])
        bytecode = '0x' + contract_data['bin']
        
        # Save to file
        with open(output_path, 'w') as f:
            json.dump({
                'contractName': contract_name,
                'abi': abi,
                'bytecode': bytecode
            }, f, indent=2)
            
        print(f"Compilation successful! Output saved to: {output_path}")
        return True
    
    except subprocess.CalledProcessError as e:
        print(f"Compilation failed with error: {e}")
        print(f"Error output: {e.stderr}")
        return False
    except Exception as e:
        print(f"Error during compilation: {str(e)}")
        return False

if __name__ == '__main__':
    compile_contract()