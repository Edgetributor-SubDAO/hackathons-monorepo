#!/bin/bash
set -e

echo "🚀 Deploying Polkadot Minimal Contract to local substrate-contracts-node"
echo ""

# Check if substrate-contracts-node is running
if ! nc -z 127.0.0.1 9944 2>/dev/null; then
    echo "❌ Error: substrate-contracts-node is not running on port 9944"
    echo ""
    echo "Start it with:"
    echo "  substrate-contracts-node --dev --tmp"
    echo ""
    exit 1
fi

cd "$(dirname "$0")/../contracts/polkadot_minimal"

echo "📦 Building contract..."
cargo contract build --release

echo ""
echo "⬆️  Uploading and instantiating contract..."
OUTPUT=$(cargo contract instantiate \
    --constructor new \
    --suri //Alice \
    --url ws://127.0.0.1:9944 \
    --execute \
    --skip-confirm 2>&1)

echo "$OUTPUT"

# Extract contract address from output
CONTRACT_ADDRESS=$(echo "$OUTPUT" | grep -oP 'Contract\s+\K5[a-zA-Z0-9]+' | head -1)

if [ -n "$CONTRACT_ADDRESS" ]; then
    echo ""
    echo "✅ Contract deployed successfully!"
    echo "📍 Contract Address: $CONTRACT_ADDRESS"
    
    # Update .env file
    ENV_FILE="$(dirname "$0")/../.env"
    if [ -f "$ENV_FILE" ]; then
        sed -i "s|POLKADOT_CONTRACT_ADDRESS=.*|POLKADOT_CONTRACT_ADDRESS=$CONTRACT_ADDRESS|" "$ENV_FILE"
        echo "💾 Updated .env file"
    fi
    
    echo ""
    echo "🧪 Testing contract..."
    cargo contract call \
        --contract "$CONTRACT_ADDRESS" \
        --message increment \
        --suri //Alice \
        --url ws://127.0.0.1:9944 \
        --execute \
        --skip-confirm
    
    echo ""
    echo "📊 Getting counter value..."
    cargo contract call \
        --contract "$CONTRACT_ADDRESS" \
        --message get_count \
        --suri //Alice \
        --url ws://127.0.0.1:9944 \
        --dry-run
else
    echo ""
    echo "❌ Failed to extract contract address"
    exit 1
fi
