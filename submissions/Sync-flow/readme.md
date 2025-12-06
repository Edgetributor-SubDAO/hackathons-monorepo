🏛 System Design: Base ↔ Polkadot Liquidity Bridge

1. Executive Summary

This document outlines the architecture for a centralized "Liquidity Pool" Bridge. Instead of minting new "wrapped" tokens (which requires complex auditing), this system uses simple Lock and Release mechanics with native liquidity on both ends.

Core Concept: The bridge acts as a currency exchange counter. Users deposit currency on one side (Base), and the system dispenses the equivalent value on the other side (Polkadot) from its own reserves.

2. Architecture Overview

The system consists of three distinct components working in a pipeline.

sequenceDiagram
    participant User as User (Base Wallet)
    participant Vault as Base Vault (Smart Contract)
    participant Relayer as Bridge Server (Node.js)
    participant Dispenser as Polkadot Wallet (Hot Wallet)
    participant Receiver as User (Polkadot Wallet)

    User->>Vault: 1. Deposit ETH + "Polkadot Address"
    Vault->>Relayer: 2. Emit Event "Deposit Received"
    Relayer->>Relayer: 3. Calculate Fees & Verify
    Relayer->>Dispenser: 4. Trigger Transfer Command
    Dispenser->>Receiver: 5. Send PAS/DOT (Keep-Alive Transfer)


Component Details

Component

Network

Type

Role

1. The Vault

Base (EVM)

Smart Contract

The Lockbox. Accepts user funds. It is passive; it cannot send money out on its own. It serves as the "Source of Truth" for deposits.

2. The Relayer

Off-Chain

Node.js Script

The Brain. It watches the Vault 24/7. When it sees money enter the Vault, it calculates the exchange rate/fees and orders the Dispenser to pay out.

3. The Dispenser

Polkadot

Wallet Account

The ATM. A standard Polkadot account controlled by the Relayer. It holds a pool of liquid tokens (PAS/DOT) ready to send to users.

3. Detailed Transaction Flow

Step 1: The Deposit (Base Side)

User Action: Sends 0.1 ETH to the BridgeVault contract.

Input Data: The user includes a string: "14...MyPolkadotAddress".

System Action: The contract locks the ETH and emits a Deposit event.

Status: User has paid (ETH - 0.1). Vault has (+0.1 ETH).

Step 2: Detection & Logic (The Relayer)

Detection: The Node.js script detects the event via WebSocket/RPC.

Fee Calculation:

Gross: 0.1 ETH equivalent.

Service Fee (1%): -0.001 ETH equivalent.

Net Payout: 0.099 ETH equivalent.

Safety Check: Does the Dispenser have enough Polkadot tokens to pay 0.099?

Yes: Proceed.

No: Log Error INSUFFICIENT_LIQUIDITY.

Step 3: The Payout (Polkadot Side)

Action: The Relayer uses the Dispenser's Seed Phrase to sign a transaction.

Type: balances.transferKeepAlive (Prevents the Dispenser account from being accidentally deleted if balance hits 0).

Status: The Polkadot network processes the block. The User receives the funds.

4. Maintenance & "Fixing" (Liquidity Rebalancing)

Crucial Concept: Since this is a one-way bridge (Base -> Polkadot), the system naturally becomes unbalanced.

The Vault (Base) will fill up with ETH.

The Dispenser (Polkadot) will run empty.

The "Fixing" Procedure (Weekly Maintenance)

To keep the bridge operational, the Admin must perform a Liquidity Cycle:

Extract: The Admin calls the withdraw() function on the Base Vault Contract. This drains the accumulated ETH to the Admin's wallet.

Swap: The Admin takes this ETH to an external exchange (e.g., Binance, Coinbase, Uniswap) and sells it for DOT (or PAS).

Refill: The Admin sends the newly purchased DOT/PAS to the Dispenser's Address on Polkadot.

Visualizing the Imbalance:

Day 1: Vault: 0 ETH | Dispenser: 1000 DOT

Day 7: Vault: 10 ETH | Dispenser: 0 DOT (Bridge Stops Working)

After Fix: Vault: 0 ETH | Dispenser: 1000 DOT

5. Profit & Gas Model

How do you ensure you don't lose money on transaction fees?

