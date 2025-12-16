# Phase 1 Stellar SDK - Manual Testing Guide

## Prerequisites

1. **Stellar Testnet Account**
   - Generate keypair: `stellar keys generate test --network testnet`
   - Fund account: Visit https://laboratory.stellar.org/#account-creator

2. **Environment Variables**
   ```bash
   # Create .env in sdk/typescript/
   STELLAR_RPC_URL=https://soroban-testnet.stellar.org
   STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
   CONTRACT_ID=your_deployed_contract_id
   CLIENT_SECRET_KEY=your_secret_key
   SERVER_SECRET_KEY=server_secret_key
   PAYMENT_ADDRESS=server_public_key
   ```

## Test 1: Verify SDK Exports

```typescript
// test-imports.ts
import { X402FlashClient, X402FlashServer } from './sdk/typescript/dist/index.js';

console.log('✅ X402FlashClient:', typeof X402FlashClient);
console.log('✅ X402FlashServer:', typeof X402FlashServer);
```

Run:
```bash
npx tsx test-imports.ts
```

**Expected**: Both should be 'function'

---

## Test 2: Client Initialization

```typescript
// test-client.ts
import { X402FlashClient } from './sdk/typescript/dist/index.js';

const client = new X402FlashClient({
  rpcUrl: 'https://soroban-testnet.stellar.org',
  networkPassphrase: 'Test SDF Network ; September 2015',
  contractId: 'CONTRACT_ID',
  secretKey: 'SECRET_KEY',
});

console.log('✅ Client created');
console.log('Public Key:', client.keypair?.publicKey() || 'N/A');
```

**Expected**: Client initializes without errors

---

## Test 3: Server Middleware

```typescript
// test-server.ts
import express from 'express';
import { X402FlashServer } from './sdk/typescript/dist/index.js';

const app = express();
const server = new X402FlashServer({
  rpcUrl: 'https://soroban-testnet.stellar.org',
  networkPassphrase: 'Test SDF Network ; September 2015',
  contractId: 'CONTRACT_ID',
  secretKey: 'SERVER_SECRET',
  paymentAddress: 'SERVER_PUBLIC',
});

app.use(express.json());

app.get('/test', server.middleware({
  'GET /test': {
    price: '1000000',
    token: 'NATIVE',
    network: 'stellar-testnet',
  },
}), (req, res) => {
  res.json({ message: 'Payment received!' });
});

app.listen(3000, () => {
  console.log('✅ Server running on port 3000');
});
```

**Expected**: Server starts without errors

---

## Test 4: Demo API Server

```bash
cd examples/demo-api-server
npm install
npm run dev
```

**Expected Output**:
```
🚀 Demo API Server running on port 3000
💳 x402-flash middleware enabled
📡 Endpoints:
   GET  /api/weather - Price: 100000 stroops
   GET  /api/premium-data - Price: 500000 stroops
```

**Test Endpoints**:
```bash
# Should return 402 Payment Required
curl http://localhost:3000/api/weather

# Should return payment requirements
curl -v http://localhost:3000/api/weather 2>&1 | grep "402"
```

---

## Test 5: Payment Flow (Requires Deployed Contract)

1. **Start demo server**:
   ```bash
   cd examples/demo-api-server
   npm run dev
   ```

2. **Run demo client** (in another terminal):
   ```bash
   cd examples/demo-client
   npm run dev
   ```

**Expected Flow**:
1. Client opens channel with escrow
2. Client makes request to /api/weather
3. Server returns 402
4. Client creates payment auth
5. Client retries with X-Payment header
6. Server verifies and responds
7. Settlement happens on-chain (async)

---

## Common Issues

### Issue 1: "Contract not found"
**Solution**: Deploy contract first or use mock mode

### Issue 2: "Insufficient balance"
**Solution**: Fund account from Friendbot

### Issue 3: "Invalid signature"
**Solution**: Check keypair matches public key

---

## Success Criteria

- [x] SDK builds without errors ✅
- [x] Client can be instantiated ✅
- [x] Server middleware initializes ✅
- [x] Demo server starts ✅
- [ ] Can open payment channel (needs contract)
- [ ] Can make paid request (needs contract)
- [ ] Can close channel (needs contract)

**Current Status**: SDK is functional, waiting for contract deployment for end-to-end testing
