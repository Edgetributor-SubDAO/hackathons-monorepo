#!/bin/bash

set -e  # Exit on error

echo "🚀 x402-Flash Automated Setup"
echo "=============================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if stellar CLI is installed
if ! command -v stellar &> /dev/null; then
    echo -e "${RED}❌ Stellar CLI not found!${NC}"
    echo ""
    echo "Please install it first:"
    echo "  cargo install --locked stellar-cli --features opt"
    echo ""
    echo "Or visit: https://developers.stellar.org/docs/tools/developer-tools"
    exit 1
fi

echo -e "${GREEN}✅ Stellar CLI found${NC}"

# Step 1: Generate or use existing keys
echo ""
echo "📝 Step 1: Stellar Account Setup"
echo "================================"

if stellar keys list 2>/dev/null | grep -q "demo-server"; then
    echo -e "${YELLOW}⚠️  Keys 'demo-server' already exist${NC}"
    read -p "Use existing keys? (y/n): " use_existing
    if [ "$use_existing" != "y" ]; then
        echo "Generating new keys..."
        stellar keys generate demo-server --network testnet
    fi
else
    echo "Generating new Stellar keypair..."
    stellar keys generate demo-server --network testnet
fi

echo ""
echo -e "${GREEN}✅ Keys ready${NC}"

# Get keys
PUBLIC_KEY=$(stellar keys address demo-server)
echo ""
echo "📍 Public Key: $PUBLIC_KEY"

# Step 2: Fund account
echo ""
echo "💰 Step 2: Funding Account"
echo "========================="
echo "Funding account with testnet XLM..."

if stellar keys fund demo-server --network testnet; then
    echo -e "${GREEN}✅ Account funded successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Funding failed. You can fund manually at:${NC}"
    echo "   https://laboratory.stellar.org/#account-creator"
    echo "   Public Key: $PUBLIC_KEY"
fi

# Step 3: Check for contract deployment
echo ""
echo "📦 Step 3: Smart Contract"
echo "========================"

CONTRACT_WASM="/Users/aditya/Coding/x402-flash-staller-sdk/contracts/x402-flash-settlement/target/wasm32-unknown-unknown/release/x402_flash_settlement.wasm"

if [ -f "$CONTRACT_WASM" ]; then
    echo -e "${GREEN}✅ Contract WASM found${NC}"
    
    read -p "Deploy contract now? (y/n): " deploy_contract
    
    if [ "$deploy_contract" = "y" ]; then
        echo "Deploying contract to testnet..."
        CONTRACT_ID=$(stellar contract deploy \
            --wasm "$CONTRACT_WASM" \
            --network testnet \
            --source demo-server 2>&1 | grep -o 'C[A-Z0-9]\{55\}' | head -1)
        
        if [ -n "$CONTRACT_ID" ]; then
            echo -e "${GREEN}✅ Contract deployed!${NC}"
            echo "   Contract ID: $CONTRACT_ID"
        else
            echo -e "${RED}❌ Contract deployment failed${NC}"
            CONTRACT_ID="YOUR_CONTRACT_ID_HERE"
        fi
    else
        echo -e "${YELLOW}⚠️  Skipping contract deployment${NC}"
        read -p "Enter your contract ID (or press Enter to skip): " CONTRACT_ID
        if [ -z "$CONTRACT_ID" ]; then
            CONTRACT_ID="YOUR_CONTRACT_ID_HERE"
        fi
    fi
else
    echo -e "${YELLOW}⚠️  Contract WASM not found at:${NC}"
    echo "   $CONTRACT_WASM"
    echo ""
    echo "Please build the contract first:"
    echo "   cd contracts/x402-flash-settlement"
    echo "   cargo build --target wasm32-unknown-unknown --release"
    echo ""
    read -p "Enter your contract ID (or press Enter to skip): " CONTRACT_ID
    if [ -z "$CONTRACT_ID" ]; then
        CONTRACT_ID="YOUR_CONTRACT_ID_HERE"
    fi
fi

# Get secret key
SECRET_KEY=$(stellar keys show demo-server 2>/dev/null || echo "SXXXXXXXXXXXXX")

# Step 4: Configure environment files
echo ""
echo "⚙️  Step 4: Configuration"
echo "======================="

# Configure API server .env
API_ENV="/Users/aditya/Coding/x402-flash-staller-sdk/examples/demo-api-server/.env"
cat > "$API_ENV" << EOF
# Stellar Network Configuration
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015

# Deployed Contract
CONTRACT_ID=$CONTRACT_ID

# Token Address (use 'native' for XLM)
TOKEN_ADDRESS=native

# Server Credentials
SERVER_SECRET_KEY=$SECRET_KEY
PAYMENT_ADDRESS=$PUBLIC_KEY

# Server Configuration
PORT=3001
EOF

echo -e "${GREEN}✅ API server .env configured${NC}"

# Configure frontend .env
FRONTEND_ENV="/Users/aditya/Coding/x402-flash-staller-sdk/examples/demo-frontend/.env"
cat > "$FRONTEND_ENV" << EOF
# API URL
VITE_API_URL=http://localhost:3001

# Stellar Configuration
VITE_CONTRACT_ID=$CONTRACT_ID
VITE_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
VITE_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
EOF

echo -e "${GREEN}✅ Frontend .env configured${NC}"

# Step 5: Install dependencies
echo ""
echo "📚 Step 5: Dependencies"
echo "======================"

read -p "Install npm dependencies? (y/n): " install_deps

if [ "$install_deps" = "y" ]; then
    echo ""
    echo "Installing SDK dependencies..."
    cd /Users/aditya/Coding/x402-flash-staller-sdk/sdk/typescript
    npm install
    npm run build
    echo -e "${GREEN}✅ SDK built${NC}"
    
    echo ""
    echo "Installing API server dependencies..."
    cd /Users/aditya/Coding/x402-flash-staller-sdk/examples/demo-api-server
    npm install
    echo -e "${GREEN}✅ API server ready${NC}"
    
    echo ""
    echo "Installing frontend dependencies..."
    cd /Users/aditya/Coding/x402-flash-staller-sdk/examples/demo-frontend
    npm install
    echo -e "${GREEN}✅ Frontend ready${NC}"
fi

# Summary
echo ""
echo "=============================="
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo "=============================="
echo ""
echo "📋 Configuration Summary:"
echo "   Public Key:  $PUBLIC_KEY"
echo "   Contract ID: $CONTRACT_ID"
echo ""
echo "🚀 Next Steps:"
echo ""
echo "1. Start the API server (Terminal 1):"
echo "   cd examples/demo-api-server"
echo "   npm run dev"
echo ""
echo "2. Start the frontend (Terminal 2):"
echo "   cd examples/demo-frontend"
echo "   npm run dev"
echo ""
echo "3. Open browser:"
echo "   http://localhost:3000"
echo ""
echo "4. Install Freighter wallet:"
echo "   https://www.freighter.app/"
echo ""
echo "5. Fund your Freighter account:"
echo "   https://laboratory.stellar.org/#account-creator"
echo ""
echo -e "${GREEN}✅ Ready to test!${NC}"
echo ""
