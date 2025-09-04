/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // framer-motion export * 에러 해결을 위한 설정
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    
    // framer-motion 모듈을 클라이언트 사이드에서만 로드하도록 설정
    config.module.rules.push({
      test: /framer-motion/,
      sideEffects: false,
    });
    
    return config;
  },
};

module.exports = nextConfig;


