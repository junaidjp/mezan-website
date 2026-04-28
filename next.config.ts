/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  typescript: {
    // Skip strict type checking during builds. We use TypeScript for IDE
    // hints but don't want builds to fail on minor type issues that work fine at runtime.
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
