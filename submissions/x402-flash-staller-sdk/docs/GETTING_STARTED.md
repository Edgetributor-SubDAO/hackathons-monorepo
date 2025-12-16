# Getting Started with x402-Flash SDK

This guide will help you set up and use the x402-Flash micropayment system on Stellar Soroban.

## Prerequisites

- Node.js >= 18
- Rust and Cargo
- Stellar CLI: `cargo install --locked stellar-cli --features opt`
- A Stellar testnet account with XLM

## Installation

### 1. Clone and Install Dependencies

```bash
git clone <your-repo>
cd x402-flash-sdk
npm install
```

### 2. Build the Smart Contract

```bash
cd contracts/x402-flash-settlement
cargo build --target wasm32-unknown-unknown --release
cd ../..
```

### 3. Set Up Testnet Accounts

Generate test accounts and fund them:

```bash
cd scripts
npm install
npm run setup
```

Copy the output secrets to your `.env` file (copy from `.env.example`).

### 4. Deploy the Contract

```bash
# Build the contract first if you haven't
cd contracts/x402-flash-settlement
cargo build --target wasm32-unknown-unknown --release

# Deploy using Stellar CLI
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/x402_flash_settlement.wasm \
  --network testnet \
  --source <YOUR_ADMIN_SECRET_KEY>

# Save the CONTRACT_ID to your .env file
```

### 5. Initialize the Contract

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  --source <ADMIN_SECRET_KEY> \
  -- initialize \
  --admin <ADMIN_PUBLIC_KEY>
```

## Usage Examples

### Server-Side: Protect API Endpoints

```typescript
import express from 'express';
import { x402FlashMiddleware } from '@x402-flash/stellar-sdk';

const app = express();

const paymentMiddleware = x402FlashMiddleware(
  {
    rpcUrl: 'https://soroban-testnet.stellar.org',
    networkPassphrase: 'Test SDF Network ; September 2015',
    contractId: process.env.CONTRACT_ID!,
    secretKey: process.env.SERVER_SECRET_KEY!,
    paymentAddress: process.env.PAYMENT_ADDRESS!,
  },
  {
    'GET /api/premium': {
      price: '100000', // stroops
      token: process.env.TOKEN_ADDRESS!,
      network: 'stellar-testnet',
    },
  }
);

app.use(paymentMiddleware);

app.get('/api/premium', (req, res) => {
  res.json({ data: 'Premium content!' });
});

app.listen(3000);
```

### Client-Side: Make Paid Requests

```typescript
import { X402FlashClient } from '@x402-flash/stellar-sdk';

const client = new X402FlashClient({
  rpcUrl: 'https://soroban-testnet.stellar.org',
  networkPassphrase: 'Test SDF Network ; September 2015',
  contractId: process.env.CONTRACT_ID!,
  secretKey: process.env.CLIENT_SECRET_KEY!,
});

// Open payment channel
await client.openEscrow(
  serverAddress,
  tokenAddress,
  '10000000', // 1 XLM
  86400 // 24 hours
);

// Use wrapped fetch for automatic payments
const paidFetch = client.wrapFetch();
const response = await paidFetch('http://localhost:3000/api/premium');
const data = await response.json();
```

## Run the Example

### Terminal 1: Start the API Server

```bash
cd examples/demo-api-server
npm install
npm run dev
```

### Terminal 2: Run the Client

```bash
cd examples/demo-client
npm install
npm start
```

## Next Steps

- Read the [Architecture Documentation](./ARCHITECTURE.md)
- Explore the [API Reference](./API.md)
- Check out [Phase 2 AI Agent Monetization](../Phase2.md)

## Troubleshooting

### "Contract not found"
Make sure you've deployed the contract and updated `CONTRACT_ID` in your `.env` file.

### "Insufficient funds"
Fund your testnet accounts using [Friendbot](https://friendbot.stellar.org/).

### "Nonce already used"
The payment has already been settled. The nonce system prevents replay attacks.

## Support

- [Stellar Discord](https://discord.gg/stellar)
- [GitHub Issues](https://github.com/your-repo/issues)
