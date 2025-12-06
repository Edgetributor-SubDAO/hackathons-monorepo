#!/bin/bash

# Verify WASM file after build

WASM_FILE="target/wasm32-unknown-unknown/release/paystamp_soroban.wasm"

if [ ! -f "$WASM_FILE" ]; then
    echo "❌ WASM file not found: $WASM_FILE"
    echo "Run 'make build' first"
    exit 1
fi

echo "✅ WASM file found: $WASM_FILE"
echo ""

# File size
SIZE=$(ls -lh "$WASM_FILE" | awk '{print $5}')
echo "📊 Size: $SIZE"

# File type
echo "📄 Type: $(file "$WASM_FILE" | cut -d: -f2)"

# Check if it's valid WASM (basic check)
if command -v wasm-objdump &> /dev/null; then
    echo ""
    echo "🔍 WASM structure:"
    wasm-objdump -h "$WASM_FILE" 2>/dev/null || echo "   (wasm-objdump not available)"
fi

echo ""
echo "✅ WASM file is ready for deployment!"

