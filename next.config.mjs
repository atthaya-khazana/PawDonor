/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produces a self-contained server in .next/standalone, which keeps the
  // runtime Docker image small (no full node_modules, no source code).
  output: 'standalone',
  serverExternalPackages: ['pg'],
  eslint: { ignoreDuringBuilds: true },
  poweredByHeader: false,
};

export default nextConfig;
