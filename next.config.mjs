/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable React StrictMode to prevent duplicate requests (like crefans_front)
  reactStrictMode: false,

  // Optimize performance
  swcMinify: true,

  // Remove static export to enable server-side routing

  // Compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === "production",
  },

  // SEO protection for admin panel
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive, nosnippet, noimageindex",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
