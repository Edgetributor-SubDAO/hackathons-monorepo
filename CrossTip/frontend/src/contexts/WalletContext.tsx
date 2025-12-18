import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { web3Enable, web3Accounts } from '@polkadot/extension-dapp';
import { config } from '../config';

interface WalletContextType {
  stellarAddress: string | null;
  polkadotAddress: string | null;
  stellarConnected: boolean;
  polkadotConnected: boolean;
  connectStellar: () => Promise<void>;
  connectPolkadot: () => Promise<void>;
  disconnectStellar: () => void;
  disconnectPolkadot: () => void;
  polkadotApi: ApiPromise | null;
  signTransaction: (transactionXDR: string, network: string) => Promise<string>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Export hook with HMR-friendly pattern
const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    console.error('useWallet called outside of WalletProvider');
    console.error('Current context:', context);
    console.error('Stack trace:', new Error().stack);
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};

export { useWallet };

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [stellarAddress, setStellarAddress] = useState<string | null>(null);
  const [polkadotAddress, setPolkadotAddress] = useState<string | null>(null);
  const [polkadotApi, setPolkadotApi] = useState<ApiPromise | null>(null);
  const [contextReady, setContextReady] = useState(false);

  useEffect(() => {
    // Aggressive error suppression to prevent phantom wallet from crashing React
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalOnError = window.onerror;
    const originalUnhandledRejection = window.onunhandledrejection;

    // Override console methods to suppress phantom wallet errors
    console.error = (...args) => {
      const message = args[0]?.toString?.() || '';
      if (message.includes('Unable to set window.solana') || 
          message.includes('Unable to set window.phantom') ||
          message.includes('installHook.js')) {
        return; // Completely suppress these errors
      }
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      const message = args[0]?.toString?.() || '';
      if (message.includes('phantom') || message.includes('solana')) {
        return; // Suppress phantom warnings too
      }
      originalWarn.apply(console, args);
    };

    // Prevent unhandled errors from crashing React
    window.onerror = (message, source, lineno, colno, error) => {
      const msg = message?.toString?.() || '';
      if (msg.includes('Unable to set window.solana') || 
          msg.includes('Unable to set window.phantom') ||
          source?.includes?.('installHook.js')) {
        return true; // Prevent default error handling
      }
      if (originalOnError) {
        return originalOnError(message, source, lineno, colno, error);
      }
      return false;
    };

    // Handle unhandled promise rejections
    window.onunhandledrejection = (event) => {
      const reason = event.reason?.toString?.() || '';
      if (reason.includes('phantom') || reason.includes('solana')) {
        event.preventDefault(); // Prevent unhandled rejection
        return;
      }
      if (originalUnhandledRejection) {
        originalUnhandledRejection.call(window, event);
      }
    };

    // Initialize wallet connections and check for saved addresses
    const initializeWallets = async () => {
      try {
        console.log('WalletProvider initialized - checking for saved connections');

        // Check for saved Stellar address
        const savedStellarAddress = localStorage.getItem('stellarAddress');
        if (savedStellarAddress) {
          console.log('Found saved Stellar address:', savedStellarAddress);
          setStellarAddress(savedStellarAddress);
        }

        // Check for saved Polkadot address
        const savedPolkadotAddress = localStorage.getItem('polkadotAddress');
        if (savedPolkadotAddress) {
          console.log('Found saved Polkadot address:', savedPolkadotAddress);
          setPolkadotAddress(savedPolkadotAddress);
        }

        setContextReady(true);
      } catch (error) {
        console.error('Error initializing wallets:', error);
        setContextReady(true); // Still mark as ready to prevent blocking
      }
    };

    // Wait a moment for phantom to finish its initialization before starting ours
    setTimeout(initializeWallets, 1000);

    return () => {
      // Restore original handlers
      console.error = originalError;
      console.warn = originalWarn;
      window.onerror = originalOnError;
      window.onunhandledrejection = originalUnhandledRejection;
      
      if (polkadotApi) {
        polkadotApi.disconnect();
      }
    };
  }, []);

  const connectStellar = async () => {
    try {
      console.log('🚀 Starting enhanced Stellar wallet connection...');
      
      // Step 1: Advanced Freighter detection with multiple strategies
      const detectFreighter = async (): Promise<any> => {
        const detectionStrategies = [
          () => (window as any).freighter,
          () => (window as any).stellar,
          () => (window as any).freighterApi,
          () => (window as any)['freighter-api'],
          () => {
            // Check in document context (sometimes extensions inject here)
            const doc = document as any;
            return doc.freighter || doc.stellar;
          },
          () => {
            // Check for extension content script indicators
            const extensionElements = document.querySelectorAll('[data-extension="freighter"], [data-wallet="freighter"]');
            if (extensionElements.length > 0) {
              console.log('Found Freighter DOM indicators');
              return (window as any).freighter;
            }
            return null;
          }
        ];

        for (let attempt = 1; attempt <= 6; attempt++) {
          console.log(`🔍 Detection attempt ${attempt}/6`);
          
          for (const strategy of detectionStrategies) {
            try {
              const result = strategy();
              if (result && typeof result === 'object') {
                console.log(`✅ Freighter found via strategy ${detectionStrategies.indexOf(strategy) + 1}`);
                return result;
              }
            } catch (e) {
              // Strategy failed, continue
            }
          }

          if (attempt < 6) {
            console.log(`⏳ Waiting ${attempt * 500}ms before next attempt...`);
            await new Promise(resolve => setTimeout(resolve, attempt * 500));
          }
        }

        return null;
      };

      const freighter = await detectFreighter();

      if (!freighter) {
        console.error('❌ Freighter detection failed completely');
        
        // Enhanced diagnostic information
        const diagnostics = {
          userAgent: navigator.userAgent,
          windowKeys: Object.keys(window).filter(k => k.toLowerCase().includes('freighter') || k.toLowerCase().includes('stellar')),
          documentKeys: Object.keys(document).filter(k => k.toLowerCase().includes('freighter') || k.toLowerCase().includes('stellar')),
          hasExtensionElements: document.querySelectorAll('[data-extension], [data-wallet]').length > 0
        };
        
        console.log('🔧 Diagnostics:', diagnostics);
        
        let errorMessage = '🔌 Freighter Wallet Not Detected\n\n';
        errorMessage += '📋 Troubleshooting Steps:\n';
        errorMessage += '1️⃣ Install Freighter: https://www.freighter.app/\n';
        errorMessage += '2️⃣ Enable the extension in your browser\n';
        errorMessage += '3️⃣ Refresh this page (Ctrl+F5 or Cmd+Shift+R)\n';
        errorMessage += '4️⃣ Try opening Freighter manually first\n';
        errorMessage += '5️⃣ Disable conflicting wallet extensions temporarily\n\n';
        
        if (diagnostics.windowKeys.length > 0) {
          errorMessage += `🔍 Found wallet-related objects: ${diagnostics.windowKeys.join(', ')}\n`;
        }
        
        alert(errorMessage);
        return;
      }

      console.log('🎯 Freighter object detected, verifying functionality...');

      // Step 2: Verify Freighter has required methods
      const requiredMethods = ['getPublicKey', 'isConnected', 'signTransaction'];
      const missingMethods = requiredMethods.filter(method => typeof freighter[method] !== 'function');
      
      if (missingMethods.length > 0) {
        throw new Error(`Freighter API incomplete. Missing methods: ${missingMethods.join(', ')}`);
      }

      // Step 3: Check connection status
      let isConnected = false;
      try {
        isConnected = await freighter.isConnected();
        console.log(`🔗 Freighter connection status: ${isConnected}`);
      } catch (e) {
        console.log('⚠️ Could not check connection status, proceeding anyway...');
      }

      // Step 4: Request access and get public key
      console.log('🔑 Requesting public key from Freighter...');
      const publicKey = await freighter.getPublicKey();
      
      if (!publicKey || typeof publicKey !== 'string') {
        throw new Error('Invalid public key received from Freighter');
      }

      // Step 5: Validate the public key format
      if (!publicKey.startsWith('G') || publicKey.length !== 56) {
        throw new Error('Invalid Stellar public key format');
      }

      // Step 6: Store the connection
      setStellarAddress(publicKey);
      localStorage.setItem('stellarAddress', publicKey);
      localStorage.setItem('stellarConnectedAt', new Date().toISOString());
      
      console.log('🎉 Stellar wallet successfully connected!');
      console.log('📍 Address:', `${publicKey.slice(0, 8)}...${publicKey.slice(-8)}`);
      
    } catch (error) {
      console.error('💥 Stellar wallet connection failed:', error);
      
      let userMessage = 'Failed to connect to Freighter wallet.\n\n';
      
      if (error instanceof Error) {
        if (error.message.includes('User declined access')) {
          userMessage += '❌ You declined access to Freighter.\n';
          userMessage += '✅ Please click "Connect Stellar Wallet" again and approve the request.';
        } else if (error.message.includes('Invalid public key')) {
          userMessage += '🔧 Invalid response from Freighter.\n';
          userMessage += '✅ Please try refreshing the page and connecting again.';
        } else {
          userMessage += `Error: ${error.message}\n\n`;
          userMessage += '✅ Please ensure Freighter is properly installed and unlocked.';
        }
      } else {
        userMessage += '✅ Please check that Freighter extension is installed and enabled.';
      }
      
      alert(userMessage);
    }
  };

  const connectPolkadot = async () => {
    try {
      // Check if Polkadot integration is disabled
      if (config.polkadot.disableAutoConnect) {
        const userConfirm = confirm(
          'Polkadot integration is currently disabled in development mode.\n\n' +
          'Do you want to enable it? This will require the Polkadot.js extension.\n\n' +
          'Click OK to proceed or Cancel to skip Polkadot integration.'
        );
        
        if (!userConfirm) {
          console.log('User cancelled Polkadot connection');
          return;
        }
      }

      console.log('🔗 Connecting to Polkadot...');
      
      // First, try to initialize the API connection
      if (!polkadotApi) {
        console.log('Initializing Polkadot API connection...');
        try {
          const provider = new WsProvider(config.polkadot.wsEndpoint);
          const api = await ApiPromise.create({ provider });
          setPolkadotApi(api);
          console.log('✅ Polkadot API connected successfully');
        } catch (apiError) {
          console.warn('⚠️ Failed to connect to Polkadot API:', apiError);
          alert('Failed to connect to Polkadot network. Please check your internet connection.');
          return;
        }
      }

      // Now try to connect to Polkadot.js extension
      console.log('🔌 Connecting to Polkadot.js extension...');
      const extensions = await web3Enable('CrossTip');
      
      if (extensions.length === 0) {
        alert(
          'Polkadot.js extension not found.\n\n' +
          'Please install it from:\n' +
          'https://polkadot.js.org/extension/\n\n' +
          'Then refresh this page and try again.'
        );
        return;
      }

      console.log(`✅ Found ${extensions.length} Polkadot extension(s)`);

      const accounts = await web3Accounts();
      if (accounts.length === 0) {
        alert(
          'No accounts found in Polkadot.js extension.\n\n' +
          'Please:\n' +
          '1. Open the Polkadot.js extension\n' +
          '2. Create or import an account\n' +
          '3. Try connecting again'
        );
        return;
      }

      console.log(`✅ Found ${accounts.length} Polkadot account(s)`);
      
      setPolkadotAddress(accounts[0].address);
      localStorage.setItem('polkadotAddress', accounts[0].address);
      
      console.log('🎉 Polkadot wallet connected successfully!');
      
    } catch (error) {
      console.error('💥 Failed to connect Polkadot wallet:', error);
      
      let errorMessage = 'Failed to connect to Polkadot wallet.\n\n';
      
      if (error instanceof Error) {
        if (error.message.includes('Extension not found')) {
          errorMessage += 'Polkadot.js extension is not installed.\n';
          errorMessage += 'Please install it from https://polkadot.js.org/extension/';
        } else if (error.message.includes('rejected')) {
          errorMessage += 'Connection was rejected by the extension.\n';
          errorMessage += 'Please approve the connection request.';
        } else {
          errorMessage += `Error: ${error.message}`;
        }
      } else {
        errorMessage += 'Please ensure Polkadot.js extension is installed and unlocked.';
      }
      
      alert(errorMessage);
    }
  };

  const disconnectStellar = () => {
    setStellarAddress(null);
    localStorage.removeItem('stellarAddress');
  };

  const disconnectPolkadot = () => {
    setPolkadotAddress(null);
    localStorage.removeItem('polkadotAddress');
  };

  const signTransaction = async (transactionXDR: string, _network: string): Promise<string> => {
    // For now, return the XDR as-is (placeholder implementation)
    // In a real app, this would integrate with wallet extensions like Freighter
    if (!stellarAddress) {
      throw new Error('No Stellar wallet connected');
    }
    
    // This is a placeholder - in production you'd use wallet extensions
    console.warn('Transaction signing not implemented - using placeholder');
    return transactionXDR;
  };

  // Restore connections from localStorage
  useEffect(() => {
    const savedStellarAddress = localStorage.getItem('stellarAddress');
    if (savedStellarAddress) {
      setStellarAddress(savedStellarAddress);
    }

    const savedPolkadotAddress = localStorage.getItem('polkadotAddress');
    if (savedPolkadotAddress) {
      setPolkadotAddress(savedPolkadotAddress);
    }
  }, []);

  const value: WalletContextType = {
    stellarAddress,
    polkadotAddress,
    stellarConnected: !!stellarAddress,
    polkadotConnected: !!polkadotAddress,
    connectStellar,
    connectPolkadot,
    disconnectStellar,
    disconnectPolkadot,
    polkadotApi,
    signTransaction,
  };

  // Don't render children until context is safely initialized to prevent crashes
  if (!contextReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-lg">Initializing wallet context...</div>
      </div>
    );
  }

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};
