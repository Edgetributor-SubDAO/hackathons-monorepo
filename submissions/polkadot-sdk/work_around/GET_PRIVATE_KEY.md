# How to Get Your Private Key

This guide shows you how to get your private key for deploying smart contracts on Moonbase Alpha (Kusama testnet).

## ⚠️ Security Warning

**NEVER share your private key with anyone!**
- Private keys give full control over your wallet
- Only use testnet private keys for testing
- Never use mainnet private keys in scripts
- Never commit private keys to Git

## Method 1: Using MetaMask (Recommended)

### Step 1: Install MetaMask

1. Go to https://metamask.io/
2. Click "Download" and install the browser extension
3. Create a new wallet or import an existing one
4. **Write down your seed phrase** and store it securely

### Step 2: Add Moonbase Alpha Network

1. Open MetaMask
2. Click the network dropdown (top center)
3. Click "Add Network" → "Add a network manually"
4. Enter these details:
   - **Network Name**: Moonbase Alpha
   - **RPC URL**: https://rpc.api.moonbase.moonbeam.network
   - **Chain ID**: 1287
   - **Currency Symbol**: DEV
   - **Block Explorer URL**: https://moonbase.moonscan.io/
5. Click "Save"

### Step 3: Get Testnet Tokens

1. Make sure you're on "Moonbase Alpha" network
2. Copy your wallet address (click on account name to copy)
3. Go to https://faucet.moonbeam.network/
4. Paste your address and request DEV tokens
5. Wait a few seconds for tokens to arrive

### Step 4: Export Private Key

1. Open MetaMask
2. Click the three dots (⋮) next to your account name
3. Click "Account details"
4. Click "Export Private Key"
5. Enter your MetaMask password
6. **Copy the private key** (it starts with `0x`)

### Step 5: Use in Your Script

```bash
# Set as environment variable (recommended)
export PRIVATE_KEY='0xYourPrivateKeyHere'

# Or use inline (less secure)
PRIVATE_KEY='0xYourPrivateKeyHere' python deploy_contract.py
```

## Method 2: Using Polkadot.js Extension

### Step 1: Install Polkadot.js Extension

1. Go to https://polkadot.js.org/extension/
2. Install for Chrome or Firefox
3. Create a new account

### Step 2: Export Private Key

1. Open Polkadot.js Extension
2. Right-click on your account
3. Select "Export account"
4. Enter your password
5. Copy the private key (seed phrase or raw seed)

**Note**: Polkadot.js uses different key formats. You may need to convert it for EVM compatibility.

## Method 3: Generate a New Test Account (For Testing Only)

If you just want to test quickly, you can generate a new account:

```python
from web3 import Web3

# Generate a new account (FOR TESTNET ONLY!)
account = Web3().eth.account.create()
print(f"Address: {account.address}")
print(f"Private Key: {account.key.hex()}")

# Get testnet tokens for this address from the faucet
```

**⚠️ Warning**: This creates a new account. Make sure to:
1. Save the private key securely
2. Get testnet tokens from the faucet
3. Never use this for mainnet

## Method 4: Using Python Script

Create a file `generate_account.py`:

```python
from web3 import Web3
import json

# Generate new account
w3 = Web3()
account = w3.eth.account.create()

print("=" * 60)
print("🔑 New Test Account Generated")
print("=" * 60)
print(f"Address: {account.address}")
print(f"Private Key: {account.key.hex()}")
print()
print("⚠️  IMPORTANT:")
print("1. Save this private key securely")
print("2. Get testnet tokens from: https://faucet.moonbeam.network/")
print("3. Use this address: " + account.address)
print("4. NEVER share your private key!")
print("=" * 60)

# Save to file (optional, be careful!)
save = input("\nSave to .env file? (y/n): ")
if save.lower() == 'y':
    with open('.env', 'w') as f:
        f.write(f"PRIVATE_KEY={account.key.hex()}\n")
    print("✅ Saved to .env file")
    print("⚠️  Make sure .env is in .gitignore!")
```

Run it:
```bash
python generate_account.py
```

## Using Your Private Key

### Option 1: Environment Variable (Recommended)

```bash
# Linux/Mac
export PRIVATE_KEY='0xYourPrivateKeyHere'

# Windows (PowerShell)
$env:PRIVATE_KEY='0xYourPrivateKeyHere'

# Windows (CMD)
set PRIVATE_KEY=0xYourPrivateKeyHere
```

### Option 2: .env File (More Secure)

1. Create a `.env` file:
```bash
PRIVATE_KEY=0xYourPrivateKeyHere
```

2. Install python-dotenv:
```bash
pip install python-dotenv
```

3. Update `deploy_contract.py` to load from .env:
```python
from dotenv import load_dotenv
load_dotenv()
```

### Option 3: Command Line (Less Secure)

```bash
PRIVATE_KEY='0xYourPrivateKeyHere' python deploy_contract.py
```

## Verify Your Setup

Test that your private key works:

```python
from web3 import Web3
import os

PRIVATE_KEY = os.getenv('PRIVATE_KEY')
if not PRIVATE_KEY:
    print("❌ PRIVATE_KEY not set!")
else:
    w3 = Web3(Web3.HTTPProvider("https://rpc.api.moonbase.moonbeam.network"))
    account = w3.eth.account.from_key(PRIVATE_KEY)
    balance = w3.eth.get_balance(account.address)
    print(f"✅ Address: {account.address}")
    print(f"💰 Balance: {w3.from_wei(balance, 'ether')} DEV")
    if balance == 0:
        print("⚠️  Get testnet tokens from: https://faucet.moonbeam.network/")
```

## Troubleshooting

### "Invalid private key format"
- Make sure it starts with `0x`
- Should be 66 characters long (0x + 64 hex characters)
- Example: `0x1234567890abcdef...` (64 hex chars after 0x)

### "Insufficient funds"
- Get testnet tokens from https://faucet.moonbeam.network/
- Make sure you're requesting for Moonbase Alpha network
- Wait a few minutes if tokens don't arrive immediately

### "Account not found"
- Double-check your private key is correct
- Make sure you copied the entire key (including `0x`)

## Security Checklist

- ✅ Using testnet only (not mainnet)
- ✅ Private key stored securely (not in Git)
- ✅ .env file in .gitignore
- ✅ Never sharing private key
- ✅ Using environment variables, not hardcoding

## Next Steps

1. ✅ Get your private key using one of the methods above
2. ✅ Get testnet tokens from https://faucet.moonbeam.network/
3. ✅ Set `PRIVATE_KEY` environment variable
4. ✅ Run `python deploy_contract.py`

Happy deploying! 🚀

