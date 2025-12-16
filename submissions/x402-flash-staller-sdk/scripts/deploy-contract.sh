#!/bin/bash

# Deploy x402-flash-settlement contract to Stellar Soroban testnet
# This script builds, installs, deploys, and configures the contract

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONTRACT_DIR="$PROJECT_ROOT/contracts/x402-flash-settlement"
ENV_FILE="$PROJECT_ROOT/.env"
FRONTEND_ENV="$PROJECT_ROOT/examples/demo-frontend/.env"

echo "🚀 X402-Flash Contract Deployment Script"
echo "========================================"

# Check if Stellar CLI is installed
if ! command -v stellar &> /dev/null; then
    echo "❌ Stellar CLI not found. Install it with:"
    echo "   cargo install --locked stellar-cli --features opt"
    exit 1
fi

echo "✅ Stellar CLI found: $(stellar --version)"

# Load current .env to get SERVER_SECRET_KEY
if [ -f "$ENV_FILE" ]; then
    SERVER_SECRET_KEY=$(grep "^SERVER_SECRET_KEY=" "$ENV_FILE" | cut -d'=' -f2)
fi

# Check if SERVER_SECRET_KEY exists
if [ -z "$SERVER_SECRET_KEY" ]; then
    echo "❌ SERVER_SECRET_KEY not found in .env"
    echo "   Run: npm run generate:keys"
    exit 1
fi

ADMIN_SECRET="$SERVER_SECRET_KEY"
ADMIN_PUBLIC=$(stellar keys address server 2>/dev/null || stellar keys show server 2>/dev/null | head -n 1 || echo "")

if [ -z "$ADMIN_PUBLIC" ]; then
    # Generate public key from secret
    echo "$ADMIN_SECRET" | stellar keys add server --secret-stdin --network testnet 2>/dev/null || true
    ADMIN_PUBLIC=$(stellar keys address server)
fi

echo "📋 Admin Account: $ADMIN_PUBLIC"

# Step 1: Build the contract
echo ""
echo "📦 Step 1/5: Building contract..."
cd "$CONTRACT_DIR"

if ! cargo build --target wasm32-unknown-unknown --release; then
    echo "❌ Contract build failed"
    exit 1
fi

WASM_PATH="$CONTRACT_DIR/target/wasm32-unknown-unknown/release/x402_flash_settlement.wasm"

if [ ! -f "$WASM_PATH" ]; then
    echo "❌ WASM file not found at: $WASM_PATH"
    exit 1
fi

echo "✅ Contract built successfully"

# Step 2: Upload WASM to network
echo ""
echo "📤 Step 2/5: Uploading WASM to testnet..."

WASM_HASH=$(stellar contract upload \
    --wasm "$WASM_PATH" \
    --source server \
    --network testnet 2>&1 | grep -v "^⚠️" | tail -n 1)

if [ -z "$WASM_HASH" ]; then
    echo "❌ Failed to upload WASM"
    exit 1
fi

echo "✅ WASM uploaded with hash: $WASM_HASH"

# Step 3: Deploy contract
echo ""
echo "🚢 Step 3/5: Deploying contract..."

CONTRACT_ID=$(stellar contract deploy \
    --wasm-hash "$WASM_HASH" \
    --source server \
    --network testnet 2>&1 | grep -v "^⚠️" | tail -n 1)

if [ -z "$CONTRACT_ID" ]; then
    echo "❌ Failed to deploy contract"
    exit 1
fi

echo "✅ Contract deployed with ID: $CONTRACT_ID"

# Step 4: Initialize contract
echo ""
echo "⚙️  Step 4/5: Initializing contract..."

if stellar contract invoke \
    --id "$CONTRACT_ID" \
    --source server \
    --network testnet \
    -- initialize \
    --admin "$ADMIN_PUBLIC" 2>&1 | grep -v "^⚠️"; then
    echo "✅ Contract initialized successfully"
else
    echo "⚠️  Contract initialization may have failed (this might be ok if already initialized)"
fi

# Step 5: Update .env files
echo ""
echo "📝 Step 5/5: Updating .env files..."

# Update root .env
if [ -f "$ENV_FILE" ]; then
    # Use temporary file to avoid in-place editing issues
    grep -v "^CONTRACT_ID=" "$ENV_FILE" > "${ENV_FILE}.tmp" || true
    echo "CONTRACT_ID=$CONTRACT_ID" >> "${ENV_FILE}.tmp"
    mv "${ENV_FILE}.tmp" "$ENV_FILE"
    echo "✅ Updated $ENV_FILE"
else
    echo "⚠️  Root .env not found"
fi

# Update frontend .env
if [ -f "$FRONTEND_ENV" ]; then
    grep -v "^VITE_CONTRACT_ID=" "$FRONTEND_ENV" > "${FRONTEND_ENV}.tmp" || true
    echo "VITE_CONTRACT_ID=$CONTRACT_ID" >> "${FRONTEND_ENV}.tmp"
    mv "${FRONTEND_ENV}.tmp" "$FRONTEND_ENV"
    echo "✅ Updated $FRONTEND_ENV"
else
    echo "⚠️  Frontend .env not found"
fi

echo ""
echo "🎉 Deployment Complete!"
echo "======================="
echo ""
echo "📋 Contract Details:"
echo "   Contract ID: $CONTRACT_ID"
echo "   WASM Hash: $WASM_HASH"
echo "   Admin: $ADMIN_PUBLIC"
echo ""
echo "✅ Environment files updated with CONTRACT_ID"
echo ""
echo "🚀 Next step: Start the demo"
echo "   npm run start:demo"
echo ""
