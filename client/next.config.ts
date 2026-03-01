/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false as any,
  turbopack: {
    root: process.cwd(),
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
