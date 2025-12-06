export interface DepositEventPayload {
  sender: string;
  amount: bigint;
  feeAmount: bigint;
  netAmount: bigint;
  stellarAddress: string;
  depositId: string;
  blockNumber: number;
  transactionHash: string;
}

