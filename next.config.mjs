/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * Prevents the Next.js dev server from entering a restart loop in certain environments.
   * By setting poll to false, we rely on the default file system event-based watching,
   * which is generally more efficient and stable.
   */
  webpack(config) {
    // This resolves a warning for a dependency of Genkit (handlebars).
    // It tells Webpack to treat the 'fs' module as an external dependency
    // that doesn't need to be bundled for the browser, which is correct.
    config.externals.push('fs');
    return config;
  },
  watchOptions: {
    poll: false,
  },
};

export default nextConfig;
