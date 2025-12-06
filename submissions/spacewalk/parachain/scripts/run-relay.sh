#!/bin/bash
# Script to run a local relay chain (Polkadot/Rococo)
# This is a placeholder - you'll need to install/build polkadot binary

set -e

echo "🚀 Starting Relay Chain..."

# Check if polkadot binary exists
POLKADOT_BIN="${POLKADOT_BIN:-polkadot}"

if ! command -v "$POLKADOT_BIN" &> /dev/null; then
    echo "❌ Error: $POLKADOT_BIN not found"
    echo ""
    echo "To install polkadot:"
    echo "  cargo install --git https://github.com/paritytech/polkadot-sdk --tag v1.6.0 polkadot --locked"
    echo ""
    echo "Or set POLKADOT_BIN to the path of your polkadot binary"
    exit 1
fi

# Create data directory
DATA_DIR="${DATA_DIR:-./relay-data}"
mkdir -p "$DATA_DIR"

echo "📁 Using data directory: $DATA_DIR"
echo "🔗 Starting relay chain on port 9944..."

# Start relay chain
exec "$POLKADOT_BIN" \
    --chain rococo-local \
    --alice \
    --validator \
    --base-path "$DATA_DIR" \
    --port 30333 \
    --rpc-port 9944 \
    --ws-port 9945 \
    --rpc-cors all \
    --unsafe-rpc-external \
    --unsafe-ws-external \
    "$@"

