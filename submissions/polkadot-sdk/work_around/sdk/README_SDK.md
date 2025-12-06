# Polkadot Smart Contract SDK

A simple SDK for deploying and interacting with smart contracts on Polkadot/Kusama networks.

## Installation

Install the SDK in development mode from the parent directory:

```bash
# From the project root (where setup.py is located)
pip install -e .
```

Or use the installation script:

```bash
cd sdk
./install.sh
```

## Usage

### Deploy a Contract

Deploy a Python file as a smart contract:

```bash
sdk-deploy-contract main.py
```

Options:
- `-o, --output`: Output file for deployment information (default: `deployment.json`)
- `-r, --rpc`: RPC URL for the network (default: Moonbase Alpha)

Example:
```bash
sdk-deploy-contract main.py -o my_deployment.json
```

### Interact with a Contract

Interact with a deployed smart contract:

```bash
sdk-interact <contract-address>
```

If you don't provide a contract address, it will load from `deployment.json`.

Options:
- `-p, --python-file`: Path to the original Python file (default: `main.py`)
- `-d, --deployment`: Path to deployment.json file (default: `deployment.json`)
- `-r, --rpc`: RPC URL for the network (default: Moonbase Alpha)

Examples:
```bash
# Use contract address from deployment.json
sdk-interact

# Use specific contract address
sdk-interact 0x1234567890123456789012345678901234567890

# Use custom Python file and deployment file
sdk-interact -p my_contract.py -d my_deployment.json
```

## Environment Variables

Make sure to set your private key:

```bash
export PRIVATE_KEY='your_private_key_here'
```

Or create a `.env` file:

```
PRIVATE_KEY=your_private_key_here
```

## Requirements

- Python 3.8+
- web3>=6.0.0
- py-solc-x>=1.1.1
- python-dotenv>=1.0.0

## How It Works

1. **Deployment**: The SDK reads your Python file, extracts functions, and compiles them to blockchain bytecode (internally using Solidity as an intermediate step, but you only write Python).

2. **Interaction**: The SDK reads your original Python file to discover available functions and provides an interactive menu to call them on the deployed contract.

## Example

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

Then select the function from the menu and provide parameters!

