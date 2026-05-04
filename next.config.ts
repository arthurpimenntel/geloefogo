import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['ftp2'],
  experimental: {
    turbopack: {} // Silencia o erro do Turbopack no Next 16
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        dns: false,
        fs: false
      };
    }
    return config;
  },
};

export default nextConfig;
