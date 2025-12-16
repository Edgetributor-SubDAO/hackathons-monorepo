# SDK Monetization Demo

Complete demonstration of AI Agent monetization using the x402-AI SDK packages.

## Architecture

This demo showcases the **proper** way to build monetized AI agents using the x402 ecosystem:

```
┌─────────────────────────────────────────────────────────────┐
│                     SDK Monetization Demo                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐       ┌──────────────┐                    │
│  │  agent.ts    │       │  server.ts   │                    │
│  │              │       │              │                    │
│  │  EchoAgent   │──────>│ AgentServer  │                    │
│  │  extends     │       │              │                    │
│  │  BaseAgent   │       │ @x402-ai/    │                    │
│  │              │       │  server      │                    │
│  │ @x402-ai/    │       │              │                    │
│  │  core        │       │              │                    │
│  └──────────────┘       └──────┬───────┘                    │
│                                 │                             │
│                                 │ HTTP + x402-flash           │
│                                 │                             │
│                         ┌───────▼────────┐                   │
│                         │   client.ts    │                   │
│                         │                │                   │
│                         │  AgentClient   │                   │
│                         │                │                   │
│                         │  @x402-ai/     │                   │
│                         │   client       │                   │
│                         │                │                   │
│                         └────────────────┘                   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## What's Demonstrated

### 1. **Agent (`agent.ts`)**

- Extends `BaseAgent` from `@x402-ai/core`
- Implements required methods: `initialize()`, `execute()`, `calculateCost()`
- Defines capabilities, pricing model, and metadata
- Proper usage tracking and cost calculation

### 2. **Server (`server.ts`)**

- Uses `AgentServer` from `@x402-ai/server`
- Automatic x402-flash payment integration
- CORS, rate limiting, usage tracking built-in
- Exposes standard endpoints: `/health`, `/metadata`, `/execute`, `/stream`

### 3. **Client (`client.ts`)**

- Uses `AgentClient` from `@x402-ai/client`
- Automatic payment channel management
- Simple API: `client.call(endpoint, request)`
- Handles metadata fetching, funding, payments automatically

## Setup

```bash
# Install dependencies
npm install

# Make sure packages are built
cd ../../packages/core && npm run build
cd ../server && npm run build
cd ../client && npm run build
```

## Running the Demo

### Option 1: Run both server and client together

```bash
npm run both
```

### Option 2: Run separately

```bash
# Terminal 1 - Start server
npm run server

# Terminal 2 - Run client
npm run client "Hello AI!"
```

## Configuration

Create `.env` files or use existing ones:

```env
RPC_URL=https://soroban-testnet.stellar.org
NETWORK_PASSPHRASE=Test SDF Network ; September 2015
CONTRACT_ID=CA3U6I3JCEMQ6DCTWVIHBTPLA2C5BWQ5YLAGC7WFNHTD3ROKE7PUHPWH
SERVER_SECRET_KEY=SCYHMGC6IGCVWHZEDGX55HIHCQAJLWWQYACPWXGHZ6DHQDFBCTLUNSHD
SERVER_PUBLIC_KEY=GDUTKZYSPCITQVMC27AS4QLE5RSZ6MQOWFXDM23YVRKMQG55Q7HGNRT5
```

## Testing Different Messages

```bash
npm run client "What is the meaning of life?"
npm run client "Hello there!"
npm run client "Help me understand"
npm run client "What's the weather?"
```

## Key Features

✅ **Proper SDK Usage**: Uses official @x402-ai packages  
✅ **Automatic Payments**: Client handles payment channels automatically  
✅ **Usage Tracking**: Detailed metrics on tokens, compute time, cost  
✅ **Rate Limiting**: Built-in protection against abuse  
✅ **CORS Support**: Ready for frontend integration  
✅ **Type Safety**: Full TypeScript support  
✅ **Extensible**: Easy to add new capabilities and pricing models

## Package Structure

```
@x402-ai/core        - BaseAgent, types, schemas
@x402-ai/server      - AgentServer, middleware, metrics
@x402-ai/client      - AgentClient, payment handling
@x402-flash/stellar  - Payment protocol implementation
```

## Next Steps

1. **Add Real AI**: Replace EchoAgent with actual AI (OpenAI, Anthropic, etc.)
2. **Deploy Production**: Use mainnet contract and real payments
3. **Add Streaming**: Implement streaming responses for long outputs
4. **Build Frontend**: Create web UI using demo-frontend as template
5. **Marketplace**: Register agent in marketplace for discovery

## Comparison with Simple Demo

| Feature          | Simple Demo           | SDK Demo          |
| ---------------- | --------------------- | ----------------- |
| Agent Definition | Manual class          | Extends BaseAgent |
| Server Setup     | Raw Express           | AgentServer class |
| Client Setup     | Raw fetch + wrapFetch | AgentClient class |
| Payment Handling | Manual middleware     | Automatic         |
| Usage Tracking   | Manual                | Built-in          |
| Rate Limiting    | None                  | Built-in          |
| Type Safety      | Partial               | Full              |
| Extensibility    | Limited               | High              |

## Troubleshooting

**Server won't start:**

- Check that port 5000 is available
- Verify packages are built (`npm run build` in each package)
- Check `.env` configuration

**Client connection fails:**

- Ensure server is running on port 5000
- Check network connectivity
- Verify Friendbot funded the account

**Payment errors:**

- Confirm contract is deployed and initialized
- Check that server has correct contract ID
- Verify keypairs have proper permissions

## Learn More

- [Phase 2 Documentation](../../docs/PHASE2.md)
- [Agent Development Guide](../../packages/core/README.md)
- [Server API Reference](../../packages/server/README.md)
- [Client API Reference](../../packages/client/README.md)
