import { z } from 'zod';
import { StellarClient } from '../stellar/client.js';
import { ToolResult } from '../types.js';

export const CallAgentSchema = z.object({
  endpoint: z.string().describe('Agent endpoint URL'),
  capability: z.string().describe('Agent capability to use (e.g., text_generation, code_generation)'),
  input: z.any().describe('Input for the agent'),
  parameters: z.record(z.any()).optional().describe('Additional parameters'),
});

export async function callAgent(
  client: StellarClient,
  args: z.infer<typeof CallAgentSchema>
): Promise<ToolResult> {
  try {
    const response = await client.sendPayment(
      args.endpoint,
      args.capability,
      args.input,
      args.parameters
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            output: response.output,
            usage: response.usage,
            cost: response.usage?.cost,
            metadata: response.metadata,
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
