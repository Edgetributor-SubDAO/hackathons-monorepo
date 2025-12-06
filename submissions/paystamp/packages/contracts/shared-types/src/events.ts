import { z } from 'zod';

/**
 * Payment event emitted from Stellar Soroban contract
 * Matches the PaymentReceived event structure
 */
export const PaymentEventSchema = z.object({
  user: z.string().min(1, 'User address is required'),
  serviceId: z.string().min(1, 'Service ID is required'),
  amount: z.string().regex(/^\d+$/, 'Amount must be a numeric string'),
  currency: z.string().min(1, 'Currency is required'),
  timestamp: z.number().int().positive('Timestamp must be positive'),
  paymentHash: z.string().min(1, 'Payment hash is required'),
});

export type PaymentEvent = z.infer<typeof PaymentEventSchema>;

/**
 * Raw event data from Stellar Horizon API
 */
export const RawStellarEventSchema = z.object({
  type: z.literal('contract'),
  contract_id: z.string(),
  id: z.string(),
  paging_token: z.string(),
  ledger: z.number(),
  ledger_closed_at: z.string(),
  topic: z.array(z.string()),
  value: z.string(),
  in_successful_contract_call: z.boolean(),
});

export type RawStellarEvent = z.infer<typeof RawStellarEventSchema>;

/**
 * Parse payment event from Stellar event data
 */
export function parsePaymentEvent(event: RawStellarEvent): PaymentEvent | null {
  try {
    // Decode the event value (base64 encoded)
    const decoded = Buffer.from(event.value, 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded);
    
    return PaymentEventSchema.parse(parsed);
  } catch (error) {
    console.error('Failed to parse payment event:', error);
    return null;
  }
}

/**
 * Validate payment event structure
 */
export function validatePaymentEvent(data: unknown): data is PaymentEvent {
  return PaymentEventSchema.safeParse(data).success;
}

