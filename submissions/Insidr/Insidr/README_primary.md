# 🔐 Insidr - Private Cross-Chain Bridge

> **Stellar ↔ Polkadot Privacy Bridge with Mobile ZK Proofs**

[![Noir](https://img.shields.io/badge/Noir-1.0.0--beta.8-black)](https://noir-lang.org/)
[![Flutter](https://img.shields.io/badge/Flutter-3.3.4+-blue)](https://flutter.dev/)
[![Stellar](https://img.shields.io/badge/Stellar-Soroban-brightgreen)](https://stellar.org/)
[![Polkadot](https://img.shields.io/badge/Polkadot-ink!-pink)](https://polkadot.network/)

**Insidr** is a privacy-preserving cross-chain bridge that enables **private transfers between Stellar and Polkadot** using **Zero-Knowledge proofs generated entirely on mobile devices**. No trusted operators, no data leakage - your transactions stay private.

## 🎯 What is Insidr?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           INSIDR BRIDGE FLOW                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  📱 YOUR PHONE                     ⭐ STELLAR           🔴 POLKADOT         │
│  ┌──────────────┐                 ┌──────────┐        ┌──────────────┐      │
│  │ Enter amount │ ──commitment──► │ Lock $   │        │              │      │
│  │ Generate ZK  │                 │ in escrow│        │              │      │
│  │ proof locally│ ─────proof────────────────────────► │ Verify proof │      │
│  │              │                 │          │        │ Mint tokens  │      │
│  └──────────────┘                 └──────────┘        └──────────────┘      │
│                                                                             │
│  ✅ Amount hidden    ✅ No trusted party    ✅ Cryptographic security       │
└─────────────────────────────────────────────────────────────────────────────┘
```

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🔒 **Private Amounts** | Transfer amounts hidden using cryptographic commitments |
| 📱 **Mobile Proving** | ZK proofs generated on your phone - no servers needed |
| ⛓️ **Cross-Chain** | Bridge between Stellar and Polkadot ecosystems |
| 🛡️ **Double-Spend Protection** | Nullifiers prevent proof reuse |
| ⚡ **Fast Proofs** | ~2-5 second proof generation on modern phones |

---

## 🚀 Quick Start

### Prerequisites

Install the following tools:

```bash
# 1. Flutter SDK (>= 3.3.4)
# Follow: https://docs.flutter.dev/get-started/install

# 2. Rust toolchain (1.89.0+)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup default stable
rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android
rustup target add aarch64-apple-ios x86_64-apple-ios aarch64-apple-ios-sim

# 3. Noir (1.0.0-beta.8)
curl -L https://raw.githubusercontent.com/noir-lang/noirup/main/install | bash
noirup --version 1.0.0-beta.8

# 4. Barretenberg (for proof generation)
curl -L https://raw.githubusercontent.com/AztecProtocol/aztec-packages/master/barretenberg/bbup/install | bash
bbup -v 1.0.0-nightly.20250723

# 5. Mopro CLI (for mobile bindings)
cargo install --git https://github.com/zkmopro/mopro mopro-cli

# 6. Android SDK & NDK (for Android builds)
# Install via Android Studio or sdkmanager

# 7. Xcode (for iOS builds - macOS only)
# Install from Mac App Store
```

### Verify Installation

```bash
flutter --version      # Should show >= 3.3.4
rustc --version        # Should show >= 1.89.0
nargo --version        # Should show 1.0.0-beta.8
bb --version           # Should show barretenberg version
mopro --version        # Should show mopro-cli version
```

---

## 📦 Installation

### 1. Clone Repository

```bash
git clone https://github.com/Arnav-panjla/Insidr.git
cd Insidr
```

### 2. Install Rust Dependencies

```bash
# Build the Rust library
cargo build --release

# Run tests to verify setup
cargo test
```

### 3. Compile Noir Circuits

```bash
cd circuits

# Compile the main circuit
nargo compile

# Generate proving artifacts
bb prove --write_vk \
  -b ./target/circuits.json \
  -w ./target/circuits.gz \
  -o ./target \
  --oracle_hash keccak \
  --output_format bytes_and_fields

cd ..
```

### 4. Generate Mobile Bindings

```bash
# Generate Flutter/Dart bindings from Rust
mopro build --platforms android

# When prompted:
# 1. Select "release" for build mode
# 2. Select "aarch64-linux-android" for architecture
```

### 5. Install Flutter Dependencies

```bash
cd flutter

# Get all dependencies
flutter pub get

# Verify no issues
flutter analyze
```

### 6. Get Wallet Connect Project ID

1. Go to [cloud.reown.com](https://cloud.reown.com)
2. Create a new project
3. Copy your **Project ID**

---

## 🏃 Running the App

### Android

```bash
cd flutter

# List available devices
flutter devices

# Run on Android device/emulator
flutter run --dart-define=PROJECT_ID=your_project_id_here

# Build release APK
flutter build apk --dart-define=PROJECT_ID=your_project_id_here
```

### iOS (macOS only)

```bash
cd flutter

# Install CocoaPods dependencies
cd ios && pod install && cd ..

# Run on iOS simulator/device
flutter run --dart-define=PROJECT_ID=your_project_id_here

# Build release IPA
flutter build ios --dart-define=PROJECT_ID=your_project_id_here
```

---

## 🔧 Project Structure

```
Insidr/
├── 📁 circuits/                    # Noir ZK circuits
│   ├── src/
│   │   ├── main.nr                 # Multiplier circuit (demo)
│   │   └── bridge.nr               # Privacy bridge circuit
│   ├── Nargo.toml                  # Noir project config
│   └── Prover.toml                 # Prover inputs
│
├── 📁 contracts/                   # Smart contracts
│   ├── Verifier.sol                # EVM/Solidity verifier
│   ├── stellar/                    # Stellar Soroban contracts
│   │   ├── StellarBridgeEscrow.rs  # Escrow contract
│   │   └── Cargo.toml
│   └── polkadot/                   # Polkadot ink! contracts
│       ├── lib.rs                  # Bridge verifier
│       └── Cargo.toml
│
├── 📁 flutter/                     # Flutter mobile app
│   ├── lib/
│   │   ├── main.dart               # App entry point
│   │   ├── config.dart             # Configuration
│   │   ├── wallet_connect_service.dart  # Wallet integration
│   │   ├── bridge_service.dart     # Bridge logic
│   │   └── bridge_page.dart        # Bridge UI
│   ├── assets/                     # Circuit artifacts
│   ├── android/                    # Android-specific
│   ├── ios/                        # iOS-specific
│   └── pubspec.yaml                # Dependencies
│
├── 📁 src/                         # Rust core library
│   ├── lib.rs                      # Library exports
│   ├── noir.rs                     # Noir proof generation
│   └── error.rs                    # Error types
│
├── Cargo.toml                      # Rust dependencies
└── README.md                       # This file
```

---

## 📱 Using the App

### Demo Mode (Multiplier Circuit)

1. **Launch App** - Open Insidr on your device
2. **Connect Wallet** - Tap the wallet icon, connect MetaMask/Trust/etc.
3. **Enter Inputs** - Input two numbers (e.g., 3 and 5)
4. **Generate Proof** - Tap "Generate Proof" (~2-5 seconds)
5. **Verify Locally** - Tap "Verify Locally" to check proof validity
6. **Verify On-Chain** - Tap "Verify On-Chain" to verify on Sepolia

### Bridge Mode (Private Transfers)

1. **Open Bridge** - Tap the swap icon (↔️) in the app bar
2. **Select Chains** - Choose source (Stellar) and destination (Polkadot)
3. **Enter Details**:
   - Amount to transfer
   - Recipient address
   - Your private secret
4. **Generate & Transfer** - Tap "Generate Proof & Transfer"
5. **Wait** - Proof generation + verification takes ~5-10 seconds
6. **Complete** - Wrapped tokens minted on destination chain

---

## �� How Privacy Works

### Commitment Scheme

```
Your Input:
  amount = 100
  nonce = random_256_bit

Commitment (public):
  commitment = Poseidon(amount || nonce)
  
  ✅ Everyone sees: commitment
  ❌ No one knows: amount, nonce
```

### ZK Proof

```
Private Inputs (only you know):
  - amount
  - nonce  
  - sender_secret

Public Inputs (everyone sees):
  - commitment
  - nullifier (prevents double-spend)
  - recipient_hash

Proof Statement:
  "I know values that hash to the commitment,
   without revealing what those values are"
```

---

## �� Dependencies

### Rust (Cargo.toml)

| Crate | Version | Purpose |
|-------|---------|---------|
| `mopro-ffi` | 0.3.2 | Mobile FFI bindings |
| `noir_rs` | v1.0.0-beta.8 | Noir proof generation |
| `thiserror` | 2.0.12 | Error handling |
| `serde` | 1.0 | Serialization |

### Flutter (pubspec.yaml)

| Package | Version | Purpose |
|---------|---------|---------|
| `mopro_flutter_bindings` | local | Rust bindings |
| `reown_appkit` | ^1.4.0 | Wallet Connect |
| `web3dart` | ^2.7.3 | Ethereum interaction |
| `path_provider` | ^2.1.4 | File system access |
| `http` | ^1.1.0 | HTTP requests |
| `convert` | ^3.1.1 | Data conversion |

---

## �� Deployed Contracts

| Network | Contract | Address |
|---------|----------|---------|
| Sepolia | HonkVerifier | `0x3C9f0361F4120D236F752035D22D1e850EA0f5E6` |
| Stellar Testnet | BridgeEscrow | *Coming Soon* |
| Polkadot Westend | BridgeVerifier | *Coming Soon* |

---

## 🐛 Troubleshooting

### Common Issues

**"Verification key not loaded"**
```bash
# Ensure assets are in place
ls flutter/assets/
# Should show: noir_multiplier2.json, .srs, .vk
```

**"Project ID not configured"**
```bash
flutter run --dart-define=PROJECT_ID=your_actual_project_id
```

**"Proof generation failed"**
```bash
cd circuits && nargo compile
```

**Android build fails**
```bash
sdkmanager "ndk;25.2.9519653"
```

**iOS build fails**
```bash
cd flutter/ios && pod deintegrate && pod install
```

---

## 📝 Quick Command Reference

```bash
# Full setup from scratch
git clone https://github.com/Arnav-panjla/Insidr.git
cd Insidr

# 1. Build Rust
cargo build --release

# 2. Build mobile bindings (interactive)
mopro build --platforms android

# 3. Install Flutter deps
cd flutter && flutter pub get

# 4. Run
flutter run --dart-define=PROJECT_ID=your_wallet_connect_project_id
```

---

## 📚 Resources

- [Noir Documentation](https://noir-lang.org/docs)
- [Mopro GitHub](https://github.com/zkmopro/mopro)
- [Stellar Soroban](https://soroban.stellar.org/)
- [Polkadot ink!](https://use.ink/)
- [Reown AppKit](https://docs.reown.com/)

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with 💜 for Privacy**

*Insidr - Because your money is your business*

</div>
