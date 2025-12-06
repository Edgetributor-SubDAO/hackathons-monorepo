import Link from 'next/link';
import { Twitter, Github } from 'lucide-react';
import { Logo } from '@/components/logo';

export function Footer() {
  return (
    <footer className="glass-lg border-t border-white/10 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Logo size={32} showText={true} textSize="md" className="mb-4" />
            <p className="text-gray-400 text-sm">
              Cross-chain access protocol bridging Stellar payments with Polkadot access control.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/status" className="text-gray-400 hover:text-white transition-colors">
                  Status
                </Link>
              </li>
              <li>
                <Link href="/history" className="text-gray-400 hover:text-white transition-colors">
                  History
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  API Reference
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Connect</h4>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 glass-button rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 glass-button rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-white/10 text-center text-sm text-gray-400">
          <p>© {new Date().getFullYear()} PayStamp. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

