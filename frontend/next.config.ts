import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://8.217.202.162:8000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
