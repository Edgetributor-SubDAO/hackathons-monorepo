'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWalletStore } from '@/stores/wallet-store';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Toggle } from '@/components/ui/toggle';
import { WalletVerificationModal } from '@/components/payment/wallet-verification-modal';
import Link from 'next/link';
import {
  BarChart3,
  Shield,
  Zap,
  Globe,
  Lock,
  ArrowRight,
  CheckCircle2,
  Wifi,
  FileText,
  Ticket,
  Key,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: 'XLM' | 'USDC';
  icon: any;
  tag: string;
  features: string[];
  category: string;
}

const services: Service[] = [
  {
    id: 'analytics',
    name: 'Premium Analytics',
    description: 'Real-time DeFi insights and advanced charting tools',
    price: 5,
    currency: 'XLM',
    icon: BarChart3,
    tag: 'Real-time DeFi insights',
    features: ['Live price tracking', 'Advanced charts', 'Export data'],
    category: 'defi',
  },
  {
    id: 'security',
    name: 'Security Suite',
    description: 'Enhanced security features and monitoring',
    price: 10,
    currency: 'XLM',
    icon: Shield,
    tag: 'Enterprise-grade security',
    features: ['Threat detection', 'Audit logs', '2FA support'],
    category: 'security',
  },
  {
    id: 'performance',
    name: 'Performance Boost',
    description: 'Faster processing and priority support',
    price: 7,
    currency: 'XLM',
    icon: Zap,
    tag: 'Lightning fast',
    features: ['Priority queue', 'Faster API', '24/7 support'],
    category: 'performance',
  },
  {
    id: 'global',
    name: 'Global Access',
    description: 'Unlock worldwide features and content',
    price: 15,
    currency: 'XLM',
    icon: Globe,
    tag: 'Worldwide coverage',
    features: ['All regions', 'Multi-language', 'Local support'],
    category: 'access',
  },
  {
    id: 'defi_dashboard',
    name: 'Premium DeFi Dashboard',
    description: 'Pro-grade on-chain analytics without subscriptions or KYC',
    price: 5,
    currency: 'XLM',
    icon: BarChart3,
    tag: 'Pro-grade analytics',
    features: ['Wallet tracking', 'Trade insights', 'Advanced analytics'],
    category: 'defi',
  },
  {
    id: 'wifi_hotspot',
    name: 'DePIN WiFi Hotspot',
    description: 'Get high-speed WiFi access by the minute - no SIM required',
    price: 2,
    currency: 'XLM',
    icon: Wifi,
    tag: '10 minutes access',
    features: ['High-speed WiFi', 'No SIM needed', 'Instant activation'],
    category: 'depin',
  },
  {
    id: 'content_access',
    name: 'Exclusive Content',
    description: 'Access premium crypto research reports and newsletters',
    price: 1,
    currency: 'XLM',
    icon: FileText,
    tag: 'Weekly reports',
    features: ['Research reports', 'Newsletter access', '7-day validity'],
    category: 'content',
  },
  {
    id: 'event_ticket',
    name: 'Event Ticket',
    description: 'Get verifiable, non-sellable tickets for IRL or virtual events',
    price: 10,
    currency: 'XLM',
    icon: Ticket,
    tag: 'Verifiable entry',
    features: ['Non-transferable', 'Instant delivery', 'QR code ticket'],
    category: 'events',
  },
  {
    id: 'api_key',
    name: 'Developer API Key',
    description: 'Get live API access for on-chain analytics and developer tools',
    price: 3,
    currency: 'XLM',
    icon: Key,
    tag: '24-hour access',
    features: ['API access', 'Analytics tools', 'Developer portal'],
    category: 'developer',
  },
];

