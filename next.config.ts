import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
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
      {
        protocol: "https",
        hostname: "books.google.com",
        port: "",
        search: "",
      },
      {
        protocol: "https",
        hostname: "covers.openlibrary.org",
        port: "",
        search: "",
      },
    ],
  },
};

export default nextConfig;
