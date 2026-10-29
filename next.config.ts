import type { NextConfig } from "next";
import { networkInterfaces } from "node:os";

const nextConfig: NextConfig = {
  // Permit this machine's addresses when testing the dev server on a physical phone.
  allowedDevOrigins: [
    "127.0.0.1",
    ...Object.values(networkInterfaces()).flatMap(entries =>
      entries?.filter(entry => entry.family === "IPv4" && !entry.internal).map(entry => entry.address) ?? [],
    ),
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },
};

export default nextConfig;