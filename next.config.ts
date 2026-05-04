const nextConfig = {
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

module.exports = nextConfig;