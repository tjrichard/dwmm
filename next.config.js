/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Optimize framer-motion to avoid export * issues
    optimizePackageImports: ['framer-motion'],
  },
  webpack: (config, { isServer }) => {
    // Handle framer-motion client-side only imports
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;


