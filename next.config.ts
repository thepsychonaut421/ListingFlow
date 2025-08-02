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
    // Genkit uses handlebars, which breaks the Next.js build.
    if (isServer) {
        config.plugins.push(
            new (require('webpack').NormalModuleReplacementPlugin)(
                /handlebars/,
                (resource: any) => {
                    resource.request = 'node-noop';
                }
            )
        );
    }
    return config;
  },
};

export default nextConfig;
