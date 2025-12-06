import Decimal from "decimal.js";

export const WEI_PER_ETH = new Decimal("1000000000000000000");
export const PLANCK_PER_DOT = new Decimal("10000000000");

export const decimalsByAsset: Record<string, Decimal> = {
  DOT: PLANCK_PER_DOT,
  PAS: PLANCK_PER_DOT,
  PASEO: PLANCK_PER_DOT
};

export function weiToEth(value: bigint): Decimal {
  return new Decimal(value.toString()).div(WEI_PER_ETH);
}

export function decimalToPlanck(amount: Decimal, assetSymbol: string): bigint {
  const decimals = decimalsByAsset[assetSymbol.toUpperCase()];
  if (!decimals) {
    throw new Error(`Unsupported Polkadot asset ${assetSymbol}`);
  }
  return BigInt(amount.mul(decimals).toFixed(0));
}

