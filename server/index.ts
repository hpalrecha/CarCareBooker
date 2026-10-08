import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { registerRoutes } from "./routes";
import { securityHeaders } from "./middleware/security-headers";
import { setupVite, serveStatic, log } from "./vite";
import { schedulerService } from "./services/scheduler";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import path from "path";
import fs from "fs";

const app = express();

// Express sends this by default; it costs nothing to a reader but is free reconnaissance for
// an attacker (confirms the framework) and pure noise for an SEO crawler. No functional effect.
app.disable("x-powered-by");

// www -> non-www canonical redirect (SEO audit: "one canonical host" — the app previously
// answered identically on both hosts, splitting ranking signals across two URLs for every page).
//
// Cloudflare-safe and loop-safe: matches the exact production hostname only (never matches
// local dev's "localhost:5000" or any other deploy target's host), and always redirects to the
// fixed "https://p91carcare.com" origin rather than trusting req.protocol — which can read
// "http" behind a proxy that already terminated TLS — so this can never downgrade to HTTP or
// redirect anywhere but the one canonical host. Since it only ever matches the www host and
// only ever redirects AWAY from it, the redirect target can never match this condition again:
// no loop is reachable.
app.use((req, res, next) => {
  if (req.headers.host === "www.p91carcare.com") {
    return res.redirect(301, `https://p91carcare.com${req.originalUrl}`);
  }
  next();
});

// gzip/brotli every text response (HTML, JS, CSS, JSON). Typically a 3-4x reduction on
// the JS bundle and the /api/services payload, on every single request.
//
// Registered first so it wraps everything below it. Already-compressed binaries — the
// WebP service images and the MP4s under /attached_assets — are skipped automatically by
// the default filter, so this costs nothing on those routes.
app.use(compression());

// Disable all restrictive security policies for Razorpay compatibility
app.use((req, res, next) => {
  // Remove all CSP and security headers that interfere with Razorpay
  res.removeHeader('Content-Security-Policy');
  res.removeHeader('X-Content-Type-Options');
  res.removeHeader('X-Frame-Options');
  res.removeHeader('X-XSS-Protection');
  
  // Set maximum permissive headers for payment gateway
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Expose-Headers', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
  res.header('Cross-Origin-Opener-Policy', 'unsafe-none');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  
  // Handle all preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

// Baseline hardening headers (nosniff, referrer policy, clickjacking protection, HSTS in production).
// Additive and Razorpay-safe; see server/middleware/security-headers.ts.
app.use(securityHeaders());

// Capture the raw request bytes alongside the parsed body.
//
// Razorpay signs the exact bytes it sends, so HMAC verification needs the untouched
// buffer. This global json() parser runs before the webhook route, which means the
// route-level express.raw() never sees an unconsumed stream and req.body arrives as a
// parsed object. Without this hook, `JSON.parse(req.body.toString())` evaluates
// "[object Object]" and throws — which is why /api/razorpay-webhook returned 500 on
// every delivery.
app.use(express.json({
  verify: (req, _res, buf) => {
    (req as any).rawBody = buf;
  },
}));
app.use(express.urlencoded({ extended: false }));

// Serve attached assets statically - use dirname for reliable path resolution in production
const attachedAssetsPath = path.resolve(import.meta.dirname, '..', 'attached_assets');
console.log('Serving attached assets from:', attachedAssetsPath);

// Fail loudly at boot if the directory is missing. express.static() on a non-existent
// directory silently calls next(), so every /attached_assets/* request falls through to
// the SPA catch-all and returns index.html with content-type text/html — which browsers
// render as a broken image. A container built without attached_assets/ therefore looked
// healthy while every service image on the site was broken.
if (!fs.existsSync(attachedAssetsPath)) {
  const message =
    `attached_assets/ is missing at ${attachedAssetsPath}. Every service image will 404. ` +
    `If this is a container, the image was built without copying attached_assets/ (see Dockerfile).`;
  if (process.env.NODE_ENV === 'production') {
    console.error(`FATAL: ${message}`);
    process.exit(1);
  }
  console.warn(`WARNING: ${message}`);
}
app.use('/attached_assets', express.static(attachedAssetsPath, {
  maxAge: '7d', // Cache images and the hero clip for 7 days
  setHeaders: (res) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
}));

// Serve uploaded images statically
const uploadsPath = path.resolve(import.meta.dirname, '..', 'uploads');
console.log('Serving uploads from:', uploadsPath);
app.use('/uploads', express.static(uploadsPath, {
  maxAge: '1d',
  setHeaders: (res) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Register object storage routes for persistent file uploads
  registerObjectStorageRoutes(app);
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  // The chat assistant answers 503 "Chat isn't available" without this key. Say so in the container log at
  // start-up, so `docker logs` shows it at once instead of a customer finding out first.
  if (!process.env.OPENAI_API_KEY) {
    console.warn("[startup] OPENAI_API_KEY is not set: /api/chat will answer 503 until it is.");
  }
  // reusePort is only supported on Linux; it throws ENOTSUP on Windows/macOS, which
  // breaks local development. Enable it only where the platform supports it.
  const listenOpts: { port: number; host: string; reusePort?: boolean } = {
    port,
    host: "0.0.0.0",
  };
  if (process.platform === "linux") {
    listenOpts.reusePort = true;
  }
  server.listen(listenOpts, () => {
    log(`serving on port ${port}`);
    
    // Start the automatic reminder scheduler - sends reminders daily at 8:00 PM IST
    schedulerService.startReminderScheduler();
  });
})();
