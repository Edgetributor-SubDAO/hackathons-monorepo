# Register Parachain via Sudo (rococo-local)

## Problem
The `registrar.reserve` extrinsic gets stuck in the transaction pool and never gets included on rococo-local.

## Solution: Use Sudo + parasSudoWrapper

### Step 1: Open Polkadot.js Apps
1. Go to: https://polkadot.js.org/apps
2. Connect to: `ws://127.0.0.1:9944` (relay chain)

### Step 2: Register via Sudo
1. Go to: **Developer → Sudo**
2. Select account: **Alice** (`5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY`)
3. Select pallet: **parasSudoWrapper** (or **paras** if parasSudoWrapper doesn't exist)
4. Select call: **sudoScheduleParaInitialize** (or **scheduleParaInitialize**)

### Step 3: Fill Parameters
- **id**: `2000`
- **genesis**: Click "+" to add object:
  - **genesisHead**: Paste from `chains/genesis-state-hex.txt` (remove `0x` prefix if present)
  - **validationCode**: Paste from `chains/genesis-wasm-hex.txt` (remove `0x` prefix if present)

### Step 4: Submit
1. Click "Submit Transaction"
2. Sign with Alice
3. Wait for "inBlock" and "finalized" status

### Step 5: Verify
1. Go to: **Network → Parachains**
2. You should see ParaId **2000** listed
3. Status should change from "Onboarding" to "Parachain"

## Alternative: If parasSudoWrapper doesn't exist

Try these pallets in order:
1. **paras** → **scheduleParaInitialize**
2. **parachainsSystem** → (look for initialize calls)
3. **sudo** → **sudo** → then select `paras.scheduleParaInitialize` as the call parameter

## Get Genesis Values
```bash
# Genesis State (remove 0x if present)
cat chains/genesis-state-hex.txt | sed 's/^0x//'

# Genesis WASM (remove 0x if present)
cat chains/genesis-wasm-hex.txt | sed 's/^0x//'
```
