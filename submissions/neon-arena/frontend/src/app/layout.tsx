import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Neon Arena - Play & Earn Crypto | Web3 Gaming",
  description: "Play epic arcade games and earn real crypto rewards on Polkadot & Stellar. No seed phrases, no gas fees hassle - just pure gaming fun!",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-mono">{children}</body>
    </html>
  );
}
