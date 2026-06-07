import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    const legacyDashboardRedirects = [
      { path: "calendar", hash: "calendar" },
      { path: "bookings", hash: "queue" },
      { path: "customers", hash: "clients" },
      { path: "employees", hash: "employee-profile" },
      { path: "reports", hash: "payrollsummary" },
      { path: "settings", hash: "setting" },
      { path: "services", hash: "setting" },
    ] as const;

    const shopRedirects = legacyDashboardRedirects.flatMap(({ path, hash }) => [
      {
        source: `/dashboard-:slug/${path}`,
        destination: `/dashboard-:slug#${hash}`,
        permanent: false,
      },
      {
        source: `/shop/:slug/${path}`,
        destination: `/dashboard-:slug#${hash}`,
        permanent: false,
      },
    ]);

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
      {
        source: "/dashboard/tenants",
        destination: "/dashboard#clientsbusiness",
        permanent: false,
      },
      {
        source: "/dashboard/tenants/:id",
        destination: "/dashboard#clientsbusiness",
        permanent: false,
      },
      ...shopRedirects,
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
