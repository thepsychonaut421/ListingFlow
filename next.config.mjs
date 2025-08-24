/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      'fs/promises': false,
      'path': false,
    };
    return config;
  },
  watchOptions: {
    // A se folosi pentru a exclude fișierele generate de sistemul de build
    // pentru a preveni buclele de reconstrucție infinită.
    ignored: ["**/.next/**", "**/node_modules/**"],
  },
};

export default nextConfig;
