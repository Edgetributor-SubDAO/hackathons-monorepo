/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000',
    NEXT_PUBLIC_STELLAR_NETWORK: process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'testnet',
    NEXT_PUBLIC_POLKADOT_NETWORK: process.env.NEXT_PUBLIC_POLKADOT_NETWORK || 'shibuya',
  },
  images: {
    domains: [],
  },
};

module.exports = nextConfig;

