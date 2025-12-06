'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-2xl text-center">
        <GlassCard glow="red" className="py-16 animate-fade-in">
          <div className="flex justify-center mb-6">
            <AlertTriangle className="w-16 h-16 text-status-warning" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Something Went Wrong</h1>
          <p className="text-xl text-gray-300 mb-2">
            We encountered an unexpected error. Please try again.
          </p>
          {error.digest && (
            <p className="text-sm text-gray-500 mb-8 font-mono">Error ID: {error.digest}</p>
          )}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <GlassButton variant="primary" size="lg" glow="red" onClick={reset}>
              Try Again
            </GlassButton>
            <Link href="/">
              <GlassButton variant="secondary" size="lg">
                Go Home
              </GlassButton>
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

