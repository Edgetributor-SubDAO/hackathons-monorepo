#!/usr/bin/env python3
"""
Oracle Client - Off-chain service to feed API data to smart contracts
This runs off-chain and updates the contract with external API data
"""

import os
import json
import time
import requests
from web3 import Web3

# Try to load from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Moonbase Alpha RPC
MOONBASE_ALPHA_RPC = "https://rpc.api.moonbase.moonbeam.network"


def load_deployment(deployment_file='deployment.json'):
    """Load deployment information"""
    if not os.path.exists(deployment_file):
        raise FileNotFoundError(f"Error: {deployment_file} not found!")
    
    with open(deployment_file, 'r') as f:
        deployment = json.load(f)
    
    return deployment['contract_address'], deployment['abi'], deployment.get('rpc_url', MOONBASE_ALPHA_RPC)


def fetch_price_from_api(symbol='ETH'):
    """
    Fetch price from external API (example: CoinGecko)
    Replace with your actual API endpoint
    """
    try:
        # Example: CoinGecko API
        url = f"https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
        response = requests.get(url, timeout=5)
        data = response.json()
        
        if 'ethereum' in data and 'usd' in data['ethereum']:
            return int(data['ethereum']['usd'] * 100)  # Return as integer (cents)
        return None
    except Exception as e:
        print(f"Error fetching API data: {e}")
        return None


def update_contract_with_api_data(contract_address, api_value, current_value):
    """
    Update smart contract with data from external API
    This simulates an oracle feeding data to the contract
    """
    # Connect to network
    web3 = Web3(Web3.HTTPProvider(MOONBASE_ALPHA_RPC))
    if not web3.is_connected():
        raise ConnectionError("Failed to connect to network!")
    
    # Load contract
    contract_address, abi, rpc_url = load_deployment()
    contract = web3.eth.contract(address=contract_address, abi=abi)
    
    # Get account
    private_key = os.getenv('PRIVATE_KEY')
    if not private_key:
        raise ValueError("PRIVATE_KEY environment variable not set")
    
    account = web3.eth.account.from_key(private_key)
    
    # Calculate delta (change in value)
    delta = api_value - current_value
    
    # Update contract using update_price function
    print(f"📡 Fetching API data...")
    print(f"📊 Current value: {current_value}")
    print(f"📊 API value: {api_value}")
    print(f"📊 Delta: {delta}")
    
    try:
        # Get fresh nonce
        nonce = web3.eth.get_transaction_count(account.address, 'pending')
        
        # Build transaction to update price
        txn = contract.functions.update_price(current_value, delta).build_transaction({
            'from': account.address,
            'nonce': nonce,
            'gas': 100000,
            'gasPrice': web3.eth.gas_price,
            'chainId': web3.eth.chain_id
        })
        
        # Sign and send
        signed_txn = account.sign_transaction(txn)
        tx_hash = web3.eth.send_raw_transaction(signed_txn.raw_transaction)
        print(f"⏳ Transaction hash: {tx_hash.hex()}")
        
        receipt = web3.eth.wait_for_transaction_receipt(tx_hash)
        print(f"✅ Contract updated with API data!")
        
        # Get updated result
        result = contract.functions.getLastResult().call()
        print(f"📊 New contract value: {result}")
        
        return result
    except Exception as e:
        print(f"❌ Error updating contract: {e}")
        raise


def main():
    """
    Oracle service that periodically fetches API data and updates the contract
    """
    print("=" * 60)
    print("🔮 Oracle Client - API to Blockchain Bridge")
    print("=" * 60)
    print()
    
    # Load deployment
    contract_address, abi, rpc_url = load_deployment()
    web3 = Web3(Web3.HTTPProvider(rpc_url))
    contract = web3.eth.contract(address=contract_address, abi=abi)
    
    # Get current value from contract
    try:
        current_value = contract.functions.getLastResult().call()
    except:
        current_value = 0
    
    print(f"📍 Contract: {contract_address}")
    print(f"📊 Current value: {current_value}")
    print()
    
    # Fetch from API
    api_value = fetch_price_from_api('ETH')
    
    if api_value:
        print(f"🌐 API returned: ${api_value / 100:.2f}")
        update_contract_with_api_data(contract_address, api_value, current_value)
    else:
        print("❌ Failed to fetch API data")
    
    print("\n💡 This oracle runs off-chain and feeds data to your contract")
    print("   Set up a cron job or service to run this periodically")


if __name__ == "__main__":
    main()

