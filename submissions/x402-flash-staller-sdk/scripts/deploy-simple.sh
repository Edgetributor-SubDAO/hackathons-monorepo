#!/bin/bash

# Simplified contract deployment script
# Deploys x402-flash-settlement to Stellar testnet

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONTRACT_DIR="$PROJECT_ROOT/contracts/x402-flash-settlement"
WASM_PATH="$CONTRACT_DIR/target/wasm32-unknown-unknown/release/x402_flash_settlement.wasm"

echo "🚀 Deploying X402-Flash Contract"
echo "================================="
echo ""

# Step 1: Build contract
echo "📦 Building contract..."
cd "$CONTRACT_DIR"
cargo build --target wasm32-unknown-unknown --release

if [ ! -f "$WASM_PATH" ]; then
    echo "❌ Build failed - WASM not found"
    exit 1
fi

echo "✅ Contract built"
echo ""

# Step 2: Upload WASM
echo "📤 Uploading WASM..."
cd "$PROJECT_ROOT"

WASM_HASH=$(stellar contract upload \
    --source server \
    --network testnet \
    --network-passphrase "Test SDF Network ; September 2015" \
    --wasm "$WASM_PATH" 2>&1 | tee /dev/tty | grep -E '^[a-f0-9]{64}$' || echo "")

if [ -z "$WASM_HASH" ]; then
    echo ""
    echo "❌ Failed to get WASM hash. Please check output above."
    exit 1
fi

echo ""
echo "✅ WASM Hash: $WASM_HASH"
echo ""

# Step 3: Deploy contract
echo "🚢 Deploying contract..."

CONTRACT_ID=$(stellar contract deploy \
    --source server \
    --network testnet \
    --network-passphrase "Test SDF Network ; September 2015" \
    --wasm-hash "$WASM_HASH" 2>&1 | tee /dev/tty | grep -E '^C[A-Z0-9]{55}$' || echo "")

if [ -z "$CONTRACT_ID" ]; then
    echo ""
    echo "❌ Failed to get contract ID. Please check output above."
    exit 1
fi

echo ""
echo "✅ Contract ID: $CONTRACT_ID"
echo ""

# Step 4: Initialize contract
echo "⚙️  Initializing contract..."
ADMIN_PUBLIC=$(stellar keys address server)

stellar contract invoke \
    --source server \
    --network testnet \
    --network-passphrase "Test SDF Network ; September 2015" \
    --id "$CONTRACT_ID" \
    -- initialize \
    --admin "$ADMIN_PUBLIC" || echo "⚠️  Initialization may have failed"

echo ""
echo "✅ Contract initialized"
echo ""

# Step 5: Update .env files
echo "📝 Updating .env files..."

ENV_FILE="$PROJECT_ROOT/.env"
FRONTEND_ENV="$PROJECT_ROOT/examples/demo-frontend/.env"

# Update root .env
if [ -f "$ENV_FILE" ]; then
    # Create temp file with updated CONTRACT_ID
    grep -v "^CONTRACT_ID=" "$ENV_FILE" > "${ENV_FILE}.tmp" || true
    echo "CONTRACT_ID=$CONTRACT_ID" >> "${ENV_FILE}.tmp"
    mv "${ENV_FILE}.tmp" "$ENV_FILE"
    echo "   ✅ Root .env"
fi

# Update frontend .env
if [ -f "$FRONTEND_ENV" ]; then
    grep -v "^VITE_CONTRACT_ID=" "$FRONTEND_ENV" > "${FRONTEND_ENV}.tmp" || true
    echo "VITE_CONTRACT_ID=$CONTRACT_ID" >> "${FRONTEND_ENV}.tmp"
    mv "${FRONTEND_ENV}.tmp" "$FRONTEND_ENV"
    echo "   ✅ Frontend .env"
fi

echo ""
echo "🎉 Deployment Complete!"
echo "======================="
echo ""
echo "📋 Contract ID: $CONTRACT_ID"
echo "📋 WASM Hash: $WASM_HASH"
echo "📋 Admin: $ADMIN_PUBLIC"
echo ""
echo "🚀 Start the demo:"
echo "   npm run start:demo"
echo ""
