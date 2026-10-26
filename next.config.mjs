import {fileURLToPath} from 'node:url';
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  outputFileTracingRoot: fileURLToPath(new URL('.', import.meta.url)),
  distDir: process.env.NEXT_DIST_DIR || '.next',
  async rewrites() {
    const backend = process.env.CREFANS_API_ORIGIN || 'http://127.0.0.1:3001';
    const url = new URL(backend);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/') throw new Error('Invalid CREFANS_API_ORIGIN');
    return [
      {source: '/api/v1/admin/:path*', destination: `${url.origin}/api/v1/admin/:path*`},
      ...['login', 'logout', 'refresh'].map(action => ({source: `/api/v1/auth/${action}`, destination: `${url.origin}/api/v1/auth/${action}`})),
    ];
  },
  async headers() {
    return [{source: '/:path*', headers: [
      {key:'X-Robots-Tag',value:'noindex, nofollow, noarchive'},
      {key:'X-Content-Type-Options',value:'nosniff'},
      {key:'Referrer-Policy',value:'same-origin'},
      {key:'X-Frame-Options',value:'DENY'},
      {key:'Cache-Control',value:'private, no-store'},
    ]}];
  },
};
export default nextConfig;
