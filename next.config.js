/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    unoptimized: true,
  },
  // Disable static generation of error pages to avoid Html import bug
  experimental: {
    forceSwcTransforms: true,
  },
};

module.exports = nextConfig;
