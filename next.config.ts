import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['ftp2'],
  turbopack: false,  // ← Colocado na raiz, não em experimental
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