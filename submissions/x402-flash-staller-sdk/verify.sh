#!/bin/bash

echo "🔍 x402-Flash SDK Verification"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check counters
checks_passed=0
checks_failed=0

# Function to check and report
check() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
        ((checks_passed++))
    else
        echo -e "${RED}❌ $2${NC}"
        ((checks_failed++))
    fi
}

echo "📦 Checking Dependencies..."
echo ""

# Check Node.js
node --version > /dev/null 2>&1
check $? "Node.js installed"

# Check NPM
npm --version > /dev/null 2>&1
check $? "NPM installed"

# Check Rust/Cargo
cargo --version > /dev/null 2>&1
check $? "Rust/Cargo installed"

# Check Stellar CLI
stellar --version > /dev/null 2>&1
check $? "Stellar CLI installed"

echo ""
echo "🏗️  Checking Project Structure..."
echo ""

# Check SDK directory
[ -d "sdk/typescript" ]
check $? "SDK directory exists"

# Check contract directory
[ -d "contracts/x402-flash-settlement" ]
check $? "Contract directory exists"

# Check examples
[ -d "examples/demo-api-server" ]
check $? "Demo API server exists"

[ -d "examples/demo-client" ]
check $? "Demo client exists"

echo ""
echo "📝 Checking Configuration Files..."
echo ""

# Check package.json files
[ -f "package.json" ]
check $? "Root package.json exists"

[ -f "sdk/typescript/package.json" ]
check $? "SDK package.json exists"

[ -f "sdk/typescript/tsconfig.json" ]
check $? "SDK tsconfig.json exists"

# Check contract files
[ -f "contracts/x402-flash-settlement/Cargo.toml" ]
check $? "Contract Cargo.toml exists"

[ -f "contracts/x402-flash-settlement/src/lib.rs" ]
check $? "Contract lib.rs exists"

echo ""
echo "🔨 Checking SDK Build..."
echo ""

# Check if SDK is built
[ -d "sdk/typescript/dist" ]
check $? "SDK dist directory exists"

[ -f "sdk/typescript/dist/index.js" ]
check $? "SDK index.js built"

[ -f "sdk/typescript/dist/index.d.ts" ]
check $? "SDK type definitions generated"

[ -f "sdk/typescript/dist/client.js" ]
check $? "Client implementation built"

[ -f "sdk/typescript/dist/server.js" ]
check $? "Server implementation built"

echo ""
echo "📚 Checking Documentation..."
echo ""

[ -f "README.md" ]
check $? "Root README.md exists"

[ -f "sdk/typescript/README.md" ]
check $? "SDK README.md exists"

[ -f "QUICKSTART.md" ]
check $? "Quick Start guide exists"

[ -f "sdk/SDK_IMPROVEMENTS.md" ]
check $? "SDK improvements doc exists"

echo ""
echo "🧪 Running Basic Tests..."
echo ""

# Test SDK can be imported
cd sdk/typescript
node -e "require('./dist/index.js')" > /dev/null 2>&1
check $? "SDK can be imported (CommonJS)"

# Test TypeScript compilation
npm run typecheck > /dev/null 2>&1
check $? "TypeScript compilation passes"

cd ../..

echo ""
echo "🎯 Environment Configuration..."
echo ""

if [ -f ".env" ]; then
    echo -e "${GREEN}✅ .env file exists${NC}"
    ((checks_passed++))
    
    # Check required vars
    if grep -q "CONTRACT_ID" .env; then
        echo -e "${GREEN}✅ CONTRACT_ID configured${NC}"
        ((checks_passed++))
    else
        echo -e "${YELLOW}⚠️  CONTRACT_ID not set in .env${NC}"
    fi
    
    if grep -q "SERVER_SECRET_KEY" .env; then
        echo -e "${GREEN}✅ SERVER_SECRET_KEY configured${NC}"
        ((checks_passed++))
    else
        echo -e "${YELLOW}⚠️  SERVER_SECRET_KEY not set in .env${NC}"
    fi
    
    if grep -q "CLIENT_SECRET_KEY" .env; then
        echo -e "${GREEN}✅ CLIENT_SECRET_KEY configured${NC}"
        ((checks_passed++))
    else
        echo -e "${YELLOW}⚠️  CLIENT_SECRET_KEY not set in .env${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  .env file not found (see .env.example)${NC}"
fi

echo ""
echo "================================"
echo "📊 Verification Summary"
echo "================================"
echo ""
echo -e "Checks passed: ${GREEN}${checks_passed}${NC}"
echo -e "Checks failed: ${RED}${checks_failed}${NC}"
echo ""

if [ $checks_failed -eq 0 ]; then
    echo -e "${GREEN}🎉 All checks passed!${NC}"
    echo ""
    echo "Your x402-Flash SDK is ready to use!"
    echo ""
    echo "Next steps:"
    echo "  1. Create .env file (if not done)"
    echo "  2. Deploy contract: ./scripts/deploy-simple.sh"
    echo "  3. Run demos: cd examples/demo-api-server && npm run dev"
    echo ""
    exit 0
else
    echo -e "${RED}⚠️  Some checks failed${NC}"
    echo ""
    echo "Please fix the issues above before proceeding."
    echo "See QUICKSTART.md for setup instructions."
    echo ""
    exit 1
fi
