import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Samodzielny serwer Node (server.js) do obrazu kontenera na Cloud Run
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
