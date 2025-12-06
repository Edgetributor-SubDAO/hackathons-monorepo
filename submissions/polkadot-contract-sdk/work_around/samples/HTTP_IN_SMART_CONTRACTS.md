# HTTP Calls in Smart Contracts - Complete Guide

## The Challenge

**Smart contracts cannot make HTTP calls directly** because:
1. **Determinism**: All nodes must execute the same code and get the same result
2. **Network calls are non-deterministic**: APIs can fail, timeout, or return different data
3. **Isolation**: Contract execution is isolated from external networks

## Solutions

### ✅ Solution 1: Client-Side WASM Execution (Recommended for Your SDK)

**How it works:**
- Deploy Python code as WASM to IPFS
- Contract stores IPFS hash (not the code)
- Client fetches WASM and executes **client-side**
- HTTP calls happen **client-side** (where they're allowed!)
- Results can be submitted back to contract

**Pros:**
- ✅ HTTP calls work (client-side)
- ✅ No gas costs for execution
- ✅ Unlimited code size (IPFS)
- ✅ Works with your existing SDK

**Cons:**
- ⚠️ Execution happens off-chain
- ⚠️ Results need to be submitted to contract separately

**Example:**

```python
# contract9_http_api.py
import requests

def fetch_weather_api(latitude, longitude):
    # This runs CLIENT-SIDE, not on-chain!
    response = requests.get(f"https://api.open-meteo.com/...")
    return response.json()
```

**Deploy:**
```bash
# Deploy as WASM
python deploy_wasm.py

# Execute with HTTP support
python samples/http_wasm_executor.py
```

---

### ✅ Solution 2: Chainlink Functions (Production Ready)

**How it works:**
- Decentralized oracle network
- Executes HTTP calls off-chain
- Multiple nodes verify results
- Results submitted on-chain

**Pros:**
- ✅ Decentralized and trustless
- ✅ Production-ready
- ✅ Multiple data sources
- ✅ Automatic execution

**Cons:**
- ⚠️ Requires Chainlink integration
- ⚠️ Costs LINK tokens
- ⚠️ More complex setup

**Example:**
```solidity
// Chainlink Functions contract
import "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";

contract WeatherContract is FunctionsClient {
    function requestWeatherData() public {
        // Chainlink executes HTTP call off-chain
        // Returns result on-chain
    }
}
```

---

### ✅ Solution 3: Substrate Off-Chain Workers (Polkadot Native)

**How it works:**
- Substrate runtime feature
- Off-chain workers can make HTTP calls
- Results submitted via transactions
- Built into Polkadot/Substrate

**Pros:**
- ✅ Native to Polkadot
- ✅ Decentralized execution
- ✅ No external dependencies

**Cons:**
- ⚠️ Only works on Substrate chains
- ⚠️ Requires runtime development
- ⚠️ Not available in EVM contracts

**Example:**
```rust
// Substrate off-chain worker
#[off_chain_worker]
fn offchain_worker(block_number: BlockNumber) {
    // Make HTTP call
    let response = fetch_weather_api();
    // Submit to chain
    submit_transaction(response);
}
```

---

### ✅ Solution 4: Hybrid Oracle Pattern (Current SDK Approach)

**How it works:**
- Off-chain oracle service (Python script)
- Fetches HTTP data
- Updates contract via transaction
- Can be automated (cron job)

**Pros:**
- ✅ Simple to implement
- ✅ Works with current SDK
- ✅ Full control

**Cons:**
- ⚠️ Centralized (single oracle)
- ⚠️ Requires running service
- ⚠️ Trust in oracle

**Example:**
```bash
# Your current approach
python samples/weather_oracle.py
```

---

## Comparison

| Solution | HTTP Calls | Decentralized | Gas Cost | Complexity |
|----------|-----------|---------------|----------|------------|
| Client-Side WASM | ✅ Yes | ⚠️ Partial | ✅ Free | 🟢 Easy |
| Chainlink Functions | ✅ Yes | ✅ Yes | ⚠️ LINK tokens | 🟡 Medium |
| Off-Chain Workers | ✅ Yes | ✅ Yes | ⚠️ Gas | 🔴 Hard |
| Oracle Pattern | ✅ Yes | ❌ No | ⚠️ Gas | 🟢 Easy |

---

## Recommended Approach for Your SDK

### For Development/Testing:
**Use Client-Side WASM** (`contract9_http_api.py`)

```bash
# 1. Create contract with HTTP calls
# (contract9_http_api.py)

# 2. Deploy as WASM
python deploy_wasm.py

# 3. Execute client-side (HTTP works!)
python samples/http_wasm_executor.py
```

### For Production:
**Use Chainlink Functions** or **Multiple Oracles**

---

## Implementation: Client-Side WASM with HTTP

### Step 1: Create Contract with HTTP Calls

```python
# contract9_http_api.py
import requests

def fetch_weather_api(latitude, longitude):
    api_url = f"https://api.open-meteo.com/v1/forecast?..."
    response = requests.get(api_url)
    return response.json()
```

### Step 2: Deploy as WASM

```bash
python deploy_wasm.py
```

This:
- Compiles Python to WASM
- Uploads to IPFS
- Deploys reference contract (stores IPFS hash)

### Step 3: Execute Client-Side

```bash
python samples/http_wasm_executor.py
```

This:
- Fetches WASM from IPFS
- Executes Python code **client-side**
- HTTP calls work! ✅
- Can submit results to contract

---

## Example Workflow

```bash
# 1. Create your contract with HTTP
cat > main.py << EOF
import requests

def fetch_weather(lat, lon):
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m"
    response = requests.get(url)
    data = response.json()
    return int(data['current']['temperature_2m'] * 10)
EOF

# 2. Deploy as WASM
python deploy_wasm.py

# 3. Execute with HTTP support
python samples/http_wasm_executor.py fetch_weather

# 4. Enter parameters when prompted
# Enter latitude: 52.52
# Enter longitude: 13.41

# 5. Result is fetched from API (client-side)!
# Submit to contract? (y/n): y
```

---

## Next Steps

1. ✅ Try `contract9_http_api.py` with WASM deployment
2. ✅ Use `http_wasm_executor.py` for client-side execution
3. 🔄 For production, consider Chainlink Functions
4. 🚀 Extend SDK to support Chainlink integration

---

## Summary

**Yes, you CAN make HTTP calls with your SDK!**

- ✅ Use **WASM + IPFS deployment** (`deploy_wasm.py`)
- ✅ Execute **client-side** where HTTP works
- ✅ Submit results to contract if needed
- ✅ No gas costs for HTTP execution
- ✅ Works with your existing code

The key is: **HTTP calls happen client-side, not on-chain!**

