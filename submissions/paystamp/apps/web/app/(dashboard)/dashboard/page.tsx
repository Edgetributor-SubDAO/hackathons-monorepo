'use client';

import { useSearchParams } from 'next/navigation';
import { useAccessStatus } from '@/lib/hooks/use-access-status';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingSpinner } from '@/components/ui/loading';
import Link from 'next/link';
import { BarChart3, Lock, TrendingUp, DollarSign, Activity } from 'lucide-react';

export default function DeFiDashboardPage() {
  const searchParams = useSearchParams();
  const serviceId = searchParams.get('service') || 'defi_dashboard';
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
          <h1 className="text-2xl font-bold mb-4 text-white">Premium Access Required</h1>
          <p className="text-gray-300 mb-6">Unlock Premium DeFi Dashboard to access advanced analytics</p>
          <Link href="/services">
            <GlassButton variant="primary" size="md" glow="blue">
              Unlock Access
            </GlassButton>
          </Link>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-display-md md:text-display-lg font-display mb-2 text-gradient-glow">
              Premium DeFi Dashboard
            </h1>
            <p className="text-gray-300">Advanced analytics and insights</p>
          </div>
          <StatusBadge status="success" variant="dot">Premium Active</StatusBadge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <GlassCard glow="blue" className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="w-8 h-8 text-electric-blue" />
              <div>
                <p className="text-sm text-gray-400">Total Value</p>
                <p className="text-2xl font-bold text-white">$12,450</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard glow="purple" className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-8 h-8 text-electric-purple" />
              <div>
                <p className="text-sm text-gray-400">24h Change</p>
                <p className="text-2xl font-bold text-status-success">+5.2%</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard glow="green" className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-8 h-8 text-status-success" />
              <div>
                <p className="text-sm text-gray-400">Active Positions</p>
                <p className="text-2xl font-bold text-white">8</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard glow="yellow" className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="w-8 h-8 text-yellow-400" />
              <div>
                <p className="text-sm text-gray-400">ROI</p>
                <p className="text-2xl font-bold text-white">+23.4%</p>
              </div>
            </div>
          </GlassCard>
        </div>

        <GlassCard glow="blue" className="p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Advanced Charts</h2>
          <div className="h-64 glass-lg rounded-xl flex items-center justify-center">
            <p className="text-gray-400">Premium charting tools available</p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

