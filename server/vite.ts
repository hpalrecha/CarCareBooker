import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";
import {
  serviceSeoTitle,
  serviceSeoDescription,
  serviceStructuredData,
  servicesItemListSchema,
} from "../client/src/lib/service-seo";
import {
  injectRootContent,
  servicePageContent,
  servicesListContent,
  type CrawlableService,
} from "../client/src/lib/crawlable-content";
import { SERVICES_SEO } from "../client/src/lib/static-seo";

const viteLogger = createLogger();

// URLs that name a file with an asset extension must never be answered with the SPA
// shell — a 200 text/html in place of an image is exactly how the broken service images
// went unnoticed. Shared by setupVite() and serveStatic().
const ASSET_EXT =
  /\.(png|jpe?g|gif|webp|avif|svg|ico|css|js|mjs|map|json|txt|woff2?|ttf|eot|mp4|webm|pdf)$/i;

// Client-only routes: App.tsx renders a real page for these but the build prerenders no
// file for them (private screens, or params only the database knows). They keep HTTP 200.
const SPA_ONLY_ROUTE = /^\/(admin(\/.*)?|booking-confirmation\/[^/]+|products\/[^/]+)\/?$/i;

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

export function serveStatic(app: Express, distPathOverride?: string) {
  /**
   * In production dist/index.js sits beside dist/public, so resolving relative to this
   * module is correct and the override is never used. It exists so the routing rules
   * below can be exercised by a test running from source, where import.meta.dirname is
   * server/ and there is no server/public — without it the indexable-sitemap regression
   * test could not run at all.
   */
  const distPath = distPathOverride ?? path.resolve(import.meta.dirname, "public");

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

    // /services: the build knows the heading and intro but not the catalogue, so the
    // prerendered file is enriched per request with every active service (linked, priced)
    // and an ItemList schema. Any failure serves the prerendered file unchanged — the page
    // still works and still has its heading, it just lacks the list for that request.
    if (pathname === "/services" || pathname === "/services/") {
      return void (async () => {
        try {
          const { storage } = await import("./storage");
          const services = (await storage.getAllServices()).filter((s: any) => s?.slug && s?.title);
          if (!services.length) return res.sendFile(candidate);
          const origin = process.env.PUBLIC_SITE_ORIGIN || "https://p91carcare.com";
          const itemList = servicesItemListSchema(services as CrawlableService[], origin);
          const html = fs
            .readFileSync(candidate, "utf8")
            .replace(
              /<div id="root">[\s\S]*?<\/div>(\s*<!--)/,
              `<div id="root">${servicesListContent(SERVICES_SEO, services as CrawlableService[])}</div>$1`,
            )
            .replace(
              /<\/head>/i,
              `    <script type="application/ld+json" data-seo="prerender">${JSON.stringify(itemList).replace(/</g, "\\u003c")}</script>\n  </head>`,
            );
          return res.type("html").send(html);
        } catch (error) {
          console.error("services list injection failed:", error);
          return res.sendFile(candidate);
        }
      })();
    }
    return res.sendFile(candidate);
  });

  /**
   * /service/:slug — indexable HTML with real metadata, resolved per request.
   *
   * ─────────────────────────────────────────────────────────────────────────────────────
   * THE DEFECT THIS FIXES.
   *
   * sitemap.xml is generated at RUNTIME from the services table, so it listed all 17
   * /service/:slug URLs. Prerendering runs at BUILD time with no database, so none of
   * them had a prerendered file. They therefore fell through to the catch-all below and
   * were served 404.html — "Page not found", `noindex, follow`.
   *
   * React then booted and rendered the real page for humans, and useSeoMeta corrected the
   * title. But useSeoMeta does not manage the robots tag, so the noindex SURVIVED
   * hydration. The sitemap was asking Google to index 17 pages while every one of them
   * carried an explicit instruction not to.
   *
   * The root cause is that the catch-all conflated two different things: "no prerendered
   * file" and "this route does not exist". This handler separates them. The server has
   * the database — the same source the sitemap is built from — so a slug that resolves to
   * an active service gets indexable HTML with its real metadata, and anything else falls
   * through to the genuine 404. Valid and invalid routes keep opposite behaviour.
   *
   * Metadata is derived exactly as ServiceSeo does in client/src/pages/service-landing.tsx,
   * so the prerendered head and the hydrated head agree rather than flickering between two
   * different titles.
   * ─────────────────────────────────────────────────────────────────────────────────────
   */
  app.get("/service/:slug", async (req, res, next) => {
    try {
      const appShell = path.resolve(distPath, "app.html");
      if (!fs.existsSync(appShell)) return next();

      const { storage } = await import("./storage");
      const service = await storage.getServiceBySlug(req.params.slug);

      // Unknown or retired slug: NOT a valid route. Fall through to the noindex 404 —
      // making these indexable would be a far worse problem than the one being fixed.
      if (!service || !service.isActive) return next();

      const origin = process.env.PUBLIC_SITE_ORIGIN || "https://p91carcare.com";
      const title = serviceSeoTitle(service);
      const description = serviceSeoDescription(service);
      const canonical = `${origin}/service/${service.slug}`;
      const images = Array.isArray(service.images) ? service.images : [];
      const rawImage = typeof images[0] === "string" && images[0].trim() ? images[0] : null;
      const image = rawImage
        ? rawImage.startsWith("http") ? rawImage : origin + rawImage
        : `${origin}/Car Care (4)_1753951564515.png`;

      const esc = (s: string) =>
        String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

      // Same builder the page uses after hydration (client/src/lib/service-seo.ts): the
      // business with its confirmed address and live hours, the Service, and FAQPage when
      // the record has questions. This copy used to omit FAQPage and the street address,
      // so a crawler that does not run JavaScript saw neither.
      const businessHours = await storage.getAllBusinessHours().catch(() => undefined);
      const schemas = serviceStructuredData(service as Parameters<typeof serviceStructuredData>[0], {
        origin,
        businessHours,
      });

      const head = [
        `    <title>${esc(title)}</title>`,
        `    <meta name="description" content="${esc(description)}" />`,
        `    <link rel="canonical" href="${esc(canonical)}" />`,
        `    <meta property="og:title" content="${esc(title)}" />`,
        `    <meta property="og:description" content="${esc(description)}" />`,
        `    <meta property="og:url" content="${esc(canonical)}" />`,
        `    <meta property="og:type" content="website" />`,
        `    <meta property="og:image" content="${esc(image)}" />`,
        `    <meta name="twitter:card" content="summary_large_image" />`,
        `    <meta name="twitter:image" content="${esc(image)}" />`,
        // data-seo="prerender": the page's useSeoMeta removes these when it sets the same
        // schema itself, so a JavaScript-running browser does not end up with two copies.
        ...schemas.map(
          (schema) =>
            `    <script type="application/ld+json" data-seo="prerender">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>`,
        ),
        "  </head>",
      ].join("\n");

      // The page's real content (title, description, price, included items, FAQ) inside
      // #root, so crawlers that do not run JavaScript can read it. React's createRoot
      // replaces it on load — see client/src/lib/crawlable-content.ts.
      const html = injectRootContent(
        fs.readFileSync(appShell, "utf8").replace(/<\/head>/i, head),
        servicePageContent(service as CrawlableService),
      );
      return res.type("html").send(html);
    } catch (error) {
      // A database hiccup must not turn a real page into a 404. Fall through to the SPA
      // shell path, which still renders correctly for humans.
      console.error("service page metadata injection failed:", error);
      return next();
    }
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
    // Status: routes that exist only client-side (no prerendered file, but App.tsx renders
    // a real page) stay 200. Everything else is a genuine miss and gets 404, so crawlers
    // stop treating every typo URL as a soft-404 page. Keep SPA_ONLY_ROUTE in step with
    // the non-prerendered <Route>s in client/src/App.tsx.
    const pathname = req.originalUrl.split("?")[0];
    const status = SPA_ONLY_ROUTE.test(pathname) ? 200 : 404;
    const notFound = path.resolve(distPath, "404.html");
    res
      .status(status)
      .sendFile(fs.existsSync(notFound) ? notFound : path.resolve(distPath, "index.html"));
  });
}
