import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  // Increase the body size limit for file uploads (500MB for .blend files)
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb',
    },
  },
  // Configure API route body size limit
  serverExternalPackages: [],
};

export default nextConfig;
