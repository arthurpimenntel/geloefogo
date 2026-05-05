import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ['ftp2', 'socksv5'],
  turbopack: {},
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        dns: false,
        fs: false,
      };
    }
    return config;
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.cjdropshipping.com' },
      { protocol: 'https', hostname: '**.aliexpress.com' },
      { protocol: 'https', hostname: '**.alicdn.com' },
    ],
  },
  allowedDevOrigins: ['deliver-submit-head-ago.trycloudflare.com'],
};

export default nextConfig;