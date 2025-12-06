# SDK Quick Start Guide

## Installation

1. From the project root directory (where setup.py is located):
```bash
pip install -e .
```

Or use the installation script from the SDK directory:
```bash
cd sdk
./install.sh
```

## Usage

### 1. Deploy a Contract

Deploy your Python file as a smart contract:

```bash
sdk-deploy-contract main.py
```

This will:
- Read your `main.py` file
- Extract functions from it
- Compile to blockchain bytecode
- Deploy to Moonbase Alpha testnet
- Save deployment info to `deployment.json`

### 2. Interact with a Contract

Interact with your deployed contract:

```bash
# Option 1: Use contract address from deployment.json
sdk-interact

# Option 2: Specify contract address directly
sdk-interact 0x1234567890123456789012345678901234567890
```

This will:
- Load contract information
- Discover available functions from your Python file
- Provide an interactive menu to call functions

## Environment Setup

Make sure to set your private key:

```bash
export PRIVATE_KEY='your_private_key_here'
```

Or create a `.env` file in your project root:
```
PRIVATE_KEY=your_private_key_here
```

## Example Workflow

1. Create a Python file `main.py`:
```python
def multiply_numbers(a, b):
    return a * b

def main():
    print(multiply_numbers(2, 3))

if __name__ == "__main__":
    main()
```

2. Deploy it:
```bash
sdk-deploy-contract main.py
```

3. Interact with it:
```bash
sdk-interact
```

4. Select function from menu and provide parameters!

## Command Options

### sdk-deploy-contract
- `python_file`: Path to Python file (required)
- `-o, --output`: Output file for deployment info (default: `deployment.json`)
- `-r, --rpc`: Custom RPC URL (default: Moonbase Alpha)

### sdk-interact
- `contract_address`: Contract address (optional, loads from deployment.json if not provided)
- `-p, --python-file`: Path to original Python file (default: `main.py`)
- `-d, --deployment`: Path to deployment.json (default: `deployment.json`)
- `-r, --rpc`: Custom RPC URL (default: Moonbase Alpha)

## Troubleshooting

- **Commands not found**: Make sure you installed with `pip install -e .`
- **Module not found**: Reinstall with `pip install -e . --force-reinstall`
- **Insufficient funds**: Get testnet tokens from https://faucet.moonbeam.network/

