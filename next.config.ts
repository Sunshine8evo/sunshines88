import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/dashboard/login",
        destination: "/login",
        permanent: false,
      },
      {
        source: "/dashboard-:slug/login",
        destination: "/login",
        permanent: false,
      },
      {
        source: "/shop/:slug/login",
        destination: "/login",
        permanent: false,
      },
      {
        source: "/index-:slug/login",
        destination: "/login",
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
    ];
  },
};

export default nextConfig;
