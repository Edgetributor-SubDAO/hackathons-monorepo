'use client';

import { useState, useEffect } from 'react';
import { useWalletStore } from '@/stores/wallet-store';
import { StellarAccountService } from '@/lib/stellar/account-service';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingSpinner } from '@/components/ui/loading';
import { Wallet, CheckCircle2, AlertTriangle, X, RefreshCw } from 'lucide-react';

interface WalletVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  requiredAmount: number;
  currency: 'XLM' | 'USDC';
  serviceName: string;
}

export function WalletVerificationModal({
  isOpen,
  onClose,
  onConfirm,
  requiredAmount,
  currency,
  serviceName,
}: WalletVerificationModalProps) {
  const { stellarAddress, stellarNetwork, isStellarConnected } = useWalletStore();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  const [balance, setBalance] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasEnoughFunds, setHasEnoughFunds] = useState(false);

  const accountService = new StellarAccountService(stellarNetwork);

  // Verify wallet when modal opens
  useEffect(() => {
    if (isOpen && stellarAddress) {
      verifyWallet();
    }
  }, [isOpen, stellarAddress, stellarNetwork]);

  const verifyWallet = async () => {
    if (!stellarAddress || !isStellarConnected) {
      setVerificationStatus('error');
      setError('Wallet not connected');
      return;
    }

    setIsVerifying(true);
    setVerificationStatus('checking');
    setError(null);

    try {
      // Check if account is funded
      const isFunded = await accountService.isAccountFunded(stellarAddress);
      if (!isFunded) {
        setVerificationStatus('error');
        setError('Account not funded. Please fund your account first.');
        setHasEnoughFunds(false);
        setIsVerifying(false);
        return;
      }

      // Get balance
      const xlmBalance = await accountService.getXlmBalance(stellarAddress);
      setBalance(xlmBalance);
      const balanceNum = parseFloat(xlmBalance);
      const requiredNum = requiredAmount;

      // Check if has enough funds (add 0.1 XLM for transaction fee)
      const hasEnough = balanceNum >= requiredNum + 0.1;
      setHasEnoughFunds(hasEnough);

      if (hasEnough) {
        setVerificationStatus('success');
      } else {
        setVerificationStatus('error');
        setError(`Insufficient balance. Required: ${requiredNum} ${currency}, Available: ${xlmBalance} XLM`);
      }
    } catch (err: any) {
      console.error('Wallet verification error:', err);
      setVerificationStatus('error');
      setError(err.message || 'Failed to verify wallet');
      setHasEnoughFunds(false);
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <GlassCard glow="blue" className="max-w-md w-full animate-slide-up">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 glass-lg rounded-xl flex items-center justify-center">
                <Wallet className="w-5 h-5 text-electric-blue" />
              </div>
              <h2 className="text-xl font-semibold text-white">Verify Wallet</h2>
            </div>
            <button
              onClick={onClose}
              className="glass-button p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Service Info */}
          <div className="mb-6 p-4 glass-lg rounded-xl">
            <p className="text-sm text-gray-400 mb-1">Service</p>
            <p className="text-lg font-semibold text-white">{serviceName}</p>
            <p className="text-sm text-gray-300 mt-1">
              Amount: <span className="text-white font-semibold">{requiredAmount} {currency}</span>
            </p>
          </div>

          {/* Verification Status */}
          {verificationStatus === 'checking' && (
            <div className="mb-6 text-center space-y-4">
              <LoadingSpinner size="md" />
              <p className="text-gray-300">Verifying wallet connection and balance...</p>
            </div>
          )}

          {verificationStatus === 'success' && (
            <div className="mb-6 space-y-4">
              <div className="p-4 glass-lg rounded-xl border border-status-success/30">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle2 className="w-6 h-6 text-status-success" />
                  <span className="text-white font-semibold">Wallet Verified</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Address:</span>
                    <code className="text-gray-300 font-mono text-xs">
                      {stellarAddress?.slice(0, 8)}...{stellarAddress?.slice(-6)}
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Balance:</span>
                    <span className="text-white font-semibold">{balance} XLM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Required:</span>
                    <span className="text-white font-semibold">{requiredAmount} {currency}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-white/10">
                    <span className="text-gray-400">Status:</span>
                    <StatusBadge status="success" variant="dot">Sufficient Funds</StatusBadge>
                  </div>
                </div>
              </div>
            </div>
          )}

          {verificationStatus === 'error' && (
            <div className="mb-6 p-4 glass-lg rounded-xl border border-status-error/30">
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className="w-6 h-6 text-status-error" />
                <span className="text-white font-semibold">Verification Failed</span>
              </div>
              <p className="text-status-error text-sm">{error}</p>
              {balance && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Current Balance:</span>
                    <span className="text-white">{balance} XLM</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <GlassButton
              variant="secondary"
              size="md"
              onClick={onClose}
              className="flex-1"
              disabled={isVerifying}
            >
              Cancel
            </GlassButton>
            {verificationStatus === 'error' && (
              <GlassButton
                variant="secondary"
                size="md"
                onClick={verifyWallet}
                className="flex-1"
                disabled={isVerifying}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isVerifying ? 'animate-spin' : ''}`} />
                Retry
              </GlassButton>
            )}
            {verificationStatus === 'success' && (
              <GlassButton
                variant="primary"
                size="md"
                glow="green"
                onClick={onConfirm}
                className="flex-1"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Confirm & Proceed
              </GlassButton>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

