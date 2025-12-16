import { z } from 'zod';

// Stellar account schema
export const StellarAccountSchema = z.object({
  publicKey: z.string(),
  secretKey: z.string().optional(),
  balance: z.string().optional(),
});

export type StellarAccount = z.infer<typeof StellarAccountSchema>;

// Payment channel schema
export const PaymentChannelSchema = z.object({
  id: z.string(),
  client: z.string(),
  server: z.string(),
  token: z.string(),
  escrowBalance: z.string(),
  status: z.enum(['open', 'pending_close', 'closed']),
  openedAt: z.number(),
  ttl: z.number(),
});

export type PaymentChannel = z.infer<typeof PaymentChannelSchema>;

// Transaction schema
export const TransactionSchema = z.object({
  hash: z.string(),
  type: z.enum(['open_channel', 'close_channel', 'payment']),
  amount: z.string().optional(),
  from: z.string(),
  to: z.string(),
  timestamp: z.number(),
  status: z.enum(['pending', 'success', 'failed']),
});

export type Transaction = z.infer<typeof TransactionSchema>;

// AI Agent schema
export const AIAgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  endpoint: z.string(),
  capabilities: z.array(z.string()),
  pricing: z.object({
    model: z.string(),
    basePrice: z.string(),
    currency: z.string(),
  }),
  author: z.object({
    name: z.string(),
    address: z.string().optional(),
  }),
});

export type AIAgent = z.infer<typeof AIAgentSchema>;

// MCP tool result types
export interface ToolResult {
  content: Array<{
    type: 'text' | 'resource';
    text?: string;
    resource?: any;
  }>;
  isError?: boolean;
}
