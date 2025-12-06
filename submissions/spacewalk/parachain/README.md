# Spacewalk Parachain Setup

This directory contains the foundation for a custom Spacewalk parachain that integrates all Spacewalk pallets and connects to a relay chain.

## 📁 Structure

```
parachain/
├── node/              # Collator node (TODO: needs to be created)
│   ├── Cargo.toml
│   └── src/
├── runtime/           # Parachain runtime
│   ├── Cargo.toml
│   └── src/
│       └── lib.rs     # Runtime with Spacewalk pallets (with TODOs)
└── scripts/
    ├── run-relay.sh           # Start local relay chain
    ├── run-parachain.sh       # Start parachain collator
    └── register-parachain.sh  # Register parachain with relay chain
```

## ✅ What's Complete

1. **Parachain Runtime Structure** (`parachain/runtime/`)
   - ✅ Cargo.toml with all Spacewalk pallets and Cumulus dependencies
   - ✅ Runtime lib.rs with all Spacewalk pallets integrated
   - ✅ All pallet configurations from testnet runtime
   - ✅ Runtime APIs for Spacewalk pallets

2. **Scripts** (`parachain/scripts/`)
   - ✅ `run-relay.sh` - Start local relay chain
   - ✅ `run-parachain.sh` - Start parachain collator
   - ✅ `register-parachain.sh` - Register parachain with relay chain

3. **Workspace Integration**
   - ✅ Added `parachain/runtime` to root `Cargo.toml`

## ⚠️ What Needs to Be Done

### 1. Complete XCM Configuration (Partially Done)

The XCM configuration in `parachain/runtime/src/lib.rs` is partially implemented but needs refinement:

- ✅ Parachain System pallet configured
- ✅ XCMP Queue configured  
- ✅ Basic XCM pallet configured
- ⚠️ XCM Executor configuration is simplified - needs full implementation with:
  - AssetTransactor (for handling asset transfers)
  - IsReserve (for identifying reserve locations)
  - IsTeleporter (for teleporting assets)
  - Barrier (for filtering XCM messages)
  - Weigher (for calculating XCM execution weights)

**Note**: The current XCM configuration is a placeholder. For production use, you'll need to implement a full XCM executor configuration based on your asset requirements.

### 2. Additional Runtime Configuration Needed

#### a. Parachain System Pallet
```rust
// TODO: Add cumulus_pallet_parachain_system::Config
impl cumulus_pallet_parachain_system::Config for Runtime {
    type RuntimeEvent = RuntimeEvent;
    type OnSystemEvent = ();
    type SelfParaId = parachain_info::Pallet<Runtime>;
    type OutboundXcmpMessageSource = XcmpQueue;
    type DmpMessageHandler = DmpQueue;
    type ReservedDmpWeight = ReservedDmpWeight;
    type XcmpMessageHandler = XcmpQueue;
    type ReservedXcmpWeight = ReservedXcmpWeight;
    type CheckAssociatedRelayNumber = RelayNumberStrictlyIncreases;
    type ConsensusHook = /* ... */;
    type WeightInfo = /* ... */;
}
```

#### b. XCMP Queue Configuration
```rust
// TODO: Add cumulus_pallet_xcmp_queue::Config
impl cumulus_pallet_xcmp_queue::Config for Runtime {
    type RuntimeEvent = RuntimeEvent;
    type XcmExecutor = XcmExecutor<XcmConfig>;
    type ChannelInfo = ParachainSystem;
    type VersionWrapper = PolkadotXcm;
    type ExecuteOverweightOrigin = EnsureRoot<AccountId>;
    type ControllerOrigin = EnsureRoot<AccountId>;
    type ControllerOriginConverter = XcmOriginToTransactDispatchOrigin;
    type WeightInfo = /* ... */;
}
```

#### c. XCM Configuration
```rust
// TODO: Add XCM executor and router
pub type XcmExecutor = xcm_executor::XcmExecutor<XcmConfig>;
pub type XcmRouter = (
    cumulus_primitives_utility::ParentAsUmp<ParachainSystem, ()>,
    XcmpQueue,
);
```

#### d. Add Parachain Pallets to construct_runtime!
```rust
construct_runtime! {
    pub enum Runtime {
        // ... existing pallets ...
        
        // TODO: Add these
        ParachainSystem: cumulus_pallet_parachain_system = 20,
        XcmpQueue: cumulus_pallet_xcmp_queue = 30,
        PolkadotXcm: pallet_xcm = 31,
    }
}
```

### 2. Create Collator Node

The collator node (`parachain/node/`) needs to be created. This is a complex task that requires:

- **Cargo.toml**: Based on `testchain/node/Cargo.toml` but with Cumulus dependencies
- **main.rs**: Collator entry point
- **chain_spec.rs**: Parachain genesis configuration
- **service.rs**: Collator service setup with relay chain connection
- **cli.rs**: Command-line interface
- **rpc.rs**: RPC setup

**Reference**: Use the [Polkadot SDK Parachain Template](https://github.com/paritytech/polkadot-sdk-parachain-template) as a reference.

### 3. Build and Test

Once the runtime and node are complete:

```bash
# Build runtime
cargo build --release -p spacewalk-parachain-runtime

# Build collator
cargo build --release -p spacewalk-parachain-collator

# Start relay chain
./parachain/scripts/run-relay.sh

# Register parachain (in another terminal)
./parachain/scripts/register-parachain.sh

# Start collator
./parachain/scripts/run-parachain.sh
```

## 📚 Resources

- [Polkadot SDK Parachain Template](https://github.com/paritytech/polkadot-sdk-parachain-template)
- [Cumulus Documentation](https://docs.substrate.io/tutorials/connect-a-parachain/)
- [XCM Documentation](https://docs.substrate.io/fundamentals/xcm-overview/)
- [Polkadot SDK v1.6.0](https://github.com/paritytech/polkadot-sdk/tree/release-polkadot-v1.6.0)

## 🔍 Current Runtime Status

The runtime currently includes:

- ✅ All Spacewalk pallets (StellarRelay, VaultRegistry, Oracle, Issue, Redeem, Replace, etc.)
- ✅ Core Substrate pallets (System, Timestamp, Aura, Grandpa, Sudo, Balances)
- ✅ ORML pallets (Tokens, Currencies)
- ⚠️ Parachain-specific pallets (ParachainSystem, XcmpQueue, Xcm) - **TODO**
- ⚠️ XCM configuration - **TODO**

## 🎯 Next Steps

1. **Complete XCM Configuration**: Add XCM executor, router, and asset registry
2. **Add Parachain Pallets**: Configure ParachainSystem and XcmpQueue
3. **Create Collator Node**: Build the collator node structure
4. **Test Locally**: Set up local relay chain and test parachain connection
5. **Deploy to Testnet**: Register on Rococo or other testnet

## ⚡ Quick Start (Once Complete)

```bash
# Terminal 1: Start relay chain
./parachain/scripts/run-relay.sh

# Terminal 2: Register parachain
./parachain/scripts/register-parachain.sh

# Terminal 3: Start collator
./parachain/scripts/run-parachain.sh
```

## 📝 Notes

- The parachain ID is currently set to `2000` in `parachain/runtime/src/lib.rs`
- Change `PARA_ID` constant if you need a different ID
- The runtime is based on the testnet runtime but adapted for parachain use
- All Spacewalk pallet configurations are copied from the testnet runtime

