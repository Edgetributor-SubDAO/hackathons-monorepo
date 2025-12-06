import Decimal from "decimal.js";

export const appConfig = {
  baseRpcUrl: "https://sepolia.base.org",
  baseWssRpcUrl: undefined,
  baseVaultAddress: "0x21E28d827CAF04ca6BA6bf9fDec8885B983FCfD9",
  baseConfirmations: 1,
  // Polkadot Hub / Asset Hub (Paseo) WS endpoint
  polkadotRpcUrl: "wss://passet-hub-paseo.ibp.network",
  polkadotSeedPhrase:
    "follow crazy enjoy gun spray bus mistake powder danger sort primary zone",
  polkadotAssetSymbol: "PAS",
  serviceFeeBps: 100,
  pollIntervalMs: 6000,
  maxParallelPayouts: 3,
  fixedRateAssetPerEth: new Decimal("100000000"),
  hardcodedPayoutDots: new Decimal("1000"),
  pollLookbackBlocks: 2000
};

