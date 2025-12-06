# Register Parachain via Polkadot.js Apps UI

## Step 1: Open Polkadot.js Apps
1. Go to: https://polkadot.js.org/apps
2. Click the network selector (top left)
3. Select "Custom endpoint"
4. Enter: `ws://127.0.0.1:9944`
5. Click "Switch"

## Step 2: Navigate to Extrinsics
1. Go to: **Developer** → **Extrinsics**

## Step 3: Fill in the Transaction
1. **Select account**: `Alice` (or `//Alice`)
2. **Select pallet**: `registrar` (if not visible, use `sudo`)
3. **Select call**: 
   - If using `registrar`: `registerPara`
   - If using `sudo`: `sudo` or `sudoUncheckedWeight`, then in the call parameter select `registrar.registerPara`

## Step 4: Set Parameters

### If using `registrar.registerPara` directly:
- **id**: `2000`
- **genesis**: Click the "+" button to add an object, then:
  - **genesisHead**: Paste the value from `chains/genesis-state-hex.txt`
  - **validationCode**: Paste the value from `chains/genesis-wasm-hex.txt`

### If using `sudo`:
- **call**: Click "+" and select `registrar.registerPara`
- Then set the same parameters as above

## Step 5: Submit
1. Click "Submit Transaction"
2. Sign with Alice's account
3. Wait for confirmation

## Files Generated:
- `chains/spacewalk-genesis-state.raw` - Genesis state hex
- `chains/spacewalk-genesis-wasm.raw` - Genesis WASM hex
- `chains/genesis-state-hex.txt` - Same as above (for easy copying)
- `chains/genesis-wasm-hex.txt` - Same as above (for easy copying)

## Quick Copy Commands:
```bash
# Copy genesis state to clipboard (if xclip is installed)
cat chains/genesis-state-hex.txt | xclip -selection clipboard

# Copy genesis WASM to clipboard
cat chains/genesis-wasm-hex.txt | xclip -selection clipboard
```

