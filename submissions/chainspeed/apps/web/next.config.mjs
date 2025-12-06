/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['@chainspeed/shared'],
    experimental: {
        externalDir: true,
    },
};

export default nextConfig;
