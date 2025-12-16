#!/bin/bash

# x402-flash Demo Setup Script
# This script sets up the complete demo environment

set -e

echo "🚀 x402-flash Demo Setup"
echo "========================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

# Check Stellar CLI (optional but recommended)
if ! command -v stellar &> /dev/null; then
    echo -e "${YELLOW}⚠️  Stellar CLI not found (optional)${NC}"
    echo "Install from: https://developers.stellar.org/docs/tools/developer-tools"
else
    echo -e "${GREEN}✅ Stellar CLI found${NC}"
fi

echo -e "${GREEN}✅ Prerequisites checked${NC}"

# Install root dependencies
echo -e "${YELLOW}Installing root dependencies...${NC}"
npm install

# Build SDK
echo -e "${YELLOW}Building TypeScript SDK...${NC}"
cd sdk/typescript
npm install
npm run build
cd ../..
echo -e "${GREEN}✅ SDK built${NC}"

# Build contract (if not already built)
if [ ! -f "contracts/x402-flash-settlement/target/wasm32-unknown-unknown/release/x402_flash_settlement.wasm" ]; then
    echo -e "${YELLOW}Building Soroban contract...${NC}"
    cd contracts/x402-flash-settlement
    
    if ! command -v cargo &> /dev/null; then
        echo -e "${RED}❌ Rust/Cargo not found${NC}"
        echo "Please install Rust from https://rustup.rs/"
        exit 1
    fi
    
    cargo build --target wasm32-unknown-unknown --release
    cd ../..
    echo -e "${GREEN}✅ Contract built${NC}"
else
    echo -e "${GREEN}✅ Contract already built${NC}"
fi

# Setup demo API server
echo -e "${YELLOW}Setting up demo API server...${NC}"
cd examples/demo-api-server
npm install
cd ../..
echo -e "${GREEN}✅ API server ready${NC}"

# Setup demo frontend
echo -e "${YELLOW}Setting up demo frontend...${NC}"
cd examples/demo-frontend
npm install
cd ../..
echo -e "${GREEN}✅ Frontend ready${NC}"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    cat > .env << 'EOF'
# Stellar Configuration
STELLAR_NETWORK=testnet
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015

# Contract Configuration
CONTRACT_ID=
TOKEN_ADDRESS=native

# Server Configuration (generate with: stellar keys generate server)
SERVER_SECRET_KEY=
PAYMENT_ADDRESS=

# Client Configuration (generate with: stellar keys generate client)
CLIENT_SECRET_KEY=

# API Configuration
PORT=3001
EOF
    echo -e "${GREEN}✅ .env file created${NC}"
    echo -e "${YELLOW}⚠️  Please fill in the .env file with your keys and contract ID${NC}"
else
    echo -e "${GREEN}✅ .env file exists${NC}"
fi

# Create frontend .env file
if [ ! -f "examples/demo-frontend/.env" ]; then
    echo -e "${YELLOW}Creating frontend .env file...${NC}"
    cat > examples/demo-frontend/.env << 'EOF'
VITE_API_URL=http://localhost:3001
VITE_CONTRACT_ID=
VITE_USDC_CONTRACT_ID=
VITE_SERVER_ADDRESS=
VITE_STELLAR_NETWORK=testnet
VITE_RPC_URL=https://soroban-testnet.stellar.org
VITE_HORIZON_URL=https://horizon-testnet.stellar.org
EOF
    echo -e "${GREEN}✅ Frontend .env created${NC}"
else
    echo -e "${GREEN}✅ Frontend .env exists${NC}"
fi

echo ""
echo -e "${GREEN}✨ Setup complete!${NC}"
echo ""
echo "📋 Next steps:"
echo "1. Deploy the contract: npm run deploy:contract"
echo "2. Update .env files with contract ID and keys"
echo "3. Fund your accounts on testnet"
echo "4. Start API server: cd examples/demo-api-server && npm run dev"
echo "5. Start frontend: cd examples/demo-frontend && npm run dev"
echo ""
echo "📚 Documentation: docs/GETTING_STARTED.md"
