/**
 * Hook for Stellar Wallet Kit integration
 * Provides seamless wallet connection and transaction signing
 */

import { useEffect, useState, useCallback } from 'react';
import { useWalletStore } from '@/stores/wallet-store';
import {
  getPublicKey,
  connect,
  disconnect,
  signTransaction as kitSignTransaction,
  isConnected,
  getSelectedWallet,
} from '@/lib/stellar/stellar-wallets-kit';
import { StellarAccountService } from '@/lib/stellar/account-service';

export interface UseStellarWalletKitReturn {
  // State
  isConnected: boolean;
  isConnecting: boolean;
  publicKey: string | null;
  balance: string | null;
  selectedWallet: string | null;
  error: string | null;

  // Actions
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  signTransaction: (xdr: string, network?: string) => Promise<string>;
}

export function useStellarWalletKit(): UseStellarWalletKitReturn {
  const {
    stellarAddress,
    setStellarAddress,
    isStellarConnected,
    stellarNetwork,
  } = useWalletStore();

  const [isConnecting, setIsConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const accountService = new StellarAccountService(stellarNetwork);

  /**
   * Load account balance
   */
  const loadBalance = useCallback(
    async (publicKey: string) => {
      try {
        const accountBalance = await accountService.getXlmBalance(publicKey);
        setBalance(accountBalance);
        setError(null);
      } catch (err: any) {
        if (err.message.includes('not found')) {
          setBalance('0.00');
        } else {
          console.error('Error loading balance:', err);
        }
      }
    },
    [accountService]
  );

  /**
   * Check connection status
   */
  const checkConnection = useCallback(async () => {
    try {
      const connected = await isConnected();
      const publicKey = await getPublicKey();
      const walletId = getSelectedWallet();

      setConnected(connected);
      setSelectedWallet(walletId);

      if (connected && publicKey) {
        if (publicKey.startsWith('G') && publicKey.length === 56) {
          setStellarAddress(publicKey);
          await loadBalance(publicKey);
        }
      } else if (stellarAddress) {
        setStellarAddress(null);
      }
    } catch (err: any) {
      console.error('Error checking connection:', err);
    }
  }, [stellarAddress, setStellarAddress, loadBalance]);

  /**
   * Connect wallet
   */
  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      await connect(async (publicKey: string) => {
        if (
          !publicKey ||
          !publicKey.startsWith('G') ||
          publicKey.length !== 56
        ) {
          throw new Error('Invalid public key received from wallet.');
        }

        setStellarAddress(publicKey);
        setSelectedWallet(getSelectedWallet());
        setConnected(true);
        await loadBalance(publicKey);
      });
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, [setStellarAddress, loadBalance]);

  /**
   * Disconnect wallet
   */
  const disconnectWallet = useCallback(async () => {
    await disconnect(() => {
      setStellarAddress(null);
      setBalance(null);
      setSelectedWallet(null);
      setConnected(false);
      setError(null);
    });
  }, [setStellarAddress]);

  /**
   * Refresh balance
   */
  const refreshBalance = useCallback(async () => {
    if (stellarAddress) {
      await loadBalance(stellarAddress);
    }
  }, [stellarAddress, loadBalance]);

  /**
   * Sign transaction
   */
  const signTransaction = useCallback(
    async (xdr: string, network?: string): Promise<string> => {
      if (!connected || !stellarAddress) {
        throw new Error('Wallet not connected');
      }
      return kitSignTransaction(xdr, network);
    },
    [connected, stellarAddress]
  );

  // Initial check
  useEffect(() => {
    checkConnection();

    const handleFocus = () => {
      checkConnection();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [checkConnection]);

  // Refresh balance on network change
  useEffect(() => {
    if (stellarAddress && isStellarConnected) {
      loadBalance(stellarAddress);
    }
  }, [stellarNetwork, stellarAddress, isStellarConnected, loadBalance]);

  return {
    isConnected: connected && isStellarConnected,
    isConnecting,
    publicKey: stellarAddress,
    balance,
    selectedWallet,
    error,
    connectWallet,
    disconnectWallet,
    refreshBalance,
    signTransaction,
  };
}

