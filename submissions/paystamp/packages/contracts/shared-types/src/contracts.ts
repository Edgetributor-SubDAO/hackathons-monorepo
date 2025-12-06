import { z } from 'zod';

/**
 * Contract deployment information
 */
export const ContractDeploymentSchema = z.object({
  network: z.enum(['testnet', 'mainnet', 'futurenet', 'shibuya']),
  contractId: z.string().min(1),
  deployedAt: z.number().int(),
  deployerAddress: z.string(),
  transactionHash: z.string().optional(),
});

export type ContractDeployment = z.infer<typeof ContractDeploymentSchema>;

/**
 * Stellar Soroban contract configuration
 */
export const StellarContractConfigSchema = z.object({
  contractId: z.string().min(1),
  network: z.enum(['testnet', 'mainnet', 'futurenet']),
  horizonUrl: z.string().url(),
  merchantAddress: z.string().min(1),
  adminAddress: z.string().min(1).optional(),
});

export type StellarContractConfig = z.infer<typeof StellarContractConfigSchema>;

/**
 * Polkadot ink! contract configuration
 */
export const PolkadotContractConfigSchema = z.object({
  contractAddress: z.string().min(1),
  network: z.enum(['shibuya', 'shiden', 'astar', 'polkadot']),
  rpcUrl: z.string().url(),
  relayerAddress: z.string().min(1),
  adminAddress: z.string().min(1).optional(),
});

export type PolkadotContractConfig = z.infer<typeof PolkadotContractConfigSchema>;

