import { z } from 'zod';
import { StellarClient } from '../stellar/client.js';
import { ToolResult } from '../types.js';

export const GetTransactionSchema = z.object({
  hash: z.string().describe('Transaction hash'),
});

export async function getTransaction(
  client: StellarClient,
  args: z.infer<typeof GetTransactionSchema>
): Promise<ToolResult> {
  try {
    const tx = await client.getTransaction(args.hash);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            transaction: {
              hash: args.hash,
              status: tx.status,
              createdAt: tx.createdAt,
              ledger: tx.ledger,
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
