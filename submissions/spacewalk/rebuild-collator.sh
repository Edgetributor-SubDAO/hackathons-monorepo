#!/bin/bash
set -e

echo "🔨 Rebuilding Spacewalk Parachain Collator with export-genesis commands..."

cd /home/milan/stellar2polka/spacewalk

# Clean previous build
echo "🧹 Cleaning previous build..."
cargo clean --manifest-path config/Cargo.toml -p spacewalk-parachain-collator

# Build with release
echo "🔨 Building collator (this may take a while)..."
cargo build --manifest-path config/Cargo.toml --release -p spacewalk-parachain-collator

# Verify the commands exist
echo ""
echo "✅ Build complete! Verifying commands..."
if ./target/release/spacewalk-parachain-collator export-genesis-state --help &>/dev/null; then
    echo "✅ export-genesis-state command works!"
else
    echo "❌ export-genesis-state command failed - checking for compilation errors..."
    ./target/release/spacewalk-parachain-collator --help | grep -i genesis || echo "Command not found in help"
fi

if ./target/release/spacewalk-parachain-collator export-genesis-wasm --help &>/dev/null; then
    echo "✅ export-genesis-wasm command works!"
else
    echo "❌ export-genesis-wasm command failed"
fi

echo ""
echo "📋 Available export commands:"
./target/release/spacewalk-parachain-collator --help | grep -E "(export|genesis)" || echo "No export/genesis commands found"

