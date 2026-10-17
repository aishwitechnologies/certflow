import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:/tmp/dev.db";
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "certflow-default-production-session-secret-2026";
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(__dirname, 'src'),
      canvas: false,
    };
    return config;
  },
};

export default nextConfig;
