import { z } from 'zod';
import { ToolResult } from '../types.js';
import { Config } from '../config.js';

export const ListAgentsSchema = z.object({
  capability: z.string().optional().describe('Filter by capability'),
  maxPrice: z.string().optional().describe('Maximum price in stroops'),
  tags: z.array(z.string()).optional().describe('Filter by tags'),
});

export async function listAgents(
  config: Config,
  args: z.infer<typeof ListAgentsSchema>
): Promise<ToolResult> {
  try {
    if (!config.agentRegistry?.url) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: 'Agent registry not configured',
            }, null, 2),
          },
        ],
        isError: true,
      };
    }

    // Build query params
    const params = new URLSearchParams();
    if (args.capability) params.append('capability', args.capability);
    if (args.maxPrice) params.append('maxPrice', args.maxPrice);
    if (args.tags) params.append('tags', args.tags.join(','));

    // Fetch agents from registry
    const response = await fetch(
      `${config.agentRegistry.url}/agents?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch agents');
    }

    const agents: any = await response.json();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            count: agents.length,
            agents: agents.map((agent: any) => ({
              id: agent.id,
              name: agent.name,
              description: agent.description,
              endpoint: agent.endpoint,
              capabilities: agent.capabilities,
              pricing: agent.pricing,
              rating: agent.rating,
            })),
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
