'use client';

import { useWalletStore } from '@/stores/wallet-store';
import { useAccessStatus } from '@/lib/hooks/use-access-status';
import { ServiceAccessStatus } from '@/lib/payment/access-manager';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingSpinner } from '@/components/ui/loading';
import { ProgressBar } from '@/components/ui/loading';
import Link from 'next/link';
import { Lock, CheckCircle2, RefreshCw, Clock, Award, Globe, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function StatusPage() {
  const searchParams = useSearchParams();
  const { stellarAddress } = useWalletStore();
  const [filteredServiceId, setFilteredServiceId] = useState<string | null>(
    searchParams.get('service') || null
  );
  
  // Always fetch all services, filter client-side
  const { allAccessStatus, isLoading, refresh, error } = useAccessStatus();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Update filteredServiceId when searchParams change
  useEffect(() => {
    const serviceParam = searchParams.get('service');
    setFilteredServiceId(serviceParam);
  }, [searchParams]);

  // Force refresh on mount if coming from payment success
  useEffect(() => {
    // Check if we're coming from a payment (check URL params or session storage)
    const fromPayment = sessionStorage.getItem('payment_completed');
    if (fromPayment && stellarAddress) {
      sessionStorage.removeItem('payment_completed');
      // Force immediate refresh
      refresh();
      setLastRefresh(Date.now());
    }
  }, [stellarAddress, refresh]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!autoRefresh || !stellarAddress) return;

    const interval = setInterval(() => {
      refresh();
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefresh, stellarAddress, refresh]);

  if (!stellarAddress) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <GlassCard glow="blue" className="text-center max-w-md">
          <div className="flex justify-center mb-4">
            <Lock className="w-16 h-16 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold mb-4 text-white">Wallet Required</h1>
          <p className="text-gray-300 mb-6">Connect your Stellar wallet to view access status</p>
          <Link href="/connect">
            <GlassButton variant="primary" size="md" glow="blue">
              Connect Wallet
            </GlassButton>
          </Link>
        </GlassCard>
      </div>
    );
  }

  // Show loading only if we have no data at all
  if (isLoading && !allAccessStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-gray-300">
            {filteredServiceId ? `Loading ${filteredServiceId} status...` : 'Loading access status...'}
          </p>
          <p className="text-sm text-gray-500">This may take a few seconds...</p>
        </div>
      </div>
    );
  }

  // If we have data but it's still loading (background refresh), show data with loading indicator
  const isBackgroundLoading = isLoading && !!allAccessStatus;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <GlassCard glow="red" className="text-center max-w-md">
          <div className="flex justify-center mb-4">
            <Lock className="w-16 h-16 text-status-error" />
          </div>
          <h1 className="text-2xl font-bold mb-4 text-white">Error Loading Status</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <GlassButton variant="primary" size="md" glow="blue" onClick={refresh}>
              Retry
            </GlassButton>
            <Link href="/status">
              <GlassButton variant="secondary" size="md">
                View All Services
              </GlassButton>
            </Link>
          </div>
        </GlassCard>
      </div>
    );
  }

  // Filter services if service query param is provided
  const filterServices = (services: ServiceAccessStatus[] | undefined): ServiceAccessStatus[] => {
    if (!services) return [];
    if (!filteredServiceId) return services;
    return services.filter((s) => s.serviceId === filteredServiceId);
  };

  const allServices = filterServices(allAccessStatus?.services);
  const activeServices = allServices.filter((s) => s.hasAccess && !s.isExpired);
  const expiredServices = allServices.filter((s) => s.isExpired && s.expiresAt);
  const noAccessServices = allServices.filter((s) => !s.hasAccess && !s.expiresAt);

  const formatTimeRemaining = (expiresAt: number | null): string => {
    if (!expiresAt) return 'N/A';
    const now = Date.now() / 1000;
    const remaining = expiresAt - now;
    
    if (remaining <= 0) return 'Expired';
    
    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getProgress = (expiresAt: number | null): number => {
    if (!expiresAt) return 0;
    const now = Date.now() / 1000;
    const remaining = expiresAt - now;
    
    // Assume 1 hour default duration for progress calculation
    const defaultDuration = 3600;
    return Math.max(0, Math.min(100, (remaining / defaultDuration) * 100));
  };

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-display-md md:text-display-lg font-display mb-4 text-gradient-glow text-balance">
              Access Status Dashboard
            </h1>
            <p className="text-lg text-gray-200 font-medium leading-relaxed">
              {filteredServiceId 
                ? `Viewing status for: ${allAccessStatus?.services?.find(s => s.serviceId === filteredServiceId)?.serviceName || filteredServiceId}`
                : 'View and manage your service access permissions'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {isBackgroundLoading && (
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Updating...</span>
              </div>
            )}
            {filteredServiceId && (
              <GlassButton
                variant="secondary"
                size="sm"
                onClick={() => {
                  setFilteredServiceId(null);
                  window.history.replaceState({}, '', '/status');
                }}
                className="flex items-center gap-2"
              >
                Clear Filter
              </GlassButton>
            )}
            <GlassButton
              variant="secondary"
              size="sm"
              onClick={refresh}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </GlassButton>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <GlassCard glow="green" className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-status-success" />
              <div>
                <p className="text-3xl font-bold text-white">{activeServices.length}</p>
                <p className="text-sm text-gray-400">Active Services</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard glow="yellow" className="p-6">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-yellow-400" />
              <div>
                <p className="text-3xl font-bold text-white">{expiredServices.length}</p>
                <p className="text-sm text-gray-400">Expired Services</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard glow="blue" className="p-6">
            <div className="flex items-center gap-3">
              <Lock className="w-8 h-8 text-gray-400" />
              <div>
                <p className="text-3xl font-bold text-white">{noAccessServices.length}</p>
                <p className="text-sm text-gray-400">No Access</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Active Services */}
        {activeServices.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-status-success" />
              Active Access
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeServices.map((service) => (
                <GlassCard
                  key={service.serviceId}
                  glow="green"
                  className="p-6 animate-fade-in"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-1">
                        {service.serviceName}
                      </h3>
                      <StatusBadge status="success" variant="dot">Active</StatusBadge>
                    </div>
                    <Award className="w-6 h-6 text-yellow-400" />
                  </div>

                  {service.expiresAt && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Time Remaining</span>
                        <span className="text-sm font-semibold text-white">
                          {formatTimeRemaining(service.expiresAt)}
                        </span>
                      </div>
                      <ProgressBar progress={getProgress(service.expiresAt)} />
                    </div>
                  )}

                  {service.nftId && (
                    <div className="mt-4 p-3 glass-lg rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">AccessStamp ID</span>
                        <code className="text-xs text-gray-300 font-mono">#{service.nftId}</code>
                      </div>
                    </div>
                  )}

                  <div className="mt-4">
                    <Link href={`/services?service=${service.serviceId}`}>
                      <GlassButton variant="secondary" size="sm" className="w-full">
                        View Details
                      </GlassButton>
                    </Link>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {/* Expired Services */}
        {expiredServices.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Clock className="w-6 h-6 text-yellow-400" />
              Expired Access
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {expiredServices.map((service) => (
                <GlassCard
                  key={service.serviceId}
                  glow="yellow"
                  className="p-6 opacity-75"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-1">
                        {service.serviceName}
                      </h3>
                      <StatusBadge status="warning" variant="dot">Expired</StatusBadge>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Link href={`/services?service=${service.serviceId}`}>
                      <GlassButton variant="primary" size="sm" glow="blue" className="w-full">
                        Renew Access
                      </GlassButton>
                    </Link>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {/* No Access Services */}
        {noAccessServices.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Lock className="w-6 h-6 text-gray-400" />
              Available Services
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {noAccessServices.map((service) => (
                <GlassCard
                  key={service.serviceId}
                  glow="blue"
                  className="p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-1">
                        {service.serviceName}
                      </h3>
                      <StatusBadge status="info" variant="dot">Not Active</StatusBadge>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Link href={`/services?service=${service.serviceId}`}>
                      <GlassButton variant="primary" size="sm" glow="blue" className="w-full">
                        Unlock Service
                      </GlassButton>
                    </Link>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && activeServices.length === 0 && expiredServices.length === 0 && noAccessServices.length === 0 && (
          <GlassCard glow="blue" className="text-center p-12">
            <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No Services Found</h2>
            <p className="text-gray-300 mb-6">Get started by unlocking your first service</p>
            <Link href="/services">
              <GlassButton variant="primary" size="md" glow="blue">
                Browse Services
              </GlassButton>
            </Link>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
