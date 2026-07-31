import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Multi-platform compatibility
  outputFileTracingRoot: process.cwd(),
  experimental: {
    isrMemoryCacheSize: 0, // Disable ISR memory caching for Cloudflare compatibility
  },
  // Add empty turbopack config to silence the error
  turbopack: {},
  // Set webpack mode explicitly
  webpack: (config, { isServer }) => {
    return config;
  },
  // Enable support for both Vercel and Cloudflare
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=3600',
          },
        ],
      },
    ];
  },
}

export default withPWA(nextConfig);
