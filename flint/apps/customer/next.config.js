/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
      },
    ],
  },
  transpilePackages: ['@cbp/types', '@cbp/supabase', '@cbp/api-client'],
};

module.exports = nextConfig;
