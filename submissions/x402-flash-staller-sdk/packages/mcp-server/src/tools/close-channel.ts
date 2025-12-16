import { z } from 'zod';
import { StellarClient } from '../stellar/client.js';
import { ToolResult } from '../types.js';

export const CloseChannelSchema = z.object({
  server: z.string().describe('Stellar address of the server/agent'),
});

export async function closeChannel(
  client: StellarClient,
  args: z.infer<typeof CloseChannelSchema>
): Promise<ToolResult> {
  try {
    // Get remaining balance before closing
    const balance = await client.getChannelBalance(args.server);

    // Close channel
    const tx = await client.closeChannel(args.server);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'Payment channel closed successfully',
            transaction: tx,
            refunded: balance,
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
