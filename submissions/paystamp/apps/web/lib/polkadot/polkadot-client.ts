/**
 * Polkadot Client using polkadot-api
 * Light client first approach for browser-based interactions
 * Based on: https://papi.how/
 * 
 * Note: This is a simplified implementation.
 * For full contract integration, you'll need to:
 * 1. Add chain descriptors using: npx papi add <chain>
 * 2. Generate types: npx papi
 * 3. Use the generated types for contract calls
 */

// Dynamic import to avoid SSR issues
let polkadotApiModule: any = null;

async function getPolkadotApiModule() {
  if (!polkadotApiModule) {
    try {
      polkadotApiModule = await import('polkadot-api');
    } catch (error) {
      console.warn('Failed to load polkadot-api:', error);
      return null;
    }
  }
  return polkadotApiModule;
}

export interface PolkadotNetwork {
  name: 'shibuya' | 'shiden' | 'astar';
  chainSpec: string;
  rpcUrl?: string;
}

export interface AccessStamp {
  user: string;
  serviceId: string;
  expiresAt: number;
  mintedAt: number;
  isActive: boolean;
}

const NETWORKS: Record<string, PolkadotNetwork> = {
  shibuya: {
    name: 'shibuya',
    chainSpec: 'shibuya',
    rpcUrl: 'wss://rpc.shibuya.astar.network',
  },
  shiden: {
    name: 'shiden',
    chainSpec: 'shiden',
    rpcUrl: 'wss://rpc.shiden.astar.network',
  },
  astar: {
    name: 'astar',
    chainSpec: 'astar',
    rpcUrl: 'wss://rpc.astar.network',
  },
};

export class PolkadotClient {
  private api: any = null;
  private provider: any = null;
  private network: PolkadotNetwork;
  private isConnecting = false;

  constructor(network: 'shibuya' | 'shiden' | 'astar' = 'shibuya') {
    this.network = NETWORKS[network] || NETWORKS.shibuya;
  }

  /**
   * Initialize Polkadot API connection
   */
  async connect(): Promise<void> {
    if (this.api && this.provider) {
      return; // Already connected
    }

    if (this.isConnecting) {
      // Wait for existing connection attempt with timeout
      const maxWait = 2000; // 2 seconds max wait
      const startTime = Date.now();
      while (this.isConnecting && (Date.now() - startTime) < maxWait) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      if (this.isConnecting) {
        // Timeout reached, reset and continue
        this.isConnecting = false;
      }
      return;
    }

    this.isConnecting = true;

    try {
      // Add overall timeout for connection (2 seconds)
      const connectPromise = (async () => {
        // Dynamic import to avoid SSR issues
        const polkadotApi = await getPolkadotApiModule();

        if (!polkadotApi) {
          console.warn('Polkadot API module not available');
          return;
        }

        // For now, we'll use a simplified approach
        // Full light client integration requires:
        // 1. Chain spec files setup with: npx papi add <chain>
        // 2. Proper smoldot initialization
        // 3. API instance creation with generated types
        
        if (this.network.rpcUrl) {
          console.log(`✅ Polkadot client initialized for ${this.network.name}`);
          console.log(`   RPC: ${this.network.rpcUrl}`);
          console.log(`   Note: Full integration requires chain setup with 'npx papi add ${this.network.name}'`);
          
          // Mark as connected (even though full API isn't set up yet)
          // This allows the app to work while Polkadot integration is being completed
          this.api = { initialized: true, network: this.network.name };
        }
      })();

      const timeoutPromise = new Promise<void>((resolve) => {
        setTimeout(() => {
          console.warn('Polkadot connection timeout, using fallback');
          this.api = { initialized: true, network: this.network.name };
          resolve();
        }, 2000); // 2 second timeout
      });

      await Promise.race([connectPromise, timeoutPromise]);
    } catch (error) {
      console.error('Failed to connect to Polkadot:', error);
      // Don't throw - allow graceful degradation
      console.warn('Polkadot connection failed, continuing without it');
      // Set fallback API
      this.api = { initialized: true, network: this.network.name };
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Disconnect from Polkadot
   */
  async disconnect(): Promise<void> {
    if (this.provider) {
      await this.provider.disconnect();
      this.provider = null;
    }
    this.api = null;
  }

  /**
   * Get API instance
   */
  async getApi() {
    if (!this.api) {
      // Add timeout to prevent hanging
      const connectPromise = this.connect();
      const timeoutPromise = new Promise<void>((resolve) => {
        setTimeout(() => {
          console.warn('Polkadot connection timeout, using fallback');
          resolve();
        }, 2000); // 2 second timeout
      });
      await Promise.race([connectPromise, timeoutPromise]);
    }
    return this.api!;
  }

  /**
   * Check if user has access to a service
   * This would query the ink! contract
   * For now, returns a simulated value
   */
  async hasAccess(
    userAddress: string,
    serviceId: string
  ): Promise<boolean> {
    try {
      // Add timeout to prevent hanging
      const apiPromise = this.getApi();
      const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => resolve(false), 1000); // 1 second timeout
      });
      
      await Promise.race([apiPromise, timeoutPromise]);
      
      // TODO: Implement contract query
      // This would call the ink! contract's has_access method
      // For now, return false as placeholder
      
      return false;
    } catch (error) {
      console.error('Error checking access:', error);
      return false;
    }
  }

  /**
   * Get access stamp details
   */
  async getAccessStamp(
    userAddress: string,
    serviceId: string
  ): Promise<AccessStamp | null> {
    try {
      // Add timeout to prevent hanging
      const apiPromise = this.getApi();
      const timeoutPromise = new Promise<AccessStamp | null>((resolve) => {
        setTimeout(() => resolve(null), 1000); // 1 second timeout
      });
      
      await Promise.race([apiPromise, timeoutPromise]);
      
      // TODO: Implement contract query
      // This would call the ink! contract's get_stamp method
      
      return null;
    } catch (error) {
      console.error('Error getting access stamp:', error);
      return null;
    }
  }

  /**
   * Get expiry timestamp for access
   */
  async getExpiry(
    userAddress: string,
    serviceId: string
  ): Promise<number | null> {
    try {
      // Add timeout to prevent hanging
      const apiPromise = this.getApi();
      const timeoutPromise = new Promise<number | null>((resolve) => {
        setTimeout(() => resolve(null), 1000); // 1 second timeout
      });
      
      await Promise.race([apiPromise, timeoutPromise]);
      
      // TODO: Implement contract query
      // This would call the ink! contract's get_expiry method
      
      return null;
    } catch (error) {
      console.error('Error getting expiry:', error);
      return null;
    }
  }

  /**
   * Switch network
   */
  async switchNetwork(network: 'shibuya' | 'shiden' | 'astar'): Promise<void> {
    if (this.network.name === network) {
      return; // Already on this network
    }

    await this.disconnect();
    this.network = NETWORKS[network] || NETWORKS.shibuya;
    await this.connect();
  }

  /**
   * Get current network
   */
  getNetwork(): string {
    return this.network.name;
  }
}

