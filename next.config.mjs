/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React StrictMode in development for better error detection
  reactStrictMode: true,

  // Optimize performance
  swcMinify: true,

  // Compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Experimental features for better performance
  experimental: {
    // Optimize CSS imports
    optimizeCss: true,
    // Enable turbo mode for faster builds
    turbo: {
      resolveAlias: {
        underscore: 'lodash',
        mocha: { browser: 'mocha/browser-entry.js' },
      },
    },
  },
};

export default nextConfig;
