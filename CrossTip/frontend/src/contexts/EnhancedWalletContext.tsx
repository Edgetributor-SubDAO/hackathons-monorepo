import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { web3Enable, web3Accounts } from '@polkadot/extension-dapp';
import { config } from '../config';

// Define supported wallet types
export enum WalletType {
  FREIGHTER = 'freighter',
  ALBEDO = 'albedo',
  RABET = 'rabet',
  LOBSTR = 'lobstr'
}

interface WalletInfo {
  id: WalletType;
  name: string;
  icon: string;
  url: string;
  isInstalled: boolean;
}

interface EnhancedWalletContextType {
  // Wallet state
  stellarAddress: string | null;
  stellarConnected: boolean;
  selectedWallet: WalletInfo | null;
  availableWallets: WalletInfo[];
  
  // Polkadot integration
  polkadotAddress: string | null;
  polkadotConnected: boolean;
  polkadotApi: ApiPromise | null;
  
  // Methods
  detectWallets: () => Promise<void>;
  connectWallet: (walletType: WalletType) => Promise<void>;
  disconnectWallet: () => Promise<void>;
  connectPolkadot: () => Promise<void>;
  disconnectPolkadot: () => void;
  signTransaction: (transactionXDR: string) => Promise<string>;
  
  // Status
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

const EnhancedWalletContext = createContext<EnhancedWalletContextType | undefined>(undefined);

export const useEnhancedWallet = () => {
  const context = useContext(EnhancedWalletContext);
  if (!context) {
    throw new Error('useEnhancedWallet must be used within EnhancedWalletProvider');
  }
  return context;
};

interface EnhancedWalletProviderProps {
  children: ReactNode;
}

export const EnhancedWalletProvider: React.FC<EnhancedWalletProviderProps> = ({ children }) => {
  // Wallet state
  const [availableWallets, setAvailableWallets] = useState<WalletInfo[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<WalletInfo | null>(null);
  const [stellarAddress, setStellarAddress] = useState<string | null>(null);
  
  // Polkadot state
  const [polkadotAddress, setPolkadotAddress] = useState<string | null>(null);
  const [polkadotApi, setPolkadotApi] = useState<ApiPromise | null>(null);
  
  // General state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initial detection
    detectWallets();
    loadSavedConnections();
    
    // Set up continuous monitoring for wallet injection
    const walletDetectionInterval = setInterval(() => {
      // Re-check every 2 seconds for the first 30 seconds
      detectWallets();
    }, 2000);
    
    // Stop checking after 30 seconds
    const stopMonitoring = setTimeout(() => {
      clearInterval(walletDetectionInterval);
    }, 30000);
    
    // Also listen for window focus events (user might have installed extension)
    const handleFocus = () => {
      detectWallets();
    };
    
    window.addEventListener('focus', handleFocus);
    
    // Listen for potential extension injection events
    const handleExtensionReady = () => {
      console.log('Extension ready event detected, re-checking wallets...');
      setTimeout(detectWallets, 1000);
    };
    
    // Some extensions fire custom events when ready
    window.addEventListener('freighter-ready', handleExtensionReady);
    window.addEventListener('stellar-ready', handleExtensionReady);
    
    return () => {
      clearInterval(walletDetectionInterval);
      clearTimeout(stopMonitoring);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('freighter-ready', handleExtensionReady);
      window.removeEventListener('stellar-ready', handleExtensionReady);
    };
  }, []);

  const loadSavedConnections = () => {
    // Load saved Stellar connection
    const savedStellarAddress = localStorage.getItem('stellarAddress');
    if (savedStellarAddress) {
      setStellarAddress(savedStellarAddress);
    }

    // Load saved Polkadot connection
    const savedPolkadotAddress = localStorage.getItem('polkadotAddress');
    if (savedPolkadotAddress) {
      setPolkadotAddress(savedPolkadotAddress);
    }
  };

  const detectWallets = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('� Detecting available Stellar wallets...');

      // Define wallets to check
      const walletsToCheck: WalletInfo[] = [
        {
          id: WalletType.FREIGHTER,
          name: 'Freighter',
          icon: '🚀',
          url: 'https://www.freighter.app/',
          isInstalled: false
        },
        {
          id: WalletType.ALBEDO,
          name: 'Albedo',
          icon: '🌟',
          url: 'https://albedo.link/',
          isInstalled: false
        },
        {
          id: WalletType.RABET,
          name: 'Rabet',
          icon: '🐰',
          url: 'https://rabet.io/',
          isInstalled: false
        },
        {
          id: WalletType.LOBSTR,
          name: 'LOBSTR',
          icon: '🦞',
          url: 'https://lobstr.co/',
          isInstalled: false
        }
      ];

