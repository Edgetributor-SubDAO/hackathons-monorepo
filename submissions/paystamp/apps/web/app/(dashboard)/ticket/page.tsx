'use client';

import { useSearchParams } from 'next/navigation';
import { useWalletStore } from '@/stores/wallet-store';
import { useAccessStatus } from '@/lib/hooks/use-access-status';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingSpinner } from '@/components/ui/loading';
import Link from 'next/link';
import { Ticket, Lock, Calendar, MapPin, CheckCircle2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function EventTicketPage() {
  const searchParams = useSearchParams();
  const { stellarAddress } = useWalletStore();
  const serviceId = searchParams.get('service') || 'event_ticket';
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
          <h1 className="text-2xl font-bold mb-4 text-white">Event Ticket Required</h1>
          <p className="text-gray-300 mb-6">Purchase a ticket to access this event</p>
          <Link href="/services">
            <GlassButton variant="primary" size="md" glow="blue">
              Get Ticket
            </GlassButton>
          </Link>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="container mx-auto max-w-2xl">
        <GlassCard glow="purple" className="p-8">
          <div className="text-center mb-8">
            <Ticket className="w-16 h-16 text-electric-purple mx-auto mb-4" />
            <h1 className="text-display-md font-display mb-2 text-gradient-glow">
              DevCon HackerHouse Afterparty
            </h1>
            <StatusBadge status="success" variant="dot">Valid Ticket</StatusBadge>
          </div>

          <div className="space-y-6">
            <div className="p-6 glass-lg rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-400">Date & Time</p>
                  <p className="text-white font-semibold">December 15, 2025 • 8:00 PM</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-400">Location</p>
                  <p className="text-white font-semibold">San Francisco, CA</p>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="p-4 glass-lg rounded-xl">
                <QRCodeSVG
                  value={stellarAddress || ''}
                  size={256}
                  level="H"
                  includeMargin={true}
                  fgColor="#ffffff"
                  bgColor="transparent"
                />
              </div>
            </div>

            <div className="p-4 glass-lg rounded-xl border border-status-info/30">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-status-success" />
                <span className="text-white font-semibold">Ticket Verified</span>
              </div>
              <p className="text-sm text-gray-300">
                This ticket is verified on-chain and cannot be transferred. 
                Present this QR code at the event entrance.
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

