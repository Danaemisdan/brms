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
  outputFileTracingIncludes: {
    '/api/**/*': ['./prisma/dev.db'],
  },
};
export default nextConfig;
