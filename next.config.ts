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
      {
        protocol: 'https',
        hostname: 'i.ebayimg.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.idealo.com',
        port: '',
        pathname: '/**',
      },
       {
        protocol: 'https',
        hostname: 'i.otto.de',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'shop.retoura.de',
        port: '',
        pathname: '/**',
      }
    ],
  },
  devIndicators: {
    allowedDevOrigins: [
        'https://6000-firebase-studio-1753103304989.cluster-6vyo4gb53jczovun3dxslzjahs.cloudworkstations.dev',
    ],
  },
  webpack: (config, { isServer }) => {
    // This is a workaround for the issue with opentelemetry/exporter-jaeger as it's not needed for the build.
    if (isServer) {
        config.resolve.alias['@opentelemetry/exporter-jaeger'] = false;
    }
    return config;
  }
};

export default nextConfig;
