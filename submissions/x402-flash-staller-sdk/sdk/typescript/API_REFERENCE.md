# 📚 x402-Flash Stellar SDK - Complete API Reference

## Installation

```bash
npm install @x402-flash/stellar-sdk
```

## Table of Contents

- [Client API](#client-api)
- [Server API](#server-api)
- [Types](#types)
- [Error Handling](#error-handling)
- [Examples](#examples)

---

## Client API

### `X402FlashClient`

Main client class for making micropayments.

#### Constructor

```typescript
import { X402FlashClient } from '@x402-flash/stellar-sdk';

const client = new X402FlashClient({
  rpcUrl: string;              // Stellar RPC endpoint
  networkPassphrase: string;   // Network passphrase
  contractId: string;          // Deployed contract ID
  secretKey: string;           // Client secret key (S...)
});
```

#### Methods

##### `openEscrow()`

Open a payment channel with escrow deposit.

```typescript
await client.openEscrow(
  server: string,      // Server public key
  token: string,       // Token address or 'native'
  amount: string,      // Amount in stroops
  ttlSeconds: number   // Time-to-live in seconds
): Promise<string>     // Returns transaction hash
```

**Example:**

```typescript
const txHash = await client.openEscrow(
  "GABC...XYZ",
  "native",
  "10000000", // 1 XLM
  86400 // 24 hours
);
```

**Throws:**

- `'Insufficient balance for escrow'`
- `'Payment channel already exists'`
- `'Transaction timeout'`

---

##### `createPaymentAuth()`

Create signed payment authorization (off-chain).

```typescript
await client.createPaymentAuth(
  server: string,     // Server public key
  token: string,      // Token address
  amount: string,     // Payment amount
  deadline: number    // Unix timestamp
): Promise<{
  auth: PaymentAuth;
  signature: string;
  publicKey: string;
}>
```

**Example:**

```typescript
const payment = await client.createPaymentAuth(
  "GABC...XYZ",
  "native",
  "10000",
  Math.floor(Date.now() / 1000) + 60
);
```

---

##### `wrapFetch()`

Wrap fetch function with automatic payment handling.

```typescript
client.wrapFetch(
  fetchFn?: typeof fetch  // Optional custom fetch
): typeof fetch           // Returns wrapped fetch
```

**Example:**

```typescript
const paidFetch = client.wrapFetch();

// Automatically handles 402 responses
const response = await paidFetch("http://api.example.com/data");
const data = await response.json();
```

**Behavior:**

1. Makes initial request
2. If 402 response, reads payment requirements
3. Creates and signs payment authorization
4. Retries with X-Payment header
5. Returns final response

---

##### `getEscrowBalance()`

Get current escrow balance for a channel.

```typescript
await client.getEscrowBalance(
  server: string      // Server public key
): Promise<string>    // Returns balance in stroops
```

**Example:**

```typescript
const balance = await client.getEscrowBalance("GABC...XYZ");
console.log(`Remaining: ${balance} stroops`);
```

---

##### `closeEscrow()`

Close payment channel and withdraw remaining funds.

```typescript
await client.closeEscrow(
  server: string      // Server public key
): Promise<string>    // Returns transaction hash
```

**Example:**

```typescript
const txHash = await client.closeEscrow("GABC...XYZ");
console.log(`Channel closed: ${txHash}`);
```

**Throws:**

- `'No active channel found'`

---

## Server API

### `paymentMiddleware()`

Create Express middleware for payment-protected routes.

```typescript
import { paymentMiddleware } from '@x402-flash/stellar-sdk';

paymentMiddleware(
  config: X402FlashServerConfig,
  routes: RoutesConfig
): (req, res, next) => void
```

#### Configuration

```typescript
interface X402FlashServerConfig {
  rpcUrl: string; // Stellar RPC endpoint
  networkPassphrase: string; // Network passphrase
  contractId: string; // Deployed contract ID
  secretKey: string; // Server secret key
  paymentAddress: string; // Payment receiving address
}
```

#### Routes Configuration

**Simple Format:**

```typescript
{
  'GET /api/data': '10000',      // Just the price
  'POST /api/process': '50000',
}
```

**Full Format:**

```typescript
{
  'POST /api/premium': {
    price: '100000',              // Required
    token: 'native',              // Optional (default: 'native')
    network: 'stellar-testnet',   // Optional (default: 'stellar-testnet')
    config: {                     // Optional
      description: 'Premium API',
      mimeType: 'application/json',
      maxTimeoutSeconds: 60,
      resource: '/custom/path',
    }
  }
}
```

#### Full Example

```typescript
import express from "express";
import { paymentMiddleware } from "@x402-flash/stellar-sdk";

const app = express();

app.use(
  paymentMiddleware(
    {
      rpcUrl: process.env.STELLAR_RPC_URL!,
      networkPassphrase: process.env.STELLAR_NETWORK_PASSPHRASE!,
      contractId: process.env.CONTRACT_ID!,
      secretKey: process.env.SERVER_SECRET_KEY!,
      paymentAddress: process.env.PAYMENT_ADDRESS!,
    },
    {
      "GET /api/weather": "10000",
      "POST /api/ai-query": {
        price: "50000",
        token: "native",
        network: "stellar-testnet",
        config: {
          description: "AI Query Processing",
          maxTimeoutSeconds: 120,
        },
      },
    }
  )
);

app.get("/api/weather", (req, res) => {
  res.json({ temp: 72, condition: "sunny" });
});

app.post("/api/ai-query", (req, res) => {
  res.json({ result: "AI response" });
});

app.listen(3000);
```

---

### `X402FlashServer`

Lower-level server class (advanced usage).

```typescript
import { X402FlashServer } from "@x402-flash/stellar-sdk";

const server = new X402FlashServer(config);

// Get middleware
const middleware = server.middleware(routes);
app.use(middleware);

// Verify signatures manually
const isValid = server.verifySignature(auth, signature, publicKey);
```

---

## Types

### `PaymentAuth`

Payment authorization structure.

```typescript
interface PaymentAuth {
  settlementContract: string; // Contract ID
  client: string; // Client public key
  server: string; // Server public key
  token: string; // Token address
  amount: string; // Payment amount
  nonce: number; // Unique nonce
  deadline: number; // Unix timestamp
}
```

---

### `RouteConfig`

Full route configuration.

```typescript
interface RouteConfig {
  price: string; // Required price in stroops
  token: string; // Token address (default: 'native')
  network: string; // Network name
  config?: PaymentConfig; // Optional metadata
}
```

---

### `PaymentConfig`

Payment metadata.

```typescript
interface PaymentConfig {
  description?: string; // Human-readable description
  mimeType?: string; // Response MIME type
  maxTimeoutSeconds?: number; // Payment timeout
  resource?: string; // Custom resource path
}
```

---

### `X402PaymentRequirements`

402 response format (x402 standard).

```typescript
interface X402PaymentRequirements {
  x402Version: number;
  accepts: Array<{
    scheme: string; // 'flash'
    network: string; // Network name
    maxAmountRequired: string; // Price
    resource: string; // Endpoint path
    description: string; // Description
    mimeType: string; // Response type
    payTo: string; // Payment address
    maxTimeoutSeconds: number; // Timeout
    asset: string; // Token address
    extra?: Record<string, any>; // Custom fields
  }>;
  error?: string;
}
```

---

## Error Handling

### Client Errors

```typescript
try {
  await client.openEscrow(server, token, amount, ttl);
} catch (error) {
  if (error.message.includes("insufficient_balance")) {
    // Not enough funds
  } else if (error.message.includes("channel_already_exists")) {
    // Channel already open
  } else if (error.message.includes("Transaction timeout")) {
    // Transaction took too long
  }
}
```

### Server Errors

The middleware handles errors automatically and returns:

**400 Bad Request:**

- Invalid payment format
- Unsupported x402 version
- Wrong payment scheme
- Network mismatch

**402 Payment Required:**

- No X-Payment header
- Insufficient payment amount

**500 Internal Server Error:**

- Settlement failures (logged, doesn't block response)

---

## Examples

### Example 1: Simple Paid API

```typescript
// server.ts
import express from "express";
import { paymentMiddleware } from "@x402-flash/stellar-sdk";

const app = express();

app.use(
  paymentMiddleware(config, {
    "GET /joke": "1000",
  })
);

app.get("/joke", (req, res) => {
  res.json({ joke: "Why did the developer quit? No cache!" });
});

app.listen(3000);
```

```typescript
// client.ts
import { X402FlashClient } from "@x402-flash/stellar-sdk";

const client = new X402FlashClient(config);

await client.openEscrow(server, "native", "1000000", 3600);

const paidFetch = client.wrapFetch();
const response = await paidFetch("http://localhost:3000/joke");
const joke = await response.json();

console.log(joke);
```

---

### Example 2: AI API with Multiple Endpoints

```typescript
app.use(
  paymentMiddleware(config, {
    "POST /ai/completion": {
      price: "50000",
      config: {
        description: "AI Text Completion",
        maxTimeoutSeconds: 120,
      },
    },
    "POST /ai/image": {
      price: "100000",
      config: {
        description: "AI Image Generation",
        maxTimeoutSeconds: 300,
      },
    },
    "GET /ai/models": "5000",
  })
);

app.post("/ai/completion", async (req, res) => {
  const result = await generateCompletion(req.body.prompt);
  res.json({ result });
});

app.post("/ai/image", async (req, res) => {
  const image = await generateImage(req.body.prompt);
  res.json({ image });
});

app.get("/ai/models", (req, res) => {
  res.json({ models: ["gpt-4", "dall-e"] });
});
```

---

### Example 3: Error Handling

```typescript
const client = new X402FlashClient(config);

try {
  // Try to open channel
  await client.openEscrow(server, "native", "10000000", 86400);
  console.log("✅ Channel opened");
} catch (error) {
  if (error.message.includes("channel_already_exists")) {
    console.log("ℹ️  Channel already open, continuing...");
  } else if (error.message.includes("insufficient_balance")) {
    console.error("❌ Please fund your account");
    process.exit(1);
  } else {
    console.error("❌ Unexpected error:", error);
    throw error;
  }
}

// Use channel
const paidFetch = client.wrapFetch();

try {
  const response = await paidFetch("http://api.example.com/data");

  if (!response.ok) {
    console.error(`API error: ${response.status}`);
  } else {
    const data = await response.json();
    console.log(data);
  }
} catch (error) {
  console.error("Payment failed:", error);
}

// Check balance
const balance = await client.getEscrowBalance(server);
console.log(`Remaining: ${balance} stroops`);

// Close when done
await client.closeEscrow(server);
```

---

## Environment Variables

```env
# Stellar Configuration
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015

# Contract
CONTRACT_ID=CAAAA...
TOKEN_ADDRESS=native

# Server
SERVER_SECRET_KEY=SABC...
PAYMENT_ADDRESS=GABC...

# Client
CLIENT_SECRET_KEY=SXYZ...
```

---

## Best Practices

1. **Always handle errors** - Network can fail
2. **Check balances** - Before closing channels
3. **Use environment variables** - Never commit secrets
4. **Log payments** - For debugging and audit
5. **Set reasonable TTLs** - Balance between convenience and security
6. **Validate amounts** - Server-side validation is crucial
7. **Use HTTPS** - In production environments
8. **Monitor settlement** - Check on-chain settlement success
9. **Graceful degradation** - Handle 402 errors properly
10. **Test thoroughly** - On testnet before mainnet

---

## Support

- **GitHub**: [flash-stellar-x402](https://github.com/AdityaKumar41/flash-stellar-x402)
- **Issues**: [Report bugs](https://github.com/AdityaKumar41/flash-stellar-x402/issues)
- **Docs**: See `/docs` directory
- **Examples**: See `/examples` directory

---

**Version**: 0.1.0  
**License**: MIT  
**Author**: AdityaKumar41
