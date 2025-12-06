# PayStamp

**Cross-chain access protocol** bridging real-world payments on **Stellar** with programmable access control on **Polkadot**.

> **"Proof-of-Payment = Proof-of-Access"** — natively, securely, and across chains.

## 📋 Project Description

PayStamp enables any service — digital or physical — to grant instant, trustless, time-bound access the moment a user completes a payment in XLM or USDC on Stellar. Unlike traditional NFT tickets or token-gated systems, PayStamp treats **payment completion itself as the trigger** for access.

### Key Features

- 🔗 **Cross-Chain Integration**: Stellar for payments, Polkadot for access control
- 💳 **Instant Access**: Payment completion automatically grants access
- 🎫 **Multiple Service Types**: Support for DeFi dashboards, WiFi hotspots, content access, event tickets, and API keys
- 🔐 **Wallet Integration**: Seamless Stellar wallet connection (Freighter, Lobster, Rabet, WalletConnect)
- 📱 **Modern UI**: Glassmorphism design with real-time status updates
- ⚡ **Real-Time Updates**: WebSocket support for live payment detection and access status
- 🛡️ **Secure**: Smart contract validation, payment verification, and access management


## 🛠️ Technologies Used

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **React Query** (`@tanstack/react-query`) - Data fetching and caching
- **Zustand** - State management
- **Apollo Client** - GraphQL client
- **Socket.io Client** - Real-time WebSocket communication
- **Lucide React** - Icon library
- **Canvas Confetti** - Celebration animations
- **QR Code React** - QR code generation

### Backend
- **Node.js 20+** - Runtime environment
- **Express** - Web framework
- **Apollo Server** - GraphQL server
- **Prisma** - ORM for PostgreSQL
- **PostgreSQL** - Relational database
- **Redis** - Caching and session storage
- **Socket.io** - WebSocket server
- **JWT** - Authentication tokens
- **Zod** - Schema validation

### Blockchain
- **Stellar SDK** (`@stellar/stellar-sdk`) - Stellar network integration
- **Stellar Wallet SDK** (`@stellar/wallet-sdk`) - Wallet operations
- **Stellar Wallets Kit** (`@creit.tech/stellar-wallets-kit`) - Multi-wallet support
- **Polkadot API** (`polkadot-api`) - Polkadot light client
- **Polkadot.js** (`@polkadot/api`) - Polkadot chain interactions

### Smart Contracts
- **Rust** - Smart contract development
- **Soroban SDK** - Stellar smart contracts
- **ink! Framework** - Polkadot smart contracts

### Infrastructure & Tools
- **Turborepo** - Monorepo build system
- **Docker & Docker Compose** - Containerization
- **TypeScript** - Type checking
- **ESLint & Prettier** - Code quality
- **Playwright** - End-to-end testing

## 🚀 How to Run/Setup the Project

### Prerequisites

- **Node.js** 20+ and **npm** 10+
- **Docker & Docker Compose** (for PostgreSQL and Redis)
- **Rust** (for smart contract development)
- **Soroban CLI** (for Stellar contracts)
- **Cargo Contract** (for Polkadot contracts)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd PayStamp
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start infrastructure (PostgreSQL + Redis):**
   ```bash
   npm run docker:up
   ```

4. **Configure environment variables:**
   
   For API (`apps/api/.env`):
   ```bash
   cd apps/api
   cp .env.example .env
   # Edit .env with your configuration
   ```
   
   Required variables:
   - `DATABASE_URL` - PostgreSQL connection string
   - `REDIS_URL` - Redis connection string
   - `JWT_SECRET` - JWT secret (min 32 characters)

5. **Setup database:**
   ```bash
   cd apps/api
   npm run db:generate
   npm run db:push  # For development
   ```

6. **Start development servers:**
   ```bash
   # From root directory
   npm run dev
   ```
   
   This starts:
   - **API Server**: `http://localhost:4000`
   - **Web Application**: `http://localhost:3000`

### Alternative: Start Services Individually

```bash
# Terminal 1: API Server
cd apps/api
npm run dev

# Terminal 2: Web Application
cd apps/web
npm run dev
```

### Smart Contract Setup

