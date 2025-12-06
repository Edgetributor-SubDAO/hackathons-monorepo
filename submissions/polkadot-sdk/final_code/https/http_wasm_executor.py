#!/usr/bin/env python3
"""
HTTP-Enabled WASM Executor
Executes WASM contracts with HTTP API support (client-side)
"""

import os
import json
import sys
import subprocess
import requests
from pathlib import Path

# Add parent directory to path for imports
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Import functions directly
def load_deployment(deployment_file='deployment.json'):
    """Load deployment information"""
    if not os.path.exists(deployment_file):
        raise FileNotFoundError(f"Error: {deployment_file} not found!")
    
    with open(deployment_file, 'r') as f:
        deployment = json.load(f)
    
    return deployment

def fetch_from_ipfs(ipfs_hash, local_file=None, deployment_info=None):
    """Fetch file from IPFS or use local file"""
    # Check if it's a mock/local hash
    is_mock = ipfs_hash.startswith('QmMock') or ipfs_hash.startswith('QmLocal') or len(ipfs_hash) < 46
    
    if is_mock:
        print("⚠️  Mock/Local IPFS hash detected, using local file...")
        
        # Try multiple possible local file locations
        possible_files = []
        
        # From deployment info
        if deployment_info:
            wasm_file = deployment_info.get('wasm_file')
            if wasm_file:
                possible_files.append(wasm_file)
                possible_files.append(os.path.join('..', wasm_file))
                possible_files.append(os.path.join(project_root, wasm_file))
        
        # Common WASM file names
        possible_files.extend([
            'contract.wasm',
            'downloaded_contract.wasm',
            os.path.join('..', 'contract.wasm'),
            os.path.join(project_root, 'contract.wasm'),
        ])
        
        # If local_file provided, prioritize it
        if local_file:
            possible_files.insert(0, local_file)
        
        # Try to find existing WASM file
        for file_path in possible_files:
            if os.path.exists(file_path):
                print(f"✅ Found local WASM file: {file_path}")
                return file_path
        
        # If no file found, raise helpful error
        print("❌ Could not find local WASM file. Tried:")
        for f in possible_files[:5]:  # Show first 5
            print(f"   - {f}")
        raise Exception("Mock hash detected but no local WASM file found. Make sure contract.wasm exists.")
    
    # Try multiple IPFS gateways
    gateways = [
        f"https://ipfs.io/ipfs/{ipfs_hash}",
        f"https://gateway.pinata.cloud/ipfs/{ipfs_hash}",
        f"https://cloudflare-ipfs.com/ipfs/{ipfs_hash}",
        f"https://dweb.link/ipfs/{ipfs_hash}"
    ]
    
    for gateway in gateways:
        try:
            print(f"   Trying {gateway}...")
            response = requests.get(gateway, timeout=10)
            if response.status_code == 200:
                if response.content[:4] == b'\x00asm':
                    wasm_file = 'downloaded_contract.wasm'
                    with open(wasm_file, 'wb') as f:
                        f.write(response.content)
                    print(f"✅ Downloaded WASM: {wasm_file}")
                    return wasm_file
                else:
                    try:
                        return response.json()
                    except:
                        return response.text
        except Exception as e:
            continue
    
    if local_file and os.path.exists(local_file):
        print("⚠️  Using local file as fallback...")
        return local_file
    
    raise Exception("Could not fetch from IPFS")


