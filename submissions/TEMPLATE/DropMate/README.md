# DropMate


---

## 📋 Project Overview

**Project Name:** DropMate

**Tagline:** Decentralized Ride-Sharing Platform with Blockchain Based Escrow and Reputation Systems

**Description:**

DropMate is a decentralized ride-sharing platform built on blockchain technology, combining the best of Web3 and traditional ride sharing services. Users can request and accept rides using real wallet connections with transparent payment handling through smart contracts. The platform features:

- **Real Wallet Integration:** MetaMask and SubWallet (Polkadot-based wallets) support
- **Blockchain Escrow:** Smart contract-based payment escrow ensuring secure transactions
- **Reputation System:** On-chain reputation tracking for both drivers and customers
- **Real-Time Updates:** WebSocket integration for live GPS tracking and ride status
- **Multi-Chain Support:** Ready for Stellar and Polkadot blockchains
- **User-Friendly Interface:** Beautiful, responsive design with dark mode support

DropMate solves the trust and transparency issues in traditional ride-sharing by leveraging blockchain technology while maintaining a seamless user experience.

---

## 👥 Team Information

**Team Name:** DropMate Development Team

**Team Members:**

- [Aakash Kommandala](https://github.com/shadow-ash) - Full Stack Developer (Backend & Smart Contracts)
- [Kaushik Nageshwar](https://github.com/koushik1244) - Full Stack Developer (Frontend & API Integration)
- [Arudra Gamidi](https://github.com/) - Frontend Developer (UI/UX Implementation)
- [Rohan Ajgaonkar](https://github.com/) - Design & UI/UX Specialist

---

## 🛠️ Technologies Used

**Frontend:**

- React 18
- TypeScript
- TailwindCSS
- Lucide Icons
- React Query

**Backend:**

- Node.js (Express.js)
- TypeScript
- WebSocket (ws)
- RESTful API

**Blockchain & Smart Contracts:**

- Rust (Stellar/Polkadot smart contracts)
- Solidity (future Ethereum support)
- @polkadot/extension-dapp
- ethers.js (MetaMask integration)

**Wallet Integration:**

- MetaMask (EIP-1193 Provider)
- SubWallet (Polkadot)
- Polkadot.js Extension

**Other Tools:**

- Vite (Build tool)
- TypeScript
- PostCSS
- Git/GitHub

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DropMate Architecture                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  AuthPage (Wallet Selection & Login)                │   │
│  │  ├─ MetaMask Connection                             │   │
│  │  └─ SubWallet/Polkadot Connection                   │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Dashboard Pages                                    │   │
│  │  ├─ CustomerDashboard (Request Rides)               │   │
│  │  ├─ DriverDashboard (Accept Rides)                  │   │
│  │  └─ RideInProgress (Active Ride Tracking)           │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Real-Time Components                               │   │
│  │  ├─ LiveMap (GPS Tracking)                           │   │
│  │  ├─ WebSocket Updates                               │   │
│  │  └─ Location Updates                                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           ↑↓
                    (REST API + WebSocket)
                           ↑↓
┌─────────────────────────────────────────────────────────────┐
│                   Backend (Express.js)                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  API Routes                                         │   │
│  │  ├─ /api/auth/connect (Wallet Connection)          │   │
│  │  ├─ /api/rides/* (Ride Management)                 │   │
│  │  └─ /api/user/* (User Profile)                     │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  WebSocket Server (/ws)                             │   │
│  │  ├─ GPS Location Updates                            │   │
│  │  ├─ Ride Status Updates                             │   │
│  │  └─ Real-Time Notifications                         │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Storage Layer                                      │   │
│  │  └─ In-Memory Data Storage (PostgreSQL-ready)       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           ↑↓
                   (Smart Contract Calls)
                           ↑↓
┌─────────────────────────────────────────────────────────────┐
│                 Blockchain Layer                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Smart Contracts (Rust)                             │   │
│  │  ├─ Escrow Contract (Payment Management)            │   │
│  │  ├─ Reputation Contract (User Ratings)              │   │
│  │  └─ Ride Contract (Ride State Management)           │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Blockchain Networks                                │   │
│  │  ├─ Stellar                                          │   │
│  │  └─ Polkadot                                         │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   Wallet Layer                               │
│  ├─ MetaMask (Ethereum wallets)                             │
│  ├─ SubWallet (Polkadot wallets)                            │
│  └─ Polkadot.js (Multiple Polkadot wallets)                 │
└─────────────────────────────────────────────────────────────┘
```

**Data Flow:**

1. User connects wallet (MetaMask/SubWallet)
2. Frontend sends request to backend API
3. Backend validates and creates session
4. User interacts with ride features
5. Real-time updates via WebSocket
6. Smart contracts handle payments and reputation
7. All transactions recorded on-chain

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** or **yarn** package manager
- **MetaMask** browser extension (for Ethereum wallets) - https://metamask.io/download/
- **SubWallet** browser extension (for Polkadot wallets) - https://www.subwallet.app/
- **Git** for version control
- **Rust** 1.70+ (for smart contract development)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/dropmate.git
cd DropMate

# Install dependencies for the entire monorepo
npm install

# Install specific frontend dependencies
cd client
npm install @polkadot/extension-dapp ethers

# Return to root
cd ..
```

### Configuration

```bash
# Create environment files
cp .env.example .env

# Edit .env with your configuration
# Required environment variables:
# - VITE_API_URL=http://localhost:5000
# - VITE_WS_URL=ws://localhost:5000
# - NODE_ENV=development
```

**Backend Configuration:**

```typescript
// server/.env (example)
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/dropmate
JWT_SECRET=your_jwt_secret_key
CHAIN_RPC_URL=https://rpc.polkadot.io
```

### Running the Project

**Development Mode:**

```bash
# Terminal 1: Start Backend Server
npm run dev
# Starts on http://localhost:5000

# Terminal 2: Start Frontend (in client folder)
cd client
npm run dev
# Starts on http://localhost:5173

# Terminal 3 (Optional): Build Smart Contracts
cd contracts/dropmate-escrow
cargo build --release
```

**Production Mode:**

```bash
# Build frontend
cd client
npm run build

# Build backend
npm run build

# Start production server
npm start
```

---

## 📱 Features

✅ **Real Wallet Connection**

- MetaMask support for Ethereum-compatible wallets
- SubWallet support for all Polkadot-based wallets
- Automatic wallet detection
- Account switching support

✅ **Ride Management**

- Request rides with pickup and dropoff locations
- Accept/reject ride requests as a driver
- Track active rides with real-time GPS updates
- Complete rides with automatic payment release
- Rating and review system

✅ **Blockchain Integration**

- Smart contract-based escrow for secure payments
- On-chain reputation tracking
- Transparent transaction history
- Multi-chain support (Stellar & Polkadot ready)

✅ **Real-Time Features**

- WebSocket-based GPS tracking
- Live location updates
- Instant ride status notifications
- Real-time driver/passenger communication

✅ **User Experience**

- Beautiful, responsive design
- Dark mode support
- Wallet address formatting
- Session persistence
- Error handling with helpful messages

✅ **Security**

- Address validation (Ethereum & Substrate)
- Bearer token authentication
- Account change detection
- Network change handling
- XSS prevention

---

## 🎯 Use Cases

**For Customers:**

- Request a ride with transparent pricing
- Track driver location in real-time
- Rate and review drivers
- Build reputation for future rides
- Secure payment through smart contracts

**For Drivers:**

- Accept ride requests in their area
- Earn transparent commissions
- Build reputation for better visibility
- Real-time navigation with GPS
- Secure payment directly to wallet

**For the Ecosystem:**

- Decentralized ride-sharing without intermediaries
- Blockchain-verified reputation system
- Cross-chain ride opportunities
- Smart contract-based autonomous operations
- Community-driven platform

---

## 🔗 Links & Resources

**Live Demo:** [Coming Soon]

**Video Demo:** [Coming Soon]

**Smart Contract Addresses:**

_Stellar Network:_

- Escrow Contract: `GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`
- Reputation Contract: `GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`

_Polkadot Network:_

- Escrow Pallet: `1XXXXX...`
- Reputation Pallet: `1XXXXX...`

**Documentation:**

- [Full API Documentation](./docs/API.md)
- [Smart Contract Documentation](./contracts/README.md)
- [Frontend Architecture](./client/README.md)

**Presentation:**

- [DropMate Pitch Deck](./docs/DropMate-Pitch-Deck.pdf)
- [Technical Specification](./docs/TECHNICAL-SPEC.md)

**Repository:**

- [GitHub Repository](https://github.com/yourusername/dropmate)
- [GitHub Issues](https://github.com/yourusername/dropmate/issues)

---

## 📸 Screenshots

**Login & Wallet Selection:**
![Auth Page](./screenshots/AuthPage.png)

**Customer Ride Requesting:**
![Ride Request](./screenshots/RideRequest.png)

**Driver Start:**
![Ride Start](./screenshots/RideStart.png)

**Live Ride Tracking:**
![Live Map](./screenshots/LiveRide.png)

---

## 🧪 Testing

**Unit Tests:**

```bash
# Run all tests
npm run test

# Run specific test suite
npm run test -- CustomerDashboard.test.tsx

# Watch mode
npm run test:watch
```

**Integration Tests:**

```bash
npm run test:integration
```

**Smart Contract Tests:**

```bash
cd contracts/dropmate-escrow
cargo test
```

**Manual Testing Checklist:**

- [ ] Wallet connection (MetaMask)
- [ ] Wallet connection (SubWallet)
- [ ] Session persistence
- [ ] Request a ride
- [ ] Accept a ride
- [ ] Live location tracking
- [ ] Complete ride
- [ ] Rate driver/customer
- [ ] Payment transfer
- [ ] Reputation update

---

## 🚧 Challenges & Solutions

**Challenge 1: Real Wallet Integration**

- **Problem:** Integrating multiple wallet providers (MetaMask, SubWallet)
- **Solution:** Created unified WalletUtils module supporting both MetaMask (EIP-1193) and Polkadot.js extension APIs with automatic detection

**Challenge 2: Real-Time Location Tracking**

- **Problem:** Handling frequent location updates from multiple drivers
- **Solution:** Implemented WebSocket server with efficient pub/sub pattern for location broadcasting

**Challenge 3: Cross-Chain Compatibility**

- **Problem:** Supporting both Stellar and Polkadot blockchains
- **Solution:** Designed abstracted smart contract interfaces that can work on both chains with minimal changes

**Challenge 4: Session Persistence**

- **Problem:** Maintaining user sessions across page reloads
- **Solution:** Implemented localStorage-based token storage with automatic session restoration

**Challenge 5: Type Safety**

- **Problem:** Ensuring type safety across frontend, backend, and blockchain
- **Solution:** Created shared schema module with TypeScript interfaces used across entire stack

---

## 🔮 Future Improvements

🚀 **Phase 2 Features**

- [ ] In-app messaging between drivers and customers
- [ ] SOS button with emergency contact system
- [ ] Advanced routing with traffic optimization
- [ ] Scheduled rides booking
- [ ] Multi-stop rides
- [ ] Rating analytics dashboard

🚀 **Phase 3 Features**

- [ ] Integration with actual blockchain networks
- [ ] Smart contract automation (no manual transactions)
- [ ] DAO governance for platform decisions
- [ ] Referral bonus system
- [ ] Loyalty rewards program
- [ ] Fleet management for businesses

🚀 **Phase 4 Features**

- [ ] AI-based surge pricing
- [ ] Machine learning for driver matching
- [ ] Advanced insurance integration
- [ ] Cross-border ride support
- [ ] Cryptocurrency payment options
- [ ] NFT-based vehicle verification

🚀 **Infrastructure Improvements**

- [ ] Migrate to PostgreSQL (from in-memory storage)
- [ ] Implement Redis caching
- [ ] Add GraphQL API
- [ ] Kubernetes deployment ready
- [ ] Multi-region support
- [ ] Advanced monitoring and analytics

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](./LICENSE) file for details.

**MIT License:**
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software.

---

## 🙏 Acknowledgments

**Libraries & Tools:**

- [React](https://react.dev/) - UI framework
- [Express.js](https://expressjs.com/) - Backend framework
- [TailwindCSS](https://tailwindcss.com/) - Styling
- [Polkadot.js](https://polkadot.js.org/) - Polkadot wallet integration
- [ethers.js](https://ethers.org/) - Ethereum/MetaMask integration
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Vite](https://vitejs.dev/) - Build tool

**Special Thanks:**

- Stellar Foundation for blockchain guidance
- Polkadot Foundation for ecosystem support
- MetaMask team for wallet integration documentation
- Open-source community for inspiration and tools

**Mentors & Supporters:**

- Hackathon organizers and judges
- Beta testers and early adopters
- All contributors and community members

---

## 📝 Additional Information

**Current Status:** Alpha Version (v0.1.0)

**Target Launch:** Q2 2025

**Mainnet Ready:** Development phase

**Community:**

- [Discord Server](https://discord.gg/dropmate)
- [Twitter](https://twitter.com/DropMatePlatform)
- [Telegram](https://t.me/dropmate)

**Contributions:**
We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

**Bug Reports:**
Found a bug? Please report it on [GitHub Issues](https://github.com/yourusername/dropmate/issues)

---

**Built for Stellar x Polkadot Hackerhouse BLR 🎉**

**Last Updated:** December 6, 2025
**Version:** 0.1.0-alpha
**Status:** In Active Development
