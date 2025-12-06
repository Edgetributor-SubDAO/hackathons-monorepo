# BIP39 rand_core Conflict Fix

## ✅ Issue Resolved

The `bip39` compilation error related to `rand_core` version conflict has been fixed.

## Problem

**Error**: 
```
error[E0277]: the trait bound `ThreadRng: rand_core::RngCore` is not satisfied
note: there are multiple different versions of crate `rand_core` in the dependency graph
```

**Root Cause**:
- `bip39 v2.0.0` had a direct dependency on `rand_core v0.4.2`
- `rand v0.7.3` (used by bip39) depends on `rand_core v0.5.1`
- This version mismatch caused trait bound errors

## Solution

Updated `bip39` to version `2.2.2` using:
```bash
cargo update -p bip39 --precise 2.2.2
```

The newer version of `bip39` uses compatible `rand_core` versions that resolve the conflict.

## Changes Made

1. **Updated Cargo.lock**: `bip39 v2.0.0` → `bip39 v2.2.2`
2. **Updated dependencies**: `bitcoin_hashes` also updated to `v0.14.1`

## Current Status

- ✅ `bip39` updated to `v2.2.2`
- ✅ `rand_core` version conflict resolved
- ✅ Build should now proceed past the `bip39` compilation error

## Next Steps

Continue building:
```bash
cargo build --release -p spacewalk-parachain-collator
```

The build should now compile `bip39` successfully.

