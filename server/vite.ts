import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

// URLs that name a file with an asset extension must never be answered with the SPA
// shell — a 200 text/html in place of an image is exactly how the broken service images
// went unnoticed. Shared by setupVite() and serveStatic().
const ASSET_EXT =
  /\.(png|jpe?g|gif|webp|avif|svg|ico|css|js|mjs|map|json|txt|woff2?|ttf|eot|mp4|webm|pdf)$/i;

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    // Same guard as serveStatic(): a missing asset must 404 rather than be answered with
    // the SPA shell at 200 text/html, so a broken image URL fails the same way in
    // development as it does in production.
    if (ASSET_EXT.test(url.split("?")[0])) {
      return res.status(404).type("text/plain").send("Not found");
    }

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // Static assets (anything with a file extension) that reached here don't exist —
  // return a real 404 instead of the SPA shell, so broken images/scripts fail loudly
  // rather than silently rendering as 200 text/html.
  app.use("*", (req, res) => {
    if (ASSET_EXT.test(req.originalUrl.split("?")[0])) {
      return res.status(404).type("text/plain").send("Not found");
    }
    // Genuine SPA navigation → serve the app shell.
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
