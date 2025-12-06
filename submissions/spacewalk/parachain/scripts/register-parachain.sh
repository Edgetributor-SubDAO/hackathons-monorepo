#!/bin/bash
# Script to register the parachain with the relay chain
# NOTE: This requires polkadot-js-cli and a running relay chain

set -e

echo "📝 Registering Parachain with Relay Chain..."

# Check dependencies
if ! command -v polkadot-js-api &> /dev/null; then
    echo "❌ Error: polkadot-js-api not found"
    echo ""
    echo "Install with: npm install -g @polkadot/api-cli"
    exit 1
fi

RELAY_WS="${RELAY_WS:-ws://127.0.0.1:9944}"
PARACHAIN_ID="${PARACHAIN_ID:-2000}"
COLLATOR_BIN="${COLLATOR_BIN:-./target/release/spacewalk-parachain-collator}"

if [ ! -f "$COLLATOR_BIN" ]; then
    echo "❌ Error: Collator binary not found at $COLLATOR_BIN"
    exit 1
fi

echo "🔗 Relay chain: $RELAY_WS"
echo "🆔 Parachain ID: $PARACHAIN_ID"

# Generate genesis state and wasm
echo "📦 Generating genesis state..."
GENESIS_STATE=$(./target/release/spacewalk-parachain-collator export-genesis-state --chain dev 2>/dev/null)
GENESIS_WASM=$(./target/release/spacewalk-parachain-collator export-genesis-wasm --chain dev 2>/dev/null)

echo "✅ Genesis state generated"
echo ""
echo "⚠️  Manual registration required:"
echo ""
echo "1. Connect to relay chain at: $RELAY_WS"
echo "2. Use sudo or governance to register parachain:"
echo "   - Parachain ID: $PARACHAIN_ID"
echo "   - Genesis State: $GENESIS_STATE"
echo "   - Genesis WASM: $GENESIS_WASM"
echo ""
echo "Example command (requires sudo account):"
echo "  polkadot-js-api tx.registrar.registerPara \\"
echo "    $PARACHAIN_ID \\"
echo "    { \"genesisHead\": \"$GENESIS_STATE\", \"validationCode\": \"$GENESIS_WASM\" } \\"
echo "    --seed //Alice --ws $RELAY_WS"

