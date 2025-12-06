'use client';

import { useEffect, useState, useCallback } from 'react';
import { useWalletStore } from '@/stores/wallet-store';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassCard } from '@/components/ui/glass-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingSpinner } from '@/components/ui/loading';
import {
  Wallet,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Star,
  ExternalLink,
  RefreshCw,
  LogOut,
} from 'lucide-react';
import {
  getPublicKey,
  connect,
  disconnect,
  signTransaction,
  isConnected,
  getSelectedWallet,
} from '@/lib/stellar/stellar-wallets-kit';
import { StellarAccountService } from '@/lib/stellar/account-service';

export function StellarWalletKit() {
  const {
    stellarAddress,
    setStellarAddress,
    isStellarConnected,
    stellarNetwork,
    setStellarNetwork,
  } = useWalletStore();

  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [accountBalance, setAccountBalance] = useState<string | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  const accountService = new StellarAccountService(stellarNetwork);

  /**
   * Check for connected wallet and auto-connect
   */
  const checkAndAutoConnect = useCallback(async () => {
    setIsChecking(true);
    setError(null);

    try {
      const connected = await isConnected();
      const publicKey = await getPublicKey();
      const walletId = getSelectedWallet();

      setSelectedWallet(walletId);

      if (connected && publicKey) {
        // Validate public key format
        if (publicKey.startsWith('G') && publicKey.length === 56) {
          console.log('✅ Auto-connected to wallet:', publicKey);
          setStellarAddress(publicKey);
          await loadAccountBalance(publicKey);
        } else {
          console.warn('Invalid public key format:', publicKey);
          setStellarAddress(null);
        }
      } else if (stellarAddress) {
        // We have a stored address but wallet is not connected
        setStellarAddress(null);
      }
    } catch (err: any) {
      console.error('Error during auto-connect check:', err);
      setError(err.message);
    } finally {
      setIsChecking(false);
    }
  }, [stellarAddress, setStellarAddress]);

  /**
   * Load account balance
   */
  const loadAccountBalance = useCallback(
    async (publicKey: string) => {
      try {
        const balance = await accountService.getXlmBalance(publicKey);
        setAccountBalance(balance);
        setError(null);
      } catch (err: any) {
        if (err.message.includes('not found')) {
          setAccountBalance('0.00');
          setError(
            'Account not funded. Please fund your account using Friendbot or Stellar Lab.'
          );
        } else {
          console.error('Error loading balance:', err);
          setAccountBalance(null);
        }
      }
    },
    [accountService]
  );

  /**
   * Connect to wallet using StellarWalletsKit
   */
  const connectWallet = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const walletId = await connect(async (publicKey: string) => {
        console.log('✅ Connected to wallet:', publicKey);

        if (
          !publicKey ||
          !publicKey.startsWith('G') ||
          publicKey.length !== 56
        ) {
          throw new Error('Invalid public key received from wallet.');
        }

        setStellarAddress(publicKey);
        setSelectedWallet(getSelectedWallet());

        // Load balance
        await loadAccountBalance(publicKey);
      });

      if (!walletId) {
        throw new Error('Wallet connection was cancelled.');
      }
    } catch (err: any) {
      console.error('Error connecting wallet:', err);
      setError(
        err.message || 'Failed to connect wallet. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [setStellarAddress, loadAccountBalance]);

  /**
   * Disconnect wallet
   */
  const disconnectWallet = useCallback(async () => {
    await disconnect(() => {
      setStellarAddress(null);
      setAccountBalance(null);
      setCopied(false);
      setSelectedWallet(null);
      setError(null);
    });
  }, [setStellarAddress]);

  /**
   * Copy address to clipboard
   */
  const copyAddress = useCallback(() => {
    if (stellarAddress) {
      navigator.clipboard.writeText(stellarAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [stellarAddress]);

  /**
   * Refresh balance
   */
  const refreshBalance = useCallback(async () => {
    if (stellarAddress) {
      await loadAccountBalance(stellarAddress);
    }
  }, [stellarAddress, loadAccountBalance]);

  // Initial check on mount
  useEffect(() => {
    checkAndAutoConnect();

    // Re-check when window gains focus
    const handleFocus = () => {
      checkAndAutoConnect();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [checkAndAutoConnect]);

  // Refresh balance when network changes
  useEffect(() => {
    if (stellarAddress && isStellarConnected) {
      loadAccountBalance(stellarAddress);
    }
  }, [stellarNetwork, stellarAddress, isStellarConnected, loadAccountBalance]);

  return (
    <div>
      <GlassCard glow="blue" className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 glass-lg rounded-xl flex items-center justify-center">
            <Wallet className="w-6 h-6 text-blue-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-white">Stellar Wallet</h4>
            <p className="text-gray-400 text-sm">
              {isChecking
                ? 'Checking for wallet...'
                : 'Connect your Stellar wallet'}
            </p>
          </div>
        </div>

        {isChecking ? (
          <div className="flex flex-col items-center justify-center py-6">
            <LoadingSpinner size="md" />
            <p className="text-gray-400 text-sm mt-4">
              Checking for wallet extension...
            </p>
          </div>
        ) : isStellarConnected && stellarAddress ? (
          <GlassCard glow="green" className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-12 h-12 glass-lg rounded-xl flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-lg font-semibold text-white">
                      {selectedWallet ? selectedWallet.charAt(0).toUpperCase() + selectedWallet.slice(1) : 'Stellar'} Wallet
                    </h4>
                    <StatusBadge status="success" variant="dot">
                      Connected
                    </StatusBadge>
                  </div>
                  <p className="text-gray-400 text-sm">
                    {accountBalance !== null ? (
                      <>
                        <span className="font-semibold text-white">
                          {accountBalance} XLM
                        </span>
                        <span className="ml-2 text-xs">
                          ({stellarNetwork})
                        </span>
                      </>
                    ) : (
                      'Loading balance...'
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={refreshBalance}
                className="glass-button p-2 rounded-lg flex-shrink-0"
                title="Refresh balance"
                disabled={isLoading}
              >
                <RefreshCw
                  className={`w-4 h-4 text-gray-400 ${
                    isLoading ? 'animate-spin' : ''
                  }`}
                />
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <div className="glass-input p-3 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 mb-1">Public Key</p>
                    <code className="text-sm text-gray-300 font-mono break-all">
                      {stellarAddress}
                    </code>
                  </div>
                  <button
                    onClick={copyAddress}
                    className="glass-button p-2 rounded-lg ml-2 flex-shrink-0"
                    title="Copy address"
                  >
                    {copied ? (
                      <CheckCircle2 className="w-4 h-4 text-status-success" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <GlassButton
                variant="secondary"
                size="sm"
                onClick={disconnectWallet}
                glow="red"
                className="flex-1 flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Disconnect
              </GlassButton>
            </div>
          </GlassCard>
        ) : (
          <>
            <GlassButton
              onClick={connectWallet}
              disabled={isLoading}
              variant="primary"
              size="md"
              glow="blue"
              loading={isLoading}
              className="w-full"
            >
              {isLoading ? 'Connecting...' : 'Connect Wallet'}
            </GlassButton>

            <div className="mt-3 p-3 glass-lg rounded-xl border border-status-info/30">
              <p className="text-status-info text-xs mb-2">
                <strong>Supported Wallets:</strong>
              </p>
              <ul className="text-gray-300 text-xs space-y-1 list-disc list-inside">
                <li>Freighter (Recommended)</li>
                <li>Lobster</li>
                <li>Rabet</li>
                <li>WalletConnect</li>
              </ul>
            </div>

            {error && (
              <div className="mt-3 p-3 glass-lg rounded-xl border border-status-error/30 animate-fade-in">
                <p className="text-status-error text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                </p>
                {error.includes('not funded') && stellarAddress && (
                  <div className="mt-2">
                    <a
                      href={`https://laboratory.stellar.org/#account-creator?network=testnet&address=${stellarAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-status-error text-xs underline hover:no-underline flex items-center gap-1"
                    >
                      Fund account with Friendbot
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </GlassCard>
    </div>
  );
}

/**
 * Export signTransaction for use in contract interactions
 */
export { signTransaction };

