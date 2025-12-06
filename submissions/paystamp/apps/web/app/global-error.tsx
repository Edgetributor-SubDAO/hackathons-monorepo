'use client';

import Link from 'next/link';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { AlertCircle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-gray-900 to-black">
          <div className="w-full max-w-2xl text-center">
            <GlassCard glow="red" className="py-16">
              <div className="flex justify-center mb-6">
                <AlertCircle className="w-16 h-16 text-status-error" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Critical Error</h1>
              <p className="text-xl text-gray-300 mb-8">
                A critical error occurred. Please refresh the page or contact support.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <GlassButton variant="primary" size="lg" glow="red" onClick={reset}>
                  Reset Application
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
      </body>
    </html>
  );
}