      // Check which wallets are installed
      for (const wallet of walletsToCheck) {
        const isInstalled = await checkWalletInstalled(wallet.id);
        wallet.isInstalled = isInstalled;
        
        if (isInstalled) {
          console.log(`✅ ${wallet.name} detected`);
        } else {
          console.log(`❌ ${wallet.name} not found`);
        }
      }

      setAvailableWallets(walletsToCheck);
      
      const installedWallets = walletsToCheck.filter(w => w.isInstalled);
      console.log(`📱 Installed wallets: ${installedWallets.map(w => w.name).join(', ')}`);

      // Try to restore previous connection
      const savedWalletId = localStorage.getItem('selectedWalletId') as WalletType;
      if (savedWalletId) {
        const savedWallet = walletsToCheck.find(w => w.id === savedWalletId && w.isInstalled);
        if (savedWallet) {
          setSelectedWallet(savedWallet);
          console.log(`🔄 Restoring connection to ${savedWallet.name}`);
          
          try {
            await connectWallet(savedWallet.id);
          } catch (autoConnectError) {
            console.log('Auto-connect failed:', autoConnectError);
            localStorage.removeItem('selectedWalletId');
          }
        }
      }

    } catch (error) {
      console.error('❌ Failed to detect wallets:', error);
      setError(error instanceof Error ? error.message : 'Failed to detect wallets');
    } finally {
      setIsLoading(false);
    }
  };

  const checkWalletInstalled = async (walletType: WalletType): Promise<boolean> => {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 10; // Increased attempts
      
      const check = () => {
        attempts++;
        let isInstalled = false;
        
        switch (walletType) {
          case WalletType.FREIGHTER:
            // Try multiple detection methods for Freighter
            isInstalled = !!(window as any).freighter || 
                          !!(window as any).stellar ||
                          !!(window as any).freighterApi ||
                          // Check if extension is in process of loading
                          document.querySelector('[data-extension="freighter"]') !== null;
            
            // Additional check: look for Freighter in the global scope
            if (!isInstalled) {
              try {
                isInstalled = typeof (window as any)['freighter'] !== 'undefined';
              } catch (e) {
                // Ignore errors
              }
            }
            break;
            
          case WalletType.ALBEDO:
            isInstalled = !!(window as any).albedo;
            break;
          case WalletType.RABET:
            isInstalled = !!(window as any).rabet;
            break;
          case WalletType.LOBSTR:
            isInstalled = !!(window as any).lobstr;
            break;
        }
        
        console.log(`Wallet detection attempt ${attempts}/${maxAttempts} for ${walletType}: ${isInstalled}`);
        
        if (isInstalled || attempts >= maxAttempts) {
          resolve(isInstalled);
        } else {
          // Progressive delay: longer waits for later attempts
          const delay = Math.min(attempts * 300, 2000);
          setTimeout(check, delay);
        }
      };
      
      // Start checking immediately, then with delays
      check();
    });
  };

  const connectWallet = async (walletType: WalletType) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log(`🔗 Connecting to ${walletType} wallet...`);

      let walletApi: any = null;
      let address: string = '';

      // Connect based on wallet type
      switch (walletType) {
        case WalletType.FREIGHTER:
          walletApi = (window as any).freighter;
          if (!walletApi) {
            throw new Error('Freighter wallet not installed');
          }
          
          // Enhanced Freighter connection with multiple attempts
          let attempts = 0;
          const maxAttempts = 3;
          
          while (!address && attempts < maxAttempts) {
            attempts++;
            try {
              console.log(`🔑 Freighter connection attempt ${attempts}/${maxAttempts}`);
              address = await walletApi.getPublicKey();
              if (address) break;
            } catch (attemptError) {
              console.log(`Attempt ${attempts} failed:`, attemptError);
              if (attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }
          }
          break;

        case WalletType.ALBEDO:
          walletApi = (window as any).albedo;
          if (!walletApi) {
            throw new Error('Albedo wallet not installed');
          }
          const albedoResult = await walletApi.getPublicKey({});
          address = albedoResult.pubkey;
          break;

        case WalletType.RABET:
          walletApi = (window as any).rabet;
          if (!walletApi) {
            throw new Error('Rabet wallet not installed');
          }
          const rabetResult = await walletApi.connect();
          address = rabetResult.publicKey;
          break;

        case WalletType.LOBSTR:
          walletApi = (window as any).lobstr;
          if (!walletApi) {
            throw new Error('LOBSTR wallet not installed');
          }
          address = await walletApi.getPublicKey();
          break;

        default:
          throw new Error(`Unsupported wallet type: ${walletType}`);
      }

      if (!address) {
        throw new Error('No address returned from wallet');
      }

      // Validate address format
      if (!address.startsWith('G') || address.length !== 56) {
        throw new Error('Invalid Stellar address format received');
      }

      // Find and set the selected wallet
      const wallet = availableWallets.find(w => w.id === walletType);
      if (!wallet) {
        throw new Error('Wallet not found in available wallets');
      }

      setStellarAddress(address);
      setSelectedWallet(wallet);
      
      // Save the connection
      localStorage.setItem('stellarAddress', address);
      localStorage.setItem('selectedWalletId', walletType);
      
      console.log(`✅ Successfully connected to ${wallet.name}`);
      console.log(`📍 Address: ${address.substring(0, 8)}...${address.substring(-8)}`);

    } catch (error) {
      console.error(`❌ Failed to connect to ${walletType}:`, error);
      
      let userFriendlyMessage = 'Failed to connect to wallet.';
      
      if (error instanceof Error) {
        if (error.message.includes('User declined') || error.message.includes('rejected')) {
          userFriendlyMessage = 'Connection was cancelled by user.';
        } else if (error.message.includes('not installed')) {
          userFriendlyMessage = `${walletType} wallet not installed.`;
        } else if (error.message.includes('locked')) {
          userFriendlyMessage = 'Please unlock your wallet and try again.';
        } else {
          userFriendlyMessage = error.message;
        }
      }
      
      setError(userFriendlyMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      setStellarAddress(null);
      setSelectedWallet(null);
      
      // Clear saved data
      localStorage.removeItem('stellarAddress');
      localStorage.removeItem('selectedWalletId');
      
      console.log('✅ Wallet disconnected');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  const connectPolkadot = async () => {
    try {
      setIsLoading(true);
      
      // Initialize API connection if needed
      if (!polkadotApi && !config.polkadot.disableAutoConnect) {
        const provider = new WsProvider(config.polkadot.wsEndpoint);
        const api = await ApiPromise.create({ provider });
        setPolkadotApi(api);
      }

      // Enable web3 extension
      const extensions = await web3Enable('CrossTip');
      
      if (extensions.length === 0) {
        throw new Error('No Polkadot extension found');
      }

      // Get accounts
      const accounts = await web3Accounts();
      
      if (accounts.length === 0) {
        throw new Error('No accounts found in Polkadot extension');
      }

      const account = accounts[0];
      setPolkadotAddress(account.address);
      localStorage.setItem('polkadotAddress', account.address);
      
      console.log('✅ Polkadot wallet connected:', account.address);
      
    } catch (error) {
      console.error('❌ Failed to connect Polkadot wallet:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect Polkadot wallet');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectPolkadot = () => {
    setPolkadotAddress(null);
    localStorage.removeItem('polkadotAddress');
    
    if (polkadotApi) {
      polkadotApi.disconnect();
      setPolkadotApi(null);
    }
    
    console.log('✅ Polkadot wallet disconnected');
  };

  const signTransaction = async (transactionXDR: string) => {
    if (!selectedWallet) {
      throw new Error('No wallet connected');
    }

    try {
      console.log('📝 Signing transaction...');
      
      let signedTxXdr: string = '';
      
      // Sign based on wallet type
      switch (selectedWallet.id) {
        case WalletType.FREIGHTER:
          const freighter = (window as any).freighter;
          if (!freighter) throw new Error('Freighter not available');
          const freighterResult = await freighter.signTransaction(transactionXDR);
          signedTxXdr = freighterResult;
          break;
          
        case WalletType.ALBEDO:
          const albedo = (window as any).albedo;
          if (!albedo) throw new Error('Albedo not available');
          const albedoResult = await albedo.tx({
            xdr: transactionXDR,
            network: 'testnet'
          });
          signedTxXdr = albedoResult.signed_envelope_xdr;
          break;
          
        case WalletType.RABET:
          const rabet = (window as any).rabet;
          if (!rabet) throw new Error('Rabet not available');
          const rabetResult = await rabet.sign(transactionXDR, 'testnet');
          signedTxXdr = rabetResult.xdr;
          break;
          
        default:
          throw new Error(`Transaction signing not implemented for ${selectedWallet.name}`);
      }
      
      console.log('✅ Transaction signed successfully');
      return signedTxXdr;
      
    } catch (error) {
      console.error('❌ Failed to sign transaction:', error);
      throw error;
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: EnhancedWalletContextType = {
    // Wallet state
    availableWallets,
    selectedWallet,
    stellarAddress,
    stellarConnected: !!stellarAddress,
    
    // Polkadot
    polkadotAddress,
    polkadotConnected: !!polkadotAddress,
    polkadotApi,
    
    // Methods
    detectWallets,
    connectWallet,
    disconnectWallet,
    connectPolkadot,
    disconnectPolkadot,
    signTransaction,
    clearError,
    
    // Status
    isLoading,
    error,
  };

  return (
    <EnhancedWalletContext.Provider value={value}>
      {children}
    </EnhancedWalletContext.Provider>
  );
};