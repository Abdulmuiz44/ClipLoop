import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    instrumentationHook: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      // Serve Vite SPA for root path
      {
        source: "/",
        destination: "/index.html",
      },
      // Serve Vite SPA for all non-API, non-Next.js-internal routes
      {
        source: "/:path((?!api/|_next/|favicon|generated/|assets/|cliploop-logo).*)",
        destination: "/index.html",
      },
    ];
  },
};

export default nextConfig;
