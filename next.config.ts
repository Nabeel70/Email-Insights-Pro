import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // This is to prevent a warning about "Critical dependency: the request of a dependency is an expression"
    // which is caused by the firebase-admin package.
    if (isServer) {
        config.externals.push(/^firebase-admin/);
    }
    
    return config;
  },
};

export default nextConfig;
