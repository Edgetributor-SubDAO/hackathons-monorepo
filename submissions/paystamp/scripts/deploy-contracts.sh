#!/bin/bash

# PayStamp Contract Deployment Script
# Deploys contracts to testnets and validates deployment

set -e

echo "🚀 PayStamp Contract Deployment"
echo "================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

NETWORK="${1:-testnet}"

echo -e "${BLUE}Network: ${NETWORK}${NC}"
echo ""

# Validate contracts first
echo "Step 1: Validating contracts..."
if ! bash scripts/validate-contracts.sh; then
    echo -e "${RED}❌ Contract validation failed${NC}"
    exit 1
fi

echo ""
echo "Step 2: Deploying contracts..."
echo ""

# Deploy Stellar Soroban Contract
if [ -d "packages/contracts/stellar-soroban" ]; then
    echo -e "${BLUE}📦 Deploying Stellar Soroban Contract to ${NETWORK}...${NC}"
    cd packages/contracts/stellar-soroban
    
    if [ -f "Makefile" ] && grep -q "deploy" Makefile; then
        if [ "$NETWORK" = "testnet" ] || [ "$NETWORK" = "futurenet" ]; then
            make deploy-${NETWORK} || {
                echo -e "${YELLOW}⚠️  Stellar deployment may require manual setup${NC}"
            }
        else
            echo -e "${YELLOW}⚠️  Stellar network '${NETWORK}' not configured${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Stellar contract Makefile not found or missing deploy target${NC}"
        echo "   Manual deployment required"
    fi
    
    cd - > /dev/null
else
    echo -e "${YELLOW}⚠️  Stellar Soroban contract directory not found${NC}"
fi

echo ""

# Deploy Polkadot ink! Contract
if [ -d "packages/contracts/polkadot-ink" ]; then
    echo -e "${BLUE}📦 Deploying Polkadot ink! Contract to Shibuya...${NC}"
    cd packages/contracts/polkadot-ink
    
    if [ -f "Makefile" ] && grep -q "deploy" Makefile; then
        make deploy-shibuya || {
            echo -e "${YELLOW}⚠️  Polkadot deployment may require manual setup${NC}"
        }
    else
        echo -e "${YELLOW}⚠️  Polkadot contract Makefile not found or missing deploy target${NC}"
        echo "   Manual deployment required:"
        echo "   cargo contract instantiate --network shibuya"
    fi
    
    cd - > /dev/null
else
    echo -e "${YELLOW}⚠️  Polkadot ink! contract directory not found${NC}"
fi

echo ""
echo -e "${GREEN}✅ Deployment process complete${NC}"
echo ""
echo "Next steps:"
echo "  1. Check deployment-registry.json for contract addresses"
echo "  2. Update .env files with contract addresses"
echo "  3. Initialize contracts with admin addresses"
echo "  4. Test contract interactions"

