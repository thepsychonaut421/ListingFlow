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
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ebayimg.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.idealo.com',
        pathname: '/**',
      },
       {
        protocol: 'https',
        hostname: 'i.otto.de',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'shop.retoura.de',
        pathname: '/**',
      }
    ],
  },
  webpack: (config, { isServer }) => {
    // These are necessary to avoid errors with some of Genkit's dependencies.
    config.resolve.alias['@opentelemetry/exporter-jaeger'] = false;
    config.resolve.alias['@opentelemetry/winston-transport'] = false;
    
    // This is the definitive fix for the "Handlebars.noConflict" error.
    // It completely removes Handlebars from the client-side bundle and prevents
    // version conflicts on the server.
    if (!isServer) {
        config.resolve.alias['handlebars'] = false;
        config.module.rules.push({
            test: /handlebars/,
            use: 'null-loader',
        });
    }
    
    // For server-side, we want to make sure any server-specific dependencies
    // are not bundled by Webpack.
    if (isServer) {
      config.externals = [...(config.externals || []), 'pino-pretty', 'lokijs', 'encoding'];
    }

    return config;
  },
};

export default nextConfig;
