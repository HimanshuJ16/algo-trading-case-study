import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/blog/algo-trading",
  async redirects() {
    return [
      {
        source: "/",
        destination: "/blog/algo-trading",
        permanent: false,
        basePath: false,
      },
    ];
  },
};

export default nextConfig;