def execute_http_wasm(contract_address=None, function_name=None, args=None):
    """
    Execute WASM contract with HTTP support
    HTTP calls happen client-side, then results can be submitted to contract
    """
    print("=" * 60)
    print("🌐 HTTP-Enabled WASM Executor")
    print("=" * 60)
    print()
    
    # Load deployment (check multiple locations)
    deployment_file = None
    if os.path.exists('deployment.json'):
        deployment_file = 'deployment.json'
    elif os.path.exists(os.path.join('..', 'deployment.json')):
        deployment_file = os.path.join('..', 'deployment.json')
    elif os.path.exists(os.path.join(project_root, 'deployment.json')):
        deployment_file = os.path.join(project_root, 'deployment.json')
    
    if not deployment_file:
        print("❌ Error: deployment.json not found!")
        print("\n💡 Deploy your contract first:")
        print("   python deploy_wasm.py")
        return
    
    deployment_info = load_deployment(deployment_file)
    ipfs_hash = deployment_info.get('ipfs_hash')
    
    if not ipfs_hash:
        print("❌ Error: No IPFS hash in deployment.json")
        print("   This contract was not deployed as WASM")
        return
    
    print(f"📍 Contract: {deployment_info['contract_address']}")
    print(f"🔗 IPFS Hash: {ipfs_hash}")
    print()
    
    # For client-side execution with HTTP, we can execute Python directly
    # No need for WASM - HTTP works in regular Python!
    print("💡 Note: For HTTP API calls, we'll execute Python directly")
    print("   (HTTP calls work client-side, no WASM needed!)")
    print()
    
    # Try to find main.py (could be in current dir or parent)
    main_py_path = None
    if os.path.exists('main.py'):
        main_py_path = 'main.py'
    elif os.path.exists(os.path.join('..', 'main.py')):
        main_py_path = os.path.join('..', 'main.py')
    elif os.path.exists(os.path.join(project_root, 'main.py')):
        main_py_path = os.path.join(project_root, 'main.py')
    
    if main_py_path:
        # Import and execute the Python code directly
        import importlib.util
        spec = importlib.util.spec_from_file_location("contract_code", main_py_path)
        contract_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(contract_module)
        
        # If function name provided, call it
        if function_name and hasattr(contract_module, function_name):
            func = getattr(contract_module, function_name)
            if args:
                result = func(*args)
            else:
                # For functions that need args, prompt user
                if function_name == 'fetch_weather_api':
                    lat = float(input("Enter latitude: "))
                    lon = float(input("Enter longitude: "))
                    result = func(lat, lon)
                else:
                    print(f"Function {function_name} requires arguments")
                    return
            
            print(f"\n✅ Function '{function_name}' executed!")
            print(f"📊 Result: {result}")
            
            # Option to submit result to contract
            submit = input("\n💾 Submit result to contract? (y/n): ")
            if submit.lower() == 'y':
                submit_to_contract(deployment_info, function_name, result)
        else:
            print("\n📋 Available functions:")
            for name in dir(contract_module):
                if not name.startswith('_') and callable(getattr(contract_module, name)):
                    print(f"   - {name}")
    else:
        print("❌ main.py not found")
        print("   Make sure main.py exists in the project root")


def submit_to_contract(deployment_info, function_name, result):
    """Submit HTTP API result to the smart contract"""
    from web3 import Web3
    
    MOONBASE_ALPHA_RPC = "https://rpc.api.moonbase.moonbeam.network"
    web3 = Web3(Web3.HTTPProvider(MOONBASE_ALPHA_RPC))
    
    contract_address = deployment_info['contract_address']
    abi = deployment_info['abi']
    contract = web3.eth.contract(address=contract_address, abi=abi)
    
    private_key = os.getenv('PRIVATE_KEY')
    if not private_key:
        print("❌ PRIVATE_KEY not set")
        return
    
    account = web3.eth.account.from_key(private_key)
    
    try:
        # Find a function that can store the result
        # This depends on your contract ABI
        if 'process_api_data' in [f['name'] for f in abi if f.get('type') == 'function']:
            nonce = web3.eth.get_transaction_count(account.address, 'pending')
            txn = contract.functions.process_api_data(result, 1).build_transaction({
                'from': account.address,
                'nonce': nonce,
                'gas': 100000,
                'gasPrice': web3.eth.gas_price,
                'chainId': web3.eth.chain_id
            })
            
            signed_txn = account.sign_transaction(txn)
            tx_hash = web3.eth.send_raw_transaction(signed_txn.raw_transaction)
            print(f"⏳ Transaction hash: {tx_hash.hex()}")
            
            receipt = web3.eth.wait_for_transaction_receipt(tx_hash)
            print(f"✅ Result submitted to contract!")
    except Exception as e:
        print(f"❌ Error submitting to contract: {e}")


def main():
    """Interactive HTTP WASM executor"""
    if len(sys.argv) > 1:
        function_name = sys.argv[1]
        args = [int(x) for x in sys.argv[2:]] if len(sys.argv) > 2 else None
        execute_http_wasm(function_name=function_name, args=args)
    else:
        execute_http_wasm()


if __name__ == "__main__":
    main()

