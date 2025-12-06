export interface DepositEventPayload {
  sender: string;
  amount: bigint;
  feeAmount: bigint;
  netAmount: bigint;
  polkadotAddress: string;
  depositId: string;
  blockNumber: number;
  transactionHash: string;
}

export interface PayoutOrder {
  deposit: DepositEventPayload;
  payoutAmountPlanck: bigint;
  payoutAmountDisplay: string;
}

