#!/bin/bash
set -e

echo "🚀 Deploying Complete Polkadot Bridge Contract with ZK Verification"
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

cd "$(dirname "$0")/../contracts/polkadot"

# Create a temporary Cargo project for the complete bridge
TEMP_DIR=$(mktemp -d)
cp polkadot_bridge_complete.rs "$TEMP_DIR/lib.rs"

# Create Cargo.toml for the complete contract
cat > "$TEMP_DIR/Cargo.toml" << 'EOF'
[package]
name = "polkadot_bridge_complete"
version = "0.1.0"
edition = "2021"
authors = ["Insidr Team"]

[dependencies]
ink = { version = "5.0", default-features = false }

[dev-dependencies]
ink_e2e = "5.0"

[lib]
path = "lib.rs"

[features]
default = ["std"]
std = [
    "ink/std",
]
ink-as-dependency = []
EOF

echo "📦 Building Polkadot bridge contract..."
cd "$TEMP_DIR"
cargo contract build --release

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    rm -rf "$TEMP_DIR"
    exit 1
fi

echo "✅ Contract built successfully"
echo ""

echo "⬆️  Uploading and instantiating contract..."
OUTPUT=$(cargo contract instantiate \
    --constructor new \
    --args 1000000 30 \
    --suri //Alice \
    --url ws://127.0.0.1:9944 \
    --execute \
    --skip-confirm 2>&1)

echo "$OUTPUT"

# Extract contract address
CONTRACT_ADDRESS=$(echo "$OUTPUT" | grep -oP 'Contract\s+\K5[a-zA-Z0-9]+' | head -1)

if [ -n "$CONTRACT_ADDRESS" ]; then
    echo ""
    echo "✅ Contract deployed successfully!"
    echo "📍 Contract Address: $CONTRACT_ADDRESS"
    
    # Update .env file
    ENV_FILE="$(dirname "$0")/../.env"
    if [ -f "$ENV_FILE" ]; then
        sed -i "s|POLKADOT_BRIDGE_CONTRACT=.*|POLKADOT_BRIDGE_CONTRACT=$CONTRACT_ADDRESS|" "$ENV_FILE"
        echo "💾 Updated .env file"
    fi
    
    echo ""
    echo "📊 Testing contract functions..."
    
    # Get total minted
    echo "   Querying total minted..."
    cargo contract call \
        --contract "$CONTRACT_ADDRESS" \
        --message get_total_minted \
        --suri //Alice \
        --url ws://127.0.0.1:9944 \
        --dry-run
    
    # Get owner
    echo "   Querying owner..."
    cargo contract call \
        --contract "$CONTRACT_ADDRESS" \
        --message get_owner \
        --suri //Alice \
        --url ws://127.0.0.1:9944 \
        --dry-run
    
    echo ""
    echo "🎉 Deployment complete!"
    echo ""
    echo "Contract Details:"
    echo "  Contract Address: $CONTRACT_ADDRESS"
    echo "  Network: Local Substrate Node (ws://127.0.0.1:9944)"
    echo "  Min Mint Amount: 1000000"
    echo "  Relayer Fee: 30 basis points (0.3%)"
    echo ""
    echo "Next steps:"
    echo "  1. Update Flutter app with contract address"
    echo "  2. Test verify_and_mint with ZK proof"
    echo "  3. Test burn_and_bridge function"
else
    echo ""
    echo "❌ Failed to extract contract address"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# Cleanup
rm -rf "$TEMP_DIR"
