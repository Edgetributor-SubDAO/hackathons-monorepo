'use client';

import { useSearchParams } from 'next/navigation';
import { useWalletStore } from '@/stores/wallet-store';
import { useAccessStatus } from '@/lib/hooks/use-access-status';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingSpinner } from '@/components/ui/loading';
import Link from 'next/link';
import { FileText, Lock, CheckCircle2 } from 'lucide-react';

export default function ContentPage() {
  const searchParams = useSearchParams();
  const { stellarAddress } = useWalletStore();
  const serviceId = searchParams.get('service') || 'content_access';
  const { accessStatus, isLoading } = useAccessStatus(serviceId);

  const hasAccess = accessStatus?.hasAccess && !accessStatus?.isExpired;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <GlassCard glow="blue" className="text-center max-w-md">
          <div className="flex justify-center mb-4">
            <Lock className="w-16 h-16 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold mb-4 text-white">Premium Content Locked</h1>
          <p className="text-gray-300 mb-6">Unlock exclusive content access</p>
          <Link href="/services">
            <GlassButton variant="primary" size="md" glow="blue">
              Unlock Content
            </GlassButton>
          </Link>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-display-md md:text-display-lg font-display text-gradient-glow">
              Exclusive Content
            </h1>
            <StatusBadge status="success" variant="dot">Unlocked</StatusBadge>
          </div>
        </div>

        <GlassCard glow="blue" className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-8 h-8 text-electric-blue" />
            <h2 className="text-2xl font-bold text-white">Weekly Crypto Research Report</h2>
          </div>

          <div className="prose prose-invert max-w-none">
            <div className="space-y-4 text-gray-200">
              <p className="text-lg">
                <strong className="text-white">Stellar × Polkadot Outlook - December 2025</strong>
              </p>
              <p>
                The integration of Stellar and Polkadot ecosystems represents a significant milestone in cross-chain interoperability. 
                This report analyzes the current state and future potential of this collaboration.
              </p>
              <h3 className="text-xl font-semibold text-white mt-6">Key Findings</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>Cross-chain payment protocols are seeing 300% growth</li>
                <li>Stellar's low fees make it ideal for micro-payments</li>
                <li>Polkadot's parachain architecture enables flexible access control</li>
                <li>PayStamp demonstrates real-world use cases for cross-chain access</li>
              </ul>
              <h3 className="text-xl font-semibold text-white mt-6">Market Analysis</h3>
              <p>
                The DeFi space continues to evolve, with cross-chain solutions becoming increasingly important. 
                PayStamp's approach of using Stellar for payments and Polkadot for access control creates a 
                unique value proposition that combines the best of both ecosystems.
              </p>
            </div>
          </div>

          <div className="mt-8 p-4 glass-lg rounded-xl border border-status-info/30">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-status-success" />
              <p className="text-sm text-gray-300">
                This content was unlocked via PayStamp. Access verified on-chain.
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

