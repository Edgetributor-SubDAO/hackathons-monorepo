'use client';

import { StellarWalletKit as StellarWallet } from '@/components/wallet/stellar-wallet-kit';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { useWalletStore } from '@/stores/wallet-store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Link2, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react';

export default function ConnectPage() {
  const { isStellarConnected } = useWalletStore();
  const router = useRouter();

  useEffect(() => {
    if (isStellarConnected) {
      // Auto-redirect after a short delay to show success state
      const timer = setTimeout(() => {
        router.push('/services');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isStellarConnected, router]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-display-md md:text-display-lg font-display mb-4 text-gradient-glow text-balance">Connect Your Wallet</h1>
          <p className="text-lg text-gray-200 font-medium leading-relaxed">
            Link your Stellar wallet to start making payments and accessing services
          </p>
        </div>

        <GlassCard glow="blue" className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-3 mb-6">
            <Link2 className="w-8 h-8 text-electric-blue" />
            <div>
              <h2 className="text-2xl font-semibold text-white font-heading">Wallet Connection</h2>
              <p className="text-gray-400 text-sm">Step 1 of 2</p>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-8" />

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Stellar Wallet</h3>
              <p className="text-gray-400 text-sm mb-4">
                Connect using Freighter extension or other Stellar-compatible wallets
            </p>
            <StellarWallet />
            </div>
          </div>

          {isStellarConnected && (
            <div className="mt-6 p-4 glass-lg rounded-xl border border-status-success/30 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-status-success/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-status-success" />
                </div>
                <div>
                  <p className="text-white font-semibold">Wallet Connected Successfully!</p>
                  <p className="text-gray-400 text-sm">Redirecting to payment page...</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <Link href="/">
              <GlassButton variant="secondary" size="md" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </GlassButton>
            </Link>
            {isStellarConnected && (
              <Link href="/services">
                <GlassButton variant="primary" size="md" glow="green" className="flex items-center gap-2">
                  Browse Services
                  <ArrowRight className="w-4 h-4" />
                </GlassButton>
              </Link>
            )}
          </div>
        </GlassCard>

        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            Don't have a wallet?{' '}
            <a
              href="https://freighter.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-electric-blue hover:text-electric-purple transition-colors underline"
            >
              Install Freighter
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
