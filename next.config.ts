import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/login",
        destination: "/dashboard/login",
        permanent: false,
      },
      {
        source: "/book",
        destination: "/",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/dashboard-:slug",
        destination: "/shop/:slug",
      },
      {
        source: "/dashboard-:slug/:path*",
        destination: "/shop/:slug/:path*",
      },
      {
        source: "/index-:slug/login",
        destination: "/shop/:slug/login",
      },
    ];
  },
};

export default nextConfig;
