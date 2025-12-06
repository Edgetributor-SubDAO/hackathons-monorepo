'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassInput } from '@/components/ui/glass-input';
import { StatusBadge } from '@/components/ui/status-badge';
import Link from 'next/link';
import { useWalletStore } from '@/stores/wallet-store';
import { Target, Check } from 'lucide-react';

export default function ServiceDetailsPage() {
  const params = useParams();
  const serviceId = params.id as string;
  const { isStellarConnected } = useWalletStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'pricing' | 'access'>('overview');
  const [amount, setAmount] = useState('500');

  const service = {
    id: serviceId,
    name: 'Premium Service',
    description: 'Access to premium features and exclusive content',
    priceRange: { min: 100, max: 1000 },
    duration: '30 days',
    features: ['Feature 1', 'Feature 2', 'Feature 3'],
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'access', label: 'Access Details' },
  ];

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Service Header */}
        <GlassCard glow="blue" className="mb-8 animate-fade-in">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-20 h-20 glass-lg rounded-2xl flex items-center justify-center">
              <Target className="w-10 h-10 text-electric-blue" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2 text-gradient">{service.name}</h1>
              <p className="text-gray-300 text-lg">{service.description}</p>
              <div className="flex flex-wrap gap-4 mt-4">
                <StatusBadge status="info">Active</StatusBadge>
                <StatusBadge status="neutral">{service.duration}</StatusBadge>
              </div>
            </div>
          </div>
        </GlassCard>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <GlassCard glow="purple">
              <div className="flex gap-2 border-b border-white/10 pb-4 mb-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      activeTab === tab.id
                        ? 'glass-lg text-white border-b-2 border-electric-blue'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {activeTab === 'overview' && (
                <div className="space-y-4 animate-fade-in">
                  <h3 className="text-xl font-bold text-white mb-4">Service Overview</h3>
                  <p className="text-gray-300 leading-relaxed">{service.description}</p>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-3">Features</h4>
                    <ul className="space-y-2">
                      {service.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-gray-300">
                          <Check className="w-4 h-4 text-status-success" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'pricing' && (
                <div className="space-y-4 animate-fade-in">
                  <h3 className="text-xl font-bold text-white mb-4">Pricing Tiers</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <GlassCard glow="blue" hover className="p-6">
                      <h4 className="text-lg font-bold text-white mb-2">Basic</h4>
                      <div className="text-3xl font-bold text-gradient mb-2">100 XLM</div>
                      <p className="text-gray-400 text-sm">7 days access</p>
                    </GlassCard>
                    <GlassCard glow="purple" hover className="p-6">
                      <h4 className="text-lg font-bold text-white mb-2">Premium</h4>
                      <div className="text-3xl font-bold text-gradient mb-2">500 XLM</div>
                      <p className="text-gray-400 text-sm">30 days access</p>
                    </GlassCard>
                  </div>
                </div>
              )}

              {activeTab === 'access' && (
                <div className="space-y-4 animate-fade-in">
                  <h3 className="text-xl font-bold text-white mb-4">Access Details</h3>
                  <div className="glass-lg p-6 rounded-xl space-y-4">
                    <div>
                      <h4 className="font-semibold text-white mb-2">Duration</h4>
                      <p className="text-gray-300">{service.duration}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-2">What's Included</h4>
                      <ul className="space-y-2 text-gray-300">
                        <li>• NFT-based access token</li>
                        <li>• Cross-chain verification</li>
                        <li>• Instant activation</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </GlassCard>
          </div>

          {/* Payment Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <GlassCard glow="green">
                <h3 className="text-xl font-bold text-white mb-6">Make Payment</h3>
                <div className="space-y-4">
                  <GlassInput
                    label="Amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="500"
                  />
                  <div className="glass-lg p-4 rounded-xl">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-400">Total</span>
                      <span className="text-white font-bold">
                        {(parseFloat(amount) * 1.01).toFixed(2)} XLM
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">Includes 1% service fee</p>
                  </div>
                  {isStellarConnected ? (
                    <Link href={`/payment?serviceId=${serviceId}&amount=${amount}`}>
                      <GlassButton variant="primary" size="lg" glow="green" className="w-full">
                        Pay Now
                      </GlassButton>
                    </Link>
                  ) : (
                    <Link href="/connect">
                      <GlassButton variant="primary" size="lg" glow="blue" className="w-full">
                        Connect Wallet
                      </GlassButton>
                    </Link>
                  )}
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

