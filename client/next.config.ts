import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  devIndicators: false as any,
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
