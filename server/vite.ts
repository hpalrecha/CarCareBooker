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

  // redirect:false is load-bearing. With the default, a request for /blog is answered with
  // a 301 to /blog/ so express.static can serve the directory index — but the canonical
  // baked into that page says /blog, and a canonical that 301s to a different URL is a
  // self-inflicted duplicate-content problem. The explicit lookup below serves the
  // directory's index.html at the URL that was actually requested.
  app.use(express.static(distPath, { redirect: false }));

  /**
   * Prerendered route HTML, from scripts/prerender.mjs.
   *
   * Each known route has dist/public/<route>/index.html carrying that route's real title,
   * canonical and JSON-LD. Without this the SPA catch-all below would answer /blog/foo
   * with the generic shell, and the prerendering would be dead weight on disk.
   *
   * Falls through to the catch-all when there is no prerendered file, so an unknown or
   * newly added route still works — just without baked metadata.
   */
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    const pathname = req.path;
    if (ASSET_EXT.test(pathname)) return next();

    const candidate = path.resolve(distPath, "." + pathname, "index.html");
    // Never serve outside the build directory, whatever the URL contains.
    if (candidate !== distPath && !candidate.startsWith(distPath + path.sep)) return next();
    if (!fs.existsSync(candidate)) return next();
    return res.sendFile(candidate);
  });

  // Static assets (anything with a file extension) that reached here don't exist —
  // return a real 404 instead of the SPA shell, so broken images/scripts fail loudly
  // rather than silently rendering as 200 text/html.
  app.use("*", (req, res) => {
    if (ASSET_EXT.test(req.originalUrl.split("?")[0])) {
      return res.status(404).type("text/plain").send("Not found");
    }
    // Genuine SPA navigation that matched no prerendered route.
    //
    // Serve 404.html, not index.html. Since prerendering, index.html carries the
    // HOMEPAGE's title, canonical and schema — sending it for /blog/typo would tell every
    // crawler that each wrong URL is a duplicate of the homepage. 404.html is the same
    // shell with a "Page not found" title and noindex, so React still boots and renders
    // the branded 404, but the URL cannot be indexed as homepage content.
    //
    // Still 200, deliberately: changing the status for unmatched paths would affect
    // health checks and monitors on a live site and belongs in its own change.
    const notFound = path.resolve(distPath, "404.html");
    res.sendFile(fs.existsSync(notFound) ? notFound : path.resolve(distPath, "index.html"));
  });
}
