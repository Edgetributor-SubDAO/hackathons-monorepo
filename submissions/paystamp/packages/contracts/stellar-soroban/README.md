# PayStamp Soroban Contract

Stellar Soroban smart contract for processing payments and emitting events for the PayStamp protocol.

## Overview

This contract handles:
- Payment processing and validation
- Service registration and management
- Payment event emission for relayer processing
- Admin controls (pause/unpause)
- Payment history queries

## Features

- ✅ Payment processing with `receive_payment()`
- ✅ Structured event emission: `PAYMENT_RECEIVED`
- ✅ Payment status queries: `get_payment()`, `payment_exists()`
- ✅ Admin functions: `pause()`, `unpause()`, `register_service()`
- ✅ Payment validation: min/max amounts, currency, service whitelisting
- ✅ Comprehensive unit tests

## Prerequisites

1. **Install Rust** (1.70+)
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. **Install Soroban CLI**
   ```bash
   curl -sSL https://soroban.stellar.org | sh
   ```

3. **Add WASM target**
   ```bash
   rustup target add wasm32-unknown-unknown
   ```

## Building

```bash
# Build the contract
make build

# Or manually
cargo build --target wasm32-unknown-unknown --release
```

The compiled WASM will be at:
`target/wasm32-unknown-unknown/release/paystamp_soroban.wasm`

## Testing

```bash
# Run all tests
make test

# Or manually
cargo test
```

## Deployment

### Deploy to Futurenet

```bash
# Set your secret key
export SECRET_KEY="your_secret_key_here"

# Deploy
make deploy-futurenet SECRET_KEY=$SECRET_KEY

# Or manually
soroban contract deploy \
  --network futurenet \
  --source $SECRET_KEY \
  --wasm target/wasm32-unknown-unknown/release/paystamp_soroban.wasm
```

### Deploy to Testnet

```bash
make deploy-testnet SECRET_KEY=$SECRET_KEY
```

## Initialization

After deployment, initialize the contract with an admin address:

```bash
# Futurenet
make init-futurenet CONTRACT_ID=<contract_id> ADMIN=<admin_address>

# Or manually
soroban contract invoke \
  --network futurenet \
  --id <CONTRACT_ID> \
  -- initialize \
  --admin <ADMIN_ADDRESS>
```

## Service Registration

Register services that can accept payments:

```bash
make register-service-futurenet \
  CONTRACT_ID=<contract_id> \
  SERVICE_ID=analytics \
  MIN_AMOUNT=1000000 \
  MAX_AMOUNT=10000000 \
  CURRENCY=XLM
```

## Contract Functions

### Public Functions

- `receive_payment(user, service_id, amount, currency, payment_hash)` - Process a payment
- `payment_exists(user, service_id, payment_hash)` - Check if payment exists
- `get_payment(user, service_id, payment_hash)` - Get payment details
- `get_service(service_id)` - Get service configuration
- `is_paused()` - Check if contract is paused

### Admin Functions

- `initialize(admin)` - Initialize contract (one-time)
- `pause()` - Pause contract
- `unpause()` - Unpause contract
- `register_service(service_id, min_amount, max_amount, currency)` - Register service
- `update_service(service_id, min_amount?, max_amount?, currency?, is_active?)` - Update service

## Event Structure

The contract emits `PAYMENT_RECEIVED` events with the following structure:

```rust
PAYMENT_RECEIVED {
    user: Address,
    service_id: Symbol,
    amount: u64,
    currency: Symbol,
    timestamp: u64,
    payment_hash: BytesN<32>,
}
```

## Usage Example

```rust
// 1. Initialize contract
initialize(admin_address);

// 2. Register a service
register_service(
    service_id: "analytics",
    min_amount: 1_000_000,  // 0.1 XLM (in stroops)
    max_amount: 10_000_000,  // 1 XLM
    currency: "XLM"
);

// 3. Receive payment
receive_payment(
    user: user_address,
    service_id: "analytics",
    amount: 5_000_000,  // 0.5 XLM
    currency: "XLM",
    payment_hash: hash_bytes
);

// 4. Query payment
let payment = get_payment(user_address, "analytics", hash_bytes);
```

## Security Considerations

- ✅ Admin-only functions protected
- ✅ Pause mechanism for emergencies
- ✅ Payment validation (min/max amounts)
- ✅ Service whitelisting
- ✅ Duplicate payment prevention
- ✅ Currency validation

## Development

### Project Structure

```
stellar-soroban/
├── Cargo.toml          # Rust dependencies
├── Makefile            # Build and deployment scripts
├── README.md           # This file
└── src/
    ├── lib.rs          # Main contract code
    └── test.rs         # Unit tests
```

### Code Style

- Follow Rust standard formatting: `cargo fmt`
- Run clippy: `cargo clippy -- -D warnings`
- All public functions should have documentation

## Troubleshooting

### Build Errors

- Ensure Rust 1.70+ is installed: `rustc --version`
- Ensure WASM target is added: `rustup target list | grep wasm32`
- Clean and rebuild: `make clean && make build`

### Deployment Errors

- Check network connectivity
- Verify secret key has funds (testnet tokens)
- Check contract size limits
- Review deployment logs

### Contract Call Errors

- Verify contract is initialized
- Check admin permissions
- Verify service is registered
- Check contract is not paused

## Next Steps

1. Deploy to testnet
2. Initialize with admin address
3. Register services
4. Test payment flow
5. Integrate with relayer service
6. Deploy to mainnet (when ready)

## License

MIT

