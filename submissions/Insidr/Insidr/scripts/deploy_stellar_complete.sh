#!/bin/bash
set -e

echo "🚀 Deploying Complete Stellar Bridge Contract with ZK Verification"
echo ""

# Load environment variables
source "$(dirname "$0")/../.env" 2>/dev/null || true

STELLAR_PUBLIC_KEY=${STELLAR_PUBLIC_KEY:-""}
STELLAR_SECRET_KEY=${STELLAR_SECRET_KEY:-""}

if [ -z "$STELLAR_PUBLIC_KEY" ]; then
    echo "❌ Error: STELLAR_PUBLIC_KEY not set in .env"
    exit 1
fi

cd "$(dirname "$0")/../contracts/stellar"

echo "📦 Building Stellar bridge contract..."
cargo build --target wasm32v1-none --release --manifest-path ../../Cargo.toml

# The WASM file will be in target directory
WASM_FILE="../../target/wasm32v1-none/release/stellar_bridge_escrow.wasm"

if [ ! -f "$WASM_FILE" ]; then
    echo "❌ Error: WASM file not found at $WASM_FILE"
    exit 1
fi

echo "✅ Contract built successfully"
echo ""

echo "🌐 Deploying to Stellar testnet..."
CONTRACT_ID=$(stellar contract deploy \
    --wasm "$WASM_FILE" \
    --source stellar_testnet \
    --network testnet 2>&1 | grep -oP '[A-Z0-9]{56}')

if [ -z "$CONTRACT_ID" ]; then
    echo "❌ Error: Failed to deploy contract"
    exit 1
fi

echo "✅ Contract deployed!"
echo "📍 Contract ID: $CONTRACT_ID"
echo ""

# Update .env file
ENV_FILE="$(dirname "$0")/../.env"
if [ -f "$ENV_FILE" ]; then
    sed -i "s|STELLAR_BRIDGE_CONTRACT=.*|STELLAR_BRIDGE_CONTRACT=$CONTRACT_ID|" "$ENV_FILE"
    echo "💾 Updated .env file"
fi

echo ""
echo "🔧 Initializing contract..."

# Get native token contract address (USDC on testnet: CAQCMH6QWNEAXZNM3J6TWVDWGPQPJBGXMS74WKMQXZY72QKY3TWGQE4M)
TOKEN_CONTRACT="CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA" # Example token

stellar contract invoke \
    --id "$CONTRACT_ID" \
    --source stellar_testnet \
    --network testnet \
    -- initialize \
    --admin "$STELLAR_PUBLIC_KEY" \
    --token_contract "$TOKEN_CONTRACT" \
    --min_lock_amount 1000000 \
    --relayer_fee 10000

echo "✅ Contract initialized"
echo ""
echo "📊 Testing contract functions..."

# Get total locked
TOTAL_LOCKED=$(stellar contract invoke \
    --id "$CONTRACT_ID" \
    --source stellar_testnet \
    --network testnet \
    -- get_total_locked)

echo "   Total Locked: $TOTAL_LOCKED"

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "Contract Details:"
echo "  Contract ID: $CONTRACT_ID"
echo "  Network: Stellar Testnet"
echo "  Explorer: https://stellar.expert/explorer/testnet/contract/$CONTRACT_ID"
echo ""
echo "Next steps:"
echo "  1. Fund the contract with tokens for testing"
echo "  2. Update Flutter app with contract ID"
echo "  3. Test lock_funds function"
echo "  4. Test verify_and_unlock with ZK proof"
