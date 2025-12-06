import type { Metadata } from 'next';
import { Inter, Space_Grotesk, Outfit, Sora } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Header } from '@/components/navigation/header';
import { Footer } from '@/components/navigation/footer';
import { BottomNav } from '@/components/navigation/bottom-nav';

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'PayStamp - Cross-Chain Access Protocol',
  description: 'Bridge Stellar payments with Polkadot access control',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${outfit.variable} ${sora.variable} font-sans`}>
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 pt-20 pb-20 md:pb-0">{children}</main>
            <Footer />
            <BottomNav />
          </div>
        </Providers>
      </body>
    </html>
  );
}
