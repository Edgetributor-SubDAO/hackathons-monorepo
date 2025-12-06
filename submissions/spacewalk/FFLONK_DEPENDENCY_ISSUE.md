# FFLONK Dependency Issue

## Problem
Building the collator with Cumulus dependencies fails with:
```
error: no matching package named `fflonk` found
location searched: Git repository https://github.com/w3f/fflonk
required by package `bandersnatch_vrfs v0.0.4`
```

## Root Cause
This is a transitive dependency issue:
- `spacewalk-parachain-collator` → `sp-core` (from polkadot-sdk)
- `sp-core` → `bandersnatch_vrfs` (from w3f/ring-vrf)
- `bandersnatch_vrfs` → `fflonk` (from w3f/fflonk)

The `fflonk` repository exists but Cargo cannot find a package named `fflonk` in it. This is likely because:
1. The repository structure doesn't match Cargo's expectations
2. The package name in the repository's Cargo.toml is different
3. The repository is missing a Cargo.toml at the root

## Current Status
- ✅ Cumulus dependencies added to `parachain/node/Cargo.toml`
- ✅ Workspace root `Cargo.toml` created
- ✅ Service code updated for Cumulus integration
- ❌ Build blocked by `fflonk` dependency issue

## Workarounds

### Option 1: Wait and Retry
The repository might be temporarily unavailable or the issue might resolve itself:
```bash
cd /home/milan/stellar2polka/spacewalk
cargo build --release -p spacewalk-parachain-collator
```

### Option 2: Use Existing Binary (Limited Functionality)
The existing binary at `target/release/spacewalk-parachain-collator` was built before Cumulus integration. It can run in standalone mode but **cannot connect to relay chain**.

### Option 3: Try Different Polkadot SDK Version
Try a different branch or tag that might not have this dependency:
```bash
# In parachain/node/Cargo.toml, try:
# branch = "release-polkadot-v1.5.0" or another version
```

### Option 4: Manual fflonk Fix
If you have access to fix the w3f/fflonk repository structure, that would resolve the issue for everyone.

## Next Steps
1. Monitor the w3f/fflonk repository for fixes
2. Check polkadot-sdk issues for known workarounds
3. Consider using a different polkadot-sdk version if available
4. Once resolved, rebuild with: `cargo build --release -p spacewalk-parachain-collator`

## Related Links
- w3f/fflonk: https://github.com/w3f/fflonk
- w3f/ring-vrf: https://github.com/w3f/ring-vrf
- polkadot-sdk: https://github.com/paritytech/polkadot-sdk

