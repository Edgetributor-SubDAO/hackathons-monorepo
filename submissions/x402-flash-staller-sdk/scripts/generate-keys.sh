#!/bin/bash

# Generate Stellar keys and update .env file
# This script helps automate the key generation process

set -e

echo "🔑 x402-flash - Generate Stellar Keys"
echo "======================================"

# Check if stellar CLI is installed
if ! command -v stellar &> /dev/null; then
    echo "❌ Stellar CLI not found"
    echo "📦 Install it with: cargo install --locked stellar-cli --features opt"
    echo "📚 Or visit: https://developers.stellar.org/docs/tools/developer-tools"
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found in project root"
    echo "Run ./scripts/setup-demo.sh first"
    exit 1
fi

echo ""
echo "Checking/generating server keypair..."
if stellar keys address server &>/dev/null; then
    echo "ℹ️  Using existing server keys"
    SERVER_PUBLIC=$(stellar keys address server)
    SERVER_SECRET=$(stellar keys show server)
else
    stellar keys generate server --network testnet
    SERVER_PUBLIC=$(stellar keys address server)
    SERVER_SECRET=$(stellar keys show server)
    echo "✅ Server keys generated"
fi
echo "   Public: $SERVER_PUBLIC"

echo ""
echo "Checking/generating client keypair..."
if stellar keys address client &>/dev/null; then
    echo "ℹ️  Using existing client keys"
    CLIENT_PUBLIC=$(stellar keys address client)
    CLIENT_SECRET=$(stellar keys show client)
else
    stellar keys generate client --network testnet
    CLIENT_PUBLIC=$(stellar keys address client)
    CLIENT_SECRET=$(stellar keys show client)
    echo "✅ Client keys generated"
fi
echo "   Public: $CLIENT_PUBLIC"

echo ""
echo "📝 Updating .env file..."

# Update .env file
sed -i.bak "s|^SERVER_SECRET_KEY=.*|SERVER_SECRET_KEY=$SERVER_SECRET|" .env
sed -i.bak "s|^PAYMENT_ADDRESS=.*|PAYMENT_ADDRESS=$SERVER_PUBLIC|" .env
sed -i.bak "s|^CLIENT_SECRET_KEY=.*|CLIENT_SECRET_KEY=$CLIENT_SECRET|" .env

rm .env.bak

echo "✅ .env file updated"

# Update frontend .env
if [ -f "examples/demo-frontend/.env" ]; then
    echo ""
    echo "📝 Updating frontend .env file..."
    sed -i.bak "s|^VITE_SERVER_ADDRESS=.*|VITE_SERVER_ADDRESS=$SERVER_PUBLIC|" examples/demo-frontend/.env
    rm examples/demo-frontend/.env.bak
    echo "✅ Frontend .env updated"
fi

echo ""
echo "💰 Funding accounts on testnet..."
echo ""

# Fund server account
echo "Funding server account..."
curl -s "https://friendbot.stellar.org?addr=$SERVER_PUBLIC" > /dev/null && echo "✅ Server account funded" || echo "⚠️  Server funding failed"

# Fund client account
echo "Funding client account..."
curl -s "https://friendbot.stellar.org?addr=$CLIENT_PUBLIC" > /dev/null && echo "✅ Client account funded" || echo "⚠️  Client funding failed"

echo ""
echo "✨ Setup complete!"
echo ""
echo "📋 Keys saved to Stellar CLI:"
echo "   - Server: stellar keys show server"
echo "   - Client: stellar keys show client"
echo ""
echo "📋 Next steps:"
echo "   1. Deploy contract: npm run deploy:contract"
echo "   2. Update CONTRACT_ID in .env"
echo "   3. Start demo: npm run start:demo"
echo ""
echo "🔐 Keep your secret keys safe!"
