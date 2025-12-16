import { z } from 'zod';
import { StellarClient } from '../stellar/client.js';
import { ToolResult } from '../types.js';

export const OpenChannelSchema = z.object({
  server: z.string().describe('Stellar address of the server/agent'),
  token: z.string().describe('Token contract address (e.g., USDC)'),
  amount: z.string().describe('Amount to deposit in escrow (in stroops)'),
  ttl: z.number().default(86400).describe('Time-to-live in seconds (default: 24 hours)'),
});

export async function openChannel(
  client: StellarClient,
  args: z.infer<typeof OpenChannelSchema>
): Promise<ToolResult> {
  try {
    const tx = await client.openChannel(
      args.server,
      args.token,
      args.amount,
      args.ttl
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'Payment channel opened successfully',
            transaction: tx,
            details: {
              server: args.server,
              amount: args.amount,
              ttl: args.ttl,
              expiresAt: new Date(Date.now() + args.ttl * 1000).toISOString(),
            },
          }, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error.message,
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
}
