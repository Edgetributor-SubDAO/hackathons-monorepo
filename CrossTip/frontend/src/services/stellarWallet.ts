// Enhanced Freighter wallet service based on Stellar Account Viewer implementation
export interface FreighterAPI {
  isConnected(): Promise<boolean>;
  getPublicKey(): Promise<string>;
  signTransaction(xdr: string, network?: string): Promise<string>;
}

export class StellarWalletService {
  private freighterAPI: FreighterAPI | null = null;

  constructor() {
    this.detectFreighter();
  }

  /**
   * Detect Freighter using multiple methods (based on Account Viewer approach)
   */
  private detectFreighter(): void {
    // Method 1: Try freighter global
    if ((window as any).freighter) {
      this.freighterAPI = (window as any).freighter;
      return;
    }

    // Method 2: Try stellar global (some versions use this)
    if ((window as any).stellar) {
      this.freighterAPI = (window as any).stellar;
      return;
    }

    // Method 3: Wait for extension to inject
    this.waitForFreighter();
  }

  /**
   * Wait for Freighter to be injected (progressive detection)
   */
  private async waitForFreighter(maxAttempts = 10, delay = 500): Promise<void> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`🔍 Freighter detection attempt ${attempt}/${maxAttempts}`);
      
      if ((window as any).freighter) {
        this.freighterAPI = (window as any).freighter;
        console.log('✅ Freighter detected via window.freighter');
        return;
      }

      if ((window as any).stellar) {
        this.freighterAPI = (window as any).stellar;
        console.log('✅ Freighter detected via window.stellar');
        return;
      }

      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    console.log('❌ Freighter not detected after all attempts');
  }

  /**
   * Check if Freighter is available
   */
  async isFreighterAvailable(): Promise<boolean> {
    if (!this.freighterAPI) {
      // Try detection again
      await this.waitForFreighter(3, 1000);
    }

    if (!this.freighterAPI) {
      return false;
    }

    try {
      // Use the official isConnected method if available
      if (typeof this.freighterAPI.isConnected === 'function') {
        const connected = await this.freighterAPI.isConnected();
        return connected;
      }

      // Fallback: try to get public key to check availability
      if (typeof this.freighterAPI.getPublicKey === 'function') {
        // Don't actually call it, just check if the method exists
        return true;
      }

      return false;
    } catch (error) {
      console.log('Error checking Freighter availability:', error);
      return false;
    }
  }

  /**
   * Connect to Freighter and get public key
   */
  async connectFreighter(): Promise<{ publicKey: string; success: boolean; error?: string }> {
    console.log('🚀 Attempting to connect to Freighter...');

    try {
      // First check availability
      const isAvailable = await this.isFreighterAvailable();
      if (!isAvailable) {
        return {
          publicKey: '',
          success: false,
          error: 'Freighter wallet is not available. Please install and enable the Freighter browser extension.'
        };
      }

      if (!this.freighterAPI || typeof this.freighterAPI.getPublicKey !== 'function') {
        return {
          publicKey: '',
          success: false,
          error: 'Freighter API not properly loaded. Please refresh the page and try again.'
        };
      }

      // Request public key (this will prompt user if not already connected)
      console.log('🔑 Requesting public key from Freighter...');
      const publicKey = await this.freighterAPI.getPublicKey();

      if (!publicKey || typeof publicKey !== 'string') {
        return {
          publicKey: '',
          success: false,
          error: 'Failed to get public key from Freighter. Please try again.'
        };
      }

      console.log(`✅ Successfully connected to Freighter: ${publicKey.substring(0, 8)}...`);
      
      return {
        publicKey,
        success: true
      };

    } catch (error: any) {
      console.error('❌ Freighter connection error:', error);

      let errorMessage = 'Unknown error occurred';
      
      if (error.message) {
        if (error.message.includes('User declined')) {
          errorMessage = 'Connection declined. Please approve the connection in Freighter and try again.';
        } else if (error.message.includes('locked')) {
          errorMessage = 'Freighter is locked. Please unlock your wallet and try again.';
        } else if (error.message.includes('not available')) {
          errorMessage = 'Freighter is not available. Please install the Freighter browser extension.';
        } else {
          errorMessage = error.message;
        }
      }

      return {
        publicKey: '',
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Sign a transaction with Freighter
   */
  async signTransaction(transactionXdr: string, network: 'TESTNET' | 'PUBLIC' = 'TESTNET'): Promise<{ signedXdr: string; success: boolean; error?: string }> {
    try {
      if (!this.freighterAPI || typeof this.freighterAPI.signTransaction !== 'function') {
        return {
          signedXdr: '',
          success: false,
          error: 'Freighter is not connected. Please connect your wallet first.'
        };
      }

      const signedXdr = await this.freighterAPI.signTransaction(transactionXdr, network);

      return {
        signedXdr,
        success: true
      };

    } catch (error: any) {
      console.error('Transaction signing error:', error);
      
      let errorMessage = 'Failed to sign transaction';
      if (error.message) {
        if (error.message.includes('User declined')) {
          errorMessage = 'Transaction signing declined. Please approve the transaction in Freighter.';
        } else {
          errorMessage = error.message;
        }
      }

      return {
        signedXdr: '',
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Get debugging information
   */
  getDebugInfo(): any {
    return {
      freighterDetected: !!this.freighterAPI,
      freighterMethods: this.freighterAPI ? Object.getOwnPropertyNames(this.freighterAPI) : [],
      windowFreighter: !!(window as any).freighter,
      windowStellar: !!(window as any).stellar,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const stellarWalletService = new StellarWalletService();