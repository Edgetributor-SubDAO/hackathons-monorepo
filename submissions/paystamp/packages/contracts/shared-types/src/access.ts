import { z } from 'zod';

/**
 * Access stamp information from Polkadot ink! contract
 */
export const AccessStampSchema = z.object({
  userAddress: z.string().min(1, 'User address is required'),
  serviceId: z.string().min(1, 'Service ID is required'),
  nftId: z.string().optional(),
  expiresAt: z.number().int().positive('Expiry must be positive'),
  isActive: z.boolean(),
  mintedAt: z.number().int().positive().optional(),
});

export type AccessStamp = z.infer<typeof AccessStampSchema>;

/**
 * Access check result from Polkadot contract
 */
export const AccessCheckResultSchema = z.object({
  hasAccess: z.boolean(),
  expiresAt: z.number().int().optional(),
  isExpired: z.boolean(),
});

export type AccessCheckResult = z.infer<typeof AccessCheckResultSchema>;

/**
 * Batch access check request
 */
export const BatchAccessCheckSchema = z.object({
  userAddress: z.string(),
  serviceIds: z.array(z.string()).min(1),
});

export type BatchAccessCheck = z.infer<typeof BatchAccessCheckSchema>;

