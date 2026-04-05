import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://carikopi-api.capturah.my.id/api/:path*",
        //destination: "http://127.0.0.1:8082/api/:path*",
      },
    ];
  },
};

export default nextConfig;
