# @x402-flash/stellar-sdk

TypeScript SDK for building x402-flash micropayment applications on Stellar Soroban. Compatible with the [x402 payment protocol](https://x402.org/).

## Features

- ✅ **x402-Express Compatible** - Works with the x402 payment protocol standard
- ⚡ **Flash Payments** - Instant off-chain payments with on-chain settlement
- 🔐 **Secure** - Ed25519 signature verification and nonce-based replay protection
- 🌟 **Payment Channels** - Efficient escrow-based payment channels
- 🎯 **Easy Integration** - Simple Express middleware for protected routes
- 📦 **Type-Safe** - Full TypeScript support with comprehensive types

## Installation

```bash
npm install @x402-flash/stellar-sdk
```

## Quick Start

### Server-Side (Express)

```typescript
import express from "express";
import { paymentMiddleware } from "@x402-flash/stellar-sdk";

const app = express();

// Configure payment middleware
app.use(
  paymentMiddleware(
    {
      rpcUrl: "https://soroban-testnet.stellar.org",
      networkPassphrase: "Test SDF Network ; September 2015",
      contractId: "YOUR_CONTRACT_ID",
      secretKey: "YOUR_SERVER_SECRET",
      paymentAddress: "YOUR_PAYMENT_ADDRESS",
    },
    {
      // Simple price format
      "GET /api/data": "10000", // 0.001 XLM

      // Full configuration format
      "POST /api/premium": {
        price: "100000", // 0.01 XLM
        token: "native",
        network: "stellar-testnet",
        config: {
          description: "Access to premium API",
          mimeType: "application/json",
          maxTimeoutSeconds: 60,
        },
      },
    }
  )
);

// Protected routes
app.get("/api/data", (req, res) => {
  res.json({ message: "This is paid content!" });
});

app.listen(3000);
```

### Client-Side

```typescript
import { X402FlashClient } from "@x402-flash/stellar-sdk";

const client = new X402FlashClient({
  rpcUrl: "https://soroban-testnet.stellar.org",
  networkPassphrase: "Test SDF Network ; September 2015",
  contractId: "YOUR_CONTRACT_ID",
  secretKey: "YOUR_CLIENT_SECRET",
});

// 1. Open payment channel with escrow
await client.openEscrow(
  "SERVER_ADDRESS",
  "native", // Token address (or 'native' for XLM)
  "10000000", // 1 XLM escrow
  86400 // 24 hours TTL
);

// 2. Make payments automatically with wrapped fetch
const paidFetch = client.wrapFetch();

const response = await paidFetch("http://localhost:3000/api/data");
const data = await response.json();
console.log(data);

// 3. Check remaining balance
const balance = await client.getEscrowBalance("SERVER_ADDRESS");
console.log(`Remaining: ${balance} stroops`);

// 4. Close channel when done
await client.closeEscrow("SERVER_ADDRESS");
```

## API Reference

### Client API

#### `X402FlashClient`

```typescript
class X402FlashClient {
  constructor(config: X402FlashClientConfig);

  // Open payment channel
  async openEscrow(
    server: string,
    token: string,
    amount: string,
    ttlSeconds: number
  ): Promise<string>;

  // Create payment authorization
  async createPaymentAuth(
    server: string,
    token: string,
    amount: string,
    deadline: number
  ): Promise<{ auth: PaymentAuth; signature: string; publicKey: string }>;

  // Wrap fetch for automatic payment handling
  wrapFetch(fetchFn?: typeof fetch): typeof fetch;

  // Get current escrow balance
  async getEscrowBalance(server: string): Promise<string>;

  // Close payment channel
  async closeEscrow(server: string): Promise<string>;
}
```

### Server API

#### `paymentMiddleware(config, routes)`

Express middleware factory function (x402-express compatible).

**Parameters:**

- `config: X402FlashServerConfig` - Server configuration
- `routes: RoutesConfig` - Route payment configurations

**Returns:** Express middleware function

```typescript
interface X402FlashServerConfig {
  rpcUrl: string;
  networkPassphrase: string;
  contractId: string;
  secretKey: string;
  paymentAddress: string;
}

type RoutesConfig = Record<string, string | RouteConfig>;

interface RouteConfig {
  price: string;
  token: string;
  network: string;
  config?: PaymentConfig;
}
```

#### `X402FlashServer`

Lower-level server class for custom implementations.

```typescript
class X402FlashServer {
  constructor(config: X402FlashServerConfig);

  middleware(routes: RoutesConfig): (req, res, next) => void;

  verifySignature(
    auth: PaymentAuth,
    signature: string,
    publicKey: string
  ): boolean;
}
```

## Configuration

### Environment Variables

Create a `.env` file:

```env
# Stellar Configuration
STELLAR_NETWORK=testnet
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015

# Contract
CONTRACT_ID=YOUR_DEPLOYED_CONTRACT_ID
TOKEN_ADDRESS=native

# Server Credentials
SERVER_SECRET_KEY=YOUR_SERVER_SECRET
PAYMENT_ADDRESS=YOUR_SERVER_PUBLIC_KEY

# Client Credentials
CLIENT_SECRET_KEY=YOUR_CLIENT_SECRET
```

### Generate Keys

```bash
# Install Stellar CLI
cargo install --locked stellar-cli

# Generate keys
stellar keys generate server --network testnet
stellar keys generate client --network testnet

# Fund accounts (testnet)
stellar keys fund server --network testnet
stellar keys fund client --network testnet
```

## Payment Flow

1. **Client opens payment channel** with escrow deposit
2. **Client requests protected resource** without payment
3. **Server responds with 402** and payment requirements
4. **Client creates signed payment authorization** (off-chain)
5. **Client retries request** with payment authorization
6. **Server validates signature** and immediately returns content (flash!)
7. **Server settles payment** on-chain asynchronously
8. **Client can close channel** and withdraw remaining funds

## Examples

See the `/examples` directory for complete examples:

- `demo-api-server` - Express API with protected routes
- `demo-client` - CLI client making payments
- `demo-frontend` - React frontend with payment integration

## Error Handling

The SDK provides detailed error messages:

```typescript
try {
  await client.openEscrow(server, token, amount, ttl);
} catch (error) {
  if (error.message.includes("insufficient_balance")) {
    console.error("Not enough funds for escrow");
  } else if (error.message.includes("channel_already_exists")) {
    console.error("Channel already open");
  }
}
```

## Security Considerations

- ✅ Ed25519 signature verification
- ✅ Nonce-based replay protection
- ✅ Deadline enforcement
- ✅ Rate limiting
- ✅ Minimum payment checks
- ⚠️ Always validate payment amounts server-side
- ⚠️ Use HTTPS in production
- ⚠️ Keep secret keys secure

## Comparison with x402-express

This SDK follows the x402 payment protocol standard and provides similar functionality to [x402-express](https://www.npmjs.com/package/x402-express) but for Stellar blockchain:

| Feature          | x402-express         | @x402-flash/stellar-sdk   |
| ---------------- | -------------------- | ------------------------- |
| Blockchain       | Ethereum/Base        | Stellar Soroban           |
| Payment Type     | On-chain per request | Off-chain with settlement |
| Latency          | ~2-10 seconds        | Instant (flash!)          |
| Middleware API   | ✅ Compatible        | ✅ Compatible             |
| Payment Protocol | x402 v1              | x402 v1                   |

## Development

```bash
# Build SDK
npm run build

# Watch mode
npm run dev

# Type check
npm run typecheck

# Clean build
npm run clean
```

## Contributing

Contributions welcome! Please see [CONTRIBUTING.md](../../CONTRIBUTING.md).

## License

MIT License - see [LICENSE](../../LICENSE)

## Links

- [GitHub Repository](https://github.com/AdityaKumar41/flash-stellar-x402)
- [x402 Protocol](https://x402.org/)
- [Stellar Documentation](https://developers.stellar.org/)
- [Soroban Documentation](https://soroban.stellar.org/)

## Support

- Open an [issue](https://github.com/AdityaKumar41/flash-stellar-x402/issues)
- Join the discussion
- Check the [documentation](../../docs/)
