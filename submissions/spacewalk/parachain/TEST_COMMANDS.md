# Testing Commands for Spacewalk Parachain Runtime

## Quick Build & Check

```bash
# Build the runtime (with std features for WASM generation)
cargo build --release -p spacewalk-parachain-runtime --features std

# Quick check (faster, doesn't generate WASM)
cargo check -p spacewalk-parachain-runtime --features std

# Check for warnings only
cargo build --release -p spacewalk-parachain-runtime --features std 2>&1 | grep -E "^warning|^error"
```

## Verify WASM Binary Generation

```bash
# Check if WASM binary was generated
find target -name "*.wasm" -path "*/spacewalk-parachain-runtime/*"

# Check the build output directory
ls -lh target/release/wbuild/spacewalk-parachain-runtime/

# Verify OUT_DIR was set correctly
cargo build --release -p spacewalk-parachain-runtime --features std -v 2>&1 | grep OUT_DIR
```

## Run Tests

```bash
# Run all tests for the runtime
cargo test -p spacewalk-parachain-runtime --features std

# Run only unit tests
cargo test -p spacewalk-parachain-runtime --features std --lib

# Run with output
cargo test -p spacewalk-parachain-runtime --features std -- --nocapture
```

## Check for Specific Issues

```bash
# Check for RPC API signature errors
cargo build --release -p spacewalk-parachain-runtime --features std 2>&1 | grep -i "rpc\|api"

# Check for Config trait errors
cargo build --release -p spacewalk-parachain-runtime --features std 2>&1 | grep -i "config\|trait"

# Check for missing types
cargo build --release -p spacewalk-parachain-runtime --features std 2>&1 | grep -i "cannot find type\|not found"
```

## Clean Build (if needed)

```bash
# Clean and rebuild
cargo clean -p spacewalk-parachain-runtime
cargo build --release -p spacewalk-parachain-runtime --features std
```

## Expected Results

✅ **Success indicators:**
- Build completes with exit code 0
- WASM binary generated in `target/release/wbuild/spacewalk-parachain-runtime/`
- No compilation errors
- Only warnings (if any) are about unused imports or similar

❌ **Failure indicators:**
- Compilation errors (check error messages)
- Missing WASM binary
- OUT_DIR errors (should be fixed with build.rs)

## Next Steps After Successful Build

1. **Test the collator node** (when ready):
   ```bash
   cargo build --release -p spacewalk-parachain-collator
   ```

2. **Generate chain spec**:
   ```bash
   ./target/release/spacewalk-parachain-collator build-spec --dev > parachain-spec.json
   ```

3. **Run the collator** (requires relay chain):
   ```bash
   ./target/release/spacewalk-parachain-collator --dev --collator
   ```

