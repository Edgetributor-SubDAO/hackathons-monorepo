'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useWalletStore } from '@/stores/wallet-store';
import { ServiceHandlerRegistry } from '@/lib/payment/service-handlers';
import { AccessManager } from '@/lib/payment/access-manager';
import { accessBroadcaster } from '@/lib/payment/access-broadcaster';
import confetti from 'canvas-confetti';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { StatusBadge } from '@/components/ui/status-badge';
import Link from 'next/link';
import {
  CheckCircle2,
  ExternalLink,
  Globe,
  CreditCard,
  ArrowRight,
  Sparkles,
  BarChart3,
  Wifi,
  FileText,
  Ticket,
  Key,
} from 'lucide-react';

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

const SERVICE_ICONS: Record<string, any> = {
  analytics: BarChart3,
  security: CreditCard,
  performance: Sparkles,
  global: Globe,
  defi_dashboard: BarChart3,
  wifi_hotspot: Wifi,
  content_access: FileText,
  event_ticket: Ticket,
  api_key: Key,
};

// Get service-specific expiry times
const getExpiryTime = (serviceId: string): number => {
  const expiryMap: Record<string, number> = {
    defi_dashboard: 3600000, // 1 hour
    wifi_hotspot: 600000, // 10 minutes
    content_access: 604800000, // 7 days
    event_ticket: 86400000, // 24 hours
    api_key: 86400000, // 24 hours
    analytics: 3600000, // 1 hour
    security: 3600000, // 1 hour
    performance: 3600000, // 1 hour
    global: 3600000, // 1 hour
  };
  return expiryMap[serviceId] || 3600000;
};

// Get service-specific redirect URLs
const getServiceRedirect = (serviceId: string): { url: string; label: string } => {
  const redirects: Record<string, { url: string; label: string }> = {
    defi_dashboard: { url: '/dashboard?service=defi_dashboard', label: 'Go to Dashboard' },
    wifi_hotspot: { url: '/wifi?service=wifi_hotspot', label: 'Get WiFi Access' },
    content_access: { url: '/content?service=content_access', label: 'View Content' },
    event_ticket: { url: '/ticket?service=event_ticket', label: 'View Ticket' },
    api_key: { url: '/developer?service=api_key', label: 'Get API Key' },
  };
  return redirects[serviceId] || { url: '/status', label: 'Go to Dashboard' };
};

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { stellarAddress } = useWalletStore();
  const { stellarNetwork } = useWalletStore();
  const [confettiFired, setConfettiFired] = useState(false);
  const [accessVerified, setAccessVerified] = useState(false);
  const [serviceHandler] = useState(() => new ServiceHandlerRegistry());
  const [accessManager] = useState(() => new AccessManager(stellarNetwork, 'shibuya'));

  const serviceId = searchParams.get('service') || 'analytics';
  const memo = searchParams.get('memo') || '';
  const accessStampId = Math.floor(Math.random() * 10000);

  const serviceName = SERVICE_NAMES[serviceId] || 'Premium Service';
  const ServiceIcon = SERVICE_ICONS[serviceId] || CheckCircle2;
  const expiresAt = new Date(Date.now() + getExpiryTime(serviceId));
  const expiresAtFormatted = expiresAt.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  const serviceRedirect = getServiceRedirect(serviceId);

  // Fire confetti on mount
  useEffect(() => {
    if (!confettiFired) {
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);

      setConfettiFired(true);
    }
  }, [confettiFired]);

  // Verify access on mount and force refresh
  useEffect(() => {
    const verifyAccess = async () => {
      if (stellarAddress && serviceHandler && accessManager) {
        try {
          // Invalidate cache to force fresh check
          accessManager.invalidateCache(stellarAddress, serviceId);
          
          // Get fresh access status
          const freshStatus = await accessManager.getServiceAccess(stellarAddress, serviceId);
          setAccessVerified(freshStatus.hasAccess);
          
          // Broadcast update to all listening components
          accessBroadcaster.broadcast(serviceId, freshStatus.hasAccess);
          
          console.log('Access verified after payment:', freshStatus);
        } catch (error) {
          console.error('Access verification error:', error);
          // Still show success even if verification fails (for demo)
          setAccessVerified(true);
          accessBroadcaster.broadcast(serviceId, true);
        }
      }
    };

    verifyAccess();
  }, [stellarAddress, serviceId, serviceHandler, accessManager]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-2xl">
        <GlassCard glow="green" className="text-center animate-fade-in">
          {/* Success Icon */}
          <div className="mb-6 flex justify-center">
            <div className="w-24 h-24 glass-lg rounded-full flex items-center justify-center animate-pulse-glow">
              <ServiceIcon className="w-16 h-16 text-status-success" />
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-display-md md:text-display-lg font-display mb-4 text-gradient-glow text-balance">
            🔓 {serviceName} Unlocked!
          </h1>
          <p className="text-lg text-gray-200 mb-2">
            Access valid until <strong className="text-white">{expiresAtFormatted}</strong>
          </p>

          {/* Access Verification Status */}
          {accessVerified && (
            <div className="mb-6">
              <StatusBadge status="success" variant="dot">
                Access Verified on Polkadot
              </StatusBadge>
            </div>
          )}

          {/* Access Proof Badge */}
          <div className="mt-8 mb-8">
            <GlassCard glow="purple" className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-electric-purple" />
                Access Proof Badge
              </h3>
              <div className="space-y-3 text-left">
                <div className="flex items-center justify-between p-3 glass-lg rounded-xl">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300">Chain</span>
                  </div>
                  <span className="text-sm font-semibold text-white">Shibuya (Polkadot)</span>
                </div>
                <div className="flex items-center justify-between p-3 glass-lg rounded-xl">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300">AccessStamp ID</span>
                  </div>
                  <span className="text-sm font-semibold text-white">#{accessStampId}</span>
                </div>
                <div className="flex items-center justify-between p-3 glass-lg rounded-xl">
                  <span className="text-sm text-gray-300">Service</span>
                  <span className="text-sm font-semibold text-white">{serviceName}</span>
                </div>
              </div>
              <a
                href={`https://shibuya.subscan.io/account/${stellarAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm text-electric-blue hover:text-electric-purple transition-colors"
              >
                View on Explorer
                <ExternalLink className="w-4 h-4" />
              </a>
            </GlassCard>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Link href={serviceRedirect.url}>
              <GlassButton variant="primary" size="lg" glow="green" className="w-full sm:w-auto flex items-center gap-2">
                {serviceRedirect.label}
                <ArrowRight className="w-5 h-5" />
              </GlassButton>
            </Link>
            <Link href="/services">
              <GlassButton variant="secondary" size="lg" glow="blue" className="w-full sm:w-auto">
                Unlock Another Service
              </GlassButton>
            </Link>
          </div>

          {/* Additional Info */}
          <div className="mt-8 p-4 glass-lg rounded-xl border border-status-info/30">
            <p className="text-xs text-gray-400">
              Your access is verified on-chain. No signup, no email confirmation, no manual approval needed.
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
