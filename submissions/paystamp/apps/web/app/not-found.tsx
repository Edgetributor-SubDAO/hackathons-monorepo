import Link from 'next/link';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { Logo } from '@/components/logo';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-2xl text-center">
        <GlassCard glow="blue" className="py-16 animate-fade-in">
          <div className="flex justify-center mb-6">
            <Logo size={80} />
          </div>
          <div className="text-8xl font-bold text-gradient mb-6 animate-float">404</div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Page Not Found</h1>
          <p className="text-xl text-gray-300 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <GlassButton variant="primary" size="lg" glow="blue">
                Go Home
              </GlassButton>
            </Link>
            <Link href="/status">
              <GlassButton variant="secondary" size="lg">
                View Status
              </GlassButton>
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

