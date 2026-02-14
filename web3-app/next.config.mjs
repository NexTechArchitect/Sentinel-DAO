/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  transpilePackages: ['@rainbow-me/rainbowkit', 'wagmi', 'viem', 'framer-motion'],

  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },

  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        { key: 'Cache-Control', value: 'no-store, max-age=0' },
      ],
    },
  ],
};

export default nextConfig;