1. **Install Rust:**
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source $HOME/.cargo/env
   ```

2. **Install Soroban CLI:**
   ```bash
   curl -sSL https://soroban.stellar.org | sh
   ```

3. **Build Stellar Contract:**
   ```bash
   cd packages/contracts/stellar-soroban
   rustup target add wasm32-unknown-unknown
   make build
   ```

4. **Validate Contracts:**
   ```bash
   npm run contracts:validate
   ```

## 📹 Demo/Video Links

<!-- TODO: Add demo video or live demo link -->
- **Live Demo**: [Add demo URL here]
- **Video Walkthrough**: [Add video URL here]
- **Presentation**: [Add presentation link here]

## 📁 Project Files Structure

```
PayStamp/
├── apps/
│   ├── api/                    # GraphQL API Server
│   │   ├── src/
│   │   │   ├── config/         # Configuration (database, env)
│   │   │   ├── middleware/     # Auth, rate limiting, error handling
│   │   │   ├── resolvers/      # GraphQL resolvers
│   │   │   ├── schema/         # GraphQL schema
│   │   │   ├── services/       # Business logic
│   │   │   └── websocket/      # Socket.io handlers
│   │   └── prisma/             # Database schema
│   │
│   └── web/                    # Next.js Frontend
│       ├── app/                # Next.js App Router
│       │   ├── (auth)/         # Authentication pages
│       │   │   ├── connect/    # Wallet connection
│       │   │   ├── payment/    # Payment flow
│       │   │   └── services/   # Service selection
│       │   └── (dashboard)/    # Dashboard pages
│       │       ├── dashboard/   # DeFi dashboard
│       │       ├── status/     # Access status
│       │       └── ...         # Other service pages
│       ├── components/         # React components
│       │   ├── ui/             # UI components (glassmorphism)
│       │   ├── wallet/         # Wallet integration
│       │   └── payment/        # Payment components
│       ├── lib/                # Utilities and services
│       │   ├── hooks/          # React hooks
│       │   ├── payment/        # Payment services
│       │   ├── polkadot/       # Polkadot client
│       │   └── stellar/        # Stellar services
│       └── stores/             # Zustand state management
│
├── packages/
│   ├── contracts/
│   │   ├── stellar-soroban/    # Stellar Soroban contract (Rust)
│   │   │   ├── src/
│   │   │   │   ├── lib.rs      # Main contract
│   │   │   │   └── test.rs     # Unit tests
│   │   │   └── Cargo.toml      # Rust dependencies
│   │   └── shared-types/       # TypeScript types
│   │
│   ├── sdk/
│   │   └── stellar-client/     # Stellar SDK package
│   │
│   └── ui/
│       └── components/          # Shared UI components
│
├── infrastructure/
│   └── docker/                 # Docker Compose configs
│
├── scripts/                    # Build and deployment scripts
│   ├── validate-contracts.sh
│   ├── deploy-contracts.sh
│   └── setup-db.sh
│
├── package.json                # Root package.json
├── turbo.json                  # Turborepo configuration
└── README.md                   # This file
```

## 📝 Additional Notes

### Architecture

PayStamp uses a **cross-chain architecture**:

1. **Payment Layer (Stellar)**: Users pay in XLM/USDC on Stellar network
2. **Smart Contract (Soroban)**: Processes payment and emits events
3. **Relayer Service**: Watches Stellar events and triggers Polkadot actions
4. **Access Layer (Polkadot)**: Mints non-transferable AccessStamp NFTs
5. **Frontend**: Real-time UI updates showing payment status and access

### Key Workflows

- **Service Selection** → User chooses a service (DeFi Dashboard, WiFi, etc.)
- **Wallet Verification** → System verifies wallet connection and balance
- **Payment Processing** → User sends payment on Stellar network
- **Real-Time Detection** → System detects payment via polling/events
- **Access Minting** → Relayer mints AccessStamp NFT on Polkadot
- **Access Grant** → User gains instant access to the service

### Supported Services

1. **Premium Analytics** - DeFi dashboard with advanced analytics
2. **Security Suite** - Enhanced security features
3. **Performance Boost** - Optimized performance access
4. **Global Access** - Worldwide service access
5. **Premium DeFi Dashboard** - Advanced DeFi analytics
6. **DePIN WiFi Hotspot** - Time-bound WiFi access
7. **Exclusive Content** - Premium content access
8. **Event Ticket** - Verifiable event tickets
9. **Developer API Key** - API access for developers

### Development Commands

```bash
# Build all packages
npm run build

# Run development servers
npm run dev

# Run tests
npm run test

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format

# Contract validation
npm run contracts:validate

# Contract deployment
npm run contracts:deploy
```

### Environment Variables

**API (`apps/api/.env`)**:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - JWT secret (min 32 characters)
- `API_KEY_SECRET` - API key secret

**Web (`apps/web/.env.local`)**:
- `NEXT_PUBLIC_API_URL` - API server URL (default: http://localhost:4000)
- `NEXT_PUBLIC_WS_URL` - WebSocket URL (default: http://localhost:4000)

### Testing

```bash
# Run all tests
npm run test

# Run E2E tests
npm run test:e2e

# Run type checking
npm run type-check
```

### Deployment

1. Set up PostgreSQL and Redis instances
2. Configure environment variables
3. Run database migrations: `cd apps/api && npm run db:migrate:deploy`
4. Build applications: `npm run build`
5. Start services: `npm start` (in each app directory)

## 📄 License

This project is licensed under the **ISC License**.

See [LICENSE](./LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For issues and questions, please open an issue on GitHub.

## 🔗 Links

- **Repository**: [GitHub Repository URL]
- **Documentation**: [Documentation URL]
- **API Documentation**: See [apps/api/README.md](./apps/api/README.md)
- **Contracts Documentation**: See [packages/contracts/README.md](./packages/contracts/README.md)

---

**Built with ❤️ using Next.js, Stellar, and Polkadot**
