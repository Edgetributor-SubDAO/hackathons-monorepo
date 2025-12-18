// src/services/stellar.ts
import { config } from '../config';

export interface CrossChainTipParams {
  sender: string;
  destinationChain: string;
  destinationAddress: string;
  creator: string;
  amount: string;
  message: string;
  gasPaymentToken: {
    address: string;
    amount: string;
  };
}

export interface TipBalance {
  creator: string;
  balance: string;
}

export interface NetworkInfo {
  id: string | number;
  name: string;
  symbol: string;
  fee: string;
  estimatedTime: string;
  icon: string;
}

export class StellarService {
  private contractId: string;

  constructor() {
    this.contractId = config.stellar.contractId;
  }

  /**
   * Get supported Axelar chains
   */
  getSupportedAxelarChains(): NetworkInfo[] {
    return config.networks.axelar;
  }

  /**
   * Get supported XCM parachains
   */
  getSupportedXcmChains(): NetworkInfo[] {
    return config.networks.xcm;
  }

  /**
   * Get all supported networks (Axelar + XCM)
   */
  getAllSupportedNetworks(): { axelar: NetworkInfo[], xcm: NetworkInfo[] } {
    return {
      axelar: this.getSupportedAxelarChains(),
      xcm: this.getSupportedXcmChains()
    };
  }

  /**
   * Mock function to simulate getting creator balance
   * In production, this would call the actual contract
   */
  async getCreatorBalance(creatorAddress: string): Promise<string> {
    try {
      // For now, return mock data
      // In production, use stellar CLI or RPC to call get_balance
      console.log(`Getting balance for creator: ${creatorAddress}`);
      return '0'; // Default balance
    } catch (error) {
      console.error('Error getting creator balance:', error);
      return '0';
    }
  }

  /**
   * Mock function to simulate cross-chain tip sending
   * In production, this would use Stellar SDK to interact with contract
   */
  async sendCrossChainTip(params: CrossChainTipParams): Promise<string> {
    try {
      console.log('Sending cross-chain tip:', params);
      
      // Simulate API call to relayer
      const response = await fetch(`${config.relayer.apiUrl}/send-tip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractId: this.contractId,
          ...params,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.transactionHash || 'mock-tx-hash-' + Date.now();
    } catch (error) {
      console.error('Error sending cross-chain tip:', error);
      throw error;
    }
  }

  /**
   * Get transaction status from relayer
   */
  async getTransactionStatus(transactionHash: string): Promise<any> {
    try {
      const response = await fetch(
        `${config.relayer.apiUrl}/transaction/${transactionHash}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting transaction status:', error);
      return { status: 'unknown', hash: transactionHash };
    }
  }

  /**
   * Check relayer health
   */
  async checkRelayerHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${config.relayer.apiUrl}${config.relayer.healthEndpoint}`);
      return response.ok;
    } catch (error) {
      console.error('Relayer health check failed:', error);
      return false;
    }
  }

  /**
   * Check if a Stellar address is valid format
   */
  isValidStellarAddress(address: string): boolean {
    // Basic Stellar address validation
    return /^G[A-Z0-9]{55}$/.test(address) || /^C[A-Z0-9]{55}$/.test(address);
  }

  /**
   * Check if an Ethereum address is valid format
   */
  isValidEthereumAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Check if a Polkadot address is valid format
   */
  isValidPolkadotAddress(address: string): boolean {
    // Basic Polkadot address validation (SS58 format)
    return /^[1-9A-HJ-NP-Za-km-z]{47,48}$/.test(address);
  }

  /**
   * Validate address based on network type
   */
  validateAddress(address: string, networkType: 'axelar' | 'xcm'): boolean {
    if (networkType === 'axelar') {
      return this.isValidEthereumAddress(address);
    } else {
      return this.isValidPolkadotAddress(address);
    }
  }

  /**
   * Format address for display (shortened)
   */
  formatAddress(address: string, length: number = 8): string {
    if (address.length <= length * 2) return address;
    return `${address.slice(0, length)}...${address.slice(-length)}`;
  }

  /**
   * Get network icon by ID
   */
  getNetworkIcon(networkId: string | number): string {
    const allNetworks = [...config.networks.axelar, ...config.networks.xcm];
    const network = allNetworks.find(n => n.id === networkId || n.id === networkId.toString());
    return network?.icon || '🌐';
  }

  /**
   * Get network name by ID
   */
  getNetworkName(networkId: string | number): string {
    const allNetworks = [...config.networks.axelar, ...config.networks.xcm];
    const network = allNetworks.find(n => n.id === networkId || n.id === networkId.toString());
    return network?.name || 'Unknown Network';
  }

  /**
   * Estimate fees for a network
   */
  getEstimatedFee(networkId: string | number): string {
    const allNetworks = [...config.networks.axelar, ...config.networks.xcm];
    const network = allNetworks.find(n => n.id === networkId || n.id === networkId.toString());
    return network?.fee || '0.01 XLM';
  }

  /**
   * Get estimated transaction time
   */
  getEstimatedTime(networkId: string | number): string {
    const allNetworks = [...config.networks.axelar, ...config.networks.xcm];
    const network = allNetworks.find(n => n.id === networkId || n.id === networkId.toString());
    return network?.estimatedTime || '1-2 min';
  }
}