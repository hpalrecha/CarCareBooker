import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import connectPg from "connect-pg-simple";
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { storage } from "./storage";
import { SlotFullError } from "./storage";
import { authenticateAdmin, hashPassword, comparePassword } from "./middleware/auth";
import { createPaymentOrder, verifyPaymentSignature } from "./services/payment";
import { resolveBookingAmount, isFreeBookingWindow, FULL_PRICE_SLUG } from "./lib/booking-amount";
import { whatsappService } from "./services/whatsapp";
import { schedulerService } from "./services/scheduler";
import { sendBookingConfirmationEmail } from "./services/email";
import { sendBookingWebhook } from "./services/webhook";
import { computeAvailability, generateHourlySlots, istNow } from "./lib/slots";
import { validateAppointmentSlot } from "./lib/booking-validation";
import { parseAttribution, deriveSource } from "./lib/attribution";
import { rateLimit } from "./lib/rate-limit";
import {
  validateCampaignInput,
  findOverlaps,
  effectiveCampaignForLandingPage,
  campaignFreeBookingForService,
} from "./lib/campaign";
import { campaignState, type CampaignRecord } from "@shared/campaign";
import { z } from "zod";

/**
 * Unguessable customer-facing confirmation token.
 *
 * 32 bytes from the CSPRNG — the same generator the Razorpay signature check relies on,
 * not Math.random(), because this string is the only thing standing between a stranger
 * and a customer's name, phone number and appointment time.
 *
 * Base64url so it is safe in a URL without escaping, which matters because it is handed
 * to customers in a link.
 */
function generateConfirmationToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * The subset of a booking a customer may see about their OWN appointment.
 *
 * An allowlist, not a denylist. A denylist silently leaks every column added later —
 * and this table gains columns regularly (ERP sync fields, attribution, this token).
 * Anything not named here does not reach the browser, including:
 *
 *   paymentId, razorpayOrderId   payment-processor identifiers
 *   erp*, n8nExecutionId         internal integration state
 *   confirmationToken            the credential itself; the holder already has it
 *   utm*, fbclid, source         the business's marketing data, not the customer's
 */
function publicBookingView(booking: any, service: any) {
  return {
    id: booking.id,
    customerName: booking.customerName,
    customerEmail: booking.customerEmail,
    customerPhone: booking.customerPhone,
    appointmentDate: booking.appointmentDate,
    appointmentTime: booking.appointmentTime,
    amount: booking.amount,
    paymentStatus: booking.paymentStatus,
    bookingStatus: booking.bookingStatus,
    createdAt: booking.createdAt,
    service: service
      ? {
          id: service.id,
          title: service.title,
          slug: service.slug,
          duration: service.duration,
          price: service.price,
        }
      : null,
  };
}

/** Shape returned to API callers so payment success is never conflated with ERP success. */
interface ErpSyncOutcome {
  status: "sent" | "failed" | "skipped";
  retryable?: boolean;
  reason?: string;
}

/**
 * Idempotently push a PAID booking to n8n -> ERPNext, recording the outcome on the booking.
 *
 * Safe to call from both the browser confirmation and the Razorpay server webhook, and safe to
 * call repeatedly: a booking already marked `synced` is skipped rather than re-sent, so webhook
 * retries and double-delivery cannot create duplicate ERP documents.
 *
 * Never throws — ERP failure must not roll back a captured payment.
 */
async function syncBookingToErp(
  bookingId: string,
  opts: { force?: boolean } = {},
): Promise<ErpSyncOutcome> {
  try {
    const booking = await storage.getBooking(bookingId);
    if (!booking) {
      return { status: "skipped", reason: "booking_not_found" };
    }

    // Gate: ERP documents are only created for confirmed-paid bookings.
    if (booking.paymentStatus !== "paid") {
      console.log(`⏭️  [erp-sync] booking=${bookingId} skipped — paymentStatus=${booking.paymentStatus}`);
      return { status: "skipped", reason: "payment_not_confirmed" };
    }

    // Idempotency: already synced -> do not send again.
    if (booking.erpSyncStatus === "synced" && !opts.force) {
      console.log(`⏭️  [erp-sync] booking=${bookingId} already synced — skipping duplicate send`);
      return { status: "skipped", reason: "already_synced" };
    }

    // Guard against two concurrent deliveries (browser + webhook arriving together).
    if (booking.erpSyncStatus === "processing" && !opts.force) {
      console.log(`⏭️  [erp-sync] booking=${bookingId} already in flight — skipping`);
      return { status: "skipped", reason: "in_progress" };
    }

    await storage.updateBooking(bookingId, {
      erpSyncStatus: "processing",
      erpSyncAttempts: (booking.erpSyncAttempts ?? 0) + 1,
    });

    const service = await storage.getService(booking.serviceId);
    const result = await sendBookingWebhook(booking, service || null);

    if (result.ok) {
      await storage.updateBooking(bookingId, {
        erpSyncStatus: "synced",
        erpSyncedAt: new Date(),
        erpSyncError: null,
        n8nExecutionId: result.n8nExecutionId ?? null,
      });
      return { status: "sent" };
    }

    await storage.updateBooking(bookingId, {
      erpSyncStatus: "failed",
      erpSyncError: `[${result.errorKind ?? "unknown"}] ${result.error ?? "unknown error"}`.slice(0, 500),
    });
    return { status: "failed", retryable: result.retryable, reason: result.errorKind };
  } catch (error) {
    // Defensive: a bug in tracking must not break payment confirmation.
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`❌ [erp-sync] unexpected error for booking=${bookingId}: ${msg}`);
    return { status: "failed", retryable: true, reason: "internal_error" };
  }
}

