# Spacewalk Parachain Collator - Run Commands

## Quick Start Commands

### 1. Verify Binary Exists
```bash
# Check if the collator binary was built successfully
ls -lh target/release/spacewalk-parachain-collator

# Check version/help
./target/release/spacewalk-parachain-collator --version
./target/release/spacewalk-parachain-collator --help
```

### 2. Generate Chain Specification
```bash
# Generate development chain spec (JSON format)
./target/release/spacewalk-parachain-collator build-spec --dev > parachain-spec-dev.json

# Generate raw chain spec (for actual deployment)
./target/release/spacewalk-parachain-collator build-spec --dev --raw > parachain-spec-dev-raw.json

# View the generated spec
cat parachain-spec-dev.json | jq .
```

### 3. Run Collator in Development Mode

#### Basic Dev Mode (Standalone - No Relay Chain)
```bash
# Run in dev mode with temporary chain state
./target/release/spacewalk-parachain-collator --dev

# Run with custom base path
./target/release/spacewalk-parachain-collator --dev --base-path ./data/parachain

# Run with RPC enabled (for Polkadot.js Apps)
./target/release/spacewalk-parachain-collator --dev --rpc-external --ws-external

# Run with telemetry
./target/release/spacewalk-parachain-collator --dev --telemetry-url "wss://telemetry.polkadot.io/submit/ 0"
```

#### With Logging
```bash
# Run with debug logging for specific modules
RUST_LOG=debug ./target/release/spacewalk-parachain-collator --dev

# Run with info level logging
RUST_LOG=info ./target/release/spacewalk-parachain-collator --dev

# Run with specific module logging
RUST_LOG=spacewalk_parachain_runtime=debug,sc_service=info ./target/release/spacewalk-parachain-collator --dev
```

### 4. Connect to Polkadot.js Apps

Once running with `--rpc-external --ws-external`, connect to:
- **Local WebSocket**: `ws://127.0.0.1:9944`
- **Local HTTP RPC**: `http://127.0.0.1:9933`

Or use Polkadot.js Apps:
1. Open https://polkadot.js.org/apps/
2. Click the network selector (top left)
3. Select "Custom Endpoint"
4. Enter: `ws://127.0.0.1:9944`
5. Click "Switch"

### 5. Check Node Status

```bash
# In another terminal, check if node is running
curl -H "Content-Type: application/json" -d '{"id":1, "jsonrpc":"2.0", "method": "system_health"}' http://localhost:9933

# Get chain info
curl -H "Content-Type: application/json" -d '{"id":1, "jsonrpc":"2.0", "method": "system_chain"}' http://localhost:9933

# Get node name and version
curl -H "Content-Type: application/json" -d '{"id":1, "jsonrpc":"2.0", "method": "system_name"}' http://localhost:9933
curl -H "Content-Type: application/json" -d '{"id":1, "jsonrpc":"2.0", "method": "system_version"}' http://localhost:9933
```

### 6. Purge Chain Data (Start Fresh)

```bash
# Remove all chain data (use with caution!)
./target/release/spacewalk-parachain-collator purge-chain --dev

# Remove chain data from specific base path
./target/release/spacewalk-parachain-collator purge-chain --dev --base-path ./data/parachain
```

### 7. Export/Import Blocks

```bash
# Export blocks to JSON
./target/release/spacewalk-parachain-collator export-blocks --dev --pruning archive > blocks.json

# Import blocks from JSON
./target/release/spacewalk-parachain-collator import-blocks --dev blocks.json
```

### 8. Key Management

```bash
# Generate a new account key
./target/release/spacewalk-parachain-collator key generate --scheme sr25519

# Generate a session key
./target/release/spacewalk-parachain-collator key generate --scheme sr25519 --password-interactive

# Insert a key into the keystore
./target/release/spacewalk-parachain-collator key insert --dev --key-type aura --scheme sr25519
```

## Advanced: Running with Relay Chain (Future)

Once you set up a local relay chain, you can run the collator connected to it:

```bash
# Run collator connected to relay chain
./target/release/spacewalk-parachain-collator \
  --collator \
  --chain parachain-spec-dev-raw.json \
  --base-path ./data/parachain \
  --port 30333 \
  --ws-port 9944 \
  --rpc-port 9933 \
  -- \
  --execution wasm \
  --chain <relay-chain-spec> \
  --port 30334 \
  --ws-port 9945 \
  --rpc-port 9934
```

## Troubleshooting

### Check if Ports are Available
```bash
# Check if ports 9944, 9933, 30333 are in use
netstat -tuln | grep -E ':(9944|9933|30333)'

# Or use ss
ss -tuln | grep -E ':(9944|9933|30333)'
```

### View Logs
```bash
# If running in background, view logs
tail -f chain.log

# Or run with output to file
./target/release/spacewalk-parachain-collator --dev 2>&1 | tee chain.log
```

### Common Issues

1. **Port already in use**: Change ports with `--port`, `--ws-port`, `--rpc-port`
2. **Database locked**: Stop any running instances or use different `--base-path`
3. **WASM binary missing**: Rebuild runtime: `cargo build --release -p spacewalk-parachain-runtime`

## Expected Output

When running successfully, you should see:
```
2024-12-05 08:05:00 Spacewalk Parachain Collator
2024-12-05 08:05:00 ✨ Hardware generation: UNKNOWN
2024-12-05 08:05:00 📦 Chain specification: Development
2024-12-05 08:05:00 🏷  Node name: ...
2024-12-05 08:05:00 👤 Role: AUTHORITY
2024-12-05 08:05:00 💾 Database: RocksDb at ...
2024-12-05 08:05:00 ⛓  Native runtime: spacewalk-parachain-1.0.18
2024-12-05 08:05:00 🔨 Initializing Genesis block/state (State: 0x...)
2024-12-05 08:05:00 Using default protocol ID "sup" because none is configured in chain spec
2024-12-05 08:05:00 🏷 Local node identity is: ...
2024-12-05 08:05:00 📦 Highest known block at #0
2024-12-05 08:05:00 〽️  Prometheus exporter started at 127.0.0.1:9615
2024-12-05 08:05:00 Listening for new connections on 127.0.0.1:9944.
```

