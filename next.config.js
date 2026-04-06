// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['anyfix-uploads.s3.eu-west-1.amazonaws.com', 'lh3.googleusercontent.com'],
  },
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*` },
    ];
  },
};
module.exports = nextConfig;