export default function ServicesPage() {
  const router = useRouter();
  const { isStellarConnected } = useWalletStore();
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [showVerification, setShowVerification] = useState(false);
  const [pendingService, setPendingService] = useState<Service | null>(null);

  const handleToggleService = (serviceId: string) => {
    const newSelected = new Set(selectedServices);
    if (newSelected.has(serviceId)) {
      newSelected.delete(serviceId);
    } else {
      newSelected.add(serviceId);
    }
    setSelectedServices(newSelected);
  };

  const handleProceed = () => {
    if (selectedServices.size === 0) return;
    
    // Get the first selected service
    const firstService = services.find(s => selectedServices.has(s.id));
    if (firstService) {
      // Show verification modal before proceeding
      setPendingService(firstService);
      setShowVerification(true);
    }
  };

  const handleVerificationConfirm = () => {
    if (pendingService) {
      setShowVerification(false);
      router.push(
        `/payment?service=${pendingService.id}&amount=${pendingService.price}&currency=${pendingService.currency}`
      );
    }
  };

  const handleVerificationClose = () => {
    setShowVerification(false);
    setPendingService(null);
  };

  if (!isStellarConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <GlassCard glow="blue" className="text-center max-w-md">
          <div className="flex justify-center mb-4">
            <Lock className="w-16 h-16 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold mb-4 text-white">Wallet Required</h1>
          <p className="text-gray-300 mb-6">Please connect your wallet to browse services</p>
          <Link href="/connect">
            <GlassButton variant="primary" size="md" glow="blue">
              Connect Wallet
            </GlassButton>
          </Link>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-display-md md:text-display-lg font-display mb-4 text-gradient-glow text-balance">
            Select a Service
          </h1>
          <p className="text-lg text-gray-200 font-medium leading-relaxed">
            Choose from our premium services to unlock advanced features
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
          {services.map((service, index) => {
            const isSelected = selectedServices.has(service.id);
            const Icon = service.icon;

            return (
              <GlassCard
                key={service.id}
                glow={isSelected ? 'blue' : 'purple'}
                hover
                className={cn(
                  'transition-all duration-300 animate-fade-in',
                  isSelected && 'ring-2 ring-electric-blue ring-opacity-50'
                )}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 glass-lg rounded-xl flex items-center justify-center">
                      <Icon className="w-7 h-7 text-electric-blue" />
                    </div>
                    <Toggle
                      checked={isSelected}
                      onChange={() => handleToggleService(service.id)}
                    />
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-2 font-heading">
                    {service.name}
                  </h3>
                  <p className="text-gray-300 mb-3 leading-relaxed">
                    {service.description}
                  </p>

                  <div className="mb-4">
                    <StatusBadge status="info" variant="dot" className="text-xs">
                      {service.tag}
                    </StatusBadge>
                  </div>

                  <div className="flex items-center justify-between mb-4 pt-4 border-t border-white/10">
                    <div>
                      <span className="text-3xl font-bold text-gradient-glow font-display">
                        {service.price}
                      </span>
                      <span className="text-gray-400 ml-2">{service.currency}</span>
                    </div>
                  </div>

                  <ul className="space-y-2">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                        <CheckCircle2 className="w-4 h-4 text-status-success flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </GlassCard>
            );
          })}
        </div>

        {/* Proceed Button - Fixed at bottom */}
        {selectedServices.size > 0 && (
          <div className="fixed bottom-0 left-0 right-0 p-4 glass-lg border-t border-white/10 animate-slide-up z-50 backdrop-blur-xl">
            <div className="container mx-auto max-w-7xl">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-gray-300 text-sm mb-1">
                    {selectedServices.size} service{selectedServices.size > 1 ? 's' : ''} selected
                  </p>
                  <p className="text-white font-semibold text-lg">
                    {Array.from(selectedServices)
                      .map(id => {
                        const service = services.find(s => s.id === id);
                        return service ? `${service.name} (${service.price} ${service.currency})` : '';
                      })
                      .join(', ')}
                  </p>
                </div>
                <GlassButton
                  onClick={handleProceed}
                  variant="primary"
                  size="lg"
                  glow="blue"
                  className="w-full sm:w-auto flex items-center gap-2"
                >
                  Continue to Payment
                  <ArrowRight className="w-5 h-5" />
                </GlassButton>
              </div>
            </div>
          </div>
        )}

        {/* Wallet Verification Modal */}
        {pendingService && (
          <WalletVerificationModal
            isOpen={showVerification}
            onClose={handleVerificationClose}
            onConfirm={handleVerificationConfirm}
            requiredAmount={pendingService.price}
            currency={pendingService.currency}
            serviceName={pendingService.name}
          />
        )}
      </div>
    </div>
  );
}
