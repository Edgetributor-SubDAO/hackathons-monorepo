#!/bin/bash

echo "🚀 x402-Flash Demo Setup Helper"
echo "================================"
echo ""

# Check if .env files exist
if [ ! -f "examples/demo-api-server/.env" ]; then
    echo "📝 Creating API server .env file..."
    cp examples/demo-api-server/.env.example examples/demo-api-server/.env
fi

if [ ! -f "examples/demo-frontend/.env" ]; then
    echo "📝 Creating frontend .env file..."
    cp examples/demo-frontend/.env.example examples/demo-frontend/.env
fi

echo ""
echo "⚠️  IMPORTANT: You need to configure the following:"
echo ""
echo "1. API Server (.env file at examples/demo-api-server/.env):"
echo "   - CONTRACT_ID: Your deployed Soroban contract ID"
echo "   - SERVER_SECRET_KEY: Your Stellar server secret key"
echo "   - PAYMENT_ADDRESS: Your Stellar server public key"
echo ""
echo "2. Frontend (.env file at examples/demo-frontend/.env):"
echo "   - VITE_CONTRACT_ID: Same as API server CONTRACT_ID"
echo ""
echo "📋 Quick Setup Steps:"
echo ""
echo "1. Generate Stellar keys:"
echo "   stellar keys generate demo-server --network testnet"
echo ""
echo "2. Fund the account:"
echo "   stellar keys fund demo-server --network testnet"
echo ""
echo "3. Get your keys:"
echo "   stellar keys address demo-server    # This is your PAYMENT_ADDRESS"
echo "   stellar keys show demo-server       # This is your SERVER_SECRET_KEY"
echo ""
echo "4. Deploy the contract:"
echo "   cd contracts/x402-flash-settlement"
echo "   cargo build --target wasm32-unknown-unknown --release"
echo "   stellar contract deploy \\"
echo "     --wasm target/wasm32-unknown-unknown/release/x402_flash_settlement.wasm \\"
echo "     --network testnet \\"
echo "     --source demo-server"
echo ""
echo "5. Update both .env files with the values above"
echo ""
echo "6. Start the demo:"
echo "   # Terminal 1:"
echo "   cd examples/demo-api-server && npm run dev"
echo ""
echo "   # Terminal 2:"
echo "   cd examples/demo-frontend && npm run dev"
echo ""
echo "7. Open http://localhost:3000 in your browser"
echo ""
echo "✅ Setup helper complete!"
