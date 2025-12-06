'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWalletStore } from '@/stores/wallet-store';
import { useAccessStatus } from '@/lib/hooks/use-access-status';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingSpinner } from '@/components/ui/loading';
import Link from 'next/link';
import { Key, Lock, Copy, CheckCircle2, Code } from 'lucide-react';

export default function DeveloperPage() {
  const searchParams = useSearchParams();
  const { stellarAddress } = useWalletStore();
  const serviceId = searchParams.get('service') || 'api_key';
  const { accessStatus, isLoading } = useAccessStatus(serviceId);
  const [copied, setCopied] = useState(false);

  // Mock API key (in production, this would be fetched from backend)
  const apiKey = `pk_live_${stellarAddress?.slice(0, 8)}${Math.random().toString(36).substring(2, 15)}`;

  const hasAccess = accessStatus?.hasAccess && !accessStatus?.isExpired;

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          <h1 className="text-2xl font-bold mb-4 text-white">API Access Required</h1>
          <p className="text-gray-300 mb-6">Unlock developer API access</p>
          <Link href="/services">
            <GlassButton variant="primary" size="md" glow="blue">
              Get API Key
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
              Developer Portal
            </h1>
            <StatusBadge status="success" variant="dot">Active</StatusBadge>
          </div>
        </div>

        <GlassCard glow="blue" className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <Key className="w-8 h-8 text-electric-blue" />
            <h2 className="text-2xl font-bold text-white">Your API Key</h2>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-200 mb-2">
              API Key
            </label>
            <div className="glass-input p-4 rounded-xl flex items-center justify-between">
              <code className="text-sm text-gray-300 font-mono flex-1 break-all">
                {apiKey}
              </code>
              <button
                onClick={copyApiKey}
                className="glass-button p-2 rounded-lg ml-2 flex-shrink-0"
                title="Copy API key"
              >
                {copied ? (
                  <CheckCircle2 className="w-5 h-5 text-status-success" />
                ) : (
                  <Copy className="w-5 h-5 text-gray-400" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              ⚠️ Keep this key secure. It will expire in 24 hours.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Code className="w-5 h-5" />
              Usage Example
            </h3>
            <div className="glass-lg p-4 rounded-xl">
              <code className="text-sm text-gray-300 font-mono block whitespace-pre-wrap">
{`curl -H "X-API-Key: ${apiKey}" \\
  https://api.paystamp.dev/analytics \\
  -d '{"query": "getBalance", "address": "${stellarAddress}"}'`}
              </code>
            </div>
          </div>

          <div className="p-4 glass-lg rounded-xl border border-status-info/30">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-status-success" />
              <span className="text-white font-semibold">API Access Active</span>
            </div>
            <p className="text-sm text-gray-300">
              Your API key is verified on-chain. Access will automatically revoke after expiry.
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

