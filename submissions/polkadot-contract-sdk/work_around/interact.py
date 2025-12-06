#!/usr/bin/env python3
"""
Interact with your deployed smart contract
Dynamically reads main.py to generate interaction menu
"""

import ast
import json
import os
from web3 import Web3

# Try to load from .env file if python-dotenv is available
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # python-dotenv not installed, continue without it

# Moonbase Alpha RPC (Kusama testnet)
MOONBASE_ALPHA_RPC = "https://rpc.api.moonbase.moonbeam.network"

def extract_functions_from_python(file_path):
    """Extract function definitions from Python file"""
    if not os.path.exists(file_path):
        return {}
    
    with open(file_path, 'r') as f:
        source = f.read()
    
    tree = ast.parse(source)
    functions = {}
    
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            # Get function signature
            args = [arg.arg for arg in node.args.args]
            functions[node.name] = {
                'args': args,
                'source': ast.get_source_segment(source, node)
            }
    
    return functions

def load_deployment():
    """Load deployment information"""
    if not os.path.exists('deployment.json'):
        print("❌ Error: deployment.json not found!")
        print("   Deploy the contract first using: python deploy_contract.py")
        return None, None, None
    
    with open('deployment.json', 'r') as f:
        deployment = json.load(f)
    
    return deployment['contract_address'], deployment['abi'], deployment['rpc_url']

def main():
    print("=" * 60)
    print("🔌 Smart Contract Interaction")
    print("=" * 60)
    print()
    
    # Read main.py to get available functions
    print("📖 Reading main.py to discover functions...")
    python_functions = extract_functions_from_python('main.py')
    
    # Filter out main and __main__ functions
    contract_functions = {
        name: info for name, info in python_functions.items() 
        if name not in ['main', '__main__']
    }
    
    if not contract_functions:
        print("⚠️  No functions found in main.py (excluding main())")
        print("   Make sure main.py has functions to deploy!")
        return
    
    print(f"✅ Found {len(contract_functions)} function(s) from main.py:")
    for func_name in contract_functions.keys():
        print(f"   - {func_name}")
    print()
    
    # Load deployment info
    contract_address, abi, rpc_url = load_deployment()
    if not contract_address:
        return
    
    # Connect to network
    web3 = Web3(Web3.HTTPProvider(rpc_url))
    if not web3.is_connected():
        print("❌ Failed to connect to network!")
        return
    
    print(f"✅ Connected to network")
    print(f"📍 Contract Address: {contract_address}\n")
    
    # Create contract instance
    contract = web3.eth.contract(address=contract_address, abi=abi)
    
    # Get account
    private_key = os.getenv('PRIVATE_KEY')
    if not private_key:
        print("⚠️  PRIVATE_KEY environment variable not set")
        print("   Set it with: export PRIVATE_KEY='your_private_key'")
        return
    
    account = web3.eth.account.from_key(private_key)
    
    # Build dynamic menu based on main.py functions
    menu_items = []
    menu_index = 1
    
    # Add functions from main.py
    for func_name, func_info in contract_functions.items():
        args = func_info['args']
        if len(args) == 2:
            menu_items.append({
                'type': 'function',
                'name': func_name,
                'args': args,
                'index': menu_index
            })
            menu_index += 1
    
    # Add helper functions
    helper_functions = [
        {'name': 'getLastResult', 'type': 'view', 'description': 'Get last result'},
        {'name': 'getCalculationCount', 'type': 'view', 'description': 'Get calculation count'}
    ]
    
    for helper in helper_functions:
        menu_items.append({
            'type': 'helper',
            'name': helper['name'],
            'description': helper['description'],
            'index': menu_index
        })
        menu_index += 1
    
    # Add exit option
    exit_index = menu_index
    
    # Interactive menu
    while True:
        print("\n" + "-" * 60)
        print("Available actions (from main.py):")
        
        # Display functions from main.py
        for item in menu_items:
            if item['type'] == 'function':
                args_str = ', '.join(item['args'])
                print(f"{item['index']}. Call {item['name']}({args_str})")
            elif item['type'] == 'helper':
                print(f"{item['index']}. {item['description']}")
        
        print(f"{exit_index}. Exit")
        print("-" * 60)
        
        choice = input(f"\nSelect an action (1-{exit_index}): ").strip()
        
        # Handle exit
        if choice == str(exit_index):
            print("\n👋 Goodbye!")
            break
        
        # Handle function calls from main.py
        selected_item = None
        for item in menu_items:
            if str(item['index']) == choice:
                selected_item = item
                break
        
        if not selected_item:
            print(f"❌ Invalid choice. Please select 1-{exit_index}.")
            continue
        
        try:
            if selected_item['type'] == 'function':
                # Call function from main.py
                func_name = selected_item['name']
                args = selected_item['args']
                
                # Get parameters from user
                params = []
                for arg in args:
                    value = input(f"Enter {arg}: ")
                    try:
                        params.append(int(value))
                    except ValueError:
                        print(f"❌ Invalid number: {value}")
                        break
                else:
                    # All parameters collected successfully
                    params_str = ', '.join(map(str, params))
                    print(f"\n📤 Calling {func_name}({params_str})...")
                    
                    # Get fresh nonce right before building transaction
                    nonce = web3.eth.get_transaction_count(account.address, 'pending')
                    
                    # Build the transaction
                    txn = getattr(contract.functions, func_name)(*params).build_transaction({
                        'from': account.address,
                        'nonce': nonce,
                        'gas': 100000,
                        'gasPrice': web3.eth.gas_price,
                        'chainId': web3.eth.chain_id
                    })
                    
                    # Sign the transaction
                    signed_txn = account.sign_transaction(txn)
                    
                    # Send the signed transaction
                    tx_hash = web3.eth.send_raw_transaction(signed_txn.raw_transaction)
                    print(f"⏳ Transaction hash: {tx_hash.hex()}")
                    
                    receipt = web3.eth.wait_for_transaction_receipt(tx_hash)
                    print(f"✅ Transaction confirmed!")
                    
                    # Get the result
                    result = contract.functions.getLastResult().call()
                    print(f"📊 Result: {result}")
            
            elif selected_item['type'] == 'helper':
                # Call helper function (view function, no transaction needed)
                func_name = selected_item['name']
                result = getattr(contract.functions, func_name)().call()
                print(f"\n📊 {selected_item['description']}: {result}")
        
        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    main()

