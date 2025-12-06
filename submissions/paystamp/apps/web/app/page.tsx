'use client';

import Link from 'next/link';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { useEffect, useState } from 'react';
import { Sparkles, Zap, Lock, Globe, CreditCard, Users, Wrench, Link2, CheckCircle2 } from 'lucide-react';
import { Logo } from '@/components/logo';

export default function HomePage() {
  const [counters, setCounters] = useState({ payments: 0, users: 0, services: 0, chains: 0 });

  useEffect(() => {
    const targets = { payments: 1250, users: 850, services: 45, chains: 2 };
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      setCounters({
        payments: Math.floor(targets.payments * progress),
        users: Math.floor(targets.users * progress),
        services: Math.floor(targets.services * progress),
        chains: Math.floor(targets.chains * progress),
      });

      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Instant cross-chain payments with minimal fees',
    },
    {
      icon: Lock,
      title: 'Secure & Trustless',
      description: 'Blockchain-powered security with no intermediaries',
    },
    {
      icon: Globe,
      title: 'Cross-Chain',
      description: 'Seamlessly bridge Stellar and Polkadot networks',
    },
  ];

  const steps = [
    {
      number: '1',
      title: 'Connect Wallet',
      description: 'Link your Stellar wallet to get started',
    },
    {
      number: '2',
      title: 'Select Service',
      description: 'Choose from available services',
    },
    {
      number: '3',
      title: 'Make Payment',
      description: 'Pay securely on the Stellar network',
    },
    {
      number: '4',
      title: 'Get Access',
      description: 'Receive NFT-based access on Polkadot',
    },
  ];

  const stats = [
    { value: counters.payments.toLocaleString(), label: 'Total Payments', icon: CreditCard },
    { value: counters.users.toLocaleString(), label: 'Active Users', icon: Users },
    { value: counters.services, label: 'Services', icon: Wrench },
    { value: counters.chains, label: 'Blockchains', icon: Link2 },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center animate-fade-in">
            <div className="inline-block mb-6 animate-float">
              <GlassCard glow="blue" className="p-4">
                <Logo size={64} />
              </GlassCard>
            </div>
            <h1 className="text-display-2xl md:text-display-xl lg:text-display-2xl font-display mb-6 text-gradient-glow animate-slide-up">
            PayStamp
          </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-12 max-w-3xl mx-auto font-medium leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Cross-chain access protocol bridging Stellar payments with Polkadot access control
          </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Link href="/connect">
                <GlassButton size="lg" variant="primary" glow="blue" className="w-full sm:w-auto">
                  Get Started
                </GlassButton>
              </Link>
              <Link href="/services">
                <GlassButton size="lg" variant="secondary" glow="purple" className="w-full sm:w-auto">
                  Browse Services
                </GlassButton>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-display-md md:text-display-lg font-display text-center mb-16 text-gradient text-balance">
            Why Choose PayStamp?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <GlassCard
                key={index}
                hover
                glow="blue"
                className="text-center animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex justify-center mb-4">
                  <feature.icon className="w-12 h-12 text-electric-blue" />
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-white font-heading">{feature.title}</h3>
                <p className="text-gray-200 leading-relaxed">{feature.description}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-display-md md:text-display-lg font-display text-center mb-16 text-gradient text-balance">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <GlassCard hover glow="purple" className="relative z-10">
                  <div className="absolute -top-4 -left-4 w-12 h-12 glass-lg rounded-full flex items-center justify-center text-2xl font-bold text-gradient">
                    {step.number}
                  </div>
                  <div className="pt-6">
                    <h3 className="text-xl font-semibold mb-2 text-white font-heading">{step.title}</h3>
                    <p className="text-gray-200 leading-relaxed">{step.description}</p>
                  </div>
                </GlassCard>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-electric-blue to-electric-purple z-20" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-display-md md:text-display-lg font-display text-center mb-16 text-gradient text-balance">
            By The Numbers
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <GlassCard
                key={index}
                glow="blue"
                className="text-center animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex justify-center mb-3">
                  <stat.icon className="w-10 h-10 text-electric-blue" />
                </div>
                <div className="text-3xl md:text-4xl font-extrabold text-gradient-glow mb-2 font-display">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-300 font-medium">{stat.label}</div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <GlassCard glow="blue" className="text-center py-16">
            <h2 className="text-display-md md:text-display-lg font-display mb-6 text-gradient-glow text-balance">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-gray-200 mb-8 font-medium">
              Join thousands of users enjoying seamless cross-chain access
            </p>
            <Link href="/connect">
              <GlassButton size="lg" variant="primary" glow="blue">
                Connect Your Wallet
              </GlassButton>
          </Link>
          </GlassCard>
        </div>
      </section>
    </div>
  );
}