The Equation:
Fee Charged (in ETH) > Cost of Gas (in DOT)

Inbound Gas: The User pays the gas to deposit ETH into the Vault. (Cost to you: $0).

Outbound Gas: The Dispenser pays the gas to send DOT to the user. (Cost to you: ~$0.05).

Your Revenue: You charge a 1% fee on the principal amount.

Example: User sends $100. You keep $1.

Net Profit: $1.00 (Fee) - $0.05 (Gas) = **$0.95 Profit**.

6. Implementation Assets

- Smart Contract: `contracts/BridgeVault.sol`
  - Designed for deployment from Remix; no Hardhat scripts required.
  - Handles deposits, emits detailed `Deposit` events (with unique IDs) and lets the admin withdraw for weekly rebalancing.
  - Configurable fee (capped at 5%), pausability and two-step ownership transfer for safety.

- Relayer Backend: `backend/`
  - Node.js + TypeScript service that watches the Base (Sepolia) vault at `0x21E2...cfd9` and instructs a Polkadot *testnet* wallet (Paseo) to pay out via `balances.transferKeepAlive`.
  - Configuration is now hard-coded for the test harness: Base Sepolia RPC/WSS, Paseo RPC + seed phrase, 1 confirmation, and a guaranteed **1000 DOT** payout per deposit (no env vars needed).
  - Built without deployment tooling; run it as a long-lived service or container.
- Frontend DApp: `frontend/`
  - Next.js + wagmi single-page app that lets users connect Coinbase Wallet, submit **0.00001 ETH** deposits to `BridgeVault`, and watch Base Sepolia confirmations in real time.
  - Uses the same hard-coded RPC/contract address, so you can clone + run without touching `.env` while testing.

### Backend Quickstart

```bash
cd backend
npm install
npm run dev          # starts the relayer with the baked-in testnet config
```

Hard-coded test values:

- Base Sepolia RPC/WSS: `https://sepolia.base.org` / `wss://sepolia.base.org`
- Vault contract: `0x21E28d827CAF04ca6BA6bf9fDec8885B983FCfD9`
- Paseo RPC: `wss://paseo-rpc.polkadot.io`
- Paseo signer seed: `follow crazy enjoy gun spray bus mistake powder danger sort primary zone`
- Fee: 1% (but payout is force-set to **1000 DOT** regardless of deposit amount)

### Frontend Quickstart

```bash
cd frontend
npm install
npm run dev
```

UI flow:

1. Hit “Connect Coinbase Wallet” → the wagmi config uses Coinbase Wallet SDK by default but also falls back to any injected wallet for testing.
2. Enter the ETH amount + destination Polkadot address (defaults to **0.00001 ETH**, the recommended test amount).
3. Click “Send deposit” to invoke `BridgeVault.deposit(polkadotAddress)`; the backend relayer ignores the amount and always pays **1000 DOT** on Paseo.
4. Basescan (Sepolia) link + confirmation status show up immediately; once the backend relayer sees the deposit it handles the fixed PAS payout.

#### Where to get TESTNET RPC URLs

- **Base Sepolia RPC/WS**: Base documents the public testnet endpoints plus faucets here: [https://docs.base.org/tools/network-faucets](https://docs.base.org/tools/network-faucets). Use `https://sepolia.base.org` (HTTP) and `wss://sepolia.base.org` (WebSocket) or request API-keyed endpoints from providers like Alchemy/QuickNode/etc if you need higher limits.
- **Paseo (Polkadot testnet) WS**: Use `wss://paseo-rpc.polkadot.io` or any mirror listed on the Polkadot wiki: [https://wiki.polkadot.network/docs/maintain-endpoints#public-testnet-endpoints](https://wiki.polkadot.network/docs/maintain-endpoints#public-testnet-endpoints).
- Both endpoints just need to be reachable from the relayer host; if your provider issues API keys, append/include them per their docs.

Operational safeguards baked into the relayer:

- Waits for configurable Base confirmations before paying out.
- Verifies dispenser balance before each transfer and logs `INSUFFICIENT_LIQUIDITY` without double-spending.
- Persists processed `depositId`s on disk to survive restarts.
- Graceful SIGINT/SIGTERM handling so it can run under systemd, PM2, or container orchestrators.