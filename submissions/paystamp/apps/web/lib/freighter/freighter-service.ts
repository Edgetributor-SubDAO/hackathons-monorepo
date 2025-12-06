/**
 * Freighter Wallet Service
 * Integrates with Freighter browser extension
 * Based on: https://developers.stellar.org/docs/build/guides/freighter/connect-testnet
 */

declare global {
  interface Window {
    freighterApi?: {
      isConnected: () => Promise<{ isConnected: boolean; publicKey?: string }>;
      connect: () => Promise<{ publicKey: string }>;
      getPublicKey: () => Promise<string>;
      setAllowed: (allowed: boolean) => Promise<void>;
      signTransaction: (xdr: string, network: string) => Promise<string>;
      getNetwork: () => Promise<string>;
      setNetwork: (network: string) => Promise<void>;
    };
  }
}

export interface FreighterConnection {
  publicKey: string;
  isConnected: boolean;
  network: string;
}

export class FreighterService {
  /**
   * Check if Freighter is installed
   */
  static isInstalled(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    // Check multiple possible locations
    const freighter = 
      (window as any).freighterApi || 
      (window as any).freighter ||
      (window as any).stellar?.freighter;

    if (freighter && (typeof freighter.connect === 'function' || typeof freighter.isConnected === 'function')) {
      // Normalize to window.freighterApi
      if (!window.freighterApi) {
        (window as any).freighterApi = freighter;
      }
      return true;
    }

    return !!window.freighterApi;
  }

  /**
   * Wait for Freighter to be available
   */
  static async waitForFreighter(timeout: number = 10000): Promise<boolean> {
    if (this.isInstalled()) {
      return true;
    }

    return new Promise((resolve) => {
      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        if (this.isInstalled()) {
          clearInterval(checkInterval);
          resolve(true);
        } else if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          resolve(false);
        }
      }, 200);
    });
  }

  /**
   * Check if already connected
   */
  static async isConnected(): Promise<boolean> {
    if (!this.isInstalled()) {
      return false;
    }

    try {
      const result = await window.freighterApi!.isConnected();
      return result.isConnected || false;
    } catch {
      return false;
    }
  }

  /**
   * Get current public key if connected
   */
  static async getPublicKey(): Promise<string | null> {
    if (!this.isInstalled()) {
      return null;
    }

    try {
      // Try isConnected first
      const result = await window.freighterApi!.isConnected();
      if (result.isConnected && result.publicKey) {
        console.log('✅ Got public key from isConnected:', result.publicKey);
        return result.publicKey;
      }

      // If not connected but API is available, try getPublicKey directly
      if (typeof window.freighterApi!.getPublicKey === 'function') {
        try {
          const publicKey = await window.freighterApi!.getPublicKey();
          console.log('✅ Got public key from getPublicKey:', publicKey);
          return publicKey;
        } catch (err) {
          console.warn('getPublicKey failed, user may need to connect:', err);
        }
      }

      return null;
    } catch (err) {
      console.error('Error getting public key:', err);
      return null;
    }
  }

  /**
   * Connect to Freighter wallet
   */
  static async connect(): Promise<FreighterConnection> {
    // Ensure Freighter is available
    const isInstalled = await this.waitForFreighter(2000);
    if (!isInstalled) {
      throw new Error(
        'Freighter wallet not found. Please install the Freighter extension from https://freighter.app and refresh this page.'
      );
    }

    // Make sure we have the API
    if (!window.freighterApi) {
      throw new Error('Freighter API not available. Please refresh the page.');
    }

    try {
      console.log('🔌 Attempting to connect to Freighter...');
      
      // Connect to Freighter - this will show a popup to the user
      const result = await window.freighterApi.connect();
      
      console.log('📥 Freighter connect response:', result);

      // Handle different response formats
      let publicKey: string | null = null;
      
      if (typeof result === 'string') {
        publicKey = result;
      } else if (result && typeof result === 'object') {
        publicKey = result.publicKey || (result as any).key || null;
      }

      if (!publicKey) {
        throw new Error('No public key returned from Freighter. The connection may have been cancelled.');
      }

      console.log('✅ Connected! Public key:', publicKey);

      // Get current network
      let network = 'TESTNET';
      try {
        network = await this.getNetwork();
      } catch (err) {
        console.warn('Failed to get network, defaulting to TESTNET:', err);
      }

      return {
        publicKey,
        isConnected: true,
        network,
      };
    } catch (error: any) {
      console.error('❌ Freighter connection error:', error);
      throw new Error(
        error.message || 'Failed to connect to Freighter wallet'
      );
    }
  }

  /**
   * Get current network
   */
  static async getNetwork(): Promise<string> {
    if (!this.isInstalled()) {
      throw new Error('Freighter not installed');
    }

    try {
      return await window.freighterApi!.getNetwork();
    } catch {
      return 'testnet'; // Default to testnet
    }
  }

  /**
   * Set network (testnet or mainnet)
   */
  static async setNetwork(network: 'testnet' | 'mainnet'): Promise<void> {
    if (!this.isInstalled()) {
      throw new Error('Freighter not installed');
    }

    try {
      // Freighter uses 'TESTNET' or 'PUBLIC' for network names
      const networkName = network === 'testnet' ? 'TESTNET' : 'PUBLIC';
      await window.freighterApi!.setNetwork(networkName);
    } catch (error: any) {
      throw new Error(`Failed to set network: ${error.message}`);
    }
  }

  /**
   * Sign a transaction XDR
   */
  static async signTransaction(xdr: string, network: 'testnet' | 'mainnet' = 'testnet'): Promise<string> {
    if (!this.isInstalled()) {
      throw new Error('Freighter not installed');
    }

    try {
      const networkName = network === 'testnet' ? 'TESTNET' : 'PUBLIC';
      const signedXdr = await window.freighterApi!.signTransaction(xdr, networkName);
      return signedXdr;
    } catch (error: any) {
      throw new Error(`Failed to sign transaction: ${error.message}`);
    }
  }
}

