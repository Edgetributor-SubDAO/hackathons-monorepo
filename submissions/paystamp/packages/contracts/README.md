# PayStamp Smart Contracts

This directory contains the smart contracts for PayStamp:

1. **Stellar Soroban Contract** (`stellar-soroban/`) - Payment processing on Stellar
2. **Polkadot ink! Contract** (`polkadot-ink/`) - Access control on Polkadot
3. **Shared Types** (`shared-types/`) - TypeScript types shared across the stack

## Architecture

```
User Payment (Stellar)
    ↓
Soroban Contract emits PaymentReceived event
    ↓
Relayer watches and processes event
    ↓
Relayer calls ink! contract mint()
    ↓
Access Stamp NFT minted on Polkadot
```

## Quick Start

### 1. Install Prerequisites

**For Stellar:**
```bash
curl -sSL https://soroban.stellar.org | sh
```

**For Polkadot:**
```bash
cargo install cargo-contract --force
```

### 2. Build Contracts

```bash
# Stellar contract
cd packages/contracts/stellar-soroban
make build

# Polkadot contract
cd packages/contracts/polkadot-ink
make build
```

### 3. Deploy Contracts

```bash
# Stellar (Futurenet)
cd packages/contracts/stellar-soroban
make deploy-futurenet

# Polkadot (Shibuya)
cd packages/contracts/polkadot-ink
make deploy-shibuya
```

### 4. Initialize Contracts

**Stellar:**
```bash
soroban contract invoke \
  --network futurenet \
  --id <CONTRACT_ID> \
  -- initialize \
  --admin <ADMIN_ADDRESS>
```

**Polkadot:**
```bash
cargo contract instantiate --network shibuya
```

## Contract Details

### Stellar Soroban Contract

- **Purpose**: Process payments and emit events
- **Network**: Stellar Futurenet/Testnet
- **Language**: Rust (Soroban SDK)
- **Events**: `PAYMENT_RECEIVED`

See [stellar-soroban/README.md](./stellar-soroban/README.md) for details.

### Polkadot ink! Contract

- **Purpose**: Manage access stamps as NFTs
- **Network**: Polkadot Shibuya/Shiden/Astar
- **Language**: Rust (ink! framework)
- **Standard**: PSP-34 (NFT)

See [polkadot-ink/README.md](./polkadot-ink/README.md) for details.

### Shared Types

TypeScript types and Zod schemas for:
- Payment events
- Access stamps
- Service configurations
- Contract deployments

See [shared-types/README.md](./shared-types/README.md) for details.

## Testing

Both contracts include comprehensive test suites:

```bash
# Stellar tests
cd packages/contracts/stellar-soroban
cargo test

# Polkadot tests
cd packages/contracts/polkadot-ink
cargo test
```

## Type Generation

After deployment, TypeScript types are generated:

- Stellar: Generated via `soroban contract bindings typescript`
- Polkadot: Metadata copied to SDK package for type generation

## Security Considerations

- ✅ Admin-only functions protected
- ✅ Pause mechanism for emergencies
- ✅ Payment validation (min/max amounts)
- ✅ Service whitelisting
- ✅ Non-transferable NFTs (access stamps)
- ✅ Expiration-based access control

## Next Steps

1. Deploy contracts to testnets
2. Initialize with admin addresses
3. Register services
4. Test end-to-end flow
5. Deploy to mainnet when ready

