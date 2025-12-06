# ChainRepute - Cross-Chain Reputation Protocol

> **Unify your on-chain reputation across Stellar and Polkadot ecosystems**

## 📋 Project Overview

**Project Name:** ChainRepute

**Tagline:** Your reputation, unified across chains - One identity, infinite possibilities

**Description:**
ChainRepute bridges Stellar and Polkadot to create unified, cross-chain reputation. We scan your on-chain activity, generate an AI-powered score (0-1000), and mint it as non-transferable Soulbound Tokens on both networks.

Your DeFi history shouldn't be siloed. ChainRepute creates a portable identity that works across chains—one reputation, infinite possibilities.

## 👥 Team Information

**Team Name:** ChainRepute

**Team Members:**
- [Ayush Yadav](https://github.com/ayuxy027) - Head of Product, Smart Contract Integration & DevOps
- [Sumeet Gond](https://github.com/sumeetgond) - UI/UX Design & Backend Integration
- [Vidip Ghosh](https://github.com/vidipghosh) - Smart Contract Development & Blockchain Integration

## 🛠️ Technologies Used

### Frontend
- **React 19** with TypeScript
- **Vite** - Next-gen build tool
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **React Router DOM** - Client-side routing

### Backend
- **Node.js/Express** - REST API server
- **TypeScript** - Type-safe backend

### Blockchain & Smart Contracts
- **Stellar Soroban** - Rust-based smart contracts (v21.5.1)
- **Polkadot Ink!** - Rust-based WASM contracts (v5.1.1)
- **@stellar/stellar-sdk** - Stellar blockchain integration
- **@polkadot/api** - Polkadot RPC connection
- **@polkadot/extension-dapp** - Browser wallet integration

### Wallets
- **Albedo** - Stellar wallet integration
- **Talisman/SubWallet** - Polkadot wallet integration

### DevOps & Tools
- **Vercel** - Frontend deployment
- **cargo-contract** - Ink! contract tooling
- **stellar-cli** - Soroban contract deployment

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Reputation  │  │    Wallet    │  │     SBT      │ │
│  │  Dashboard   │  │  Integration │  │   Minting    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Backend API (Express/Node)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  AI Engine   │  │   Stellar    │  │   Polkadot   │ │
│  │   Scanner    │  │   Scanner    │  │   Scanner    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
           │                                    │
           ▼                                    ▼
┌──────────────────────┐         ┌──────────────────────┐
│   Stellar Network    │         │  Polkadot Network    │
│  ┌────────────────┐  │         │  ┌────────────────┐  │
│  │ Soroban SBT    │  │         │  │  Ink! SBT      │  │
│  │   Contract     │  │         │  │  Contract      │  │
│  └────────────────┘  │         │  └────────────────┘  │
│    (Deployed ✅)     │         │   (Ready 🔧)        │
└──────────────────────┘         └──────────────────────┘
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Rust 1.91.1+ (for contract development)
- Stellar CLI (for Soroban contracts)
- cargo-contract (for Ink! contracts)
- Albedo wallet browser extension
- Talisman or SubWallet browser extension

### Installation

```bash
# Clone the repository
git clone https://github.com/ayuxy027/polkadotxstellar.git
cd polkadotxstellar

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### Configuration

Create `.env` file in root directory:

```bash
# Stellar Configuration
VITE_STELLAR_NETWORK=testnet
VITE_STELLAR_RPC=https://soroban-testnet.stellar.org
VITE_STELLAR_CONTRACT=CDUTJKXOOVPWI6BZZDJDUMZUDBLP2VRBYPLJGF35UK52LKWM6CZXHJNX

# Polkadot Configuration  
VITE_POLKADOT_RPC=wss://rpc1.paseo.popnetwork.xyz
VITE_POLKADOT_CONTRACT=<contract-address-after-deployment>

# Backend API
VITE_API_URL=http://localhost:3001
```

### Running the Project

```bash
# Start backend server (Terminal 1)
cd server
npm run dev
# Server runs on http://localhost:3001

# Start frontend (Terminal 2)
npm run dev
# Frontend runs on http://localhost:5174
```

### Building for Production

```bash
# Build frontend
npm run build

# Preview production build
npm run preview

# Build Stellar contract
stellar contract build --manifest-path contracts/soroban-reputation/Cargo.toml

# Build Polkadot contract
cargo contract build --manifest-path contracts/governance-sbt/Cargo.toml --release
```

## 📱 Features

- ✅ **Cross-Chain Scanning** - Analyze reputation across Stellar and Polkadot
- ✅ **AI-Powered Analysis** - Smart scoring algorithm (0-1000 scale)
- ✅ **Soulbound Token Minting** - Non-transferable reputation NFTs
- ✅ **Dual Wallet Integration** - Seamless Albedo + Talisman/SubWallet support
- ✅ **Unified Dashboard** - Single interface for both chains
- ✅ **Tier-Based Rewards** - Newcomer → Bronze → Silver → Gold progression
- ✅ **Real-Time Updates** - Live transaction status and confirmations
- ✅ **Responsive Design** - Mobile-first, works everywhere

## 🎯 Use Cases

1. **DeFi Protocol Access** - Use unified reputation for undercollateralized loans, higher trading limits
2. **DAO Governance** - Weighted voting power based on cross-chain reputation
3. **Community Gates** - Token-gated access to premium features, exclusive communities
4. **Credit Scoring** - On-chain credit history for Web3 financial services
5. **Identity Verification** - Sybil-resistant identity without KYC
6. **Airdrop Eligibility** - Fair distribution based on proven reputation

## 🔗 Links & Resources

- **Live Demo:** https://chainrepute.vercel.app/
- **Video Demo:** https://drive.google.com/drive/folders/1iHgmkN-2Ddwe_2E4bYzYkrIbAKP8hAv4?usp=sharing
- **GitHub Repository:** https://github.com/ayuxy027/ChainRepute
- **Smart Contract Addresses:**
  - Stellar Soroban SBT (Testnet): `CDUTJKXOOVPWI6BZZDJDUMZUDBLP2VRBYPLJGF35UK52LKWM6CZXHJNX`
  - Polkadot Ink! SBT (Pop Network Testnet): *Awaiting deployment - contract built and ready*
- **Backend API:** http://localhost:3001 (when running locally)

## 📸 Screenshots

### Landing Page
![Landing Page](./screenshots/landing.png)

### Reputation Dashboard
![Dashboard](./screenshots/dashboard.png)

### Wallet Connection
![Wallet Connect](./screenshots/wallet.png)

### SBT Minting
![SBT Mint](./screenshots/mint.png)

## 🧪 Testing

### Test Stellar Contract

```bash
# Check total SBTs minted
stellar contract invoke \
  --id CDUTJKXOOVPWI6BZZDJDUMZUDBLP2VRBYPLJGF35UK52LKWM6CZXHJNX \
  --network testnet \
  -- total_supply

# Query user reputation
stellar contract invoke \
  --id CDUTJKXOOVPWI6BZZDJDUMZUDBLP2VRBYPLJGF35UK52LKWM6CZXHJNX \
  --network testnet \
  -- get_reputation \
  --user <STELLAR_ADDRESS>
```

### Test Polkadot Contract (once deployed)

```bash
# Deploy contract to Pop Network
cargo contract instantiate \
  --manifest-path contracts/governance-sbt/Cargo.toml \
  --url wss://rpc1.paseo.popnetwork.xyz \
  --suri <YOUR_SEED_PHRASE> \
  -x -y \
  --constructor new \
  --value 0

# Query reputation
cargo contract call \
  --contract <CONTRACT_ADDRESS> \
  --message get_reputation \
  --args <POLKADOT_ADDRESS>
```

### Run Frontend Tests

```bash
npm run test
```

### API Health Check

```bash
curl http://localhost:3001/api/health
```

## 🚧 Challenges & Solutions

### Challenge 1: Polkadot Testnet Token Availability
**Problem:** Pop Network testnet tokens were scarce. Faucets had limits, and Paseo Asset Hub tokens didn't work on the contracts parachain.

**Solution:** Built complete Ink! contract (23KB, production-ready), created deployment scripts, and identified correct RPC. Ready to deploy in 2 minutes once tokens arrive.

### Challenge 2: Dual Ecosystem Mastery
**Problem:** Mastering both Stellar Soroban and Polkadot Ink! simultaneously. Different architectures, deployment tools, testing frameworks, and RPC patterns—all in Rust but worlds apart.

**Solution:** Split the work, deep-dived separately, built parallel workflows. Created frontend abstraction layers to handle both chains uniformly.

### Challenge 3: Wallet Integration Hell
**Problem:** Four different wallets (Albedo, Talisman, SubWallet). Different APIs, signing flows, error patterns, and address formats.

**Solution:** Built unified `WalletContext` with abstracted logic, standardized errors, and graceful fallbacks. Auto-detects installed wallets and guides users.

### Challenge 4: Cross-Chain State Synchronization
**Problem:** Syncing state across independent blockchains without bridges or oracles.

**Solution:** "Scan once, mint twice" architecture. Backend analyzes both chains, generates unified score, mints separate SBTs on each. Users prove ownership by holding both.

## 🔮 Future Improvements

- [ ] **Bridge Integration** - Add XCM/IBC bridges for actual cross-chain token transfers
- [ ] **More Chains** - Expand to Ethereum, Cosmos, Solana
- [ ] **Advanced Analytics** - ML-powered behavior prediction and risk scoring
- [ ] **Reputation Marketplace** - Trade reputation-gated services
- [ ] **DAO Integration** - Direct Snapshot/Tally integration for governance
- [ ] **Mobile App** - Native iOS/Android apps with wallet connect
- [ ] **Oracle Network** - Decentralized reputation verification
- [ ] **Privacy Layer** - Zero-knowledge proofs for selective reputation disclosure
- [ ] **Reputation Staking** - Stake reputation for additional benefits
- [ ] **Multi-sig Support** - Corporate/team reputation profiles

## 📄 License

MIT License - Open Source

Copyright (c) 2025 ChainRepute Team

## 🙏 Acknowledgments

- **Stellar Foundation** - For Soroban testnet access and comprehensive documentation
- **Polkadot/Web3 Foundation** - For Ink! framework and ecosystem support
- **Pop Network** - For providing contracts-enabled parachain infrastructure
- **Albedo, Talisman, SubWallet** - For excellent wallet developer experience
- **Vite & React Teams** - For blazing-fast developer tooling
- **Rust Community** - For the amazing smart contract languages

Special thanks to all the developers who built the incredible tools and frameworks that made this possible!

---

**Built for Stellar x Polkadot Hackerhouse BLR** 🎉

*Unifying Web3 reputation, one chain at a time.*
