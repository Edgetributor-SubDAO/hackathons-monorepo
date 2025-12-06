#!/bin/bash

# PayStamp Contract Validation Script
# Validates both Stellar Soroban and Polkadot ink! contracts

set -e

echo "🔍 PayStamp Contract Validation"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Rust is installed
if ! command -v rustc &> /dev/null; then
    echo -e "${RED}❌ Rust is not installed${NC}"
    echo "Install Rust: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    exit 1
fi

echo -e "${GREEN}✅ Rust toolchain found${NC}"

# Check if Soroban CLI is installed
if ! command -v soroban &> /dev/null; then
    echo -e "${YELLOW}⚠️  Soroban CLI not found${NC}"
    echo "Install: curl -sSL https://soroban.stellar.org | sh"
else
    echo -e "${GREEN}✅ Soroban CLI found${NC}"
fi

# Check if cargo-contract is installed
if ! command -v cargo-contract &> /dev/null; then
    echo -e "${YELLOW}⚠️  cargo-contract not found${NC}"
    echo "Install: cargo install cargo-contract --force"
else
    echo -e "${GREEN}✅ cargo-contract found${NC}"
fi

echo ""
echo "Validating contracts..."
echo ""

# Validate Stellar Soroban Contract
if [ -d "packages/contracts/stellar-soroban" ]; then
    echo "📦 Validating Stellar Soroban Contract..."
    cd packages/contracts/stellar-soroban
    
    if [ -f "Cargo.toml" ]; then
        echo "  - Checking Cargo.toml..."
        if cargo check --quiet 2>/dev/null; then
            echo -e "  ${GREEN}✅ Stellar contract compiles${NC}"
        else
            echo -e "  ${RED}❌ Stellar contract has compilation errors${NC}"
            cargo check
            exit 1
        fi
    else
        echo -e "  ${YELLOW}⚠️  Stellar contract directory exists but Cargo.toml not found${NC}"
    fi
    
    cd - > /dev/null
else
    echo -e "${YELLOW}⚠️  Stellar Soroban contract directory not found${NC}"
fi

# Validate Polkadot ink! Contract
if [ -d "packages/contracts/polkadot-ink" ]; then
    echo "📦 Validating Polkadot ink! Contract..."
    cd packages/contracts/polkadot-ink
    
    if [ -f "Cargo.toml" ]; then
        echo "  - Checking Cargo.toml..."
        if cargo contract check --quiet 2>/dev/null; then
            echo -e "  ${GREEN}✅ Polkadot contract compiles${NC}"
        else
            echo -e "  ${YELLOW}⚠️  Running cargo contract check (may take a moment)...${NC}"
            cargo contract check || {
                echo -e "  ${RED}❌ Polkadot contract has compilation errors${NC}"
                exit 1
            }
        fi
    else
        echo -e "  ${YELLOW}⚠️  Polkadot contract directory exists but Cargo.toml not found${NC}"
    fi
    
    cd - > /dev/null
else
    echo -e "${YELLOW}⚠️  Polkadot ink! contract directory not found${NC}"
fi

echo ""
echo -e "${GREEN}✅ Contract validation complete${NC}"
echo ""
echo "Next steps:"
echo "  1. Deploy contracts: npm run contracts:deploy"
echo "  2. Initialize contracts: npm run contracts:init"
echo "  3. Test contracts: npm run contracts:test"

