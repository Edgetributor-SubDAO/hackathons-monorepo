#!/usr/bin/env python3
"""
Verify your private key setup and account balance
"""

from web3 import Web3
import os

MOONBASE_ALPHA_RPC = "https://rpc.api.moonbase.moonbeam.network"

def main():
    print("=" * 60)
    print("🔍 Verifying Setup")
    print("=" * 60)
    print()
    
    # Check if private key is set
    private_key = os.getenv('PRIVATE_KEY')
    
    if not private_key:
        print("❌ PRIVATE_KEY environment variable not set!")
        print()
        print("Set it with:")
        print('  export PRIVATE_KEY="0xYourPrivateKeyHere"')
        print()
        print("Or generate a new account:")
        print("  python generate_account.py")
        return
    
    # Validate private key format
    if not private_key.startswith('0x'):
        print("⚠️  Warning: Private key should start with '0x'")
        private_key = '0x' + private_key
    
    if len(private_key) != 66:
        print(f"⚠️  Warning: Private key should be 66 characters (got {len(private_key)})")
    
    try:
        # Create account from private key
        w3 = Web3()
        account = w3.eth.account.from_key(private_key)
        
        print("✅ Private key is valid!")
        print(f"📍 Address: {account.address}")
        print()
        
        # Connect to Moonbase Alpha
        print("🌐 Connecting to Moonbase Alpha...")
        moonbase = Web3(Web3.HTTPProvider(MOONBASE_ALPHA_RPC))
        
        if not moonbase.is_connected():
            print("❌ Failed to connect to Moonbase Alpha")
            return
        
        print(f"✅ Connected! Chain ID: {moonbase.eth.chain_id}")
        print()
        
        # Check balance
        balance = moonbase.eth.get_balance(account.address)
        balance_eth = moonbase.from_wei(balance, 'ether')
        
        print("=" * 60)
        print("💰 Account Balance")
        print("=" * 60)
        print(f"Balance: {balance_eth} DEV")
        
        if balance == 0:
            print()
            print("⚠️  No testnet tokens found!")
            print("📝 Get tokens from: https://faucet.moonbeam.network/")
            print(f"📍 Use this address: {account.address}")
        else:
            print("✅ You have testnet tokens! Ready to deploy.")
        
        print()
        print("=" * 60)
        print("✅ Setup verified!")
        print("=" * 60)
        print()
        print("Next step: python deploy_contract.py")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print()
        print("Make sure your private key is correct and starts with '0x'")

if __name__ == "__main__":
    main()

