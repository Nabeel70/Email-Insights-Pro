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
    config.externals.push({
      'firebase-admin/app': 'commonjs firebase-admin/app',
      'firebase-admin/auth': 'commonjs firebase-admin/auth',
      'firebase-admin/firestore': 'commonjs firebase-admin/firestore',
    });
    
    return config;
  },
};

export default nextConfig;
