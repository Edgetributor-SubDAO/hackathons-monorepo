#!/usr/bin/env python3
"""
Generate a new test account for Moonbase Alpha testnet
FOR TESTNET USE ONLY - Never use for mainnet!
"""

from web3 import Web3
import os

def main():
    print("=" * 60)
    print("🔑 Test Account Generator")
    print("=" * 60)
    print()
    print("⚠️  WARNING: This generates a new account for TESTNET only!")
    print("    Never use this account or private key for mainnet!")
    print()
    
    # Generate new account
    w3 = Web3()
    account = w3.eth.account.create()
    
    print("✅ New account generated!")
    print()
    print("=" * 60)
    print("📋 Account Details")
    print("=" * 60)
    print(f"Address:    {account.address}")
    print(f"Private Key: {account.key.hex()}")
    print()
    
    # Check balance on Moonbase Alpha
    print("🌐 Checking balance on Moonbase Alpha...")
    moonbase = Web3(Web3.HTTPProvider("https://rpc.api.moonbase.moonbeam.network"))
    
    if moonbase.is_connected():
        balance = moonbase.eth.get_balance(account.address)
        balance_eth = moonbase.from_wei(balance, 'ether')
        print(f"💰 Balance: {balance_eth} DEV")
        
        if balance == 0:
            print()
            print("⚠️  No testnet tokens found!")
            print("📝 Next steps:")
            print(f"   1. Copy this address: {account.address}")
            print("   2. Go to: https://faucet.moonbeam.network/")
            print("   3. Paste your address and request DEV tokens")
    else:
        print("⚠️  Could not connect to Moonbase Alpha")
    
    print()
    print("=" * 60)
    print("🔧 Setup Instructions")
    print("=" * 60)
    print()
    print("1. Set your private key as environment variable:")
    print(f'   export PRIVATE_KEY="{account.key.hex()}"')
    print()
    print("2. Or save to .env file (make sure .env is in .gitignore!):")
    print(f'   echo "PRIVATE_KEY={account.key.hex()}" >> .env')
    print()
    print("3. Get testnet tokens from: https://faucet.moonbeam.network/")
    print()
    print("4. Deploy your contract:")
    print("   python deploy_contract.py")
    print()
    print("=" * 60)
    print("⚠️  SECURITY REMINDER")
    print("=" * 60)
    print("• NEVER share your private key")
    print("• NEVER commit private keys to Git")
    print("• This is for TESTNET only")
    print("• Store your private key securely")
    print("=" * 60)
    
    # Ask if user wants to save to .env
    save = input("\n💾 Save private key to .env file? (y/n): ").strip().lower()
    if save == 'y':
        # Check if .env exists
        if os.path.exists('.env'):
            append = input("⚠️  .env file exists. Append to it? (y/n): ").strip().lower()
            mode = 'a' if append == 'y' else 'w'
        else:
            mode = 'w'
        
        with open('.env', mode) as f:
            if mode == 'a':
                f.write('\n')
            f.write(f"PRIVATE_KEY={account.key.hex()}\n")
        
        print("✅ Saved to .env file")
        print("⚠️  Make sure .env is in .gitignore!")
        
        # Check .gitignore
        if os.path.exists('.gitignore'):
            with open('.gitignore', 'r') as f:
                if '.env' in f.read():
                    print("✅ .env is already in .gitignore")
                else:
                    print("⚠️  Adding .env to .gitignore...")
                    with open('.gitignore', 'a') as f:
                        f.write('\n.env\n')
                    print("✅ Added .env to .gitignore")
        else:
            print("⚠️  Creating .gitignore with .env...")
            with open('.gitignore', 'w') as f:
                f.write('.env\n')
            print("✅ Created .gitignore")

if __name__ == "__main__":
    main()

