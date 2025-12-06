'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWalletStore } from '@/stores/wallet-store';
import { useAccessStatus } from '@/lib/hooks/use-access-status';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingSpinner } from '@/components/ui/loading';
import Link from 'next/link';
import { Wifi, Lock, CheckCircle2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function WiFiHotspotPage() {
  const searchParams = useSearchParams();
  const { stellarAddress } = useWalletStore();
  const serviceId = searchParams.get('service') || 'wifi_hotspot';
  const { accessStatus, isLoading } = useAccessStatus(serviceId);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes in seconds

  const hasAccess = accessStatus?.hasAccess && !accessStatus?.isExpired;

  // Countdown timer based on expiry
  useEffect(() => {
    if (!hasAccess || !accessStatus?.expiresAt) return;

    const updateTimer = () => {
      const now = Date.now() / 1000;
      const remaining = Math.max(0, accessStatus.expiresAt! - now);
      setTimeRemaining(Math.floor(remaining));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [hasAccess, accessStatus?.expiresAt]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
          <h1 className="text-2xl font-bold mb-4 text-white">WiFi Access Required</h1>
          <p className="text-gray-300 mb-6">Purchase WiFi hotspot access to continue</p>
          <Link href="/services">
            <GlassButton variant="primary" size="md" glow="blue">
              Get WiFi Access
            </GlassButton>
          </Link>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-display-md md:text-display-lg font-display mb-4 text-gradient-glow">
            WiFi Hotspot Access
          </h1>
          <StatusBadge status="success" variant="dot">Active</StatusBadge>
        </div>

        <GlassCard glow="blue" className="text-center">
          <div className="mb-6">
            <Wifi className="w-16 h-16 text-electric-blue mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Connected</h2>
            <p className="text-gray-300">Time remaining: <strong className="text-white">{formatTime(timeRemaining)}</strong></p>
          </div>

          <div className="mb-6">
            <p className="text-gray-300 mb-4">Scan this QR code at the hotspot:</p>
            <div className="flex justify-center">
              <div className="p-4 glass-lg rounded-xl">
                <QRCodeSVG
                  value={stellarAddress || ''}
                  size={200}
                  level="H"
                  includeMargin={true}
                  fgColor="#ffffff"
                  bgColor="transparent"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 glass-lg rounded-xl">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-status-success" />
                <span className="text-white font-semibold">Access Granted</span>
              </div>
              <p className="text-sm text-gray-300">Your wallet address is verified on-chain</p>
            </div>

            <Link href="/services">
              <GlassButton variant="secondary" size="md" className="w-full">
                Extend Access
              </GlassButton>
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

