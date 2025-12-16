# x402-Flash Demo Examples

Complete working examples demonstrating the x402-flash SDK with Freighter wallet integration on Stellar.

## 📦 What's Included

This demo package contains three complete examples:

1. **API Server** (`demo-api-server/`) - Express server with payment-protected endpoints
2. **React Frontend** (`demo-frontend/`) - Interactive web app with Freighter wallet
3. **CLI Client** (`demo-cli/`) - Command-line tool for testing payments

## 🚀 Quick Start

### Prerequisites

Before starting, make sure you have:

- [Node.js](https://nodejs.org/) v18 or higher
- [Freighter Wallet](https://www.freighter.app/) browser extension (for frontend)
- Stellar testnet account with XLM (we'll fund it in setup)

### 1. Install Dependencies

From the project root:

```bash
# Install SDK dependencies
cd sdk/typescript
npm install
npm run build

# Install API server dependencies
cd ../../examples/demo-api-server
npm install

# Install frontend dependencies
cd ../demo-frontend
npm install
```

### 2. Setup Stellar Keys

Generate keys for the API server:

```bash
# Generate a new keypair
stellar keys generate demo-server --network testnet

# Fund the account with testnet XLM
stellar keys fund demo-server --network testnet

# Get your public key
stellar keys address demo-server
```

### 3. Deploy Contract

From the project root:

```bash
# Build the contract
cd contracts/x402-flash-settlement
cargo build --target wasm32-unknown-unknown --release

# Deploy to testnet
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/x402_flash_settlement.wasm \
  --network testnet \
  --source demo-server

# Save the CONTRACT_ID from the output
```

### 4. Configure Environment

#### API Server

Create `examples/demo-api-server/.env`:

```bash
# Copy the example
cp .env.example .env

# Edit with your values
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
CONTRACT_ID=<your_contract_id_from_step_3>
SERVER_SECRET_KEY=<secret_key_from_stellar_keys_generate>
PAYMENT_ADDRESS=<public_key_from_stellar_keys_address>
PORT=3001
```

#### Frontend

Create `examples/demo-frontend/.env`:

```bash
# Copy the example
cp .env.example .env

# Edit with your values
VITE_API_URL=http://localhost:3001
VITE_CONTRACT_ID=<your_contract_id_from_step_3>
VITE_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
VITE_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
```

### 5. Start the Demo

**Terminal 1 - API Server:**

```bash
cd examples/demo-api-server
npm run dev
```

**Terminal 2 - Frontend:**

```bash
cd examples/demo-frontend
npm run dev
```

Open http://localhost:3000 in your browser!

## 🎯 Using the Demo

### Frontend (Web Browser)

1. **Install Freighter**: Get it from [freighter.app](https://www.freighter.app/)

2. **Create/Import Account**:
   - Open Freighter
   - Create new account or import existing
   - Switch to TESTNET network
   - Fund account: https://laboratory.stellar.org/#account-creator

3. **Connect Wallet**:
   - Click "Connect Freighter" button
   - Approve connection in Freighter popup

4. **Open Payment Channel**:
   - Enter amount (e.g., 1000000 stroops = 0.1 XLM)
   - Click "Open Channel"
   - Approve transaction in Freighter

5. **Make API Calls**:
   - Click any endpoint button (Weather, Market, Analytics, AI)
   - Payments are instant - no blockchain confirmation needed!
   - Watch metrics update in real-time

6. **Close Channel**:
   - Click "Close Channel" when done
   - Remaining balance returns to your wallet
   - Approve final settlement transaction

### API Endpoints

All endpoints require payment via x402-flash:

| Endpoint             | Price     | Description             |
| -------------------- | --------- | ----------------------- |
| `GET /api/weather`   | 0.001 XLM | Current weather data    |
| `GET /api/market`    | 0.005 XLM | Real-time market prices |
| `GET /api/analytics` | 0.01 XLM  | Premium analytics       |
| `POST /api/ai/query` | 0.02 XLM  | AI-powered queries      |

Free endpoints (no payment required):

| Endpoint       | Description     |
| -------------- | --------------- |
| `GET /health`  | Health check    |
| `GET /info`    | API information |
| `GET /metrics` | Payment metrics |

## 🔧 Development

### Building

```bash
# API Server
cd examples/demo-api-server
npm run build
npm start

# Frontend
cd examples/demo-frontend
npm run build
npm run preview
```

### Project Structure

```
examples/
├── demo-api-server/
│   ├── src/
│   │   └── index.ts          # Express server with x402 middleware
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── demo-frontend/
│   ├── src/
│   │   ├── App.tsx           # Main React component
│   │   ├── components/       # UI components
│   │   ├── hooks/            # React hooks for wallet & payments
│   │   ├── styles/           # CSS styles
│   │   └── main.tsx          # Entry point
│   ├── package.json
│   ├── vite.config.ts
│   └── .env.example
└── README.md
```

## 🎨 Frontend Features

- **Freighter Integration**: Native Stellar wallet support
- **Real-time Metrics**: Live payment tracking via WebSocket
- **Channel Management**: Visual channel status and balance
- **API Testing**: Interactive endpoint testing
- **Responsive Design**: Works on desktop and mobile
- **Dark Theme**: Eye-friendly Stellar-themed UI

## 🔐 Security Notes

⚠️ **TESTNET ONLY**: These examples use Stellar testnet. Never use testnet keys/contracts on mainnet.

- Session keypairs are generated client-side for payment signing
- Private keys never leave the browser
- Freighter handles transaction signing securely
- All payments are verified on-chain via smart contract

## 📊 How Flash Payments Work

```
┌─────────────┐         ┌─────────────┐         ┌──────────────┐
│   Client    │         │  API Server │         │   Contract   │
│  (Browser)  │         │   (Node.js) │         │   (Soroban)  │
└─────────────┘         └─────────────┘         └──────────────┘
       │                        │                        │
       │ 1. Open Channel        │                        │
       │───────────────────────>│                        │
       │                        │ 2. Create Escrow       │
       │                        │───────────────────────>│
       │                        │ 3. Escrow Created      │
       │<─────────────────────────────────────────────────
       │                        │                        │
       │ 4. API Request         │                        │
       │   + Payment Auth       │                        │
       │───────────────────────>│ 5. Verify Signature   │
       │                        │  (instant, off-chain) │
       │ 6. Response            │                        │
       │<───────────────────────│                        │
       │                        │                        │
       │ 7. More Requests       │                        │
       │   (instant payments)   │                        │
       │<──────────────────────>│                        │
       │                        │                        │
       │ 8. Close Channel       │                        │
       │───────────────────────>│                        │
       │                        │ 9. Settle On-Chain    │
       │                        │───────────────────────>│
       │                        │ 10. Settlement Done   │
       │<─────────────────────────────────────────────────
```

**Key Benefits**:

- ⚡ Instant payments (no blockchain confirmation)
- 💰 Lower costs (batch settlement)
- 🔒 Secure (cryptographic signatures)
- 🚀 Scalable (unlimited requests per channel)

## 🐛 Troubleshooting

### Freighter Not Detected

- Make sure Freighter extension is installed
- Try refreshing the page
- Check browser console for errors

### Transaction Failed

- Ensure your account has sufficient XLM balance
- Check you're on testnet network in Freighter
- Verify CONTRACT_ID is correct in .env

### API Server Not Responding

- Check server is running (`npm run dev`)
- Verify .env configuration
- Check server console for errors
- Make sure port 3001 is not in use

### Channel Opening Fails

- Ensure account is funded (min ~2 XLM for fees)
- Verify contract is deployed correctly
- Check server secret key is valid
- Look at browser developer console

### Payment Verification Fails

- Ensure channel is open
- Check payment amount matches endpoint price
- Verify signature is being created correctly
- Check server logs for details

## 📚 Learn More

- [x402 Protocol Specification](https://github.com/x402/spec)
- [Stellar Documentation](https://developers.stellar.org/)
- [Soroban Smart Contracts](https://soroban.stellar.org/)
- [Freighter Wallet](https://docs.freighter.app/)

## 🤝 Support

Having issues? Check:

1. [GitHub Issues](https://github.com/yourusername/x402-flash-sdk/issues)
2. [Stellar Stack Exchange](https://stellar.stackexchange.com/)
3. [Stellar Discord](https://discord.gg/stellardev)

## 📄 License

MIT License - see LICENSE file for details

---

**Happy Building! 🚀**

Built with ❤️ using Stellar and the x402-flash SDK
