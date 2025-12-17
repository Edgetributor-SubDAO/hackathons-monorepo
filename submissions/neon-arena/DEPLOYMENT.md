# Neon Arena - On-Chain Deployment Guide

## 🌙 Deploying to Moonbase Alpha (Polkadot Ecosystem)

Moonbase Alpha is Moonbeam's testnet - an EVM-compatible parachain on Polkadot.

---

## Step 1: Get Free Test Tokens (DEV)

Since you don't have test tokens, follow these steps:

### 1.1 Add Moonbase Alpha to MetaMask

**Option A - Auto-add:**
Click "Connect for On-Chain" in the game and MetaMask will prompt you to add the network.

**Option B - Manual:**
- **Network Name:** Moonbase Alpha
- **RPC URL:** `https://rpc.api.moonbase.moonbeam.network`
- **Chain ID:** 1287
- **Currency Symbol:** DEV
- **Block Explorer:** `https://moonbase.moonscan.io/`

### 1.2 Get Free DEV Tokens

1. Go to: **https://faucet.moonbeam.network/**
2. Connect your MetaMask wallet
3. Complete the verification (Twitter/Discord)
4. Receive ~1 DEV token (enough for ~100+ transactions!)

---

## Step 2: Deploy the Contract

### 2.1 Set Up Environment

Create a `.env` file in the `contracts` folder:

```bash
# Copy from .env.example
cp .env.example .env
```

Edit `.env` and add your private key:
```
PRIVATE_KEY=your_metamask_private_key_here
```

**⚠️ To get your private key from MetaMask:**
1. Open MetaMask
2. Click the 3 dots menu → Account Details
3. Click "Export Private Key"
4. Enter your password
5. Copy the key (NEVER share this!)

### 2.2 Deploy to Moonbase Alpha

```bash
cd contracts
npm run deploy:moonbase
```

Or directly:
```bash
npx hardhat run polkadot/deploy.js --network moonbase
```

### 2.3 Save the Contract Address

After deployment, you'll see output like:
```
✅ GameLeaderboard deployed to: 0x1234...abcd
```

Copy this address!

---

## Step 3: Connect Frontend to Contract

### 3.1 Update Frontend Environment

Edit `frontend/.env.local`:
```
NEXT_PUBLIC_LEADERBOARD_CONTRACT=0xYourContractAddressHere
```

### 3.2 Restart the Frontend

```bash
cd frontend
npm run dev
```

---

## Step 4: Test On-Chain Features

1. Open the game at http://localhost:3000
2. Sign up and go to the Arena
3. Click "🔗 Connect for On-Chain"
4. MetaMask will prompt to add Moonbase Alpha
5. Play a game
6. After game over, click "⛓️ Submit Score On-Chain"
7. Approve the transaction in MetaMask
8. Your score is now on the blockchain! 🎉

---

## 📊 Viewing On-Chain Data

- **Leaderboard:** Visible in the Arena page
- **Block Explorer:** https://moonbase.moonscan.io/
- **Your transactions:** Search your wallet address

---

## 🔧 Troubleshooting

### "Not enough balance"
→ Get more DEV from the faucet: https://faucet.moonbeam.network/

### "Contract not deployed"
→ Make sure you set `NEXT_PUBLIC_LEADERBOARD_CONTRACT` in `.env.local`

### "Network not supported"
→ The game will automatically prompt to add Moonbase Alpha

---

## 💰 Gas Costs

Each action costs approximately:
- Register Player: ~0.0001 DEV
- Submit Score: ~0.0002 DEV

With 1 DEV from the faucet, you can play hundreds of games!
