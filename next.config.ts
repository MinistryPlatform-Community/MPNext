import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // Required for Docker deployment
  cacheComponents: true,
  cacheLife: {
    dashboard: {
      stale: 300, // 5 minutes stale
      revalidate: 21600, // 6 hours
      expire: 86400, // 1 day
    },
    "static-lookup": {
      stale: 3600, // 1 hour stale
      revalidate: 86400, // 24 hours
      expire: 604800, // 1 week
    },
  },
};

export default nextConfig;
