/**
 * Hook for seamless Freighter wallet management
 * Provides auto-detection, connection, and state management
 */

import { useEffect, useState, useCallback } from 'react';
import { useWalletStore } from '@/stores/wallet-store';
import { FreighterService } from '@/lib/freighter/freighter-service';
import { StellarAccountService } from '@/lib/stellar/account-service';

export interface WalletConnectionState {
  isInstalled: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  balance: string | null;
  network: string;
}

export function useFreighterWallet() {
  const {
    stellarAddress,
    setStellarAddress,
    isStellarConnected,
    stellarNetwork,
    setStellarNetwork,
  } = useWalletStore();

  const [isInstalled, setIsInstalled] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [network, setNetwork] = useState<string>('');

  const accountService = new StellarAccountService(stellarNetwork);

  /**
   * Check if Freighter is installed
   */
  const checkInstallation = useCallback(async () => {
    const installed = await FreighterService.waitForFreighter(2000);
    setIsInstalled(installed);
    return installed;
  }, []);

  /**
   * Auto-connect if previously connected
   */
  const autoConnect = useCallback(async () => {
    if (!isInstalled) return;

    try {
      const isConnected = await FreighterService.isConnected();
      const publicKey = await FreighterService.getPublicKey();
      const currentNetwork = await FreighterService.getNetwork();

      setNetwork(currentNetwork);

      if (isConnected && publicKey && publicKey.startsWith('G') && publicKey.length === 56) {
        setStellarAddress(publicKey);

        // Sync network
        if (currentNetwork === 'TESTNET' && stellarNetwork !== 'testnet') {
          setStellarNetwork('testnet');
        } else if (currentNetwork === 'PUBLIC' && stellarNetwork !== 'mainnet') {
          setStellarNetwork('mainnet');
        }

        // Load balance
        try {
          const accountBalance = await accountService.getXlmBalance(publicKey);
          setBalance(accountBalance);
        } catch (err) {
          setBalance('0.00');
        }
      }
    } catch (err: any) {
      console.error('Auto-connect error:', err);
    }
  }, [isInstalled, stellarNetwork, setStellarAddress, setStellarNetwork, accountService]);

  /**
   * Connect to Freighter
   */
  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      if (!isInstalled) {
        const installed = await checkInstallation();
        if (!installed) {
          throw new Error(
            'Freighter extension not found. Please install it from https://freighter.app'
          );
        }
      }

      // Ensure correct network
      const currentNetwork = await FreighterService.getNetwork();
      if (stellarNetwork === 'testnet' && currentNetwork !== 'TESTNET') {
        await FreighterService.setNetwork('testnet');
        await new Promise((resolve) => setTimeout(resolve, 500));
      } else if (stellarNetwork === 'mainnet' && currentNetwork !== 'PUBLIC') {
        await FreighterService.setNetwork('mainnet');
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Connect
      const connection = await FreighterService.connect();

      if (
        !connection.publicKey ||
        !connection.publicKey.startsWith('G') ||
        connection.publicKey.length !== 56
      ) {
        throw new Error('Invalid public key received from Freighter.');
      }

      setStellarAddress(connection.publicKey);
      setNetwork(connection.network);

      // Sync network
      if (connection.network === 'TESTNET' && stellarNetwork !== 'testnet') {
        setStellarNetwork('testnet');
      } else if (connection.network === 'PUBLIC' && stellarNetwork !== 'mainnet') {
        setStellarNetwork('mainnet');
      }

      // Load balance
      try {
        const accountBalance = await accountService.getXlmBalance(connection.publicKey);
        setBalance(accountBalance);
      } catch (err: any) {
        if (err.message.includes('not found')) {
          setBalance('0.00');
          setError('Account not funded. Please fund your account using Friendbot.');
        } else {
          throw err;
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to Freighter wallet');
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, [
    isInstalled,
    stellarNetwork,
    checkInstallation,
    setStellarAddress,
    setStellarNetwork,
    accountService,
  ]);

  /**
   * Disconnect wallet
   */
  const disconnect = useCallback(() => {
    setStellarAddress(null);
    setBalance(null);
    setNetwork('');
    setError(null);
  }, [setStellarAddress]);

  /**
   * Refresh balance
   */
  const refreshBalance = useCallback(async () => {
    if (!stellarAddress) return;

    try {
      const accountBalance = await accountService.getXlmBalance(stellarAddress);
      setBalance(accountBalance);
      setError(null);
    } catch (err: any) {
      if (err.message.includes('not found')) {
        setBalance('0.00');
      } else {
        console.error('Error refreshing balance:', err);
      }
    }
  }, [stellarAddress, accountService]);

  /**
   * Switch network
   */
  const switchNetwork = useCallback(
    async (network: 'testnet' | 'mainnet') => {
      if (!isInstalled) return;

      try {
        await FreighterService.setNetwork(network);
        setStellarNetwork(network);
        setNetwork(network === 'testnet' ? 'TESTNET' : 'PUBLIC');

        if (stellarAddress) {
          await refreshBalance();
        }
      } catch (err: any) {
        setError(`Failed to switch network: ${err.message}`);
      }
    },
    [isInstalled, stellarAddress, setStellarNetwork, refreshBalance]
  );

  // Initial check on mount
  useEffect(() => {
    const initialize = async () => {
      const installed = await checkInstallation();
      if (installed) {
        await autoConnect();
      }
    };

    initialize();

    // Re-check on window focus
    const handleFocus = () => {
      checkInstallation().then((installed) => {
        if (installed) {
          autoConnect();
        }
      });
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [checkInstallation, autoConnect]);

  // Refresh balance when network changes
  useEffect(() => {
    if (stellarAddress && isStellarConnected) {
      refreshBalance();
    }
  }, [stellarNetwork, stellarAddress, isStellarConnected, refreshBalance]);

  return {
    // State
    isInstalled,
    isConnected: isStellarConnected,
    isConnecting,
    error,
    balance,
    network,
    address: stellarAddress,

    // Actions
    connect,
    disconnect,
    refreshBalance,
    switchNetwork,
    checkInstallation,
  };
}

