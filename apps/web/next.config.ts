import path from "node:path";
import type { NextConfig } from "next";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

const config: NextConfig = {
  // Page copy lives in packages/content and pure logic in packages/domain, outside this app.
  turbopack: { root: repoRoot },
  outputFileTracingRoot: repoRoot,
  output: "standalone",
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "p91carcare.com", pathname: "/attached_assets/**" }],
  },
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "Strict-Transport-Security", value: "max-age=15552000" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      ],
    }];
  },
};

export default config;
