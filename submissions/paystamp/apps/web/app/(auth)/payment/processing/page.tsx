'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useWebSocket } from '@/lib/hooks/use-websocket';
import confetti from 'canvas-confetti';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingSpinner } from '@/components/ui/loading';
import { ProgressBar } from '@/components/ui/loading';
import Link from 'next/link';
import { Clock, Loader2, CheckCircle2, PartyPopper, XCircle, CheckCircle } from 'lucide-react';

type PaymentStatus = 'pending' | 'processing' | 'confirmed' | 'success' | 'failed';

export default function PaymentProcessingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { socket } = useWebSocket();
  const [status, setStatus] = useState<PaymentStatus>('pending');
  const [progress, setProgress] = useState(0);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  const memo = searchParams.get('memo');
  const amount = searchParams.get('amount');

  useEffect(() => {
    // Simulate payment processing steps (even without socket)
    const steps = [
      { status: 'processing' as PaymentStatus, progress: 25, delay: 1000 },
      { status: 'processing' as PaymentStatus, progress: 50, delay: 2000 },
      { status: 'confirmed' as PaymentStatus, progress: 75, delay: 3000 },
      { status: 'success' as PaymentStatus, progress: 100, delay: 4000 },
    ];

    let currentStep = 0;
    const processSteps = () => {
      if (currentStep < steps.length) {
        const step = steps[currentStep];
        setTimeout(() => {
          setStatus(step.status);
          setProgress(step.progress);
          currentStep++;

          if (step.status === 'success') {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
            });
            setTimeout(() => {
              router.push('/status');
            }, 3000);
          } else {
            processSteps();
          }
        }, step.delay);
      }
    };

    processSteps();

    // Listen for real-time updates if socket is connected
    if (socket && socket.connected) {
      socket.on('payment:processed', (data: any) => {
        if (data.status === 'PROCESSED') {
          setStatus('success');
          setProgress(100);
          setTransactionHash(data.transactionHash || null);
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        } else if (data.status === 'FAILED') {
          setStatus('failed');
        }
      });

      return () => {
        if (socket) {
          socket.off('payment:processed');
        }
      };
    }
  }, [socket, router]);

  const statusConfig = {
    pending: {
      icon: Clock,
      color: 'warning',
      title: 'Payment Pending',
      description: 'Waiting for transaction confirmation',
      glow: 'yellow' as const,
    },
    processing: {
      icon: Loader2,
      color: 'info',
      title: 'Processing Payment',
      description: 'Your payment is being processed',
      glow: 'blue' as const,
    },
    confirmed: {
      icon: CheckCircle2,
      color: 'success',
      title: 'Payment Confirmed',
      description: 'Transaction confirmed on blockchain',
      glow: 'green' as const,
    },
    success: {
      icon: PartyPopper,
      color: 'success',
      title: 'Payment Successful!',
      description: 'Your access has been granted',
      glow: 'green' as const,
    },
    failed: {
      icon: XCircle,
      color: 'error',
      title: 'Payment Failed',
      description: 'Something went wrong with your payment',
      glow: 'red' as const,
    },
  };

  const currentConfig = statusConfig[status];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-2xl">
        <GlassCard glow={currentConfig.glow} className="text-center animate-fade-in">
          {/* Status Icon */}
          <div className="mb-6 flex justify-center">
            <div
              className={`w-24 h-24 glass-lg rounded-full flex items-center justify-center animate-pulse-glow ${
                status === 'processing' ? 'animate-spin' : ''
              }`}
            >
              <currentConfig.icon className="w-12 h-12 text-white" />
            </div>
          </div>

          {/* Status Title */}
          <h1 className="text-3xl md:text-4xl font-bold mb-3 text-gradient">
            {currentConfig.title}
          </h1>
          <p className="text-gray-300 mb-8">{currentConfig.description}</p>

          {/* Progress Bar */}
          {status !== 'failed' && (
            <div className="mb-8">
              <ProgressBar progress={progress} showLabel />
            </div>
          )}

          {/* Payment Details */}
          {memo && amount && (
            <div className="glass-lg p-6 rounded-xl mb-6 text-left">
              <h3 className="text-lg font-semibold text-white mb-4">Payment Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount:</span>
                  <span className="text-white font-semibold">{amount} XLM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Memo:</span>
                  <code className="text-gray-300 font-mono">{memo}</code>
                </div>
                {transactionHash && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Transaction:</span>
                    <code className="text-gray-300 font-mono text-xs break-all">
                      {transactionHash.slice(0, 12)}...{transactionHash.slice(-8)}
                    </code>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex justify-between items-center relative">
              {['Initiated', 'Processing', 'Confirmed', 'Access Granted'].map((step, index) => {
                const stepIndex = ['pending', 'processing', 'confirmed', 'success'].indexOf(status);
                const isActive = index <= stepIndex;
                const isCurrent = index === stepIndex;

                return (
                  <div key={index} className="flex flex-col items-center relative z-10">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                        isActive
                          ? 'glass-lg text-white shadow-glow-green'
                          : 'glass text-gray-500'
                      }`}
                    >
                      {isActive ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>
                    <span
                      className={`text-xs mt-2 ${
                        isCurrent ? 'text-white font-semibold' : 'text-gray-400'
                      }`}
                    >
                      {step}
                    </span>
                    {index < 3 && (
                      <div
                        className={`absolute top-5 left-1/2 w-full h-0.5 ${
                          isActive ? 'bg-gradient-to-r from-electric-blue to-electric-purple' : 'bg-white/10'
                        }`}
                        style={{ width: 'calc(100% - 40px)', marginLeft: '20px' }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {status === 'success' && (
              <>
                <Link href="/status">
                  <GlassButton variant="primary" size="md" glow="green" className="w-full sm:w-auto">
                    View Access Status
                  </GlassButton>
                </Link>
                {transactionHash && (
                  <a
                    href={`https://stellar.expert/explorer/public/tx/${transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <GlassButton variant="secondary" size="md" glow="blue" className="w-full sm:w-auto">
                      View on Explorer
                    </GlassButton>
                  </a>
                )}
              </>
            )}
            {status === 'failed' && (
              <>
                <Link href="/payment">
                  <GlassButton variant="primary" size="md" glow="red" className="w-full sm:w-auto">
                    Retry Payment
                  </GlassButton>
                </Link>
                <Link href="/">
                  <GlassButton variant="secondary" size="md" className="w-full sm:w-auto">
                    Go Home
                  </GlassButton>
                </Link>
              </>
            )}
            {status === 'processing' && (
              <div className="flex items-center justify-center gap-2 text-gray-400">
                <LoadingSpinner size="sm" />
                <span>Processing...</span>
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

