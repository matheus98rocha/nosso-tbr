import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "m.media-amazon.com",
        port: "",
        search: "",
      },
      {
        protocol: "https",
        hostname: "**.ssl-images-amazon.com",
        port: "",
        search: "",
      },
      {
        protocol: "https",
        hostname: "**.media-amazon.com",
        port: "",
        search: "",
      },
    ],
  },
};

export default nextConfig;
