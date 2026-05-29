import type { NextConfig } from 'next'

const appUrl = process.env.NEXT_PUBLIC_APP_URL
const productionHost = appUrl ? new URL(appUrl).host : null

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        ...(productionHost ? [productionHost] : []),
      ],
    },
  },
}

export default nextConfig
