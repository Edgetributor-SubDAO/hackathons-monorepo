#!/bin/bash
# Register parachain using sudo method (for rococo-local)

echo "=== Registering Parachain via Sudo ==="
echo ""

GENESIS_STATE=$(cat chains/genesis-state-hex.txt | sed 's/^0x//')
GENESIS_WASM=$(cat chains/genesis-wasm-hex.txt | sed 's/^0x//')

echo "ParaId: 2000"
echo "Genesis State (first 50 chars): ${GENESIS_STATE:0:50}..."
echo "Genesis WASM (first 50 chars): ${GENESIS_WASM:0:50}..."
echo ""
echo "Use this in Polkadot.js Apps → Developer → Sudo:"
echo ""
echo "Account: Alice"
echo "Pallet: parasSudoWrapper (or paras)"
echo "Call: sudoScheduleParaInitialize (or scheduleParaInitialize)"
echo "Parameters:"
echo "  id: 2000"
echo "  genesis: {"
echo "    genesisHead: \"$GENESIS_STATE\""
echo "    validationCode: \"$GENESIS_WASM\""
echo "  }"
