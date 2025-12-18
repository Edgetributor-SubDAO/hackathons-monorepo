// API service for CrossTip relayer communication
import { config } from '../config';

export interface NetworkStatus {
  stellar: {
    status: 'online' | 'offline';
    blockHeight: number;
  };
  polkadot: {
    status: 'online' | 'offline';
    blockHeight: number;
  };
  axelar: {
    status: 'online' | 'offline';
    bridgeHealth: number;
  };
}

export interface TipTransaction {
  id: string;
  amount: string;
  sender: string;
  recipient: string;
  destinationChain: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  txHash?: string;
}

export class APIService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.relayer?.apiUrl || 'http://localhost:3001';
  }

  async getNetworkStatus(): Promise<NetworkStatus> {
    const response = await fetch(`${this.baseUrl}/status`);
    if (!response.ok) {
      throw new Error('Failed to fetch network status');
    }
    return response.json();
  }

  async submitCrossChainTip(tipData: any): Promise<{ txId: string }> {
    const response = await fetch(`${this.baseUrl}/tips`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tipData),
    });

    if (!response.ok) {
      throw new Error('Failed to submit cross-chain tip');
    }

    return response.json();
  }

  async getTipStatus(txId: string): Promise<TipTransaction> {
    const response = await fetch(`${this.baseUrl}/tips/${txId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch tip status');
    }
    return response.json();
  }

  async getUserTips(address: string): Promise<TipTransaction[]> {
    const response = await fetch(`${this.baseUrl}/tips/user/${address}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user tips');
    }
    return response.json();
  }
}

export const apiService = new APIService();
