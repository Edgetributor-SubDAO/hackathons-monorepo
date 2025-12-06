# Quick Fix: PRIVATE_KEY Error

## The Problem

You're getting this error:
```
ValueError: PRIVATE_KEY environment variable not set
```

## Solution: Set Your Private Key

You have 3 options:

### Option 1: Export in Terminal (Temporary)

```bash
export PRIVATE_KEY='your_private_key_here'
python3 weather_oracle.py
```

**Note:** This only works for the current terminal session.

### Option 2: Create .env File (Recommended)

Create a `.env` file in your project root:

```bash
# In your project root directory
echo "PRIVATE_KEY=your_private_key_here" > .env
```

Then run:
```bash
python3 weather_oracle.py
```

The script will automatically load from `.env` if you have `python-dotenv` installed.

### Option 3: Inline Variable

```bash
PRIVATE_KEY='your_private_key_here' python3 weather_oracle.py
```

## Get Your Private Key

If you don't have a private key yet:

1. **Use an existing account** - If you already deployed contracts, use that key
2. **Generate a new one** - Use the `generate_account.py` script in the project
3. **From MetaMask** - Export your private key from MetaMask (be careful!)

## Security Warning

⚠️ **Never commit your private key to git!**

- Add `.env` to `.gitignore`
- Never share your private key
- Use testnet keys for testing only

## Verify It Works

After setting PRIVATE_KEY:

```bash
# Check if it's set
echo $PRIVATE_KEY

# Run the oracle
python3 weather_oracle.py
```

You should see:
```
✅ Contract updated with weather data!
```

