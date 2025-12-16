import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const ConfigSchema = z.object({
  stellar: z.object({
    rpcUrl: z.string(),
    networkPassphrase: z.string(),
    horizonUrl: z.string(),
  }),
  contracts: z.object({
    x402Flash: z.string(),
    usdc: z.string().optional(),
  }),
  wallet: z.object({
    secretKey: z.string(),
    publicKey: z.string().optional(),
  }),
  mcp: z.object({
    name: z.string(),
    version: z.string(),
  }),
  agentRegistry: z.object({
    url: z.string().optional(),
  }).optional(),
});

export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(): Config {
  return ConfigSchema.parse({
    stellar: {
      rpcUrl: process.env.STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org',
      networkPassphrase: process.env.STELLAR_NETWORK || 'Test SDF Network ; September 2015',
      horizonUrl: process.env.HORIZON_URL || 'https://horizon-testnet.stellar.org',
    },
    contracts: {
      x402Flash: process.env.X402_CONTRACT_ID!,
      usdc: process.env.USDC_CONTRACT_ID,
    },
    wallet: {
      secretKey: process.env.WALLET_SECRET_KEY!,
      publicKey: process.env.WALLET_PUBLIC_KEY,
    },
    mcp: {
      name: 'x402-flash-payments',
      version: '1.0.0',
    },
    agentRegistry: {
      url: process.env.AGENT_REGISTRY_URL,
    },
  });
}
