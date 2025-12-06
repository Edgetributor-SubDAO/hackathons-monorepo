'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useWalletStore } from '@/stores/wallet-store';
import { useMutation } from '@tanstack/react-query';
import { PaymentService } from '@/lib/payment/payment-service';
import { PaymentDetector } from '@/lib/payment/payment-detector';
import { ServiceHandlerRegistry } from '@/lib/payment/service-handlers';
import { AccessManager } from '@/lib/payment/access-manager';
import { accessBroadcaster } from '@/lib/payment/access-broadcaster';
import { StellarAccountService } from '@/lib/stellar/account-service';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingSpinner } from '@/components/ui/loading';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import {
  Lock,
  Wallet,
  CheckCircle2,
  Copy,
  Clock,
  Loader2,
  PartyPopper,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

type PaymentStatus = 'idle' | 'initiating' | 'awaiting' | 'detecting' | 'confirmed' | 'minting' | 'success' | 'error';

const SERVICE_NAMES: Record<string, string> = {
  analytics: 'Premium Analytics',
  security: 'Security Suite',
  performance: 'Performance Boost',
  global: 'Global Access',
  defi_dashboard: 'Premium DeFi Dashboard',
  wifi_hotspot: 'DePIN WiFi Hotspot',
  content_access: 'Exclusive Content',
  event_ticket: 'Event Ticket',
  api_key: 'Developer API Key',
};

function getServiceTitle(serviceId: string): string {
  return SERVICE_NAMES[serviceId] || 'Premium Service';
}

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { stellarAddress, stellarNetwork, isStellarConnected } = useWalletStore();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Initializing payment...');
  const [progress, setProgress] = useState(0);
  
  const paymentDetectorRef = useRef<PaymentDetector | null>(null);
  const serviceHandlerRef = useRef<ServiceHandlerRegistry | null>(null);
  const accessManagerRef = useRef<AccessManager | null>(null);

  const serviceId = searchParams.get('service') || 'analytics';
  const amount = searchParams.get('amount') || '5';
  const currency = (searchParams.get('currency') as 'XLM' | 'USDC') || 'XLM';

  const paymentService = new PaymentService(stellarNetwork, 'shibuya');

  // Initialize services
  useEffect(() => {
    paymentDetectorRef.current = new PaymentDetector(stellarNetwork);
    serviceHandlerRef.current = new ServiceHandlerRegistry();
    accessManagerRef.current = new AccessManager(stellarNetwork, 'shibuya');
    return () => {
      if (paymentDetectorRef.current) {
        paymentDetectorRef.current.stopPolling();
      }
      if (accessManagerRef.current) {
        accessManagerRef.current.stopAllPolling();
      }
    };
  }, [stellarNetwork]);

  // Initialize payment on mount
  const initiatePayment = useMutation({
    mutationFn: async () => {
      if (!stellarAddress) {
        throw new Error('Wallet not connected');
      }

      // Re-verify wallet before initiating payment
      setStatusMessage('🔍 Verifying wallet connection...');
      setProgress(5);
      
      try {
        const accountService = new StellarAccountService(stellarNetwork);
        const isFunded = await accountService.isAccountFunded(stellarAddress);
        if (!isFunded) {
          throw new Error('Account not funded. Please fund your account first.');
        }

        const balance = await accountService.getXlmBalance(stellarAddress);
        const balanceNum = parseFloat(balance);
        const requiredNum = parseFloat(amount);
        
        if (balanceNum < requiredNum + 0.1) {
          throw new Error(`Insufficient balance. Required: ${requiredNum} ${currency}, Available: ${balance} XLM`);
        }

        setStatusMessage('✅ Wallet verified. Generating payment details...');
        setProgress(8);
      } catch (error: any) {
        throw new Error(`Wallet verification failed: ${error.message}`);
      }

      const details = await paymentService.initiatePayment(
        stellarAddress,
        serviceId,
        amount,
        currency
      );

      return details;
    },
    onSuccess: (data) => {
      setPaymentDetails(data);
      setPaymentStatus('awaiting');
      setStatusMessage('⏳ Awaiting payment on Stellar…');
      setProgress(10);
      startPaymentDetection(data);
    },
    onError: (error: any) => {
      setPaymentStatus('error');
      setStatusMessage(`Error: ${error.message}`);
    },
  });

  /**
   * Start payment detection
   */
  const startPaymentDetection = (details: any) => {
    if (!paymentDetectorRef.current || !stellarAddress) return;

    setPaymentStatus('detecting');
    setStatusMessage('🔍 Detecting payment on Stellar network…');
    setProgress(30);

    paymentDetectorRef.current.startPolling(
      details,
      async (result) => {
        if (result.detected && result.confirmed) {
          // Payment detected
          setPaymentStatus('confirmed');
          setStatusMessage('✅ Payment confirmed! Processing access…');
          setProgress(60);

          // Handle service-specific logic
          if (serviceHandlerRef.current) {
            try {
              await serviceHandlerRef.current.handlePaymentConfirmed(
                serviceId,
                stellarAddress,
                details
              );

              // Mint access on Polkadot
              setPaymentStatus('minting');
              setStatusMessage('🪙 Minting access stamp on Polkadot…');
              setProgress(80);

              // Simulate minting delay
              setTimeout(() => {
                setPaymentStatus('success');
                setStatusMessage('🎉 Access granted! Redirecting...');
                setProgress(100);

                // Get redirect URL immediately
                const redirectUrl = serviceHandlerRef.current?.getSuccessRedirect(
                  serviceId,
                  stellarAddress,
                  details
                ) || `/payment/success?service=${serviceId}&memo=${details.memo}`;

                // Set flag for status page to refresh
                sessionStorage.setItem('payment_completed', 'true');
                
                // Invalidate cache and broadcast (non-blocking, fire and forget)
                if (accessManagerRef.current && stellarAddress) {
                  accessManagerRef.current.invalidateCache(stellarAddress, serviceId);
                  // Broadcast immediately
                  accessBroadcaster.broadcast(serviceId, true);
                  
                  // Refresh access status in background (don't wait for it)
                  // Use setTimeout to make it truly non-blocking
                  setTimeout(() => {
                    accessManagerRef.current?.getServiceAccess(stellarAddress, serviceId)
                      .then((freshStatus) => {
                        console.log('Fresh access status after minting:', freshStatus);
                        accessBroadcaster.broadcast(serviceId, freshStatus.hasAccess);
                      })
                      .catch((error) => {
                        console.error('Error refreshing access after minting:', error);
                      });
                  }, 0);
                }
                
                // Redirect immediately using window.location for reliability
                // This ensures redirect happens even if router.push fails
                try {
                  router.push(redirectUrl);
                  // Fallback: use window.location if router.push doesn't work
                  setTimeout(() => {
                    if (window.location.pathname === '/payment') {
                      window.location.href = redirectUrl;
                    }
                  }, 500);
                } catch (error) {
                  console.error('Redirect error:', error);
                  window.location.href = redirectUrl;
                }
              }, 1000); // 1 second delay to show success state
            } catch (error: any) {
              console.error('Service handler error:', error);
              setPaymentStatus('error');
              setStatusMessage(`Error processing access: ${error.message}`);
            }
          }
        } else if (result.error) {
          setPaymentStatus('error');
          setStatusMessage(`Error: ${result.error}`);
        }
      },
      2000 // Poll every 2 seconds
    );
  };

  useEffect(() => {
    if (isStellarConnected && stellarAddress && paymentStatus === 'idle') {
      setPaymentStatus('initiating');
      setStatusMessage('Initializing payment...');
      initiatePayment.mutate();
    }
  }, [isStellarConnected, stellarAddress, paymentStatus, initiatePayment]);

  const copyAddress = () => {
    if (paymentDetails?.merchantAddress) {
      navigator.clipboard.writeText(paymentDetails.merchantAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyMemo = () => {
    if (paymentDetails?.memo) {
      navigator.clipboard.writeText(paymentDetails.memo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isStellarConnected || !stellarAddress) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <GlassCard glow="blue" className="text-center max-w-md">
          <div className="flex justify-center mb-4">
            <Lock className="w-16 h-16 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold mb-4 text-white">Wallet Required</h1>
          <p className="text-gray-300 mb-6">Please connect your wallet to make a payment</p>
          <Link href="/connect">
            <GlassButton variant="primary" size="md" glow="blue">
              Connect Wallet
            </GlassButton>
          </Link>
        </GlassCard>
      </div>
    );
  }

  if (!paymentDetails && (paymentStatus === 'idle' || paymentStatus === 'initiating')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-300 mt-4">{statusMessage}</p>
        </div>
      </div>
    );
  }

  if (!paymentDetails) {
    return null;
  }

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'awaiting':
      case 'detecting':
        return <Clock className="w-5 h-5 text-electric-blue animate-spin" />;
      case 'confirmed':
      case 'minting':
        return <Loader2 className="w-5 h-5 text-status-success animate-spin" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-status-success" />;
      default:
        return <Clock className="w-5 h-5 text-electric-blue" />;
    }
  };

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-display-md md:text-display-lg font-display mb-4 text-gradient-glow text-balance">
            Unlock {getServiceTitle(serviceId)}
          </h1>
        </div>

        <GlassCard glow={paymentStatus === 'success' ? 'green' : paymentStatus === 'error' ? 'red' : 'blue'} className="animate-slide-up">
          {/* Live Status Bar with Progress - Only show for non-success states */}
          {paymentStatus !== 'success' && (
            <div className="mb-8 p-4 glass-lg rounded-xl border border-electric-blue/30">
              <div className="flex items-center justify-center gap-3 mb-3">
                {getStatusIcon()}
                <p className="text-lg font-semibold text-white text-center">
                  {statusMessage}
                </p>
              </div>
              
              {/* Progress Bar */}
              {paymentStatus !== 'error' && (
                <div className="w-full bg-gray-700/50 rounded-full h-3 mt-4 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-electric-blue via-electric-purple to-electric-blue h-3 rounded-full transition-all duration-500 relative"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Payment Instructions */}
          {paymentStatus === 'awaiting' || paymentStatus === 'detecting' ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Payment Instructions</h2>
                <p className="text-gray-300 mb-6">
                  Send <strong className="text-white">{amount} {currency}</strong> to the address below:
                </p>
              </div>

              {/* QR Code */}
              <div className="flex justify-center mb-6">
                <div className="p-4 glass-lg rounded-xl">
                  <QRCodeSVG
                    value={paymentDetails.merchantAddress}
                    size={256}
                    level="H"
                    includeMargin={true}
                    fgColor="#ffffff"
                    bgColor="transparent"
                  />
                </div>
              </div>

              {/* Merchant Address */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Merchant Address
                  </label>
                  <div className="glass-input p-4 rounded-xl flex items-center justify-between">
                    <code className="text-sm text-gray-300 font-mono break-all flex-1">
                      {paymentDetails.merchantAddress}
                    </code>
                    <button
                      onClick={copyAddress}
                      className="glass-button p-2 rounded-lg ml-2 flex-shrink-0"
                      title="Copy address"
                    >
                      {copied ? (
                        <CheckCircle2 className="w-5 h-5 text-status-success" />
                      ) : (
                        <Copy className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Memo */}
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Memo (Required)
                  </label>
                  <div className="glass-input p-4 rounded-xl flex items-center justify-between">
                    <code className="text-sm text-gray-300 font-mono flex-1">
                      {paymentDetails.memo}
                    </code>
                    <button
                      onClick={copyMemo}
                      className="glass-button p-2 rounded-lg ml-2 flex-shrink-0"
                      title="Copy memo"
                    >
                      {copied ? (
                        <CheckCircle2 className="w-5 h-5 text-status-success" />
                      ) : (
                        <Copy className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Wallet Status */}
              <div className="mt-6 p-4 glass-lg rounded-xl border border-status-info/30">
                <div className="flex items-center gap-3 mb-2">
                  <Wallet className="w-5 h-5 text-status-info" />
                  <h3 className="text-sm font-semibold text-white">Wallet Status</h3>
                </div>
                {isStellarConnected && stellarAddress ? (
                  <div className="flex items-center gap-2">
                    <StatusBadge status="success" variant="dot">Connected</StatusBadge>
                    <code className="text-xs text-gray-400 font-mono">
                      {stellarAddress.slice(0, 8)}...{stellarAddress.slice(-6)}
                    </code>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <StatusBadge status="warning" variant="dot">Not Connected</StatusBadge>
                    <Link href="/connect" className="text-xs text-electric-blue hover:underline">
                      Connect Wallet
                    </Link>
                  </div>
                )}
              </div>

              {/* Help Text */}
              <div className="mt-6 p-4 glass-lg rounded-xl border border-status-info/30">
                <p className="text-sm text-gray-300">
                  <strong className="text-white">Tip:</strong> Open your Freighter wallet and send the exact amount with the memo included. 
                  The system will automatically detect your payment and grant access.
                </p>
              </div>
            </div>
          ) : paymentStatus === 'success' ? (
            <div className="p-8 text-center space-y-6">
              {/* Success Animation */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-32 h-32 glass-lg rounded-full flex items-center justify-center animate-pulse-glow">
                    <PartyPopper className="w-16 h-16 text-status-success" />
                  </div>
                  <div className="absolute -top-2 -right-2">
                    <Sparkles className="w-8 h-8 text-electric-purple animate-pulse" />
                  </div>
                  <div className="absolute -bottom-2 -left-2">
                    <Sparkles className="w-6 h-6 text-electric-blue animate-pulse" style={{ animationDelay: '0.5s' }} />
                  </div>
                </div>
              </div>

              {/* Success Message */}
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-gradient-glow">
                  🎉 Access Granted!
                </h2>
                <p className="text-xl text-gray-200">
                  Your {getServiceTitle(serviceId)} is now unlocked
                </p>
                <div className="flex items-center justify-center gap-2 text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Redirecting...</span>
                </div>
              </div>

              {/* Manual Redirect Button (Fallback) */}
              <div className="pt-4">
                <GlassButton
                  variant="primary"
                  size="lg"
                  glow="green"
                  onClick={() => {
                    const redirectUrl = serviceHandlerRef.current?.getSuccessRedirect(
                      serviceId,
                      stellarAddress!,
                      paymentDetails
                    ) || `/payment/success?service=${serviceId}&memo=${paymentDetails?.memo}`;
                    // Force immediate redirect
                    window.location.href = redirectUrl;
                  }}
                  className="flex items-center gap-2 mx-auto"
                >
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </GlassButton>
              </div>
            </div>
          ) : paymentStatus === 'error' ? (
            <div className="p-6 glass-lg rounded-xl border border-status-error/30">
              <p className="text-status-error text-center">{statusMessage}</p>
              <div className="mt-4 flex justify-center">
                <Link href="/services">
                  <GlassButton variant="secondary" size="md">
                    Back to Services
                  </GlassButton>
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center space-y-6">
              {/* Modern Loading State */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <LoadingSpinner size="lg" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 glass-lg rounded-full flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-electric-blue animate-spin" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-white">{statusMessage}</p>
                <p className="text-sm text-gray-400">Please wait while we process your request...</p>
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
