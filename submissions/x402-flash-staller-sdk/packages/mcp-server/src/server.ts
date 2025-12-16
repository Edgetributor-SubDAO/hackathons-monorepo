import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { StellarClient } from './stellar/client.js';
import { loadConfig } from './config.js';

import { OpenChannelSchema, openChannel } from './tools/open-channel.js';
import { CloseChannelSchema, closeChannel } from './tools/close-channel.js';
import { CheckBalanceSchema, checkBalance } from './tools/check-balance.js';
import { CallAgentSchema, callAgent } from './tools/call-agent.js';
import { ListAgentsSchema, listAgents } from './tools/list-agents.js';
import { GetTransactionSchema, getTransaction } from './tools/get-transaction.js';

export class X402PaymentsMCPServer {
  private server: Server;
  private stellarClient: StellarClient;
  private config: ReturnType<typeof loadConfig>;

  constructor() {
    this.config = loadConfig();
    this.stellarClient = new StellarClient(this.config);

    this.server = new Server(
      {
        name: this.config.mcp.name,
        version: this.config.mcp.version,
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'open_channel',
          description: 'Open a payment channel with an AI agent using x402-flash on Stellar',
          inputSchema: {
            type: 'object',
            properties: {
              server: { type: 'string', description: 'Stellar address of the server/agent' },
              token: { type: 'string', description: 'Token contract address' },
              amount: { type: 'string', description: 'Amount in stroops' },
              ttl: { type: 'number', description: 'Time-to-live in seconds', default: 86400 },
            },
            required: ['server', 'token', 'amount'],
          },
        },
        {
          name: 'close_channel',
          description: 'Close a payment channel and withdraw remaining balance',
          inputSchema: {
            type: 'object',
            properties: {
              server: { type: 'string', description: 'Stellar address of the server/agent' },
            },
            required: ['server'],
          },
        },
        {
          name: 'check_balance',
          description: 'Check wallet or channel balance',
          inputSchema: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['wallet', 'channel'], description: 'Balance type' },
              server: { type: 'string', description: 'Server address (for channel)' },
            },
            required: ['type'],
          },
        },
        {
          name: 'call_agent',
          description: 'Call a paid AI agent using x402-flash payments',
          inputSchema: {
            type: 'object',
            properties: {
              endpoint: { type: 'string', description: 'Agent endpoint URL' },
              capability: { type: 'string', description: 'Capability to use' },
              input: { description: 'Input for the agent' },
              parameters: { type: 'object', description: 'Additional parameters' },
            },
            required: ['endpoint', 'capability', 'input'],
          },
        },
        {
          name: 'list_agents',
          description: 'Discover available AI agents in the marketplace',
          inputSchema: {
            type: 'object',
            properties: {
              capability: { type: 'string', description: 'Filter by capability' },
              maxPrice: { type: 'string', description: 'Maximum price' },
              tags: { type: 'array', items: { type: 'string' }, description: 'Filter by tags' },
            },
          },
        },
        {
          name: 'get_transaction',
          description: 'Get details of a Stellar transaction',
          inputSchema: {
            type: 'object',
            properties: {
              hash: { type: 'string', description: 'Transaction hash' },
            },
            required: ['hash'],
          },
        },
      ],
    }));

    // Handle tool calls  
    // Note: Using 'as any' to work around MCP SDK type strictness
    // The ToolResult format is correct at runtime
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        let result;
        
        switch (request.params.name) {
          case 'open_channel': {
            const args = OpenChannelSchema.parse(request.params.arguments);
            result = await openChannel(this.stellarClient, args);
            break;
          }

          case 'close_channel': {
            const args = CloseChannelSchema.parse(request.params.arguments);
            result = await closeChannel(this.stellarClient, args);
            break;
          }

          case 'check_balance': {
            const args = CheckBalanceSchema.parse(request.params.arguments);
            result = await checkBalance(this.stellarClient, args);
            break;
          }

          case 'call_agent': {
            const args = CallAgentSchema.parse(request.params.arguments);
            result = await callAgent(this.stellarClient, args);
            break;
          }

          case 'list_agents': {
            const args = ListAgentsSchema.parse(request.params.arguments);
            result = await listAgents(this.config, args);
            break;
          }

          case 'get_transaction': {
            const args = GetTransactionSchema.parse(request.params.arguments);
            result = await getTransaction(this.stellarClient, args);
            break;
          }

          default:
            throw new Error(`Unknown tool: ${request.params.name}`);
        }

        return result as any; // Type assertion for MCP SDK compatibility
      } catch (error: any) {
        const errorResult: any = {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                success: false,
                error: error.message || 'Tool execution failed',
              }, null, 2),
            },
          ],
          isError: true,
        };
        return errorResult;
      }
    });

    // List resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: 'stellar://wallet',
          name: 'Stellar Wallet',
          description: 'Your Stellar wallet information',
          mimeType: 'application/json',
        },
      ],
    }));

    // Read resources
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const uri = request.params.uri;

      if (uri === 'stellar://wallet') {
        const balance = await this.stellarClient.getBalance();
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify({
                publicKey: this.stellarClient.getPublicKey(),
                balance: `${balance} XLM`,
                network: this.config.stellar.networkPassphrase,
              }, null, 2),
            },
          ],
        };
      }

      throw new Error(`Unknown resource: ${uri}`);
    });

    // List prompts
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => ({
      prompts: [
        {
          name: 'payment_guide',
          description: 'Guide for making payments with x402-flash',
        },
        {
          name: 'agent_discovery',
          description: 'How to discover and call AI agents',
        },
      ],
    }));

    // Get prompts
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      if (request.params.name === 'payment_guide') {
        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: 'How do I make payments using x402-flash on Stellar?',
              },
            },
            {
              role: 'assistant',
              content: {
                type: 'text',
                text: `Here's how to use x402-flash payments:

1. **Check your wallet balance**:
   check_balance(type: "wallet")

2. **Open a payment channel** with an AI agent:
   open_channel(server: "AGENT_ADDRESS", token: "TOKEN_ADDRESS", amount: "10000000", ttl: 86400)

3. **Call the AI agent**:
   call_agent(endpoint: "https://agent.com", capability: "text_generation", input: "Your prompt")

4. **Check channel balance**:
   check_balance(type: "channel", server: "AGENT_ADDRESS")

5. **Close channel** when done:
   close_channel(server: "AGENT_ADDRESS")

Payments are instant (< 100ms) thanks to x402-flash!`,
              },
            },
          ],
        };
      }

      if (request.params.name === 'agent_discovery') {
        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: 'How do I find and use AI agents?',
              },
            },
            {
              role: 'assistant',
              content: {
                type: 'text',
                text: `Discovering AI agents:

1. **List all agents**: list_agents()
2. **Filter by capability**: list_agents(capability: "code_generation")
3. **Filter by price**: list_agents(maxPrice: "1000000")
4. **Filter by tags**: list_agents(tags: ["chatbot", "gpt-4"])

Once you find an agent, open a channel and start calling it!`,
              },
            },
          ],
        };
      }

      throw new Error(`Unknown prompt: ${request.params.name}`);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('x402-flash Payments MCP server running on stdio');
  }
}
