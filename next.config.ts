import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.in' },
      { protocol: 'https', hostname: 'r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: '*.r2.dev' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      // allow any HTTPS for product images from suppliers
      { protocol: 'https', hostname: '**' },
    ],
  },
  experimental: {
    // serverComponentsExternalPackages removed in Next 15+
  },
}

export default nextConfig
