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
  webpack: (config, { isServer }) => {
    config.resolve.alias['@opentelemetry/exporter-jaeger'] = false;
    config.resolve.alias['@opentelemetry/winston-transport'] = false;
    
    config.module.rules.push({
      test: /handlebars/,
      use: 'null-loader',
    });

    if (!isServer) {
      config.resolve.alias['handlebars'] = false;
    }
    
    if (isServer) {
      config.externals = [...(config.externals || []), 'pino-pretty', 'lokijs', 'encoding'];
    }

    return config;
  },
};

export default nextConfig;
