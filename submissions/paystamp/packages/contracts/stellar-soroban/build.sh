#!/bin/bash

# Build script for PayStamp Soroban Contract
# Generates the WASM file from Rust source code

set -e

echo "🔨 Building PayStamp Soroban Contract..."
echo ""

# Check if Rust is installed
if ! command -v rustc &> /dev/null; then
    echo "❌ Rust is not installed"
    echo "Install Rust: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    exit 1
fi

# Check if WASM target is installed
if ! rustup target list --installed | grep -q "wasm32-unknown-unknown"; then
    echo "📦 Installing wasm32-unknown-unknown target..."
    rustup target add wasm32-unknown-unknown
fi

# Build the contract
echo "🔨 Compiling contract..."
cargo build --target wasm32-unknown-unknown --release

# Check if WASM file was created
WASM_FILE="target/wasm32-unknown-unknown/release/paystamp_soroban.wasm"
if [ -f "$WASM_FILE" ]; then
    SIZE=$(ls -lh "$WASM_FILE" | awk '{print $5}')
    echo ""
    echo "✅ Build successful!"
    echo "📦 WASM file: $WASM_FILE"
    echo "📊 Size: $SIZE"
    echo ""
    echo "Next steps:"
    echo "  1. Deploy: make deploy-futurenet SECRET_KEY=<your_key>"
    echo "  2. Or manually: soroban contract deploy --network futurenet --source <key> --wasm $WASM_FILE"
else
    echo "❌ Build failed - WASM file not found"
    exit 1
fi

