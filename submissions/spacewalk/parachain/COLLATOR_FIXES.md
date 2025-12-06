# Collator Node Compilation Fixes

## Status
The collator node has several compilation errors that need to be fixed. The main issues are:

1. ✅ Fixed: Import queue syntax
2. ✅ Fixed: new_partial calls
3. ⚠️ Pending: new_full return type (async function)
4. ⚠️ Pending: TryRuntime variant handling
5. ⚠️ Pending: Missing runtime API implementations (AccountNonceApi, TransactionPaymentRuntimeApi, GrandpaApi)
6. ⚠️ Pending: CurrencyId Display/FromStr for Oracle RPC

## Remaining Errors

### 1. new_full Return Type
The function is async but command.rs is trying to use `.map_err()` on the Future. Need to await first:
```rust
// In command.rs line 179:
parachain_service::new_full(config).await.map_err(sc_cli::Error::Service)
```

### 2. TryRuntime Variant
The TryRuntime variant is a unit variant when try-runtime is disabled, but a tuple variant when enabled. Need to handle both cases properly.

### 3. Missing Runtime APIs
The runtime needs to implement:
- `AccountNonceApi<Block, AccountId, Nonce>`
- `TransactionPaymentRuntimeApi<Block, Balance>`
- `GrandpaApi<Block>`

These should already be in the runtime's `impl_runtime_apis!` block. Check if they're missing.

### 4. CurrencyId Display/FromStr
The Oracle RPC requires CurrencyId to implement Display and FromStr, but it doesn't. This might be a version mismatch. Check if the testnet node has the same issue or if there's a workaround.

## Next Steps

1. Fix the new_full await issue
2. Fix TryRuntime variant handling
3. Verify runtime API implementations
4. Check CurrencyId trait implementations

