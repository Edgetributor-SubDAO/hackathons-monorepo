import { z } from 'zod';

/**
 * Payment status enumeration
 */
export enum PaymentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  PROCESSED = 'processed',
}

/**
 * Service configuration for payment validation
 */
export const ServiceConfigSchema = z.object({
  serviceId: z.string().min(1, 'Service ID is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string(),
  minAmount: z.string().regex(/^\d+$/, 'Min amount must be numeric'),
  maxAmount: z.string().regex(/^\d+$/).optional(),
  currency: z.string().min(1, 'Currency is required'),
  accessDuration: z.number().int().positive('Access duration must be positive'), // in seconds
  isActive: z.boolean().default(true),
  merchantAddress: z.string().min(1, 'Merchant address is required'),
});

export type ServiceConfig = z.infer<typeof ServiceConfigSchema>;

/**
 * Payment validation result
 */
export const PaymentValidationResultSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(z.string()).default([]),
});

export type PaymentValidationResult = z.infer<typeof PaymentValidationResultSchema>;

/**
 * Payment query result from Soroban contract
 */
export const PaymentQueryResultSchema = z.object({
  exists: z.boolean(),
  user: z.string().optional(),
  serviceId: z.string().optional(),
  amount: z.string().optional(),
  currency: z.string().optional(),
  timestamp: z.number().optional(),
  paymentHash: z.string().optional(),
});

export type PaymentQueryResult = z.infer<typeof PaymentQueryResultSchema>;

