import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        /**
         * Vendor chunking, paired with the route-level React.lazy split in App.tsx.
         *
         * Without this, splitting routes alone can make things WORSE: shared dependencies
         * get duplicated into several route chunks, or the framework ends up inside the
         * first route chunk and is re-parsed on navigation. Pinning the big shared
         * libraries to stable, long-cached files means a returning visitor downloads only
         * the page they asked for.
         *
         * Grouped by change rate, not by size. `react-vendor` almost never changes, so it
         * stays in the browser cache across deploys; app code changes on every release and
         * is deliberately kept out of it.
         */
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return undefined;
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler|wouter)[\\/]/.test(id)) {
            return "react-vendor";
          }
          if (/[\\/]node_modules[\\/]@tanstack[\\/]/.test(id)) return "query-vendor";
          if (/[\\/]node_modules[\\/]@radix-ui[\\/]/.test(id)) return "radix-vendor";
          // Charting and date tooling are admin-only and heavy; keeping them in their own
          // chunk stops them reaching a customer who never opens the dashboard.
          if (/[\\/]node_modules[\\/](recharts|d3-|victory|date-fns)/.test(id)) {
            return "chart-vendor";
          }
          return undefined;
        },
      },
    },
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
