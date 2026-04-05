import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://carikopi-api.capturah.my.id/api/:path*",
      },
    ];
  },
};

export default nextConfig;
