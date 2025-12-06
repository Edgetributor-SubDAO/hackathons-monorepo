import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'ChainSpeed - Ookla for Web3',
    description: 'Test and compare blockchain performance in real-time. The Speedtest for crypto.',
    keywords: ['blockchain', 'performance', 'speed test', 'crypto', 'web3', 'polkadot', 'stellar'],
    openGraph: {
        title: 'ChainSpeed - Ookla for Web3',
        description: 'Test and compare blockchain performance in real-time.',
        type: 'website',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <div className="min-h-screen animated-bg">
                    {children}
                </div>
            </body>
        </html>
    );
}
