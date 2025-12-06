# PayStamp Shared Types

TypeScript types and Zod validation schemas shared across the PayStamp stack.

## Purpose

This package provides:
- Type-safe interfaces matching contract events
- Validation schemas for runtime type checking
- Event parsers for Stellar Horizon events
- Contract configuration types

## Exports

### Events (`events.ts`)

- `PaymentEvent` - Payment event from Stellar contract
- `PaymentEventSchema` - Zod validation schema
- `parsePaymentEvent()` - Parse Stellar event data
- `validatePaymentEvent()` - Validate payment event structure

### Access (`access.ts`)

- `AccessStamp` - Access stamp information
- `AccessCheckResult` - Access check query result
- `BatchAccessCheck` - Batch access check request

### Payment (`payment.ts`)

- `PaymentStatus` - Payment status enumeration
- `ServiceConfig` - Service configuration
- `PaymentValidationResult` - Payment validation result
- `PaymentQueryResult` - Payment query result from contract

### Contracts (`contracts.ts`)

- `ContractDeployment` - Deployment information
- `StellarContractConfig` - Stellar contract configuration
- `PolkadotContractConfig` - Polkadot contract configuration

## Usage

```typescript
import { PaymentEvent, PaymentEventSchema, parsePaymentEvent } from '@paystamp/shared-types';

// Validate payment event
const result = PaymentEventSchema.safeParse(data);
if (result.success) {
  const payment: PaymentEvent = result.data;
}

// Parse from Stellar event
const payment = parsePaymentEvent(stellarEvent);
if (payment) {
  // Use payment event
}
```

## Development

```bash
# Build
npm run build

# Type check
npm run type-check

# Lint
npm run lint
```

