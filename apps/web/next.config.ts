import path from "node:path";
import type { NextConfig } from "next";
import { OLD_URL_REDIRECTS } from "../../packages/content/src/site/redirects.ts";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

const config: NextConfig = {
  // Page copy lives in packages/content and pure logic in packages/domain, outside this app.
  turbopack: { root: repoRoot },
  outputFileTracingRoot: repoRoot,
  output: "standalone",
  poweredByHeader: false,
  // proxy.ts answers 410s first and strips a trailing slash in the same hop as the old-URL redirect.
  skipTrailingSlashRedirect: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "p91carcare.com", pathname: "/attached_assets/**" }],
  },
  // Old site URLs -> new pages, one hop, permanent (308). /service/* stays on the API (booking).
  async redirects() {
    return OLD_URL_REDIRECTS;
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
