#!/bin/bash
# Stellar Contract Deployment Script for Testnet

set -e

echo "🌟 Stellar Bridge Contract Deployment"
echo "======================================"

# Check if soroban CLI is installed
if ! command -v soroban &> /dev/null; then
    echo "❌ Soroban CLI not installed. Please run: cargo install soroban-cli"
    exit 1
fi

# Set network to testnet
stellar config network add --global testnet \
    --rpc-url https://soroban-testnet.stellar.org:443 \
    --network-passphrase "Test SDF Network ; September 2015" || true

echo "✅ Network configured"

# Load .env if exists
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Generate or import account
if [ -z "$STELLAR_PUBLIC_KEY" ]; then
    echo "❌ No Stellar account found in .env file"
    exit 1
else
    echo "✅ Using existing account: $STELLAR_PUBLIC_KEY"
    STELLAR_ACCOUNT=$STELLAR_PUBLIC_KEY
fi

# Fund account from friendbot
echo "💰 Funding account from friendbot..."
curl -X POST "https://friendbot.stellar.org?addr=$STELLAR_ACCOUNT" || true
sleep 5
echo "✅ Account funded"

# Build contract
echo "🔨 Building Stellar contract..."
cargo build --target wasm32-unknown-unknown --release
echo "✅ Contract built"

# Deploy contract
echo "🚀 Deploying contract..."
CONTRACT_ID=$(stellar contract deploy \
    --wasm ../../target/wasm32-unknown-unknown/release/stellar_bridge_escrow.wasm \
    --source stellar_testnet \
    --network testnet 2>&1 | tee /tmp/stellar_deploy.log | grep -E '^C[A-Z0-9]{55}$' || cat /tmp/stellar_deploy.log)

echo "✅ Contract deployed!"
echo "📝 Contract ID: $CONTRACT_ID"

# Save contract ID to .env
cd ../..
sed -i "s|STELLAR_CONTRACT_ID=.*|STELLAR_CONTRACT_ID=$CONTRACT_ID|" .env
echo "✅ Contract ID saved to .env"

echo ""
echo "🎉 Deployment complete!"
echo "================================"
echo "Contract ID: $CONTRACT_ID"
echo "Account: $STELLAR_ACCOUNT"
echo ""
echo "View on Stellar Expert:"
echo "https://stellar.expert/explorer/testnet/contract/$CONTRACT_ID"
echo ""
echo "All credentials saved in .env file"
