import { X402FlashClient } from '@x402-flash/stellar-sdk';
import { AgentMetadata, AgentResponse } from '@x402-ai/core';

export interface AgentClientConfig {
  stellar: {
    rpcUrl: string;
    networkPassphrase: string;
    contractId: string;
    secretKey: string;
  };
  autoOpenChannel?: boolean;
  defaultEscrow?: string;
}

export class AgentClient {
  private x402Client: X402FlashClient;
  private config: AgentClientConfig;
  private openChannels: Map<string, boolean> = new Map();

  constructor(config: AgentClientConfig) {
    this.config = config;
    this.x402Client = new X402FlashClient(config.stellar);
  }

  /**
   * Call an AI agent
   */
  async call(
    agentEndpoint: string,
    request: {
      capability: string;
      input: any;
      parameters?: Record<string, any>;
      userId?: string;
    }
  ): Promise<AgentResponse> {
    // Get agent metadata
    const metadata = await this.getMetadata(agentEndpoint);

    // Open channel if needed
    if (this.config.autoOpenChannel && !this.openChannels.has(agentEndpoint)) {
      await this.openChannel(agentEndpoint, metadata);
    }

    // Wrap fetch with payment handling
    const paidFetch = this.x402Client.wrapFetch();

    // Make request
    const response = await paidFetch(`${agentEndpoint}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error: any = await response.json();
      throw new Error(error.error?.message || 'Request failed');
    }

    return response.json() as Promise<AgentResponse>;
  }

  /**
   * Call agent with streaming response
   */
  async callStream(
    agentEndpoint: string,
    request: {
      capability: string;
      input: any;
      parameters?: Record<string, any>;
      userId?: string;
    },
    onChunk: (chunk: any) => void
  ): Promise<void> {
    const metadata = await this.getMetadata(agentEndpoint);

    if (this.config.autoOpenChannel && !this.openChannels.has(agentEndpoint)) {
      await this.openChannel(agentEndpoint, metadata);
    }

    const paidFetch = this.x402Client.wrapFetch();

    const response = await paidFetch(`${agentEndpoint}/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error: any = await response.json();
      throw new Error(error.error?.message || 'Request failed');
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          if (data.type === 'done') {
            return;
          } else if (data.type === 'error') {
            throw new Error(data.error);
          } else {
            onChunk(data);
          }
        }
      }
    }
  }

  /**
   * Get agent metadata
   */
  async getMetadata(agentEndpoint: string): Promise<AgentMetadata> {
    const response = await fetch(`${agentEndpoint}/metadata`);
    if (!response.ok) {
      throw new Error('Failed to fetch agent metadata');
    }
    return response.json() as Promise<AgentMetadata>;
  }

  /**
   * Get cost estimate
   */
  async estimateCost(
    agentEndpoint: string,
    request: {
      capability: string;
      input: any;
      parameters?: Record<string, any>;
    }
  ): Promise<{ estimate: string }> {
    const response = await fetch(`${agentEndpoint}/estimate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('Failed to estimate cost');
    }

    return response.json() as Promise<{ estimate: string }>;
  }

  /**
   * Open payment channel with agent
   */
  private async openChannel(
    agentEndpoint: string,
    metadata: AgentMetadata
  ): Promise<void> {
    const escrowAmount = this.config.defaultEscrow || '10000000';

    await this.x402Client.openEscrow(
      metadata.author.address || agentEndpoint,
      metadata.pricing.currency,
      escrowAmount,
      86400 // 24 hours
    );

    this.openChannels.set(agentEndpoint, true);
  }

  /**
   * Close channel with agent
   */
  async closeChannel(agentEndpoint: string): Promise<void> {
    const metadata = await this.getMetadata(agentEndpoint);
    await this.x402Client.closeEscrow(metadata.author.address || agentEndpoint);
    this.openChannels.delete(agentEndpoint);
  }

  /**
   * Get channel balance
   */
  async getChannelBalance(agentEndpoint: string): Promise<string> {
    const metadata = await this.getMetadata(agentEndpoint);
    return this.x402Client.getEscrowBalance(
      metadata.author.address || agentEndpoint
    );
  }
}
