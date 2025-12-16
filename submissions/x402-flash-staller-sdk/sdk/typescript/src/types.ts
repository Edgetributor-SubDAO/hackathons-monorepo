export interface PaymentAuth {
  settlementContract: string;
  client: string;
  server: string;
  token: string;
  amount: string;
  nonce: number;
  deadline: number;
}

export interface Channel {
  escrowBalance: string;
  token: string;
  openedAt: number;
  lastActivityAt: number;
  ttlSeconds: number;
  state: "None" | "Open" | "PendingClose" | "Closed";
  closedBy?: string;
  pendingSettlements: number;
}

export interface X402FlashClientConfig {
  rpcUrl: string;
  networkPassphrase: string;
  contractId: string;
  secretKey: string;
}

export interface X402FlashServerConfig {
  rpcUrl: string;
  networkPassphrase: string;
  contractId: string;
  secretKey: string;
  paymentAddress: string;
}

// x402 Standard Types
export interface PaymentConfig {
  description?: string;
  mimeType?: string;
  maxTimeoutSeconds?: number;
  resource?: string;
}

export interface RouteConfig {
  price: string;
  token: string;
  network: string;
  config?: PaymentConfig;
}

export type RoutesConfig = Record<string, string | RouteConfig>;

export interface X402PaymentRequirement {
  scheme: string;
  network: string;
  maxAmountRequired: string;
  resource: string;
  description: string;
  mimeType: string;
  payTo: string;
  maxTimeoutSeconds: number;
  asset: string;
  extra?: Record<string, any>;
}

export interface X402PaymentRequirements {
  x402Version: number;
  accepts: X402PaymentRequirement[];
  error?: string;
}

export interface X402PaymentPayload {
  x402Version: number;
  scheme: "flash";
  network: string;
  payload: {
    auth: PaymentAuth;
    signature: string;
    publicKey: string;
  };
}

export interface X402PaymentResponse {
  success: boolean;
  network: string;
  timestamp: number;
  transactionHash?: string;
}
