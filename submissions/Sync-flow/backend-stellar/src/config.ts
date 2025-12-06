export const appConfig = {
  baseRpcUrl: process.env.BASE_RPC_URL || "https://sepolia.base.org",
  baseWssRpcUrl: process.env.BASE_WSS_RPC_URL,
  baseVaultAddress: process.env.BASE_VAULT_ADDRESS || "0x0000000000000000000000000000000000000000",
  baseConfirmations: Number(process.env.BASE_CONFIRMATIONS) || 1,
  stellarRpcUrl: process.env.STELLAR_RPC_URL || "https://soroban-testnet.stellar.org",
  stellarSecretKey: process.env.STELLAR_DISPENSER_SECRET_KEY || "",
  stellarNetworkPassphrase:
    process.env.STELLAR_NETWORK_PASSPHRASE || "Test SDF Network ; September 2015",
  pollIntervalMs: Number(process.env.POLL_INTERVAL_MS) || 6000,
  maxParallelPayouts: Number(process.env.MAX_PARALLEL_PAYOUTS) || 3,
  pollLookbackBlocks: Number(process.env.POLL_LOOKBACK_BLOCKS) || 2000,
  // Fixed XLM payout amount per deposit (for testing)
  hardcodedPayoutXlm: Number(process.env.HARDCODED_PAYOUT_XLM) || 1
};

