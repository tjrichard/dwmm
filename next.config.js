/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Disable by providing an empty allowlist to avoid rxjs barrel optimization issues
    optimizePackageImports: [],
  },
};

module.exports = nextConfig;


