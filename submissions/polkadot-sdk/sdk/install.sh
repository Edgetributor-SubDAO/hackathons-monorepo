#!/bin/bash
# Installation script for the SDK

echo "Installing Polkadot Smart Contract SDK..."
cd "$(dirname "$0")/.."
pip install -e .
echo ""
echo "✅ Installation complete!"
echo ""
echo "You can now use:"
echo "  sdk-deploy-contract <python-file>"
echo "  sdk-interact [contract-address]"
echo ""
echo "Make sure to set your PRIVATE_KEY environment variable:"
echo "  export PRIVATE_KEY='your_private_key'"

