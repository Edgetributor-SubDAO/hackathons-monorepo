#!/bin/bash
set -e

echo "🚀 Deploying Complete Polkadot Bridge Contract to Paseo Testnet"
echo "📍 Target: Paseo Asset Hub (Parachain 1000) - Contracts-enabled parachain"
echo ""

# Load environment variables
ENV_FILE="$(dirname "$0")/../.env"
if [ -f "$ENV_FILE" ]; then
    source "$ENV_FILE"
else
    echo "❌ Error: .env file not found at $ENV_FILE"
    exit 1
fi

# Check if mnemonic is set
if [ -z "$POLKADOT_MNEMONIC" ]; then
    echo "❌ Error: POLKADOT_MNEMONIC not set in .env"
    exit 1
fi

cd "$(dirname "$0")/../contracts/polkadot"

# Create a temporary Cargo project for the complete bridge
TEMP_DIR=$(mktemp -d)
echo "📁 Creating temporary build directory: $TEMP_DIR"
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

echo ""
echo "📤 Uploading contract to Paseo testnet..."
echo "This will require PAS tokens for gas fees."
echo ""

# Upload the contract code
echo "⚠️  Note: Paseo testnet may not have contracts parachain fully enabled yet."
echo "Attempting to upload to Paseo relay chain..."
UPLOAD_OUTPUT=$(cargo contract upload \
    --suri "$POLKADOT_MNEMONIC" \
    --url wss://paseo.rpc.amforc.com \
    --skip-confirm \
    target/ink/polkadot_bridge_complete.wasm 2>&1)

echo "$UPLOAD_OUTPUT"

# Extract code hash from output
CODE_HASH=$(echo "$UPLOAD_OUTPUT" | grep -oP 'Code hash\s+\K0x[a-fA-F0-9]+' || echo "")

if [ -z "$CODE_HASH" ]; then
    echo "❌ Error: Could not extract code hash from upload output"
    echo "Please check if you have sufficient WND tokens in account: $POLKADOT_ADDRESS"
    exit 1
fi

echo ""
echo "✅ Contract code uploaded successfully!"
echo "Code Hash: $CODE_HASH"
echo ""

# Instantiate the contract
echo "📝 Instantiating contract..."
INSTANTIATE_OUTPUT=$(cargo contract instantiate \
    --suri "$POLKADOT_MNEMONIC" \
    --url wss://paseo.rpc.amforc.com \
    --constructor new \
    --args "$POLKADOT_ADDRESS" \
    --skip-confirm \
    --value 0 \
    $CODE_HASH 2>&1)

echo "$INSTANTIATE_OUTPUT"

# Extract contract address from output
CONTRACT_ADDRESS=$(echo "$INSTANTIATE_OUTPUT" | grep -oP 'Contract\s+\K5[a-zA-Z0-9]+' || echo "")

if [ -z "$CONTRACT_ADDRESS" ]; then
    echo "❌ Error: Could not extract contract address from instantiation output"
    exit 1
fi

echo ""
echo "✅ Contract instantiated successfully!"
echo "Contract Address: $CONTRACT_ADDRESS"
echo ""

# Update .env file with the new contract address
ENV_FILE="$(dirname "$0")/../.env"
if grep -q "POLKADOT_BRIDGE_CONTRACT=" "$ENV_FILE"; then
    sed -i "s|POLKADOT_BRIDGE_CONTRACT=.*|POLKADOT_BRIDGE_CONTRACT=$CONTRACT_ADDRESS|" "$ENV_FILE"
else
    echo "POLKADOT_BRIDGE_CONTRACT=$CONTRACT_ADDRESS" >> "$ENV_FILE"
fi

# Cleanup
rm -rf "$TEMP_DIR"

echo "✅ Deployment Complete!"
echo ""
echo "📋 Contract Details:"
echo "  Network: Paseo Testnet"
echo "  Code Hash: $CODE_HASH"
echo "  Contract Address: $CONTRACT_ADDRESS"
echo "  Explorer: https://paseo.subscan.io/account/$CONTRACT_ADDRESS"
echo ""
echo "Updated .env with POLKADOT_BRIDGE_CONTRACT"
