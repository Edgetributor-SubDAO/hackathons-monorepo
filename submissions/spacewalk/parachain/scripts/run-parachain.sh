#!/bin/bash
# Script to run the Spacewalk parachain collator
# NOTE: This is a placeholder - the collator node needs to be built first

set -e

echo "🚀 Starting Spacewalk Parachain Collator..."

# Check if collator binary exists
COLLATOR_BIN="${COLLATOR_BIN:-./target/release/spacewalk-parachain-collator}"

if [ ! -f "$COLLATOR_BIN" ]; then
    echo "❌ Error: Collator binary not found at $COLLATOR_BIN"
    echo ""
    echo "To build the collator:"
    echo "  cargo build --release -p spacewalk-parachain-collator"
    echo ""
    echo "Or set COLLATOR_BIN to the path of your collator binary"
    exit 1
fi

# Relay chain connection
RELAY_WS="${RELAY_WS:-ws://127.0.0.1:9944}"
PARACHAIN_ID="${PARACHAIN_ID:-2000}"

# Create data directory
DATA_DIR="${DATA_DIR:-./parachain-data}"
mkdir -p "$DATA_DIR"

echo "📁 Using data directory: $DATA_DIR"
echo "🔗 Connecting to relay chain at: $RELAY_WS"
echo "🆔 Parachain ID: $PARACHAIN_ID"

# Start collator
exec "$COLLATOR_BIN" \
    --collator \
    --chain dev \
    --base-path "$DATA_DIR" \
    --port 30334 \
    --rpc-port 9933 \
    --ws-port 9946 \
    --rpc-cors all \
    --unsafe-rpc-external \
    --unsafe-ws-external \
    --parachain-id "$PARACHAIN_ID" \
    -- \
    --execution wasm \
    --chain rococo-local \
    --port 30335 \
    --rpc-port 9934 \
    --ws-port 9947 \
    "$@"

