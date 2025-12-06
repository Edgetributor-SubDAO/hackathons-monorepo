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
import { FreighterService } from '@/lib/freighter/freighter-service';
import { StellarAccountService } from '@/lib/stellar/account-service';

export function FreighterWallet() {
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
  const [currentNetwork, setCurrentNetwork] = useState<string>('');
  const [isFreighterInstalled, setIsFreighterInstalled] = useState(false);

  const accountService = new StellarAccountService(stellarNetwork);

  /**
   * Check for Freighter and auto-connect if previously connected
   */
  const checkAndAutoConnect = useCallback(async () => {
    setIsChecking(true);
    setError(null);

    try {
      // Wait for Freighter to be available
      const installed = await FreighterService.waitForFreighter(3000);
      setIsFreighterInstalled(installed);

      if (!installed) {
        setIsChecking(false);
        return;
      }

      // Check if already connected
      const isConnected = await FreighterService.isConnected();
      const publicKey = await FreighterService.getPublicKey();
      const network = await FreighterService.getNetwork();

      setCurrentNetwork(network);

      if (isConnected && publicKey) {
        // Validate public key format
        if (publicKey.startsWith('G') && publicKey.length === 56) {
          console.log('✅ Auto-connected to Freighter:', publicKey);
          setStellarAddress(publicKey);

          // Sync network
          if (network === 'TESTNET' && stellarNetwork !== 'testnet') {
            setStellarNetwork('testnet');
          } else if (network === 'PUBLIC' && stellarNetwork !== 'mainnet') {
            setStellarNetwork('mainnet');
          }

          // Load balance
          await loadAccountBalance(publicKey);
        } else {
          console.warn('Invalid public key format:', publicKey);
          setStellarAddress(null);
        }
      } else if (stellarAddress) {
        // We have a stored address but Freighter is not connected
        // Clear it to avoid confusion
        setStellarAddress(null);
      }
    } catch (err: any) {
      console.error('Error during auto-connect check:', err);
      setError(err.message);
    } finally {
      setIsChecking(false);
    }
  }, [stellarAddress, stellarNetwork, setStellarAddress, setStellarNetwork]);

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
   * Connect to Freighter wallet
   */
  const connectFreighter = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!isFreighterInstalled) {
        throw new Error(
          'Freighter extension not found. Please install it from https://freighter.app'
        );
      }

      // Ensure Freighter is on the correct network
      const network = await FreighterService.getNetwork();
      setCurrentNetwork(network);

      if (stellarNetwork === 'testnet' && network !== 'TESTNET') {
        await FreighterService.setNetwork('testnet');
        setCurrentNetwork('TESTNET');
        // Give Freighter a moment to switch networks
        await new Promise((resolve) => setTimeout(resolve, 500));
      } else if (stellarNetwork === 'mainnet' && network !== 'PUBLIC') {
        await FreighterService.setNetwork('mainnet');
        setCurrentNetwork('PUBLIC');
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Connect to Freighter
      const connection = await FreighterService.connect();

      if (
        !connection.publicKey ||
        !connection.publicKey.startsWith('G') ||
        connection.publicKey.length !== 56
      ) {
        throw new Error('Invalid public key received from Freighter.');
      }

      console.log('✅ Connected to Freighter:', connection.publicKey);

      setStellarAddress(connection.publicKey);
      setCurrentNetwork(connection.network);

      // Sync network
      if (connection.network === 'TESTNET' && stellarNetwork !== 'testnet') {
        setStellarNetwork('testnet');
      } else if (connection.network === 'PUBLIC' && stellarNetwork !== 'mainnet') {
        setStellarNetwork('mainnet');
      }

      // Load balance
      await loadAccountBalance(connection.publicKey);
    } catch (err: any) {
      console.error('Error connecting Freighter:', err);
      setError(err.message || 'Failed to connect to Freighter wallet');
    } finally {
      setIsLoading(false);
    }
  }, [
    isFreighterInstalled,
    stellarNetwork,
    setStellarAddress,
    setStellarNetwork,
    loadAccountBalance,
  ]);

  /**
   * Disconnect wallet
   */
  const disconnect = useCallback(() => {
    setStellarAddress(null);
    setAccountBalance(null);
    setCopied(false);
    setCurrentNetwork('');
    setError(null);
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

  /**
   * Switch to testnet
   */
  const switchToTestnet = useCallback(async () => {
    if (!isFreighterInstalled) return;
    setIsLoading(true);
    setError(null);
    try {
      await FreighterService.setNetwork('testnet');
      setCurrentNetwork('TESTNET');
      setStellarNetwork('testnet');
      if (stellarAddress) {
        await loadAccountBalance(stellarAddress);
      }
    } catch (err: any) {
      setError(`Failed to switch network: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [isFreighterInstalled, stellarAddress, setStellarNetwork, loadAccountBalance]);

  // Initial check on mount
  useEffect(() => {
    checkAndAutoConnect();

    // Re-check when window gains focus (user might have installed Freighter)
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
            <h4 className="text-lg font-semibold text-white">Freighter Wallet</h4>
            <p className="text-gray-400 text-sm">
              {isChecking
                ? 'Checking for Freighter...'
                : isFreighterInstalled
                ? 'Connect your Freighter wallet'
                : 'Freighter not detected'}
            </p>
          </div>
        </div>

        {isChecking ? (
          <div className="flex flex-col items-center justify-center py-6">
            <LoadingSpinner size="md" />
            <p className="text-gray-400 text-sm mt-4">
              Checking for Freighter extension...
            </p>
          </div>
        ) : !isFreighterInstalled ? (
          <div className="space-y-4">
            <div className="p-4 glass-lg rounded-xl border border-status-warning/30">
              <p className="text-status-warning text-sm flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4" />
                Freighter Extension Not Found
              </p>
              <p className="text-gray-300 text-sm mb-4">
                Please install the Freighter browser extension to connect your
                Stellar wallet.
              </p>
              <a
                href="https://freighter.app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                <GlassButton variant="primary" size="sm" glow="blue">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Install Freighter
                </GlassButton>
              </a>
            </div>
            <div className="p-4 glass-lg rounded-xl border border-status-info/30">
              <p className="text-status-info text-sm mb-2">Steps to connect:</p>
              <ol className="text-gray-300 text-xs space-y-1 list-decimal list-inside">
                <li>Install Freighter extension from freighter.app</li>
                <li>Create or import a wallet in Freighter</li>
                <li>Switch to Testnet in Freighter settings</li>
                <li>Refresh this page and click Connect</li>
              </ol>
            </div>
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
                      Freighter Wallet
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
                        {currentNetwork && (
                          <span className="ml-2 text-xs">
                            ({currentNetwork})
                          </span>
                        )}
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

            {currentNetwork !== 'TESTNET' && stellarNetwork === 'testnet' && (
              <div className="mb-4 p-3 glass-lg rounded-xl border border-status-warning/30">
                <p className="text-status-warning text-sm mb-2">
                  Switch to Testnet in Freighter
                </p>
                <GlassButton
                  onClick={switchToTestnet}
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  disabled={isLoading}
                >
                  Switch to Testnet
                </GlassButton>
              </div>
            )}

            <div className="flex gap-2">
              <GlassButton
                variant="secondary"
                size="sm"
                onClick={disconnect}
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
              onClick={connectFreighter}
              disabled={isLoading}
              variant="primary"
              size="md"
              glow="blue"
              loading={isLoading}
              className="w-full"
            >
              {isLoading ? 'Connecting...' : 'Connect Freighter Wallet'}
            </GlassButton>

            {stellarNetwork === 'testnet' && (
              <div className="mt-3 p-3 glass-lg rounded-xl border border-status-info/30">
                <p className="text-status-info text-xs">
                  Make sure Freighter is set to <strong>Testnet</strong> network.
                  You can switch networks in the Freighter extension.
                </p>
              </div>
            )}

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

