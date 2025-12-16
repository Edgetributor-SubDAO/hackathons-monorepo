#!/bin/bash
# Polkadot Contract Deployment Script for Testnet (Contracts on Rococo)

set -e

echo "🔴 Polkadot Bridge Contract Deployment"
echo "======================================"

# Check if cargo-contract is installed
if ! command -v cargo-contract &> /dev/null; then
    echo "📦 Installing cargo-contract..."
    cargo install --force --locked cargo-contract
fi

echo "✅ cargo-contract ready"

# Load .env if exists
if [ -f ../../.env ]; then
    source ../../.env
fi

# Check if we need to generate a keypair
if [ -z "$POLKADOT_SECRET_SEED" ]; then
    echo "📝 Generating new Polkadot account..."
    echo "⚠️  You'll need to manually create an account using:"
    echo "   1. Visit https://polkadot.js.org/apps/"
    echo "   2. Create new account"
    echo "   3. Save the seed phrase and address to .env:"
    echo "      POLKADOT_SECRET_SEED='your seed phrase'"
    echo "      POLKADOT_PUBLIC_KEY='your_address'"
    echo ""
    echo "   4. Fund your account from the faucet:"
    echo "      https://use.ink/faucet (select Contracts on Rococo)"
    echo ""
    read -p "Press Enter after you've created and funded your account..."
    
    if [ -f ../../.env ]; then
        source ../../.env
    fi
fi

if [ -z "$POLKADOT_PUBLIC_KEY" ]; then
    echo "❌ POLKADOT_PUBLIC_KEY not set in .env"
    exit 1
fi

echo "✅ Using account: $POLKADOT_PUBLIC_KEY"

# Build contract
echo "🔨 Building Polkadot contract..."
cd contracts/polkadot
cargo contract build --release
echo "✅ Contract built"

# Get contract artifacts
CONTRACT_WASM="target/ink/polkadot_bridge_verifier.wasm"
CONTRACT_METADATA="target/ink/polkadot_bridge_verifier.json"

echo "📦 Contract artifacts:"
echo "  - WASM: $CONTRACT_WASM"
echo "  - Metadata: $CONTRACT_METADATA"
echo ""

# Try to deploy automatically
echo "🚀 Deploying contract to Contracts on Rococo..."
echo "⚠️  Make sure your account is funded!"

# Deploy using cargo-contract
CONTRACT_ADDRESS=$(cargo contract instantiate \
    --constructor new \
    --suri "$POLKADOT_SECRET_SEED" \
    --url wss://rococo-contracts-rpc.polkadot.io \
    --skip-confirm \
    --output-json \
    2>&1 | grep -o '"contract":"[^"]*"' | cut -d'"' -f4) || {
    echo "⚠️  Automatic deployment failed. Please deploy manually:"
    echo ""
    echo "🌐 Manual Deployment Instructions:"
    echo "======================================"
    echo "1. Go to https://contracts-ui.substrate.io/"
    echo "2. Connect to 'Contracts on Rococo' testnet"
    echo "3. Connect your wallet with account: $POLKADOT_PUBLIC_KEY"
    echo ""
    echo "4. Upload & Deploy contract:"
    echo "   - Upload: $CONTRACT_WASM"
    echo "   - Metadata: $CONTRACT_METADATA"
    echo "   - Constructor: new()"
    echo "   - Deploy and copy the contract address"
    echo ""
    echo "5. Add to .env file:"
    echo "   POLKADOT_VERIFIER_CONTRACT_ADDRESS=<contract_address>"
    exit 1
}

# Save contract address to .env
cd ../..\
sed -i "s|POLKADOT_VERIFIER_CONTRACT_ADDRESS=.*|POLKADOT_VERIFIER_CONTRACT_ADDRESS=$CONTRACT_ADDRESS|" .env

echo ""
echo "🎉 Deployment complete!"
echo "================================"
echo "Contract Address: $CONTRACT_ADDRESS"
echo "Account: $POLKADOT_PUBLIC_KEY"
echo ""
echo "View on Polkadot.js:"
echo "https://polkadot.js.org/apps/?rpc=wss://rococo-contracts-rpc.polkadot.io#/contracts"
echo ""
echo "All credentials saved in .env file"
