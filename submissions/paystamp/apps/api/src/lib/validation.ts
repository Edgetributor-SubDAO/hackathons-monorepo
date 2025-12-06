/**
 * Validation utilities using Zod
 */
import { z } from 'zod';
import { ValidationError } from './errors';

/**
 * Stellar address validation (starts with G)
 */
export const stellarAddressSchema = z
  .string()
  .regex(/^G[A-Z0-9]{55}$/, 'Invalid Stellar address format')
  .length(56);

/**
 * Payment amount validation
 */
export const amountSchema = z
  .string()
  .regex(/^\d+(\.\d+)?$/, 'Invalid amount format')
  .refine((val) => {
    const num = parseFloat(val);
    return num > 0;
  }, 'Amount must be greater than 0');

/**
 * Currency validation
 */
export const currencySchema = z.enum(['XLM', 'USDC'], {
  errorMap: () => ({ message: 'Currency must be XLM or USDC' }),
});

/**
 * Service ID validation
 */
export const serviceIdSchema = z
  .string()
  .min(1, 'Service ID is required')
  .max(100, 'Service ID is too long')
  .regex(/^[A-Z0-9_]+$/, 'Service ID must contain only uppercase letters, numbers, and underscores');

/**
 * Payment initiation input validation
 */
export const initiatePaymentInputSchema = z.object({
  userAddress: stellarAddressSchema,
  serviceId: serviceIdSchema,
  amount: amountSchema,
  currency: currencySchema,
});

/**
 * Access status query validation
 */
export const accessStatusInputSchema = z.object({
  userAddress: stellarAddressSchema,
  serviceId: serviceIdSchema,
});

/**
 * Payment history query validation
 */
export const paymentHistoryInputSchema = z.object({
  userAddress: stellarAddressSchema,
  serviceId: serviceIdSchema.optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

/**
 * Validate input data with Zod schema
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fields: Record<string, string[]> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!fields[path]) {
          fields[path] = [];
        }
        fields[path].push(err.message);
      });
      throw new ValidationError('Validation failed', fields);
    }
    throw error;
  }
}

/**
 * Safe parse with error handling
 */
export function safeParse<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: ValidationError } {
  try {
    const data = schema.parse(data);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fields: Record<string, string[]> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!fields[path]) {
          fields[path] = [];
        }
        fields[path].push(err.message);
      });
      return {
        success: false,
        error: new ValidationError('Validation failed', fields),
      };
    }
    throw error;
  }
}

