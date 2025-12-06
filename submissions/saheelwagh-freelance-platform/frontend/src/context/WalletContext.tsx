import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import freighterApi from '@stellar/freighter-api';

// Contract ID deployed on testnet
export const ESCROW_CONTRACT_ID = 'CCKCGYGFMTYRAHHNOVMBMGKAP6S4XSWL3TEJJH2D4JCZWBJRIZBUXZII';
export const NETWORK = 'TESTNET';
export const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';

interface WalletContextType {
  isConnected: boolean;
  address: string;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check wallet connection on mount
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const { isConnected: connected } = await freighterApi.isConnected();
      if (connected) {
        const { isAllowed } = await freighterApi.isAllowed();
        if (isAllowed) {
          const { address: addr } = await freighterApi.getAddress();
          if (addr) {
            setAddress(addr);
            setIsConnected(true);
          }
        }
      }
    } catch (err) {
      console.log('Wallet not connected');
    }
  };

  const connect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const { isConnected: connected } = await freighterApi.isConnected();
      
      if (!connected) {
        setError('Please install Freighter wallet extension');
        window.open('https://www.freighter.app/', '_blank');
        setIsConnecting(false);
        return;
      }

      await freighterApi.setAllowed();
      const { address: addr } = await freighterApi.getAddress();
      
      if (addr) {
        setAddress(addr);
        setIsConnected(true);
      }
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAddress('');
    setIsConnected(false);
  };

  return (
    <WalletContext.Provider value={{
      isConnected,
      address,
      isConnecting,
      error,
      connect,
      disconnect,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
