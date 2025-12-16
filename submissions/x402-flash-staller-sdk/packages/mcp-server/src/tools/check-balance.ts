import { z } from 'zod';
import { StellarClient } from '../stellar/client.js';
import { ToolResult } from '../types.js';

export const CheckBalanceSchema = z.object({
  type: z.enum(['wallet', 'channel']).describe('Balance type: wallet or channel'),
  server: z.string().optional().describe('Server address (for channel balance)'),
});

export async function checkBalance(
  client: StellarClient,
  args: z.infer<typeof CheckBalanceSchema>
): Promise<ToolResult> {
  try {
    if (args.type === 'wallet') {
      const balance = await client.getBalance();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              type: 'wallet',
              publicKey: client.getPublicKey(),
              balance: `${balance} XLM`,
              balanceStroops: balance,
            }, null, 2),
          },
        ],
      };
    } else {
      if (!args.server) {
        throw new Error('Server address required for channel balance');
      }

      const balance = await client.getChannelBalance(args.server);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              type: 'channel',
              server: args.server,
              balance: balance,
              balanceXLM: (parseInt(balance) / 10000000).toFixed(7),
            }, null, 2),
          },
        ],
      };
    }
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