// Setup multer for image uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const uploadStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: uploadStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, GIF, and WebP images are allowed"));
    }
  },
});
import {
  adminLoginSchema,
  bookingFormSchema,
  insertServiceSchema,
  insertTimeSlotSchema,
  insertPpfLeadSchema,
  whatsappConfigSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const isProd = process.env.NODE_ENV === "production";

  // Require a real session secret in production; never fall back to a public literal.
  const sessionSecret = process.env.SESSION_SECRET;
  if (isProd && (!sessionSecret || sessionSecret === "your-secret-key")) {
    throw new Error(
      "SESSION_SECRET must be set to a strong secret in production. Refusing to start with the default.",
    );
  }

  // Behind Cloudflare / App Engine the app sees a proxy; trust it so `secure` cookies
  // and req.protocol work correctly.
  app.set("trust proxy", 1);

  // Session configuration
  const pgStore = connectPg(session);
  app.use(
    session({
      store: new pgStore({
        conString: process.env.DATABASE_URL,
        createTableIfMissing: false,
        tableName: "sessions",
      }),
      secret: sessionSecret || "dev-only-insecure-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        // HTTPS-only cookie in production; plain http allowed only in local dev.
        secure: isProd,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
        sameSite: "lax",
      },
    })
  );

  // Admin Authentication Routes
  app.post("/api/admin/login", async (req, res) => {
    try {
      console.log("Admin login attempt:", { email: req.body.email, timestamp: new Date().toISOString() });
      
      const { email, password } = adminLoginSchema.parse(req.body);
      
      const admin = await storage.getAdminByEmail(email);
      if (!admin) {
        console.log("Admin not found:", email);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await comparePassword(password, admin.password);
      if (!isValidPassword) {
        console.log("Invalid password for admin:", email);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Regenerate the session on login to prevent session fixation.
      req.session.regenerate((err) => {
        if (err) {
          console.error("Session regenerate error:", err);
          return res.status(500).json({ message: "Login failed" });
        }
        req.session.adminId = admin.id;
        console.log("Admin login successful:", { adminId: admin.id, email: admin.email });
        res.json({ message: "Login successful", admin: { id: admin.id, email: admin.email, name: admin.name } });
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(400).json({ message: "Invalid request" });
    }
  });

  app.post("/api/admin/logout", authenticateAdmin, (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/admin/me", authenticateAdmin, (req, res) => {
    const admin = (req as any).admin;
    res.json({ id: admin.id, email: admin.email, name: admin.name });
  });

  // Image Upload Route
  app.post("/api/upload", authenticateAdmin, upload.single("image"), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const imageUrl = `/uploads/${req.file.filename}`;
      res.json({ url: imageUrl, filename: req.file.filename });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  // robots.txt — served from here, not client/public, so it can react to the deploy
  // environment. A checked-in static file would ship the production Allow rules and the
  // production sitemap URL to every staging and preview host, inviting Google to index
  // p91-cc-audit.web.app and similar as duplicates of the real site.
  //
  // Any origin that is not the canonical one is served a blanket Disallow.
  // registerRoutes() runs before serveStatic()/setupVite(), so this wins over any file of
  // the same name.
  app.get("/robots.txt", (_req, res) => {
    const origin = process.env.PUBLIC_SITE_ORIGIN || "https://p91carcare.com";
    const isCanonical = origin === "https://p91carcare.com";

    if (!isCanonical) {
      res
        .type("text/plain")
        .send(
          `# Non-production origin (${origin}) — indexing disabled.\n` +
            `# Set PUBLIC_SITE_ORIGIN=https://p91carcare.com on the production deploy.\n` +
            `User-agent: *\nDisallow: /\n`,
        );
      return;
    }

    res.type("text/plain").send(
      `# P91 Car Care — ${origin}\n` +
        `#\n` +
        `# Marketing pages are open. The admin panel, the JSON API and per-booking\n` +
        `# confirmation URLs are not useful in search and are kept out of the index.\n` +
        `\n` +
        `User-agent: *\n` +
        `Allow: /\n` +
        `Disallow: /admin/\n` +
        `Disallow: /api/\n` +
        `Disallow: /booking-confirmation/\n` +
        `\n` +
        `Sitemap: ${origin}/sitemap.xml\n`,
    );
  });

  // sitemap.xml — generated from the live active-service rows rather than a checked-in
  // file, so a service added or deactivated in the admin panel is reflected without a
  // redeploy. getAllServices() returns active rows only, which is exactly the set that
  // should be indexable: an inactive slug renders "Service Not Found".
  //
  // Registered here rather than in client/public because the SPA catch-all in vite.ts
  // would otherwise answer /sitemap.xml with index.html.
  app.get("/sitemap.xml", async (_req, res) => {
    try {
      const origin = process.env.PUBLIC_SITE_ORIGIN || "https://p91carcare.com";
      const services = await storage.getAllServices();

      const staticPaths = [
        { loc: "/", priority: "1.0", changefreq: "weekly" },
        // The catalogue page. Ranks for the broad "services" queries that the homepage
        // and the 17 per-service pages were previously competing for on their own.
        { loc: "/services", priority: "0.9", changefreq: "weekly" },
        // Local-intent landing pages. Additive — /service/:slug below is unchanged.
        // Kept in step with client/src/lib/seo-pages.ts.
        { loc: "/services/ceramic-coating-bangalore", priority: "0.8", changefreq: "monthly" },
        { loc: "/services/paint-protection-film-bangalore", priority: "0.8", changefreq: "monthly" },
        { loc: "/services/interior-detailing-bangalore", priority: "0.8", changefreq: "monthly" },
        { loc: "/services/glass-sun-control-film-bangalore", priority: "0.8", changefreq: "monthly" },
        // Blog. Kept in step with client/src/lib/blog-posts.ts.
        { loc: "/blog", priority: "0.7", changefreq: "weekly" },
        { loc: "/blog/ppf-vs-ceramic-coating-bangalore", priority: "0.6", changefreq: "yearly" },
        { loc: "/blog/hard-water-spot-removal-bangalore", priority: "0.6", changefreq: "yearly" },
        { loc: "/blog/windshield-heat-rejection-film-summer", priority: "0.6", changefreq: "yearly" },
        // Category listings. Each is a real, prerendered, indexable URL rather than a
        // client-side filter over /blog — otherwise the hub has exactly one crawlable
        // listing page however much gets written. Slugs come from categorySlug() in
        // client/src/lib/blog-posts.ts; adding a post in a NEW category means adding a
        // line here, which tests/blog-seo.test.mjs enforces.
        { loc: "/blog/category/protection", priority: "0.5", changefreq: "monthly" },
        { loc: "/blog/category/paint-care", priority: "0.5", changefreq: "monthly" },
        { loc: "/blog/category/glass-film", priority: "0.5", changefreq: "monthly" },
        { loc: "/ppf-ceramic-coating", priority: "0.9", changefreq: "monthly" },
        { loc: "/contact", priority: "0.6", changefreq: "yearly" },
        { loc: "/terms-conditions", priority: "0.3", changefreq: "yearly" },
        { loc: "/privacy-policy", priority: "0.3", changefreq: "yearly" },
        { loc: "/refund-policy", priority: "0.3", changefreq: "yearly" },
      ];

      const escape = (s: string) =>
        s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

      const urls = [
        ...staticPaths.map(
          (p) =>
            `  <url>\n    <loc>${escape(origin + p.loc)}</loc>\n` +
            `    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`,
        ),
        ...services
          .filter((s: any) => typeof s.slug === "string" && s.slug.trim() !== "")
          .map(
            (s: any) =>
              `  <url>\n    <loc>${escape(`${origin}/service/${s.slug}`)}</loc>\n` +
              `    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`,
          ),
      ];

      res.type("application/xml").send(
        `<?xml version="1.0" encoding="UTF-8"?>\n` +
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`,
      );
    } catch (error) {
      console.error("Sitemap error:", error);
      res.status(500).type("text/plain").send("Failed to build sitemap");
    }
  });

  // Service Management Routes
  app.get("/api/services", async (req, res) => {
    try {
      const services = await storage.getAllServices();
      res.json(services);
    } catch (error) {
      console.error("Get services error:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.get("/api/admin/services", authenticateAdmin, async (req, res) => {
    try {
      const services = await storage.getAllServicesAdmin();
      res.json(services);
    } catch (error) {
      console.error("Get admin services error:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.get("/api/services/:id", async (req, res) => {
    try {
      // Check if this is a slug or an ID
      const param = req.params.id;
      let service;
      
      if (param.includes('-')) {
        // Looks like a slug
        service = await storage.getServiceBySlug(param);
      } else {
        // Looks like an ID
        service = await storage.getService(param);
      }
      
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      if (!service.isActive) {
        return res.status(404).json({ message: "This service is not currently available" });
      }
      res.json(service);
    } catch (error) {
      console.error("Get service error:", error);
      res.status(500).json({ message: "Failed to fetch service" });
    }
  });

  app.post("/api/services", authenticateAdmin, async (req, res) => {
    try {
      const serviceData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(serviceData);
      res.json(service);
    } catch (error) {
      console.error("Create service error:", error);
      res.status(400).json({ message: "Invalid service data" });
    }
  });

  app.put("/api/services/:id", authenticateAdmin, async (req, res) => {
    try {
      // Pre-process the data to handle string-to-number conversions
      const body = { ...req.body };
      
      // Convert string numbers to proper types
      if (body.price !== undefined) {
        body.price = String(body.price);
      }
      if (body.originalPrice !== undefined) {
        body.originalPrice = body.originalPrice ? String(body.originalPrice) : null;
      }
      if (body.duration !== undefined) {
        body.duration = parseInt(String(body.duration), 10);
      }

      // Handle isActive toggle separately with a dedicated method to ensure it persists reliably
      if (body.isActive !== undefined) {
        await storage.setServiceActiveStatus(req.params.id, Boolean(body.isActive));
        delete body.isActive;
      }

      // For partial updates, we don't need strict validation
      // Just pass the cleaned data directly to storage
      if (Object.keys(body).length > 0) {
        await storage.updateService(req.params.id, body);
      }
      const service = await storage.getService(req.params.id);
      res.json(service);
    } catch (error) {
      console.error("Update service error:", error);
      res.status(400).json({ message: "Invalid service data" });
    }
  });

  app.delete("/api/services/:id", authenticateAdmin, async (req, res) => {
    try {
      await storage.deleteService(req.params.id);
      res.json({ message: "Service deleted successfully" });
    } catch (error) {
      console.error("Delete service error:", error);
      res.status(500).json({ message: "Failed to delete service" });
    }
  });

  // Settings Routes
  app.get("/api/settings", authenticateAdmin, async (req, res) => {
    try {
      const category = req.query.category as string;
      const settings = category 
        ? await storage.getSettingsByCategory(category)
        : await storage.getAllSettings();
      res.json(settings);
    } catch (error) {
      console.error("Get settings error:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.get("/api/settings/:key", async (req, res) => {
    try {
      const setting = await storage.getSetting(req.params.key);
      if (!setting) {
        return res.status(404).json({ message: "Setting not found" });
      }
      res.json(setting);
    } catch (error) {
      console.error("Get setting error:", error);
      res.status(500).json({ message: "Failed to fetch setting" });
    }
  });

  /**
   * Public: is the free-booking offer running right now?
   *
   * The browser must not decide this. The window is an IST calendar date, and a customer
   * whose phone is set to another timezone — or whose clock is simply wrong — would
   * otherwise see "Book Free" and then be charged, or see ₹299 during the offer. One
   * server-computed answer, used by every surface that mentions the price.
   *
   * Fails closed like everything else here: any error reports the offer as OFF, so an
   * outage shows the normal fee rather than giving work away.
   */
  /**
   * Public: runtime configuration the browser needs.
   *
   * Exists because Vite inlines `VITE_*` at BUILD time and the Dockerfile passes no build
   * arguments — a VITE_META_PIXEL_ID would be baked as undefined inside the container
   * regardless of the deployment environment, and the pixel would silently never load.
   * Serving it at runtime means marketing can change the pixel with a container restart
   * rather than a rebuild and redeploy.
   *
   * ONLY non-secret, already-public values belong here. A Meta Pixel ID is visible in the
   * page source of every site that uses one; it is an identifier, not a credential. The
   * Conversions API access token, if that is ever added, is a genuine secret and must
   * NEVER be served from this endpoint — it stays server-side and is used server-side.
   */
  app.get("/api/public-config", (_req, res) => {
    // No cache: this is how the pixel is turned on and off, and a CDN holding a stale
    // "null" would keep tracking dark after the id is configured.
    res.set("Cache-Control", "no-store");
    res.json({
      metaPixelId: process.env.META_PIXEL_ID || null,
    });
  });

  /**
   * Public: a customer reading THEIR OWN booking confirmation.
   *
   * ─────────────────────────────────────────────────────────────────────────────────
   * WHY THIS EXISTS AS A SEPARATE ROUTE.
   *
   * /booking-confirmation/:id was registered in the router and the page existed, but
   * nothing navigated to it, and if anything had, it fetched GET /api/bookings/:id —
   * which is authenticateAdmin-gated. A customer got 401 and was silently redirected to
   * the homepage.
   *
   * The fix is NOT to relax that admin route. It stays exactly as it is: session
   * required, full row including payment and ERP internals. This is a second, narrower
   * door.
   *
   * WHY A TOKEN AND NOT THE ID. The booking id is a database key. It appears in admin
   * URLs, in server logs and in ERP payloads, and it is handed to the client that
   * created the booking. A key that is also a credential means every place the key leaks
   * is a place the credential leaks. The token is generated for this one purpose, is
   * unique-indexed, and carries no other meaning — so it can be rotated or revoked
   * without touching the booking.
   *
   * WHY IT IS STILL SAFE WITH NO LOGIN. 32 CSPRNG bytes is 256 bits. Guessing one is not
   * a realistic attack, and the rate limit below removes even the theoretical one by
   * capping attempts per address.
   *
   * Response is an allowlist (publicBookingView), so columns added to this table in
   * future are private by default rather than public by default.
   * ─────────────────────────────────────────────────────────────────────────────────
   */
  app.get(
    "/api/bookings/confirmation/:token",
    // Generous enough that a customer refreshing their confirmation, or opening it on a
    // second device, is never blocked — but low enough that token guessing is pointless.
    rateLimit({
      bucket: "confirmation-lookup",
      windowMs: 60_000,
      max: 30,
      message: "Too many lookups. Please wait a moment and refresh.",
    }),
    async (req, res) => {
      try {
        const booking = await storage.getBookingByConfirmationToken(req.params.token);

        // Same 404 for "no such token" and "malformed token". Distinguishing them would
        // confirm to a guesser which of their attempts had the right shape.
        if (!booking) {
          return res.status(404).json({ message: "Booking not found" });
        }

        const service = await storage.getService(booking.serviceId);
        res.json(publicBookingView(booking, service ?? null));
      } catch (error) {
        console.error("Public confirmation lookup error:", error);
        res.status(500).json({ message: "Failed to load booking" });
      }
    },
  );

  /**
   * Public: the campaign running on a landing page right now.
   *
   * The browser never decides this. It returns:
   *
   *   campaign   the resolved winner, or null
   *   serverNow  this server's clock, as an ISO instant
   *
   * `serverNow` is what makes the countdown correct on a device whose clock is wrong.
   * The client measures the offset once and ticks against server time thereafter, so two
   * phones showing the same campaign show the same remaining seconds even if one of them
   * is set to the wrong hour. Without it, "consistent across devices" is not achievable
   * from a static end timestamp alone.
   *
   * Fails closed like every other offer surface: any error reports no campaign, so an
   * outage shows the normal pricing rather than an offer nobody can honour.
   */
  app.get("/api/campaigns/active", async (req, res) => {
    try {
      const landingPage = typeof req.query.landingPage === "string" ? req.query.landingPage : "";
      if (!landingPage) {
        return res.status(400).json({ message: "landingPage is required" });
      }

      const all = (await storage.getAllCampaigns()) as unknown as CampaignRecord[];
      const resolved = effectiveCampaignForLandingPage(all, landingPage);

      // Overlapping active campaigns are an admin mistake, not a customer-facing error.
      // The customer still gets one deterministic offer; the conflict is logged so it can
      // be found and fixed rather than silently shaping what people are shown.
      if (resolved.conflicts.length > 0) {
        console.warn(
          `[campaigns] CONFLICT on ${landingPage}: serving "${resolved.campaign?.identifier}" ` +
            `over ${resolved.conflicts.map((c) => `"${c.identifier}"`).join(", ")} — ` +
            `overlapping active campaigns should be corrected in admin.`,
        );
      }

      const c = resolved.campaign;
      res.json({
        serverNow: new Date().toISOString(),
        campaign: c
          ? {
              identifier: c.identifier,
              name: c.name,
              serviceSlug: c.serviceSlug,
              vehicleType: c.vehicleType,
              landingPage: c.landingPage,
              startsAt: new Date(c.startsAt).toISOString(),
              endsAt: new Date(c.endsAt).toISOString(),
              offerType: c.offerType,
              offerTitle: c.offerTitle,
              offerDescription: c.offerDescription ?? null,
              ctaText: c.ctaText,
            }
          : null,
      });
    } catch (error) {
      console.error("campaigns/active read failed; reporting no campaign:", error);
      res.json({ serverNow: new Date().toISOString(), campaign: null });
    }
  });

  // ---------------------------------------------------------------- admin campaigns
  //
  // Every field is validated server-side by validateCampaignInput; the admin frontend is
  // not trusted for any of it. Overlap is refused at write time, which is the real fix —
  // deterministic read-time resolution is the safety net, not a licence to create
  // ambiguous offers.

  app.get("/api/admin/campaigns", authenticateAdmin, async (_req, res) => {
    try {
      const all = (await storage.getAllCampaigns()) as unknown as CampaignRecord[];
      const now = new Date();
      res.json(
        all.map((c) => ({
          ...c,
          // Computed, never stored: a stored status is a status that goes stale the
          // moment the clock moves past it.
          state: campaignState(c, now),
        })),
      );
    } catch (error) {
      console.error("List campaigns error:", error);
      res.status(500).json({ message: "Failed to load campaigns" });
    }
  });

  app.post("/api/admin/campaigns", authenticateAdmin, async (req, res) => {
    try {
      const parsed = validateCampaignInput(req.body);
      if (!parsed.ok) {
        return res.status(400).json({ message: parsed.message, fieldErrors: parsed.fieldErrors });
      }
      const input = parsed.value;

      // The service must exist and be bookable. A campaign advertising a service the
      // catalogue cannot sell sends paid traffic to a dead end.
      const service = await storage.getServiceBySlug(input.serviceSlug);
      if (!service || !service.isActive) {
        return res.status(400).json({
          message: "Please correct the highlighted fields.",
          fieldErrors: { serviceSlug: "No active service with this slug" },
        });
      }

      const existingByIdentifier = await storage.getCampaignByIdentifier(input.identifier);
      if (existingByIdentifier) {
        return res.status(409).json({
          message: "Please correct the highlighted fields.",
          fieldErrors: { identifier: "A campaign with this identifier already exists" },
        });
      }

      const all = (await storage.getAllCampaigns()) as unknown as CampaignRecord[];
      const candidate = { ...input, id: "__new__", createdAt: new Date() } as CampaignRecord;
      const overlaps = findOverlaps(candidate, all);
      if (overlaps.length > 0) {
        return res.status(409).json({
          message:
            `This campaign overlaps ${overlaps.map((o) => `"${o.name}"`).join(", ")} on ` +
            `${input.landingPage}. Pause the other campaign or change the dates.`,
          fieldErrors: { startsAt: "Overlaps an active campaign on this landing page" },
          conflicts: overlaps.map((o) => ({ id: o.id, name: o.name, identifier: o.identifier })),
        });
      }

      const created = await storage.createCampaign({
        ...input,
        startsAt: new Date(input.startsAt),
        endsAt: new Date(input.endsAt),
        offerDescription: input.offerDescription ?? null,
        createdBy: (req as any).admin?.id ?? null,
      });
      console.log(`[campaigns] created ${created.identifier} by admin ${(req as any).admin?.id}`);
      res.json({ ...created, state: campaignState(created as unknown as CampaignRecord) });
    } catch (error) {
      console.error("Create campaign error:", error);
      res.status(500).json({ message: "Failed to create campaign" });
    }
  });

  app.patch("/api/admin/campaigns/:id", authenticateAdmin, async (req, res) => {
    try {
      const existing = await storage.getCampaign(req.params.id);
      if (!existing) return res.status(404).json({ message: "Campaign not found" });

      // Validate the MERGED record rather than the patch alone. Validating a patch in
      // isolation cannot check end-after-start when only one of the two is being changed.
      const merged = {
        name: req.body.name ?? existing.name,
        identifier: req.body.identifier ?? existing.identifier,
        serviceSlug: req.body.serviceSlug ?? existing.serviceSlug,
        vehicleType: req.body.vehicleType ?? existing.vehicleType,
        landingPage: req.body.landingPage ?? existing.landingPage,
        startsAt: req.body.startsAt ?? new Date(existing.startsAt).toISOString(),
        endsAt: req.body.endsAt ?? new Date(existing.endsAt).toISOString(),
        isActive: req.body.isActive ?? existing.isActive,
        offerType: req.body.offerType ?? existing.offerType,
        offerTitle: req.body.offerTitle ?? existing.offerTitle,
        offerDescription: req.body.offerDescription ?? existing.offerDescription,
        ctaText: req.body.ctaText ?? existing.ctaText,
      };

      const parsed = validateCampaignInput(merged);
      if (!parsed.ok) {
        return res.status(400).json({ message: parsed.message, fieldErrors: parsed.fieldErrors });
      }
      const input = parsed.value;

      if (input.serviceSlug !== existing.serviceSlug) {
        const service = await storage.getServiceBySlug(input.serviceSlug);
        if (!service || !service.isActive) {
          return res.status(400).json({
            message: "Please correct the highlighted fields.",
            fieldErrors: { serviceSlug: "No active service with this slug" },
          });
        }
      }

      if (input.identifier !== existing.identifier) {
        const clash = await storage.getCampaignByIdentifier(input.identifier);
        if (clash && clash.id !== existing.id) {
          return res.status(409).json({
            message: "Please correct the highlighted fields.",
            fieldErrors: { identifier: "A campaign with this identifier already exists" },
          });
        }
      }

      const all = (await storage.getAllCampaigns()) as unknown as CampaignRecord[];
      const candidate = { ...input, id: existing.id, createdAt: existing.createdAt } as CampaignRecord;
      const overlaps = findOverlaps(candidate, all);
      if (overlaps.length > 0) {
        return res.status(409).json({
          message:
            `This campaign would overlap ${overlaps.map((o) => `"${o.name}"`).join(", ")} on ` +
            `${input.landingPage}. Pause the other campaign or change the dates.`,
          fieldErrors: { startsAt: "Overlaps an active campaign on this landing page" },
          conflicts: overlaps.map((o) => ({ id: o.id, name: o.name, identifier: o.identifier })),
        });
      }

      const updated = await storage.updateCampaign(existing.id, {
        ...input,
        startsAt: new Date(input.startsAt),
        endsAt: new Date(input.endsAt),
        offerDescription: input.offerDescription ?? null,
      });
      console.log(
        `[campaigns] updated ${updated.identifier} by admin ${(req as any).admin?.id}: ` +
          Object.keys(req.body ?? {}).join(", "),
      );
      // NOTE: bookings already taken under this campaign are NOT touched. They carry a
      // snapshot of the identifier precisely so an edit here cannot rewrite history.
      res.json({ ...updated, state: campaignState(updated as unknown as CampaignRecord) });
    } catch (error) {
      console.error("Update campaign error:", error);
      res.status(500).json({ message: "Failed to update campaign" });
    }
  });

  app.get("/api/booking-offer", async (_req, res) => {
    try {
      const setting = await storage.getSetting("free_booking_until");
      const until = setting?.value ?? null;
      const free = isFreeBookingWindow(until);
      res.json({ free, until: free ? until : null });
    } catch (error) {
      console.error("booking-offer read failed; reporting offer as off:", error);
      res.json({ free: false, until: null });
    }
  });

  app.put("/api/settings/:key", authenticateAdmin, async (req, res) => {
    try {
      const { value, description, category, dataType } = req.body;
      const settingData = {
        key: req.params.key,
        value: value.toString(),
        description,
        category: category || "general",
        dataType: dataType || "string",
      };
      const setting = await storage.upsertSetting(settingData);
      res.json(setting);
    } catch (error) {
      console.error("Update setting error:", error);
      res.status(400).json({ message: "Failed to update setting" });
    }
  });

  app.delete("/api/settings/:key", authenticateAdmin, async (req, res) => {
    try {
      await storage.deleteSetting(req.params.key);
      res.json({ message: "Setting deleted successfully" });
    } catch (error) {
      console.error("Delete setting error:", error);
      res.status(500).json({ message: "Failed to delete setting" });
    }
  });

  // Blackout Dates Routes
  app.get("/api/blackout-dates", async (req, res) => {
    try {
      const blackoutDates = await storage.getAllBlackoutDates();
      res.json(blackoutDates);
    } catch (error) {
      console.error("Get blackout dates error:", error);
      res.status(500).json({ message: "Failed to fetch blackout dates" });
    }
  });

  app.post("/api/blackout-dates", authenticateAdmin, async (req, res) => {
    try {
      const { date, reason } = req.body;
      
      if (!date || !reason) {
        return res.status(400).json({ message: "Date and reason are required" });
      }

      const existingBlackout = await storage.getBlackoutDate(date);
      if (existingBlackout) {
        return res.status(400).json({ message: "This date is already blocked" });
      }

      const blackoutDate = await storage.createBlackoutDate({ date, reason });
      res.json(blackoutDate);
    } catch (error) {
      console.error("Create blackout date error:", error);
      res.status(400).json({ message: "Failed to create blackout date" });
    }
  });

  app.delete("/api/blackout-dates/:id", authenticateAdmin, async (req, res) => {
    try {
      await storage.deleteBlackoutDate(req.params.id);
      res.json({ message: "Blackout date deleted successfully" });
    } catch (error) {
      console.error("Delete blackout date error:", error);
      res.status(500).json({ message: "Failed to delete blackout date" });
    }
  });

  // Business Hours Routes
  app.get("/api/business-hours", async (req, res) => {
    try {
      const hours = await storage.getAllBusinessHours();
      res.json(hours);
    } catch (error) {
      console.error("Get business hours error:", error);
      res.status(500).json({ message: "Failed to fetch business hours" });
    }
  });

  app.post("/api/business-hours/initialize", authenticateAdmin, async (req, res) => {
    try {
      const hours = await storage.initializeBusinessHours();
      res.json(hours);
    } catch (error) {
      console.error("Initialize business hours error:", error);
      res.status(500).json({ message: "Failed to initialize business hours" });
    }
  });

  app.patch("/api/business-hours/:dayOfWeek", authenticateAdmin, async (req, res) => {
    try {
      const dayOfWeek = parseInt(req.params.dayOfWeek);
      const { isOpen, openTime, cutoffTime } = req.body;
      
      const updated = await storage.updateBusinessHours(dayOfWeek, { isOpen, openTime, cutoffTime });
      res.json(updated);
    } catch (error) {
      console.error("Update business hours error:", error);
      res.status(400).json({ message: "Failed to update business hours" });
    }
  });

  // PPF Leads Routes
  app.get("/api/ppf-leads", authenticateAdmin, async (req, res) => {
    try {
      const leads = await storage.getAllPpfLeads();
      res.json(leads);
    } catch (error) {
      console.error("Get PPF leads error:", error);
      res.status(500).json({ message: "Failed to fetch PPF leads" });
    }
  });

  /**
   * Public: PPF / ceramic enquiry.
   *
   * ─────────────────────────────────────────────────────────────────────────────────
   * WHAT THIS USED TO BE. `const { name, email, ... } = req.body`, a truthiness check on
   * five fields, and straight into the database. No format validation, no length limits,
   * no rate limit, no bot protection. `insertPpfLeadSchema` was written for this route in
   * shared/schema.ts and never imported.
   *
   * That is the endpoint about to be pointed at from paid advertising. "test"/"a@b"/"1"
   * was a valid lead, a 10 MB string was a valid name, and a trivial script could fill
   * the table faster than staff could read it.
   *
   * WHY NOT insertPpfLeadSchema AS-IS. It is drizzle-zod generated from the column types,
   * so every field is just `string` — it would accept "not-an-email" as an email and
   * "abc" as a phone number, and impose no length bound. It is the right STARTING point
   * (it already omits id, createdAt and status, so those cannot be injected) and is
   * extended below with the checks that actually matter for a lead someone has to ring.
   * ─────────────────────────────────────────────────────────────────────────────────
   */
  const ppfLeadRequestSchema = insertPpfLeadSchema
    .extend({
      // Bounded on both ends. The lower bound rejects junk, the upper stops a crafted
      // request writing unbounded data into a varchar column.
      name: z.string().trim().min(2, "Please enter your name").max(120),
      email: z.string().trim().email("Please enter a valid email address").max(200),
      // Deliberately permissive about FORMAT and strict about CONTENT: customers type
      // "+91 98765 43210", "098765 43210" and "9876543210", all of which are the same
      // number and all of which staff can dial. Rejecting on punctuation would lose real
      // leads; requiring 10-15 actual digits rejects "1" and "abc".
      phone: z
        .string()
        .trim()
        .max(20)
        .refine((v) => (v.match(/\d/g) ?? []).length >= 10 && (v.match(/\d/g) ?? []).length <= 15, {
          message: "Please enter a valid phone number",
        }),
      // Enums, not free strings: these drive admin filtering, and an unrecognised value
      // would create a silent third category nobody is looking at.
      vehicleType: z.enum(["car", "bike"], { errorMap: () => ({ message: "Select car or bike" }) }),
      serviceInterest: z.enum(["ppf", "ceramic", "both"], {
        errorMap: () => ({ message: "Select a service" }),
      }),
      vehicleModel: z.string().trim().max(120).optional().nullable(),
      message: z.string().trim().max(2000).optional().nullable(),
      // Which FORM produced this. Not client-defined: an arbitrary value here would
      // pollute the only column that distinguishes the main form from the exit popup.
      source: z.enum(["landing_page", "exit_intent"]).optional(),
      /**
       * Honeypot. Rendered in the form, visually hidden, never focusable, and left empty
       * by every human. Bots fill inputs they can see in the DOM.
       *
       * Named "website" because that is a field name a naive form-filler will recognise
       * and populate. A field called "honeypot" defeats itself.
       */
      website: z.string().max(200).optional(),
    })
    // Unknown keys are dropped rather than rejected, so a future client sending an extra
    // field does not start failing against an older server.
    .passthrough();

  app.post(
    "/api/ppf-leads",
    /**
     * Rate limit.
     *
     * Five per ten minutes per address. A real customer submits once — occasionally
     * twice if they mistype an email — so this is far above genuine use and far below
     * what makes scripted submission worthwhile.
     *
     * NOTE: counters are per-process (see server/lib/rate-limit.ts). This deployment runs
     * one container, so the limit is the limit. Scaling out needs a shared store.
     */
    rateLimit({
      bucket: "ppf-leads",
      windowMs: 10 * 60_000,
      max: 5,
      message:
        "You've already sent us an enquiry. Our team will call you shortly — or reach us directly on +91 74066 19191.",
    }),
    async (req, res) => {
      try {
        const parsed = ppfLeadRequestSchema.safeParse(req.body);

        if (!parsed.success) {
          // Field-keyed errors so the form can mark the offending input rather than
          // showing one generic toast for eight possible causes.
          const fieldErrors: Record<string, string> = {};
          for (const issue of parsed.error.issues) {
            const key = issue.path.join(".") || "form";
            if (!fieldErrors[key]) fieldErrors[key] = issue.message;
          }
          return res.status(400).json({
            message: "Please check the highlighted fields and try again.",
            fieldErrors,
          });
        }

        const data = parsed.data;

        // Honeypot tripped. Respond exactly as if it succeeded: a bot that learns it was
        // detected adapts, and the response must be indistinguishable from the real one.
        // Nothing is written.
        if (data.website && data.website.trim() !== "") {
          console.warn(`[ppf-leads] honeypot tripped from ${req.ip} — discarded silently`);
          return res.json({ id: null, status: "new", createdAt: new Date().toISOString() });
        }

        // Attribution is validated separately and never fails the request: losing a lead
        // to a malformed marketing label would be the wrong trade.
        const attribution = parseAttribution(req.body);

        const lead = await storage.createPpfLead({
          name: data.name,
          email: data.email,
          phone: data.phone,
          vehicleType: data.vehicleType,
          serviceInterest: data.serviceInterest,
          vehicleModel: data.vehicleModel || null,
          message: data.message || null,
          source: data.source || "landing_page",
          channel: deriveSource(attribution),
          ...attribution,
        });

        console.log(
          `[ppf-leads] created ${lead.id} channel=${lead.channel} campaign=${lead.utmCampaign ?? "-"}`,
        );
        res.json(lead);
      } catch (error) {
        console.error("Create PPF lead error:", error);
        res.status(500).json({ message: "Failed to submit. Please try again or call us directly." });
      }
    },
  );

  app.patch("/api/ppf-leads/:id/status", authenticateAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      const lead = await storage.updatePpfLeadStatus(req.params.id, status);
      res.json(lead);
    } catch (error) {
      console.error("Update PPF lead status error:", error);
      res.status(400).json({ message: "Failed to update lead status" });
    }
  });

  app.delete("/api/ppf-leads/:id", authenticateAdmin, async (req, res) => {
    try {
      await storage.deletePpfLead(req.params.id);
      res.json({ message: "Lead deleted successfully" });
    } catch (error) {
      console.error("Delete PPF lead error:", error);
      res.status(500).json({ message: "Failed to delete lead" });
    }
  });

  // Time Slot Routes
  app.get("/api/services/:serviceId/slots/:date", async (req, res) => {
    try {
      const { serviceId, date } = req.params;
      const serviceDate = new Date(date);
      const slots = await storage.getServiceTimeSlots(serviceId, serviceDate);
      res.json(slots);
    } catch (error) {
      console.error("Get time slots error:", error);
      res.status(500).json({ message: "Failed to fetch time slots" });
    }
  });

  app.post("/api/services/:serviceId/slots", authenticateAdmin, async (req, res) => {
    try {
      const slotData = insertTimeSlotSchema.parse({
        ...req.body,
        serviceId: req.params.serviceId,
      });
      const slot = await storage.createTimeSlot(slotData);
      res.json(slot);
    } catch (error) {
      console.error("Create time slot error:", error);
      res.status(400).json({ message: "Invalid time slot data" });
    }
  });

  // Slot availability endpoint - returns bookable slots for a date, honouring
  // blackout dates, the configured business hours for that weekday, past times
  // (same-day) and per-slot capacity. This mirrors the validation in POST /api/bookings
  // so a customer never picks a slot that will be rejected after payment.
  app.get("/api/slot-availability/:serviceId/:date", async (req, res) => {
    try {
      const { serviceId, date } = req.params;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ message: "Invalid date format, expected YYYY-MM-DD" });
      }
      const service = await storage.getService(serviceId);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      const maxPerSlot = service.maxBookingsPerSlot || 3;

      const blackoutDates = await storage.getAllBlackoutDates();
      const blackout = blackoutDates.find((bd) => bd.date === date);

      const dayOfWeek = new Date(date + "T00:00:00").getDay();
      const hours = await storage.getBusinessHoursForDay(dayOfWeek);

      const { dateStr: todayIST, minutes: nowMinutes } = istNow(new Date());

      // booked counts only for the hours this weekday actually offers
      const candidateSlots = generateHourlySlots(hours ?? undefined);
      const bookedBySlot: Record<string, number> = {};
      for (const slotId of candidateSlots) {
        bookedBySlot[slotId] = await storage.getBookingCountForSlot(serviceId, date, slotId);
      }

      const result = computeAvailability({
        hours: hours ?? undefined,
        isBlackout: !!blackout,
        blackoutReason: blackout?.reason ?? null,
        isToday: date === todayIST,
        nowMinutes,
        maxPerSlot,
        bookedBySlot,
      });

      // Response keeps the legacy `availability`/`maxPerSlot` shape the existing frontend
      // reads, and adds `available`/`reason`/`slots` for the improved UI.
      res.json(result);
    } catch (error) {
      console.error("Slot availability error:", error);
      res.status(500).json({ message: "Failed to check slot availability" });
    }
  });

  // Booking Routes
  app.post(
    "/api/bookings",
    /**
     * Rate limit on the booking endpoint.
     *
     * Higher than the lead form because this is a multi-step flow a customer legitimately
     * retries: a failed payment, a slot that filled while they were typing, a browser
     * back-and-resubmit. Ten in ten minutes never blocks a real customer and still stops
     * a script from creating bookings in bulk — each of which holds slot capacity, sends
     * a WhatsApp message and triggers an ERP sync.
     */
    rateLimit({
      bucket: "bookings",
      windowMs: 10 * 60_000,
      max: 10,
      message:
        "Too many booking attempts. Please wait a moment, or call us on +91 74066 19191 and we'll book you in.",
    }),
    async (req, res) => {
    try {
      console.log("Booking request body:", req.body);

      // Parse booking data with extended schema to include amount and appointment fields
      const extendedBookingSchema = bookingFormSchema.extend({
        amount: z.number().optional(),
        isBookingFee: z.boolean().optional(),
        appointmentDate: z.string().optional(),
        appointmentTime: z.string().optional(),
      });

      const bookingData = extendedBookingSchema.parse(req.body);

      // Campaign attribution. Validated separately from the booking body and never able
      // to fail the request — a malformed marketing label must not cost a sale. `source`
      // is derived here rather than read from the body, so what reporting groups by
      // cannot be set by the browser. See server/lib/attribution.ts.
      const attribution = parseAttribution(req.body);
      const attributionSource = deriveSource(attribution);
      
      // Check if appointment date is a blackout date
      if (bookingData.appointmentDate) {
        const blackoutDates = await storage.getAllBlackoutDates();
        const isBlackout = blackoutDates.some(bd => bd.date === bookingData.appointmentDate);
        
        if (isBlackout) {
          const blackoutDate = blackoutDates.find(bd => bd.date === bookingData.appointmentDate);
          return res.status(400).json({ 
            message: `Booking not available for this day – ${blackoutDate?.reason}. Please choose another date before or after.` 
          });
        }
      }

      // Check business hours and cutoff time
      if (bookingData.appointmentDate && bookingData.appointmentTime) {
        const appointmentDay = new Date(bookingData.appointmentDate + 'T00:00:00').getDay();
        const businessHours = await storage.getBusinessHoursForDay(appointmentDay);
        
        if (businessHours) {
          // Check if the store is open on this day
          if (!businessHours.isOpen) {
            return res.status(400).json({ 
              message: `Sorry, we are closed on ${businessHours.dayName}. Please select another day.` 
            });
          }
          
          // Check if booking time is after cutoff
          const bookingTime = bookingData.appointmentTime;
          const cutoffTime = businessHours.cutoffTime;
          
          if (bookingTime > cutoffTime) {
            return res.status(400).json({ 
              message: `Bookings after ${cutoffTime.replace(':', ':')} are not available on ${businessHours.dayName}. Please select an earlier time slot.` 
            });
          }
          
          // Check if booking time is before opening
          const openTime = businessHours.openTime;
          if (bookingTime < openTime) {
            return res.status(400).json({ 
              message: `We open at ${openTime} on ${businessHours.dayName}. Please select a later time slot.` 
            });
          }
        }
      }
      
      // Get service details
      const service = await storage.getService(bookingData.serviceId);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      if (!service.isActive) {
        return res.status(400).json({ message: "This service is not currently available for booking." });
      }

      // Validate: prevent booking past time slots for today
      if (bookingData.appointmentDate && bookingData.appointmentTime) {
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istNow = new Date(now.getTime() + istOffset);
        const todayIST = istNow.toISOString().split('T')[0];
        
        if (bookingData.appointmentDate === todayIST) {
          const currentHour = istNow.getUTCHours();
          const currentMinute = istNow.getUTCMinutes();
          const [slotHour, slotMinute] = bookingData.appointmentTime.split(':').map(Number);
          
          if (slotHour < currentHour || (slotHour === currentHour && slotMinute <= currentMinute)) {
            return res.status(400).json({ 
              message: "This time slot has already passed. Please select a future time slot." 
            });
          }
        }
      }

      // Validate: check max bookings per slot limit
      if (bookingData.appointmentDate && bookingData.timeSlotId) {
        const maxPerSlot = service.maxBookingsPerSlot || 3;
        const currentCount = await storage.getBookingCountForSlot(
          bookingData.serviceId, 
          bookingData.appointmentDate, 
          bookingData.timeSlotId
        );
        
        if (currentCount >= maxPerSlot) {
          return res.status(400).json({ 
            message: `This time slot is fully booked (max ${maxPerSlot} bookings). Please select a different time slot.` 
          });
        }
      }

      // ---------------------------------------------------------------------------
      // AUTHORITATIVE PAYABLE AMOUNT — server-side only.
      //
      // This used to be seeded from the request body:
      //
      //     let bookingFeeAmount = bookingData.amount || 299;
      //
      // For the Annual Maintenance Package and for the normal path that value was then
      // overwritten from the database, so it was usually harmless. But the override was
      // CONDITIONAL: if the `booking_amount` setting row was missing, its value was empty,
      // or the read threw (the catch below logs and continues), the client's number
      // survived — and it is this variable that becomes the Razorpay order amount in
      // createPaymentOrder() and the stored `bookings.amount`. An admin can delete a
      // setting via DELETE /api/settings/:key, so that state was reachable without any
      // code change, and a crafted request could then have paid ₹1.
      //
      // The seed is now a server-side constant. `bookingData.amount` is still accepted by
      // the schema (so existing clients keep validating) but is NEVER read for pricing.
      // Precedence, all server-side:
      //   1. Annual Maintenance Package -> services.price
      //   2. otherwise                  -> site_settings.booking_amount
      //   3. neither available          -> DEFAULT_BOOKING_FEE below
      // ---------------------------------------------------------------------------
      // Read the configured fee. A failed read becomes null, never a price: an outage must
      // not be able to change what a customer is charged.
      let bookingAmountSettingValue: string | null = null;
      if (service.slug !== FULL_PRICE_SLUG) {
        try {
          const bookingAmountSetting = await storage.getSetting("booking_amount");
          bookingAmountSettingValue = bookingAmountSetting?.value ?? null;
        } catch (error) {
          console.log("Using default booking amount due to setting fetch error:", error);
          bookingAmountSettingValue = null;
        }
      }

      // Free-booking offer window. Same rule as the fee: a failed read becomes null, which
      // means "not free" — an outage must never be able to give the catalogue away.
      let freeBookingUntilValue: string | null = null;
      try {
        const freeSetting = await storage.getSetting("free_booking_until");
        freeBookingUntilValue = freeSetting?.value ?? null;
      } catch (error) {
        console.log("free_booking_until unreadable; charging normally:", error);
        freeBookingUntilValue = null;
      }

      // Campaign offer state for THIS service. Read failures become "no campaign", never
      // "free": an outage must not be able to give the catalogue away, exactly as the
      // legacy setting above already guarantees.
      let campaignFree = false;
      let activeCampaign: CampaignRecord | null = null;
      try {
        const all = (await storage.getAllCampaigns()) as unknown as CampaignRecord[];
        const result = campaignFreeBookingForService(all, service.slug);
        campaignFree = result.free;
        activeCampaign = result.campaign;
      } catch (error) {
        console.log("campaign read failed; charging normally:", error);
      }

      const resolvedAmount = resolveBookingAmount({
        serviceSlug: service.slug,
        servicePrice: service.price,
        bookingAmountSetting: bookingAmountSettingValue,
        freeBookingUntil: freeBookingUntilValue,
        campaignFreeBooking: campaignFree,
      });

      /**
       * Campaign snapshot written onto every booking.
       *
       * `campaignIdentifier` is a COPY, not a join. An admin renaming or deleting this
       * campaign next month must not change the answer to "which advertisement produced
       * this booking" for a booking taken today.
       */
      const campaignSnapshot = {
        campaignId: activeCampaign?.id ?? null,
        campaignIdentifier: activeCampaign?.identifier ?? null,
        vehicleType: activeCampaign?.vehicleType === "both" ? null : activeCampaign?.vehicleType ?? null,
      };
      const bookingFeeAmount = resolvedAmount.amount;
      console.log(
        `💰 Authoritative amount ₹${bookingFeeAmount} (source: ${resolvedAmount.source}) for ${service.slug}`,
      );

      // Observability only — never pricing. A mismatch means the client displayed a
      // different figure to the one being charged, which is worth seeing in the logs.
      if (
        typeof bookingData.amount === "number" &&
        Math.round(bookingData.amount * 100) !== Math.round(bookingFeeAmount * 100)
      ) {
        console.warn(
          `⚠️  Client-supplied amount ${bookingData.amount} ignored; ` +
            `server authority charged ${bookingFeeAmount} for service ${service.slug}.`,
        );
      }
      
      // ---------------------------------------------------------------- free booking
      //
      // While the offer window is open nothing is charged online, so Razorpay is not
      // involved at all — no order, no signature, no webhook. The booking is confirmed
      // the moment it is created and the customer is notified immediately, which is the
      // whole point of the offer: name, number, email, date and slot, and they are booked.
      //
      // This sits BEFORE the Razorpay configuration check on purpose. A free booking has
      // no payment to configure, so a missing key must not block it.
      //
      // paymentStatus is "free", deliberately not "paid": admin sums revenue from "paid"
      // rows, and recording ₹0 bookings as paid would inflate the revenue figure with
      // money nobody sent. It is also not "pending" — nothing is owed online, so these
      // must not sit in the queue of payments to chase.
      if (resolvedAmount.amount === 0) {
        const freeValues = {
          serviceId: bookingData.serviceId,
          timeSlotId: bookingData.timeSlotId,
          appointmentDate: bookingData.appointmentDate,
          appointmentTime: bookingData.appointmentTime,
          customerName: bookingData.customerName,
          customerEmail: bookingData.customerEmail,
          customerPhone: bookingData.customerPhone,
          amount: "0.00",
          razorpayOrderId: null,
          paymentStatus: "free",
          ...campaignSnapshot,
          // Attribution + the customer-facing confirmation credential. Applied to every
          // insert path (free, dev and paid) so no route can create a booking that the
          // customer cannot open or that reporting cannot attribute.
          source: attributionSource,
          ...attribution,
          confirmationToken: generateConfirmationToken(),
        };

        let freeBooking;
        try {
          // Same atomic capacity guard as the paid path. A free slot is still a real slot
          // and two simultaneous requests must not both take the last one.
          freeBooking = (bookingData.appointmentDate && bookingData.timeSlotId)
            ? await storage.createBookingWithCapacity(freeValues, {
                serviceId: bookingData.serviceId,
                date: bookingData.appointmentDate,
                timeSlotId: bookingData.timeSlotId,
                maxPerSlot: service.maxBookingsPerSlot || 3,
              })
            : await storage.createBooking(freeValues);
        } catch (err) {
          if (err instanceof SlotFullError) {
            return res.status(409).json({ message: err.message + " Please select a different time slot." });
          }
          throw err;
        }

        console.log(`🎁 Free booking ${freeBooking.id} created (offer window open, ₹0 charged)`);

        let whatsappSent = false;
        try {
          const waResult = await whatsappService.sendBookingConfirmation(
            freeBooking.customerPhone,
            freeBooking.customerName,
            service.title,
            freeBooking.appointmentDate || new Date().toLocaleDateString(),
            freeBooking.appointmentTime || "10:00 AM",
            "0",
          );
          whatsappSent = waResult.success;
          await storage.updateBooking(freeBooking.id, {
            whatsappSent,
            customerWhatsappMessageId: waResult.messageId ?? null,
          });
        } catch (error) {
          // A notification failure must not undo a confirmed booking. The row already
          // exists and the slot is held; the studio can still see it in admin.
          console.error("Free booking created but WhatsApp failed:", error);
        }

        // Same treatment as a confirmed payment: the booking is real, so ERP gets it.
        const erpSync = await syncBookingToErp(freeBooking.id);

        return res.json({
          booking: await storage.getBooking(freeBooking.id),
          // The customer-facing confirmation URL. Returned explicitly so the client has a
          // stable contract and does not have to know it lives on the booking row.
          confirmationToken: freeBooking.confirmationToken,
          freeBooking: true,
          amount: 0,
          whatsappSent,
          erpSync,
          message: "Booking confirmed. No payment required during the free booking offer.",
          success: true,
        });
      }

      // Check if payment service is configured
      const razorpayConfigured = !!(process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_TEST_KEY_ID);

      // In production a missing Razorpay credential must STOP order creation. Previously it
      // silently fell through to the development path, creating a `dev_order_` booking marked
      // "completed" without any payment being taken — a booking on 2026-07-31 did exactly that.
      if (!razorpayConfigured && process.env.NODE_ENV === "production") {
        console.error(
          "❌ Razorpay is not configured in production — refusing to create a booking. " +
            "Set RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET in the deployment environment."
        );
        return res.status(503).json({
          message:
            "Online payment is temporarily unavailable. Please try again shortly or contact us.",
        });
      }

      if (!razorpayConfigured) {
        // Development only (NODE_ENV !== "production"): create booking without payment.
        const booking = await storage.createBooking({
          serviceId: bookingData.serviceId,
          timeSlotId: bookingData.timeSlotId,
          appointmentDate: bookingData.appointmentDate,
          appointmentTime: bookingData.appointmentTime,
          customerName: bookingData.customerName,
          customerEmail: bookingData.customerEmail,
          customerPhone: bookingData.customerPhone,
          amount: bookingFeeAmount.toString(),
          razorpayOrderId: `dev_order_${Date.now()}`,
          paymentStatus: "completed", // Skip payment for development
          ...campaignSnapshot,
          source: attributionSource,
          ...attribution,
          confirmationToken: generateConfirmationToken(),
        });

        // Skip marking time slot as unavailable - using static time slots

        // ERP sync is deliberately NOT triggered here. Creating an ERP Appointment before
        // payment produced appointments for unpaid bookings; it now happens only once the
        // payment is confirmed paid (see syncBookingToErp).
        await storage.updateBooking(booking.id, { erpSyncStatus: "pending" });

        return res.json({
          booking,
          confirmationToken: booking.confirmationToken,
          paymentOrder: {
            id: `dev_order_${Date.now()}`,
            amount: bookingFeeAmount * 100, // Convert to paisa
            currency: "INR",
            key: "dev_key",
          },
          message: "Development mode: Booking created without payment"
        });
      }
      
      // Create Razorpay order with booking fee
      const paymentOrder = await createPaymentOrder(
        bookingFeeAmount,
        `booking_${Date.now()}`
      );

      // Create booking with pending payment. When we have a slot, use the atomic
      // capacity-guarded insert so two simultaneous requests can't both take the last
      // space (the pre-check above is a fast UX fail; this is the authoritative guard).
      const bookingValues = {
        serviceId: bookingData.serviceId,
        timeSlotId: bookingData.timeSlotId,
        appointmentDate: bookingData.appointmentDate,
        appointmentTime: bookingData.appointmentTime,
        customerName: bookingData.customerName,
        customerEmail: bookingData.customerEmail,
        customerPhone: bookingData.customerPhone,
        amount: bookingFeeAmount.toString(),
        razorpayOrderId: paymentOrder.id,
        paymentStatus: "pending",
        ...campaignSnapshot,
        source: attributionSource,
        ...attribution,
        confirmationToken: generateConfirmationToken(),
      };

      let booking;
      try {
        booking = (bookingData.appointmentDate && bookingData.timeSlotId)
          ? await storage.createBookingWithCapacity(bookingValues, {
              serviceId: bookingData.serviceId,
              date: bookingData.appointmentDate,
              timeSlotId: bookingData.timeSlotId,
              maxPerSlot: service.maxBookingsPerSlot || 3,
            })
          : await storage.createBooking(bookingValues);
      } catch (err) {
        if (err instanceof SlotFullError) {
          return res.status(409).json({ message: err.message + " Please select a different time slot." });
        }
        throw err;
      }

      // Skip marking time slot as unavailable - using static time slots

      // ERP sync is deliberately NOT triggered here — only after payment is confirmed paid.
      await storage.updateBooking(booking.id, { erpSyncStatus: "pending" });

      res.json({
        booking,
        confirmationToken: booking.confirmationToken,
        paymentOrder: {
          id: paymentOrder.id,
          amount: paymentOrder.amount,
          currency: paymentOrder.currency,
          key: process.env.VITE_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
        },
      });
    } catch (error) {
      console.error("Create booking error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`)
        });
      }
      res.status(400).json({ message: "Invalid booking data" });
    }
  },
  );

  // Payment confirmation endpoint (called by frontend after successful payment)
  app.post("/api/confirm-payment", async (req, res) => {
    try {
      console.log("🔄 Payment confirmation called at", new Date().toISOString());
      console.log("📦 Payment payload:", req.body);
      
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        console.error("Missing required payment fields");
        return res.status(400).json({ message: "Missing required payment fields" });
      }

      // Verify payment signature
      const isValid = await verifyPaymentSignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );

      console.log("Payment signature verification:", isValid);
      if (!isValid) {
        return res.status(400).json({ message: "Invalid payment signature" });
      }

      // Find the booking by its Razorpay order id.
      //
      // This previously scanned getBookingsByStatus("pending") — which filters on
      // paymentStatus — and matched razorpayOrderId within that list. That created a race:
      // Razorpay's server-to-server webhook and the customer's browser both confirm the
      // same payment, and whichever arrives first sets paymentStatus to "paid". If the
      // WEBHOOK won, the booking was no longer "pending", the browser's lookup missed it,
      // and this endpoint returned 404 for a payment that had in fact succeeded. The
      // browser then retried five times, gave up, and showed the degraded
      // "Payment Successful!" toast — and, because the purchase conversion only fires on
      // an ok response, that sale was never reported to Google Ads.
      //
      // It also meant the `alreadyPaid` branch below was unreachable: a booking found in
      // the "pending" list is pending by definition.
      //
      // Looking up by order id directly makes the endpoint idempotent instead of
      // order-dependent. getBookingByPaymentOrderId already existed and is what the
      // webhook route uses, so both paths now resolve the same row the same way.
      console.log("🔍 Looking for booking with order ID:", razorpay_order_id);
      const booking = await storage.getBookingByPaymentOrderId(razorpay_order_id);

      if (!booking) {
        console.error("❌ Booking not found for order ID:", razorpay_order_id);
        return res.status(404).json({ message: "Booking not found" });
      }
      
      console.log("✅ Found booking:", booking.id, "for customer:", booking.customerName);

      // Idempotency: if the Razorpay server webhook already confirmed this booking, do not
      // re-send the customer's WhatsApp. Still reconcile ERP, which is itself idempotent.
      const alreadyPaid = booking.paymentStatus === "paid";
      if (alreadyPaid) {
        console.log(`ℹ️  Booking ${booking.id} already marked paid — skipping duplicate notification`);
      }

      // Update booking status
      console.log("💳 Updating booking status to paid...");
      const updatedBooking = await storage.updateBooking(booking.id, {
        paymentId: razorpay_payment_id,
        paymentStatus: "paid",
        paymentVerifiedAt: booking.paymentVerifiedAt ?? new Date(),
      });
      console.log("✅ Booking status updated successfully");

      // Get service and time slot details for notifications
      const service = await storage.getService(booking.serviceId);
      const timeSlot = await storage.getTimeSlot(booking.timeSlotId);

      let whatsappSent = booking.whatsappSent ?? false;
      if (service && !alreadyPaid) {
        // Send WhatsApp confirmation using the proper service
        console.log("📱 Sending WhatsApp confirmation...");

        const waResult = await whatsappService.sendBookingConfirmation(
          booking.customerPhone,
          booking.customerName,
          service.title,
          booking.appointmentDate || new Date().toLocaleDateString(),
          booking.appointmentTime || "10:00 AM",
          booking.amount.toString()
        );
        whatsappSent = waResult.success;
        console.log(
          `📱 WhatsApp result: success=${waResult.success} messageId=${waResult.messageId ?? "(none)"}`
        );

        // Send email confirmation (if email service is configured)
        let emailSent = false;
        try {
          // Email service would go here if configured
          console.log("📧 Email service not configured, skipping email notification");
        } catch (error) {
          console.log("📧 Email service error:", error);
        }

        // Update notification status
        await storage.updateBooking(booking.id, {
          whatsappSent,
          emailSent,
          customerWhatsappMessageId: waResult.messageId ?? null,
        });
      }

      // Push to n8n -> ERPNext. Idempotent, and never throws.
      const erpSync = await syncBookingToErp(booking.id);

      console.log(`🎉 Payment confirmation complete! erpSync=${erpSync.status}`);
      // The payment result and the ERP result are reported separately: a failed ERP sync must
      // not present as a failed payment, and a successful payment must not imply ERP succeeded.
      res.json({
        message: "Payment confirmed",
        booking: await storage.getBooking(booking.id),
        // Where to send the customer next. Read from the row rather than regenerated, so
        // a retry of this endpoint returns the SAME confirmation URL — the retry loop in
        // booking-modal.tsx can call this up to five times, and a fresh token each time
        // would invalidate the link the customer may already be looking at.
        confirmationToken: booking.confirmationToken,
        whatsappSent,
        paymentStatus: "paid",
        erpSync,
        // True when the Razorpay webhook had already marked this booking paid before the
        // browser got here. The response is still a success — the payment is verified and
        // the booking is confirmed — but no duplicate WhatsApp was sent. The client uses
        // this only for logging; the purchase conversion fires in both cases, deduplicated
        // client-side by razorpay_payment_id.
        alreadyConfirmed: alreadyPaid,
        success: true
      });
    } catch (error) {
      console.error("Payment webhook error:", error);
      res.status(500).json({ message: "Payment processing failed" });
    }
  });

  app.get("/api/bookings", authenticateAdmin, async (req, res) => {
    try {
      const bookings = await storage.getAllBookings();
      res.json(bookings);
    } catch (error) {
      console.error("Get bookings error:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get("/api/bookings/:id", authenticateAdmin, async (req, res) => {
    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      console.error("Get booking error:", error);
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  // Admin: full booking detail (booking row + its service) for the View modal.
  app.get("/api/admin/bookings/:id", authenticateAdmin, async (req, res) => {
    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) return res.status(404).json({ message: "Booking not found" });
      const service = await storage.getService(booking.serviceId);
      res.json({ ...booking, service: service ?? null });
    } catch (error) {
      console.error("Get admin booking error:", error);
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  // Admin: edit operational fields only. Payment/ERP/audit fields are NOT editable here.
  app.patch("/api/admin/bookings/:id", authenticateAdmin, async (req, res) => {
    try {
      const editableSchema = z.object({
        customerName: z.string().min(1).max(120).optional(),
        customerPhone: z.string().min(6).max(20).optional(),
        customerEmail: z.string().email().optional(),
        serviceId: z.string().uuid().optional(),
        appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        appointmentTime: z.string().regex(/^\d{1,2}:\d{2}$/).optional(),
        timeSlotId: z.string().min(1).max(20).optional(),
        bookingStatus: z.enum(["pending", "confirmed", "completed", "cancelled"]).optional(),
      }).strict();

      const patch = editableSchema.parse(req.body);

      const existing = await storage.getBooking(req.params.id);
      if (!existing) return res.status(404).json({ message: "Booking not found" });

      // Reject any attempt to touch protected fields, even if the client sent them.
      const PROTECTED = ["paymentId", "razorpayOrderId", "amount", "paymentStatus",
        "erpDocumentId", "erpDocumentType", "erpSyncStatus", "erpSyncAttempts",
        "erpSyncError", "erpSyncedAt", "n8nExecutionId", "paymentVerifiedAt"];
      const attempted = PROTECTED.filter((k) => k in (req.body ?? {}));
      if (attempted.length) {
        return res.status(400).json({ message: `These fields cannot be edited here: ${attempted.join(", ")}` });
      }

      // If date/time/service is changing, re-validate the slot against live config.
      const newDate = patch.appointmentDate ?? existing.appointmentDate ?? undefined;
      const newTime = patch.appointmentTime ?? existing.appointmentTime ?? undefined;
      const newSlot = patch.timeSlotId ?? existing.timeSlotId ?? undefined;
      const newServiceId = patch.serviceId ?? existing.serviceId;
      const changingSchedule = patch.appointmentDate || patch.appointmentTime || patch.timeSlotId || patch.serviceId;

      if (changingSchedule && newDate && newTime && newSlot) {
        const service = await storage.getService(newServiceId);
        if (!service) return res.status(400).json({ message: "Service not found" });
        const check = await validateAppointmentSlot(storage, {
          serviceId: newServiceId, date: newDate, time: newTime,
          timeSlotId: newSlot, maxPerSlot: service.maxBookingsPerSlot || 3,
        });
        // Allow keeping the same slot even if "full" (this booking already occupies it),
        // only block genuinely invalid dates/hours or a full DIFFERENT slot.
        const movedSlot = newSlot !== existing.timeSlotId || newDate !== existing.appointmentDate || newServiceId !== existing.serviceId;
        if (!check.ok && !(check.reason === "full" && !movedSlot)) {
          return res.status(check.status).json({ message: check.message, reason: check.reason });
        }
      }

      const updated = await storage.updateBooking(req.params.id, patch);
      const adminId = (req as any).admin?.id;
      console.log(`Admin ${adminId} edited booking ${req.params.id}: ${Object.keys(patch).join(", ")}`);
      const service = await storage.getService(updated.serviceId);
      res.json({ ...updated, service: service ?? null });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.issues.map(i => `${i.path.join(".")}: ${i.message}`) });
      }
      console.error("Edit booking error:", error);
      res.status(500).json({ message: "Failed to update booking" });
    }
  });

  app.post("/api/bookings/:id/send-whatsapp", authenticateAdmin, async (req, res) => {
    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const service = await storage.getService(booking.serviceId);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      // Send WhatsApp notification.
      // (Previously passed a single object to a positional-argument function, so this route
      //  could never have worked — TS2554 in the baseline typecheck confirmed it.)
      const waResult = await whatsappService.sendBookingConfirmation(
        booking.customerPhone,
        booking.customerName,
        service.title,
        booking.appointmentDate || new Date().toLocaleDateString(),
        booking.appointmentTime || booking.timeSlotId,
        booking.amount.toString()
      );

      if (waResult.success) {
        await storage.updateBooking(booking.id, {
          whatsappSent: true,
          customerWhatsappMessageId: waResult.messageId ?? null,
        });
        res.json({
          message: "WhatsApp notification sent successfully",
          messageId: waResult.messageId,
        });
      } else {
        res.status(500).json({
          message: "Failed to send WhatsApp notification",
          error: waResult.error,
        });
      }
    } catch (error) {
      console.error("Send WhatsApp error:", error);
      res.status(500).json({ message: "Failed to send WhatsApp notification" });
    }
  });

  // WhatsApp Business API Routes
  app.get("/api/whatsapp/config", authenticateAdmin, async (req, res) => {
    try {
      const config = await whatsappService.getConfig();
      if (!config) {
        return res.json(null);
      }
      // Don't expose sensitive data
      res.json({
        id: config.id,
        phoneNumberId: config.phoneNumberId,
        businessAccountId: config.businessAccountId,
        isActive: config.isActive,
        createdAt: config.createdAt,
      });
    } catch (error) {
      console.error("Get WhatsApp config error:", error);
      res.status(500).json({ message: "Failed to fetch WhatsApp configuration" });
    }
  });

  app.post("/api/whatsapp/config", authenticateAdmin, async (req, res) => {
    try {
      const configData = whatsappConfigSchema.parse(req.body);
      const config = await whatsappService.saveConfig(configData);
      res.json({
        id: config.id,
        phoneNumberId: config.phoneNumberId,
        businessAccountId: config.businessAccountId,
        isActive: config.isActive,
        createdAt: config.createdAt,
      });
    } catch (error) {
      console.error("Save WhatsApp config error:", error);
      res.status(400).json({ message: "Invalid WhatsApp configuration data" });
    }
  });

  app.get("/api/whatsapp/templates", authenticateAdmin, async (req, res) => {
    try {
      const templates = await whatsappService.getTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Get WhatsApp templates error:", error);
      res.status(500).json({ message: "Failed to fetch WhatsApp templates" });
    }
  });

  app.post("/api/whatsapp/templates/fetch", authenticateAdmin, async (req, res) => {
    try {
      const templates = await whatsappService.fetchTemplatesFromMeta();
      res.json(templates);
    } catch (error) {
      console.error("Fetch WhatsApp templates error:", error);
      res.status(500).json({ message: "Failed to fetch templates from Meta API" });
    }
  });

  // Test route for debugging payment flow
  app.post("/api/test-payment", async (req, res) => {
    try {
      console.log("Test payment called with:", req.body);
      res.json({ status: "success", message: "Test payment endpoint working" });
    } catch (error) {
      console.error("Test payment error:", error);
      res.status(500).json({ message: "Test payment failed" });
    }
  });

  // Test payment confirmation manually (for debugging)
  app.post("/api/test-payment-confirmation", async (req, res) => {
    try {
      const { bookingId } = req.body;
      
      if (!bookingId) {
        return res.status(400).json({ message: "Booking ID required" });
      }
      
      console.log("🧪 Testing payment confirmation for booking:", bookingId);
      
      // Get the booking
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Update to paid status
      await storage.updateBooking(bookingId, {
        paymentStatus: "paid",
        paymentId: `test_${Date.now()}`
      });
      
      // Get service for WhatsApp
      const service = await storage.getService(booking.serviceId);
      if (service) {
        const waResult = await whatsappService.sendBookingConfirmation(
          booking.customerPhone,
          booking.customerName,
          service.title,
          booking.appointmentDate || new Date().toLocaleDateString(),
          booking.appointmentTime || "10:00 AM",
          booking.amount.toString()
        );

        console.log(
          `🧪 Test WhatsApp result: success=${waResult.success} messageId=${waResult.messageId ?? "(none)"}`
        );

        res.json({
          success: true,
          message: "Test payment confirmation complete",
          whatsappSent: waResult.success,
          whatsappMessageId: waResult.messageId,
          booking: booking
        });
      } else {
        res.json({ success: false, message: "Service not found" });
      }
    } catch (error) {
      console.error("Test payment confirmation error:", error);
      res.status(500).json({ message: "Test failed" });
    }
  });

  // Razorpay Webhook for payment confirmations
  app.post("/api/razorpay-webhook", express.raw({ type: 'application/json' }), async (req, res) => {
    try {
      const webhookSignature = req.headers['x-razorpay-signature'] as string;
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

      // FAIL CLOSED. Previously a missing secret skipped verification entirely, which let
      // anyone forge a payment event. No secret => the endpoint is disabled, not open.
      if (!webhookSecret) {
        console.error(
          "❌ RAZORPAY_WEBHOOK_SECRET is not configured — rejecting webhook. " +
            "Set the secret in the deployment environment to enable server-side confirmation."
        );
        return res.status(503).json({ message: "Webhook not configured" });
      }

      if (!webhookSignature) {
        console.error("❌ Razorpay webhook rejected: missing x-razorpay-signature header");
        return res.status(400).json({ message: "Missing signature" });
      }

      // Razorpay signs the exact bytes it sent, so the HMAC must run over the raw buffer
      // captured by the express.json() verify hook in index.ts — NOT over req.body, which
      // the global parser has already turned into an object.
      const rawBody: Buffer | undefined = (req as any).rawBody;
      if (!rawBody || !Buffer.isBuffer(rawBody)) {
        console.error(
          "❌ Razorpay webhook: raw body unavailable — cannot verify signature. " +
            "The express.json() verify hook in server/index.ts must be present."
        );
        return res.status(500).json({ message: "Cannot verify signature" });
      }

      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      // Constant-time compare; never log the secret or the full signature.
      const expectedBuf = Buffer.from(expectedSignature, "utf8");
      const receivedBuf = Buffer.from(webhookSignature, "utf8");
      const signatureValid =
        expectedBuf.length === receivedBuf.length &&
        crypto.timingSafeEqual(expectedBuf, receivedBuf);

      if (!signatureValid) {
        console.error("❌ Razorpay webhook rejected: invalid signature");
        return res.status(400).json({ message: "Invalid signature" });
      }

      const event = JSON.parse(rawBody.toString("utf8"));
      console.log("Razorpay webhook event:", event.event);

      // Handle payment success events
      if (event.event === "payment.captured" || event.event === "payment.authorized") {
        const payment = event.payload.payment.entity;
        const orderId = payment.order_id;

        // Find booking by Razorpay order ID
        const booking = await storage.getBookingByPaymentOrderId(orderId);

        if (!booking) {
          // Unknown order: ack so Razorpay stops retrying an event we can never satisfy.
          console.warn(`⚠️  Razorpay webhook: no booking for order ${orderId}`);
          return res.status(200).json({ received: true, matched: false });
        }

        // Correct schema fields: the column is `paymentStatus`, not `status`.
        // Idempotent: a replayed webhook re-runs ERP reconciliation but does not re-pay.
        if (booking.paymentStatus !== "paid") {
          await storage.updateBooking(booking.id, {
            paymentStatus: "paid",
            paymentId: payment.id,
            paymentVerifiedAt: new Date(),
          });
          console.log(`✅ Booking ${booking.id} marked as paid via Razorpay webhook`);
        } else {
          console.log(`ℹ️  Booking ${booking.id} already paid — webhook replay, no change`);
        }

        // Complete ERP sync server-side so it no longer depends on the customer's browser
        // returning to /api/confirm-payment. syncBookingToErp is idempotent.
        const erpSync = await syncBookingToErp(booking.id);
        console.log(`   erpSync=${erpSync.status} for booking=${booking.id}`);

        return res.status(200).json({ received: true, matched: true, erpSync });
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error("Webhook processing error:", error);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  // Contact form submission route
  const contactFormSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(10),
    subject: z.string().min(5),
    message: z.string().min(10),
  });

  app.post("/api/contact", async (req, res) => {
    try {
      const contactData = contactFormSchema.parse(req.body);
      
      // Store contact submission (you can add a contacts table if needed)
      console.log("Contact form submission:", contactData);
      
      // For now, we'll just log the contact form submission
      // In a real application, you would:
      // 1. Store it in database
      // 2. Send email notification to admin
      // 3. Send auto-reply to customer
      
      res.json({ message: "Contact form submitted successfully" });
    } catch (error) {
      console.error("Contact form error:", error);
      res.status(400).json({ message: "Invalid contact form data" });
    }
  });

  // Test WhatsApp endpoint - send actual booking confirmation
  app.post("/api/test-whatsapp", async (req, res) => {
    try {
      const { to, customerName, serviceName, appointmentDate, appointmentTime, bookingAmount } = req.body;
      
      console.log("Sending booking confirmation WhatsApp message to:", to);
      
      const config = await whatsappService.getConfig();
      if (!config) {
        return res.status(500).json({ success: false, message: "WhatsApp not configured" });
      }

      // Use the booking reminder template
      const bookingMessage = {
        messaging_product: "whatsapp",
        to: to.replace(/^\+/, ""),
        type: "template",
        template: {
          name: "p91_booking_reminder",
          language: {
            code: "en"
          },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: customerName || "Jagpreet" },
                { type: "text", text: serviceName || "Headlight Restoration - Both Lights" },
                { type: "text", text: `${appointmentDate || "August 2, 2025"} at ${appointmentTime || "11:00 AM"}` }
              ]
            }
          ]
        }
      };

      console.log("Sending booking confirmation:", JSON.stringify(bookingMessage, null, 2));

      const response = await fetch(
        `https://graph.facebook.com/v18.0/${config.phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(bookingMessage),
        }
      );

      const result = await response.json();
      console.log("WhatsApp API response:", result);

      if (response.ok) {
        console.log("Booking confirmation sent successfully to:", to);
        res.json({ 
          success: true, 
          message: `Booking confirmation sent to ${to}`,
          details: {
            customerName: customerName || "Jagpreet",
            serviceName: serviceName || "Headlight Restoration - Both Lights",
            appointmentDate: appointmentDate || "August 2, 2025",
            appointmentTime: appointmentTime || "11:00 AM",
            bookingAmount: `₹${bookingAmount || "299"}`
          },
          whatsappResponse: result
        });
      } else {
        console.log("Failed to send booking confirmation:", result);
        res.status(500).json({ 
          success: false, 
          message: "Failed to send booking confirmation",
          error: result
        });
      }
    } catch (error) {
      console.error("Booking confirmation error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Error sending booking confirmation",
        error: error.message 
      });
    }
  });

  // Manual payment status update for debugging (Admin only)
  app.post("/api/admin/bookings/:id/mark-paid", authenticateAdmin, async (req, res) => {
    try {
      const bookingId = req.params.id;
      const { paymentId } = req.body;
      
      console.log("🔧 Manual payment status update for booking:", bookingId);
      
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Update booking status manually
      const updatedBooking = await storage.updateBooking(bookingId, {
        paymentId: paymentId || `manual_${Date.now()}`,
        paymentStatus: "paid",
      });
      
      // Get service details for notifications
      const service = await storage.getService(booking.serviceId);
      
      if (service) {
        // Send WhatsApp confirmation
        const waResult = await whatsappService.sendBookingConfirmation(
          booking.customerPhone,
          booking.customerName,
          service.title,
          booking.appointmentDate || new Date().toLocaleDateString(),
          booking.appointmentTime || "10:00 AM",
          booking.amount
        );

        // Update notification status
        await storage.updateBooking(bookingId, {
          whatsappSent: waResult.success,
          emailSent: false,
          customerWhatsappMessageId: waResult.messageId ?? null,
        });

        // A manually-confirmed payment must reach ERP too. Idempotent.
        const erpSync = await syncBookingToErp(bookingId);

        console.log(`✅ Booking marked as paid; whatsapp=${waResult.success} erpSync=${erpSync.status}`);

        res.json({
          success: true,
          message: "Booking marked as paid and WhatsApp notification sent",
          booking: await storage.getBooking(bookingId),
          whatsappSent: waResult.success,
          whatsappMessageId: waResult.messageId,
          erpSync
        });
      } else {
        const erpSync = await syncBookingToErp(bookingId);
        res.json({
          success: true,
          message: "Booking marked as paid",
          booking: await storage.getBooking(bookingId),
          erpSync
        });
      }
    } catch (error) {
      console.error("Manual payment update error:", error);
      res.status(500).json({ message: "Failed to update payment status" });
    }
  });

  // Scheduler management endpoints (Admin only)
  app.get("/api/admin/scheduler/status", authenticateAdmin, async (req, res) => {
    try {
      const status = schedulerService.getSchedulerStatus();
      res.json(status);
    } catch (error) {
      console.error("Scheduler status error:", error);
      res.status(500).json({ message: "Failed to get scheduler status" });
    }
  });

  app.post("/api/admin/scheduler/test-reminders", authenticateAdmin, async (req, res) => {
    try {
      console.log("Manual reminder test triggered by admin");
      await schedulerService.triggerReminderCheck();
      res.json({ 
        success: true, 
        message: "Reminder check completed successfully" 
      });
    } catch (error) {
      console.error("Manual reminder test error:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to run reminder check",
        error: error.message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
