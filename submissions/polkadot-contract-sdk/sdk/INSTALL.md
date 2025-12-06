# Installation Guide

## Quick Install

From the project root directory (where setup.py is located):

```bash
pip install -e .
```

Or use the installation script:

```bash
cd sdk
./install.sh
```

## Verify Installation

After installation, you should be able to run:

```bash
sdk-deploy-contract --help
sdk-interact --help
```

## Usage Examples

### Deploy a contract:
```bash
sdk-deploy-contract main.py
```

### Interact with a contract:
```bash
# Using contract address from deployment.json
sdk-interact

# Using a specific contract address
sdk-interact 0x1234567890123456789012345678901234567890
```

## Troubleshooting

If the commands are not found after installation:
1. Make sure your Python environment is activated
2. Try reinstalling: `pip install -e . --force-reinstall`
3. Check that the scripts are in your PATH: `which sdk-deploy-contract`

