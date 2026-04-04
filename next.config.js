/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

module.exports = nextConfig;
