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
        # Run solc to compile the contract with a more specific output format
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
        
        # Ensure result.stdout is a string and properly formatted
        if not isinstance(result.stdout, str):
            raise ValueError("Compiler output is not a string")

        # Parse the JSON output
        try:
            output = json.loads(result.stdout)
            if not isinstance(output, dict):
                raise ValueError("Compiler output JSON is not a dictionary")
            
            # Extract the ABI and bytecode for the EVoting contract
            contract_key = None
            for key in output.get('contracts', {}).keys():
                if 'EVoting' in key:
                    contract_key = key
                    break

            if not contract_key:
                raise ValueError("EVoting contract not found in compiler output")

            contract_data = output['contracts'][contract_key]
            abi = json.loads(contract_data['abi'])
            bytecode = '0x' + contract_data['bin']

            # Save to file
            with open(output_path, 'w') as f:
                json.dump({
                    'contractName': 'EVoting',
                    'abi': abi,
                    'bytecode': bytecode
                }, f, indent=2)

            print(f"Compilation successful! Output saved to: {output_path}")
            return True
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            print(f"Raw output: {result.stdout}")
            return False
        except json.JSONDecodeError:
            # If we can't parse the JSON, try a direct compiler approach
            print("JSON parsing failed, trying alternative compilation method...")
            
            # Try to compile and get the outputs separately
            abi_result = subprocess.run(
                ['solc', '--abi', contract_path],
                capture_output=True, 
                text=True,
                check=True
            )
            
            bin_result = subprocess.run(
                ['solc', '--bin', contract_path],
                capture_output=True,
                text=True,
                check=True
            )
            
            # Parse the outputs manually
            abi_lines = abi_result.stdout.strip().split('\n')
            bin_lines = bin_result.stdout.strip().split('\n')
            
            abi_str = None
            bytecode = None
            
            for i in range(len(abi_lines)):
                if 'EVoting' in abi_lines[i] and i+1 < len(abi_lines):
                    abi_str = abi_lines[i+1]
                    break
            
            for i in range(len(bin_lines)):
                if 'EVoting' in bin_lines[i] and i+1 < len(bin_lines):
                    bytecode = '0x' + bin_lines[i+1]
                    break
            
            if not abi_str or not bytecode:
                raise ValueError("Failed to extract ABI or bytecode")
            
            # Parse ABI string
            abi = json.loads(abi_str)
            
            # Save to file
            with open(output_path, 'w') as f:
                json.dump({
                    'contractName': 'EVoting',
                    'abi': abi,
                    'bytecode': bytecode
                }, f, indent=2)
            
            print(f"Compilation successful using alternative method! Output saved to: {output_path}")
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