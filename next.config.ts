import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@xenova/transformers', 'pdfjs-dist', 'mammoth'],
};

export default nextConfig;
