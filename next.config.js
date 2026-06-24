/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: "standalone", // Temporarily disabled to fix Html import bug
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    unoptimized: true,
  },
  experimental: {
    forceSwcTransforms: true,
  },
};

module.exports = nextConfig;
