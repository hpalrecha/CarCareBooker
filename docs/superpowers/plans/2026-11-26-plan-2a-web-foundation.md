# Plan 2a: `apps/web` foundation, Home and PPF page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the new Next.js public site in `apps/web` with the P91 design system, live price ranges, structured data, sitemap/robots/llms.txt, and the first two real pages (Home and `/services/paint-protection-film`), running side by side with the current site on a staging port.

**Architecture:** `apps/web` is a Next.js 16 App Router app in an npm workspace. Pages are static (SSG) with ISR (`revalidate = 300`) where prices show. Page copy is typed data in `packages/content/src/site/*` (one file per page); prices, packages and hours come from the existing Express API (`API_ORIGIN`, GET only). A pure `price-ranges` module turns catalogue rows into the ranges the spec requires. JSON-LD is built by typed builders (`schema-dts`). Nothing in production routing changes in this plan: the old site keeps serving `p91carcare.com` until Plan 3.

**Tech Stack:** Next.js 16.4, React 19.3, TypeScript 5 strict, Tailwind CSS 4.3 (`@tailwindcss/postcss`), `schema-dts` 2.1, `@img-comparison-slider/react` 8, `lucide-react`, `framer-motion` 12, node:test + tsx for unit tests.

Plan sequence for the spec `docs/superpowers/specs/2026-11-25-site-restructure-redesign-design.md`:
- Plan 1 (done, deployed 26 Nov): monorepo layout.
- **Plan 2a (this):** web foundation, Home, PPF page, staging.
- Plan 2b: remaining wave 1 pages (other services, sub-services, areas, brands, guides migration, hubs, gallery, faq, contact, about), each page's copy approved by the owner first.
- Plan 2c: booking flow in Next (`/book/<package>`, confirmation) on the Express API.
- Plan 3: analytics (GTM, Pixel + CAPI, attribution), redirects live, nginx cutover, Search Console steps.
- Plan 4: API/admin internals refactor.

## Global Constraints

- Prices on marketing pages are **ranges, never exact figures or "from ₹X"**; each range has a "what moves the price" note. Ranges are computed from the catalogue, never typed into copy. A missing top end renders as nothing (the page shows only what is known) and is listed by the ship-gate check.
- No page ships to production while its content contains `[NEEDS`. The ship-gate script (Task 7) lists offenders; Plan 3 runs it before cutover.
- Photos in proof sections (our work, before/after, area jobs) are real P91 photos from `docs/superpowers/specs/photo-catalogue.md` only. Never use `attached_assets/gallery/p91-stek-*` (other installer's footage) or any watermarked image. Concept images from licensed stock carry a credit in `packages/content/src/image-credits.ts` and are never captioned as P91 work.
- Design tokens (exact): brand green `#4DB848`, action green `#2E7D32`, green dark `#1B5E20`, tint `#EAF7EA`, ink `#12211B`, text-2 `#33443C`, muted `#5E6E66`, line `#E4E9E6`, ground `#F5F7F6`, white `#FFFFFF`. Font Plus Jakarta Sans 400–800. Radii 12 (buttons), 14 (cards), 16 (hero blocks). Touch targets ≥ 44 px, main buttons 52 px. Icons: `lucide-react` only, stroke 2.
- Business facts (exact): P91 Car Care, 49, 13th Cross, Ayappa Garden, Adugodi, Bengaluru 560030; phone `+91 74066 19191` (`tel:+917406619191`); WhatsApp `https://wa.me/917406619191`; origin `https://p91carcare.com`. Hours come from `/api/business-hours`.
- Washing is an offered service. Pickup and drop: "on request, confirmed on a call" — never promise free pickup or fixed timings.
- The API is read with GET only. Never POST from builds or tests.
- Do not touch `apps/api`, `apps/admin` behaviour, the Dockerfile used by production, or nginx in this plan.
- Never run `npm run dev` or the API with the real `.env` across 20:00 IST (reminder cron). `apps/web` alone is safe at any time.
- Use Node (read/replace/write) for bulk edits, never `sed -i` (CRLF files).
- Commits end with `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`. Work on branch `feat/web-foundation`; do not push `main` without the owner's go.

## Import rule for shared and tested modules

Every module under `packages/content/src/site/`, `packages/domain/src/price-ranges.ts` and `apps/web/lib/{site,api,schema}.ts` imports its relative neighbours **with the `.ts` extension** (`./site.ts`) and uses only erasable TypeScript (no enums, no parameter properties). Root `npm test` runs `tests/*.test.mjs` with plain Node 24 type stripping, which cannot resolve extensionless relative imports or `@web/*` aliases. `apps/web/tsconfig.json` has `allowImportingTsExtensions`, so Next accepts the same files. Components and pages may use `@web/*` and `@p91/*` aliases freely; they are never imported by tests.

## File structure

```
package.json                         + "workspaces": ["apps/web"]
apps/web/
  package.json                       next, react 19, tailwind 4, schema-dts, slider, lucide, framer-motion
  next.config.ts                     turbopack root = repo, images, headers, typedRoutes off
  tsconfig.json                      paths @p91/content/*, @p91/domain/*, @web/*
  postcss.config.mjs
  app/
    layout.tsx                       <html lang="en-IN">, font, header, footer, LocalBusiness JSON-LD
    globals.css                      tailwind import + tokens + base
    page.tsx                         Home
    services/paint-protection-film/page.tsx
    sitemap.ts  robots.ts  llms.txt/route.ts  not-found.tsx
  components/
    site-header.tsx  site-footer.tsx  breadcrumbs.tsx  button-link.tsx
    price-range-table.tsx  faq-list.tsx  before-after.tsx  cta-band.tsx
    json-ld.tsx  section.tsx  trust-strip.tsx  photo.tsx
  lib/
    api.ts                           typed GET client for /api/services, /api/business-hours
    schema.ts                        JSON-LD builders (schema-dts)
    site.ts                          business facts, origin, nav
packages/content/src/site/
  types.ts                           PageContent, ServiceFamily, FaqItem, ProofPhoto
  home.ts                            Home copy
  paint-protection-film.ts           PPF page copy
  registry.ts                        every web page: path, title, lastmod, content ref (sitemap + llms + ship gate)
packages/domain/src/
  price-ranges.ts                    catalogue rows -> ranges per family and body type
scripts/web/
  ship-gate.mjs                      lists pages whose content contains [NEEDS
  check-pages.mjs                    builds + starts web, asserts head/H1/canonical/JSON-LD per registry page
tests/
  price-ranges.test.mjs  web-schema.test.mjs  web-registry.test.mjs
```

---

### Task 1: Workspace and Next.js app skeleton

**Files:**
- Modify: `package.json` (add `workspaces`, scripts `web:dev`, `web:build`, `web:start`)
- Create: `apps/web/package.json`, `apps/web/next.config.ts`, `apps/web/tsconfig.json`, `apps/web/postcss.config.mjs`, `apps/web/app/globals.css`, `apps/web/app/layout.tsx`, `apps/web/app/page.tsx` (placeholder replaced in Task 5), `apps/web/lib/site.ts`, `apps/web/next-env.d.ts`
- Modify: root `tsconfig.json` `exclude` (add `apps/web/**`), `.gitignore` (add `apps/web/.next`)

**Interfaces:**
- Produces: `SITE` from `apps/web/lib/site.ts`:
  ```ts
  export const SITE: { name: string; legalName: string; origin: string; phone: string; phoneHref: string; whatsapp: string;
    address: { street: string; locality: string; city: string; postalCode: string; region: string; country: string };
    geo: { lat: number; lng: number } };
  ```
  Commands: `npm run web:dev` (port 3100), `npm run web:build`, `npm run web:start` (port 3100).

- [ ] **Step 1: Branch**

```bash
git checkout main && git pull --ff-only && git checkout -b feat/web-foundation
```

- [ ] **Step 2: Root workspace and scripts**

Edit `package.json` with Node (keep CRLF): add after `"license"`:

```json
  "workspaces": ["apps/web"],
```

and in `scripts`:

```json
    "web:dev": "npm run dev -w apps/web",
    "web:build": "npm run build -w apps/web",
    "web:start": "npm run start -w apps/web",
```

Root `tsconfig.json`: `"exclude": ["node_modules", "build", "dist", "**/*.test.ts", "apps/web/**"]`. `.gitignore`: add `apps/web/.next` and `apps/web/next-env.d.ts` is committed (Next regenerates it identically).

- [ ] **Step 3: `apps/web/package.json`**

```json
{
  "name": "@p91/web",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev --port 3100",
    "build": "next build",
    "start": "next start --port 3100",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@img-comparison-slider/react": "^8.0.2",
    "framer-motion": "^12.38.0",
    "lucide-react": "^0.453.0",
    "next": "16.4.6",
    "react": "19.3.1",
    "react-dom": "19.3.1"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "4.3.5",
    "@types/node": "^22.10.0",
    "@types/react": "^19.1.0",
    "@types/react-dom": "^19.1.0",
    "schema-dts": "2.1.0",
    "tailwindcss": "4.3.5",
    "typescript": "^5.6.3"
  }
}
```

Run: `npm install`
Expected: installs into `apps/web/node_modules` where versions differ from the root (React 19 vs the admin's React 18); root `npm test` still passes 684/684.

- [ ] **Step 4: Config files**

`apps/web/next.config.ts`:

```ts
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
```

`apps/web/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "strict": true,
    "noEmit": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "allowImportingTsExtensions": true,
    "skipLibCheck": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@web/*": ["./*"],
      "@p91/content/*": ["../../packages/content/src/*"],
      "@p91/domain/*": ["../../packages/domain/src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts", "../../packages/content/src/site/**/*.ts", "../../packages/domain/src/price-ranges.ts"],
  "exclude": ["node_modules"]
}
```

`apps/web/postcss.config.mjs`:

```js
export default { plugins: { "@tailwindcss/postcss": {} } };
```

- [ ] **Step 5: Tokens and base CSS**

`apps/web/app/globals.css`:

```css
@import "tailwindcss";

@theme {
  --color-brand: #4DB848;
  --color-action: #2E7D32;
  --color-action-dark: #1B5E20;
  --color-tint: #EAF7EA;
  --color-ink: #12211B;
  --color-text-2: #33443C;
  --color-muted: #5E6E66;
  --color-line: #E4E9E6;
  --color-ground: #F5F7F6;
  --color-on-ink: #A9E5A5;
  --font-sans: var(--font-jakarta), system-ui, sans-serif;
  --radius-btn: 12px;
  --radius-card: 14px;
  --radius-hero: 16px;
}

@layer base {
  html { -webkit-text-size-adjust: 100%; }
  body { background: #fff; color: var(--color-ink); font-family: var(--font-sans); font-size: 17px; line-height: 1.6; }
  a { color: var(--color-action); }
  a:hover { color: var(--color-action-dark); }
  :focus-visible { outline: 3px solid var(--color-brand); outline-offset: 2px; }
  h1, h2, h3 { letter-spacing: -0.03em; line-height: 1.05; }
}

@utility wrap { max-width: 1240px; margin-inline: auto; padding-inline: 24px; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; }
}
```

- [ ] **Step 6: Site facts**

`apps/web/lib/site.ts`:

```ts
export const SITE = {
  name: "P91 Car Care",
  legalName: "Plus Nine One Inc",
  origin: "https://p91carcare.com",
  phone: "+91 74066 19191",
  phoneHref: "tel:+917406619191",
  whatsapp: "https://wa.me/917406619191",
  address: {
    street: "49, 13th Cross, Ayappa Garden, Adugodi",
    locality: "Adugodi",
    city: "Bengaluru",
    postalCode: "560030",
    region: "Karnataka",
    country: "IN",
  },
  // Taken from the live AutoRepair JSON-LD on p91carcare.com (25 Nov 2026). Re-check in Task 3 Step 1.
  geo: { lat: 12.9416, lng: 77.6105 },
} as const;

export const NAV = [
  { href: "/services/paint-protection-film", label: "PPF" },
  { href: "/services/ceramic-coating", label: "Ceramic coating" },
  { href: "/services", label: "All services" },
  { href: "/areas/koramangala", label: "Areas" },
  { href: "/guides", label: "Guides" },
] as const;
```

- [ ] **Step 7: Layout and placeholder home**

`apps/web/app/layout.tsx`:

```tsx
import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { SITE } from "@web/lib/site";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-jakarta", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.origin),
  title: { default: "PPF and ceramic coating in Bangalore | P91 Car Care", template: "%s | P91 Car Care" },
  robots: { index: true, follow: true, googleBot: { "max-image-preview": "large" } },
};

export const viewport: Viewport = { themeColor: "#12211B" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={jakarta.variable}>
      <body>{children}</body>
    </html>
  );
}
```

`apps/web/app/page.tsx` (replaced in Task 5):

```tsx
export default function Home() {
  return <main className="wrap py-20"><h1 className="text-5xl font-extrabold">P91 Car Care</h1></main>;
}
```

- [ ] **Step 8: Build and run**

Run:
```bash
npm run web:build
```
Expected: `✓ Compiled successfully`, route `/` listed as static (○).

Run: `npm test 2>&1 | grep -E "^ℹ (tests|pass|fail)"`
Expected: unchanged from main (684/684).

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json tsconfig.json .gitignore apps/web
git commit -m "feat(web): add the Next.js app workspace with P91 tokens"
```

---

### Task 2: Price ranges from the catalogue

**Files:**
- Create: `packages/domain/src/price-ranges.ts`
- Create: `tests/price-ranges.test.mjs`
- Create: `apps/web/lib/api.ts`

**Interfaces:**
- Produces (from `packages/domain/src/price-ranges.ts`):
  ```ts
  export type CatalogueRow = { slug: string; price: string | number; isActive?: boolean };
  export type BodyType = "hatchback" | "sedan" | "suv";
  export type Range = { low: number; high: number | null };     // high null = only one price known
  export type FamilyRanges = { overall: Range; byBody: Partial<Record<BodyType, Range>> };
  export const FAMILIES: Record<string, { slugs: RegExp; bodyFromSlug?: (slug: string) => BodyType | null }>;
  export function rangesFor(family: keyof typeof FAMILIES, rows: CatalogueRow[]): FamilyRanges | null;
  export function formatRange(r: Range): string;                   // "₹50k–90k", or "₹7.5k" when high is null
  ```
- Produces (from `apps/web/lib/api.ts`): `getServices(): Promise<CatalogueRow[]>`, `getBusinessHours(): Promise<BusinessHour[]>` with `BusinessHour = { dayOfWeek: number; dayName: string; isOpen: boolean; openTime: string; cutoffTime: string }`.

- [ ] **Step 1: Write the failing test**

`tests/price-ranges.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { rangesFor, formatRange } from "../packages/domain/src/price-ranges.ts";

// The live catalogue on 25 Nov 2026 (GET /api/services), trimmed to slug and price.
const ROWS = [
  { slug: "ppf-hatchback", price: "50000.00" }, { slug: "ppf-sedan", price: "60000.00" }, { slug: "ppf-suv", price: "70000.00" },
  { slug: "ppf-premium-hatchback", price: "70000.00" }, { slug: "ppf-premium-sedan", price: "80000.00" }, { slug: "ppf-premium-suv", price: "90000.00" },
  { slug: "1-year-ceramic-coating", price: "7500.00" }, { slug: "1-year-bike-ceramic-coating", price: "3999.00" },
  { slug: "premium-car-wash-special", price: "999.00" }, { slug: "headlight-restoration-both", price: "1499.00" },
  { slug: "old-ppf-row", price: "1.00", isActive: false },
];

test("PPF overall range spans standard to premium", () => {
  assert.deepEqual(rangesFor("ppf", ROWS).overall, { low: 50000, high: 90000 });
});

test("PPF has one range per body type, standard to premium", () => {
  const r = rangesFor("ppf", ROWS).byBody;
  assert.deepEqual(r.hatchback, { low: 50000, high: 70000 });
  assert.deepEqual(r.sedan, { low: 60000, high: 80000 });
  assert.deepEqual(r.suv, { low: 70000, high: 90000 });
});

test("a family with one catalogue price has no top end", () => {
  assert.deepEqual(rangesFor("ceramic-car", ROWS).overall, { low: 7500, high: null });
});

test("inactive rows never count", () => {
  assert.equal(rangesFor("ppf", ROWS).overall.low, 50000);
});

test("unknown family or no rows returns null", () => {
  assert.equal(rangesFor("ppf", []), null);
});

test("formatting uses compact rupees", () => {
  assert.equal(formatRange({ low: 50000, high: 90000 }), "₹50k–90k");
  assert.equal(formatRange({ low: 7500, high: null }), "₹7.5k");
  assert.equal(formatRange({ low: 999, high: 1800 }), "₹999–1.8k");
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test tests/price-ranges.test.mjs`
Expected: FAIL, cannot find module `price-ranges.ts`.

- [ ] **Step 3: Implement**

`packages/domain/src/price-ranges.ts`:

```ts
/**
 * Catalogue rows -> the price ranges marketing pages show.
 *
 * Owner rule (25 Nov 2026): never an exact price or "from ₹X" on a marketing page; show the
 * range a car can land in and what moves it. Exact amounts belong to booking and checkout.
 */
export type CatalogueRow = { slug: string; price: string | number; isActive?: boolean };
export type BodyType = "hatchback" | "sedan" | "suv";
export type Range = { low: number; high: number | null };
export type FamilyRanges = { overall: Range; byBody: Partial<Record<BodyType, Range>> };

const bodyFromSuffix = (slug: string): BodyType | null => {
  const m = slug.match(/-(hatchback|sedan|suv)$/);
  return m ? (m[1] as BodyType) : null;
};

export const FAMILIES = {
  ppf: { slugs: /^ppf-(premium-)?(hatchback|sedan|suv)$/, bodyFromSlug: bodyFromSuffix },
  "ceramic-car": { slugs: /^(\d+-year-)?ceramic-coating(-[a-z]+)?$/ },
  "ceramic-bike": { slugs: /bike-ceramic-coating/ },
  "car-wash": { slugs: /car-wash/ },
  "interior-detailing": { slugs: /^interior-detailing/ },
  "exterior-detailing": { slugs: /^exterior-detailing/ },
  "headlight-restoration": { slugs: /^headlight-restoration/ },
  "windshield-glass-coating": { slugs: /^windshield-glass-coating/ },
  "windshield-glass-polishing": { slugs: /^windshield-glass-polishing/ },
  "maintenance-plan": { slugs: /^annual-maintenance/ },
} satisfies Record<string, { slugs: RegExp; bodyFromSlug?: (slug: string) => BodyType | null }>;

export type Family = keyof typeof FAMILIES;

const toRange = (prices: number[]): Range => {
  const low = Math.min(...prices);
  const high = Math.max(...prices);
  return { low, high: high > low ? high : null };
};

export function rangesFor(family: Family, rows: CatalogueRow[]): FamilyRanges | null {
  const def = FAMILIES[family] as { slugs: RegExp; bodyFromSlug?: (slug: string) => BodyType | null };
  const hits = rows.filter((r) => r.isActive !== false && def.slugs.test(r.slug));
  if (hits.length === 0) return null;
  const price = (r: CatalogueRow) => Number(r.price);
  const byBody: Partial<Record<BodyType, Range>> = {};
  if (def.bodyFromSlug) {
    for (const body of ["hatchback", "sedan", "suv"] as const) {
      const p = hits.filter((r) => def.bodyFromSlug!(r.slug) === body).map(price);
      if (p.length) byBody[body] = toRange(p);
    }
  }
  return { overall: toRange(hits.map(price)), byBody };
}

const k = (n: number) => {
  if (n < 1000) return String(n);
  const v = n / 1000;
  return `${Number.isInteger(v) ? v : v.toFixed(1).replace(/\.0$/, "")}k`;
};

export function formatRange(r: Range): string {
  return r.high === null ? `₹${k(r.low)}` : `₹${k(r.low)}–${k(r.high)}`;
}
```

- [ ] **Step 4: Run tests**

Run: `node --test tests/price-ranges.test.mjs`
Expected: 6 pass.

- [ ] **Step 5: API client**

`apps/web/lib/api.ts`:

```ts
import type { CatalogueRow } from "@p91/domain/price-ranges";

/** Read-only client for the existing Express API. Build and ISR only; never POST from here. */
const API_ORIGIN = process.env.API_ORIGIN ?? "https://p91carcare.com";

export type BusinessHour = { dayOfWeek: number; dayName: string; isOpen: boolean; openTime: string; cutoffTime: string };

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_ORIGIN}${path}`, { next: { revalidate: 300 }, headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}

export async function getServices(): Promise<CatalogueRow[]> {
  const data = await get<unknown>("/api/services");
  const rows = Array.isArray(data) ? data : ((data as { services?: unknown[] }).services ?? []);
  return (rows as Array<{ slug: string; price: string; isActive?: boolean }>).map((r) => ({ slug: r.slug, price: r.price, isActive: r.isActive }));
}

export const getBusinessHours = () => get<BusinessHour[]>("/api/business-hours");
```

- [ ] **Step 6: Commit**

```bash
git add packages/domain/src/price-ranges.ts tests/price-ranges.test.mjs apps/web/lib/api.ts
git commit -m "feat(domain): price ranges from the catalogue, and a read-only API client for web"
```

---

### Task 3: JSON-LD builders

**Files:**
- Create: `apps/web/lib/schema.ts`, `apps/web/components/json-ld.tsx`, `tests/web-schema.test.mjs`

**Interfaces:**
- Consumes: `SITE` (Task 1), `Range` (Task 2), `BusinessHour` (Task 2).
- Produces:
  ```ts
  export function businessSchema(hours: BusinessHour[]): WithContext<AutoRepair>;
  export function serviceSchema(a: { name: string; path: string; description: string; range: Range | null }): WithContext<Service>;
  export function faqSchema(items: { q: string; a: string }[]): WithContext<FAQPage>;
  export function breadcrumbSchema(items: { name: string; path: string }[]): WithContext<BreadcrumbList>;
  export const BUSINESS_ID = "https://p91carcare.com/#business";
  ```
  `<JsonLd data={...} />` renders one `<script type="application/ld+json">` with `<` escaped as `<`.

- [ ] **Step 1: Confirm the geo coordinates**

Run: `curl -s https://p91carcare.com/ | grep -o '"geo":{[^}]*}'`
Expected: a `GeoCoordinates` object. Put its `latitude`/`longitude` into `SITE.geo` if they differ from Task 1.

- [ ] **Step 2: Failing test**

`tests/web-schema.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { businessSchema, serviceSchema, faqSchema, breadcrumbSchema, BUSINESS_ID } from "../apps/web/lib/schema.ts";

const HOURS = [
  { dayOfWeek: 0, dayName: "Sunday", isOpen: true, openTime: "10:30", cutoffTime: "14:00" },
  { dayOfWeek: 1, dayName: "Monday", isOpen: true, openTime: "10:30", cutoffTime: "16:30" },
  { dayOfWeek: 2, dayName: "Tuesday", isOpen: false, openTime: "10:30", cutoffTime: "16:30" },
];

test("business is an AutoRepair with a stable @id, address, phone and only open days", () => {
  const s = businessSchema(HOURS);
  assert.equal(s["@type"], "AutoRepair");
  assert.equal(s["@id"], BUSINESS_ID);
  assert.equal(s.telephone, "+917406619191");
  assert.equal(s.address.postalCode, "560030");
  assert.equal(s.openingHoursSpecification.length, 2);
  assert.deepEqual(s.areaServed.map((a) => a.name), ["Koramangala", "HSR Layout", "Indiranagar", "Bengaluru"]);
});

test("service carries an AggregateOffer range in INR and points at the business", () => {
  const s = serviceSchema({ name: "Paint protection film", path: "/services/paint-protection-film", description: "d", range: { low: 50000, high: 90000 } });
  assert.equal(s.offers["@type"], "AggregateOffer");
  assert.equal(s.offers.lowPrice, 50000);
  assert.equal(s.offers.highPrice, 90000);
  assert.equal(s.offers.priceCurrency, "INR");
  assert.equal(s.provider["@id"], BUSINESS_ID);
  assert.equal(s.url, "https://p91carcare.com/services/paint-protection-film");
});

test("service without a known range carries no offers", () => {
  const s = serviceSchema({ name: "x", path: "/x", description: "d", range: null });
  assert.equal(s.offers, undefined);
});

test("faq and breadcrumb shapes", () => {
  const f = faqSchema([{ q: "Q?", a: "A." }]);
  assert.equal(f.mainEntity[0].acceptedAnswer.text, "A.");
  const b = breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Services", path: "/services" }]);
  assert.equal(b.itemListElement[1].position, 2);
  assert.equal(b.itemListElement[1].item, "https://p91carcare.com/services");
});
```

Run: `node --test tests/web-schema.test.mjs`
Expected: FAIL (module missing).

- [ ] **Step 3: Implement**

`apps/web/lib/schema.ts`:

```ts
import type { AutoRepair, BreadcrumbList, FAQPage, Service, WithContext } from "schema-dts";
import type { Range } from "@p91/domain/price-ranges";
import type { BusinessHour } from "./api.ts";
import { SITE } from "./site.ts";

export const BUSINESS_ID = `${SITE.origin}/#business`;
const abs = (path: string) => new URL(path, SITE.origin).toString().replace(/\/$/, path === "/" ? "/" : "");

export function businessSchema(hours: BusinessHour[]) {
  return {
    "@context": "https://schema.org",
    "@type": "AutoRepair",
    "@id": BUSINESS_ID,
    name: SITE.name,
    legalName: SITE.legalName,
    url: SITE.origin,
    telephone: SITE.phoneHref.replace("tel:", ""),
    image: `${SITE.origin}/og/home.png`,
    priceRange: "₹₹₹",
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE.address.street,
      addressLocality: SITE.address.city,
      postalCode: SITE.address.postalCode,
      addressRegion: SITE.address.region,
      addressCountry: SITE.address.country,
    },
    geo: { "@type": "GeoCoordinates", latitude: SITE.geo.lat, longitude: SITE.geo.lng },
    areaServed: ["Koramangala", "HSR Layout", "Indiranagar", "Bengaluru"].map((name) => ({ "@type": "Place" as const, name })),
    openingHoursSpecification: hours.filter((h) => h.isOpen).map((h) => ({
      "@type": "OpeningHoursSpecification" as const,
      dayOfWeek: `https://schema.org/${h.dayName}`,
      opens: h.openTime,
      closes: h.cutoffTime,
    })),
  } satisfies WithContext<AutoRepair>;
}

export function serviceSchema(a: { name: string; path: string; description: string; range: Range | null }) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: a.name,
    description: a.description,
    url: abs(a.path),
    areaServed: { "@type": "City", name: "Bengaluru" },
    provider: { "@id": BUSINESS_ID },
    ...(a.range
      ? { offers: { "@type": "AggregateOffer", priceCurrency: "INR", lowPrice: a.range.low, highPrice: a.range.high ?? a.range.low } }
      : {}),
  } satisfies WithContext<Service>;
}

export function faqSchema(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({ "@type": "Question" as const, name: i.q, acceptedAnswer: { "@type": "Answer" as const, text: i.a } })),
  } satisfies WithContext<FAQPage>;
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem" as const, position: i + 1, name: it.name, item: abs(it.path) })),
  } satisfies WithContext<BreadcrumbList>;
}
```

`apps/web/components/json-ld.tsx`:

```tsx
export function JsonLd({ data }: { data: object }) {
  // "<" escaped so a string containing "</script>" cannot end the tag early.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
```

- [ ] **Step 4: Run tests**

Run: `node --test tests/web-schema.test.mjs`
Expected: 4 pass. If `abs("/")` yields `https://p91carcare.com/` keep it; the breadcrumb test only checks `/services`.

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/schema.ts apps/web/components/json-ld.tsx tests/web-schema.test.mjs apps/web/lib/site.ts
git commit -m "feat(web): typed JSON-LD builders for business, service ranges, FAQ and breadcrumbs"
```

---

### Task 4: Shared components

**Files:**
- Create: `apps/web/components/site-header.tsx`, `site-footer.tsx`, `breadcrumbs.tsx`, `button-link.tsx`, `section.tsx`, `price-range-table.tsx`, `faq-list.tsx`, `before-after.tsx`, `cta-band.tsx`, `trust-strip.tsx`, `photo.tsx`
- Modify: `apps/web/app/layout.tsx` (header, footer, business JSON-LD)
- Create: `apps/web/public/brand/p91-logo.png` (copy of `apps/admin/public/Car Care (4)_1753951564515.png`)

**Interfaces:**
- Consumes: `SITE`, `NAV`, `businessSchema`, `getBusinessHours`, `breadcrumbSchema`, `faqSchema`, `formatRange`, `Range`.
- Produces (props exactly):
  - `ButtonLink({ href, children, variant: "primary" | "secondary" | "on-ink" | "outline-on-ink" })`
  - `Section({ id?, labelledBy, tone?: "white" | "ground" | "ink", children })`
  - `Breadcrumbs({ items: { name: string; path: string }[] })` renders nav + BreadcrumbList JSON-LD
  - `PriceRangeTable({ rows: { label: string; examples: string; range: Range | null; moves: string }[], caption: string })`
  - `FaqList({ items: { q: string; a: string }[], withSchema?: boolean })`
  - `BeforeAfter({ before: Img, after: Img, caption: React.ReactNode })` with `Img = { src: string; alt: string; width: number; height: number }`
  - `CtaBand({ title: string; body?: string; primary: { href: string; label: string }; secondary?: { href: string; label: string } })`
  - `TrustStrip({ items: { strong: string; sub: string }[] })`
  - `Photo({ src, alt, width, height, priority?, className? })` wraps `next/image`

- [ ] **Step 1: Copy the logo**

```bash
mkdir -p apps/web/public/brand && cp "apps/admin/public/Car Care (4)_1753951564515.png" apps/web/public/brand/p91-logo.png
```

- [ ] **Step 2: Write the components**

`apps/web/components/button-link.tsx`:

```tsx
import Link from "next/link";

const STYLES = {
  primary: "bg-action text-white hover:bg-action-dark hover:text-white",
  secondary: "border-[1.5px] border-[#D5DDD9] bg-white text-ink hover:border-action",
  "on-ink": "bg-brand text-ink hover:bg-[#5fcf59] hover:text-ink",
  "outline-on-ink": "border-[1.5px] border-white/55 text-white hover:border-white hover:text-white",
} as const;

export function ButtonLink({ href, children, variant = "primary" }: { href: string; children: React.ReactNode; variant?: keyof typeof STYLES }) {
  const external = /^(https?:|tel:)/.test(href);
  const cls = `inline-flex min-h-[52px] items-center justify-center rounded-[12px] px-6 text-base font-bold no-underline transition-colors ${STYLES[variant]}`;
  return external ? <a href={href} className={cls}>{children}</a> : <Link href={href} className={cls}>{children}</Link>;
}
```

`apps/web/components/section.tsx`:

```tsx
const TONES = { white: "bg-white", ground: "bg-ground", ink: "bg-ink text-white" } as const;

export function Section({ id, labelledBy, tone = "white", children }: { id?: string; labelledBy: string; tone?: keyof typeof TONES; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={`${TONES[tone]} py-16 md:py-20`}>
      <div className="wrap">{children}</div>
    </section>
  );
}
```

`apps/web/components/photo.tsx`:

```tsx
import Image from "next/image";

export function Photo({ src, alt, width, height, priority = false, className = "" }: { src: string; alt: string; width: number; height: number; priority?: boolean; className?: string }) {
  return <Image src={src} alt={alt} width={width} height={height} priority={priority} sizes="(min-width: 1240px) 600px, 100vw" className={`block h-full w-full object-cover ${className}`} />;
}
```

`apps/web/components/site-header.tsx`:

```tsx
import Image from "next/image";
import Link from "next/link";
import { NAV, SITE } from "@web/lib/site";

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-white">
      <div className="wrap flex flex-wrap items-center gap-x-7 gap-y-3 py-3">
        <Link href="/" aria-label="P91 Car Care, home" className="flex items-center">
          <Image src="/brand/p91-logo.png" alt="P91 Car Care" width={58} height={44} priority className="h-11 w-auto" />
        </Link>
        <nav aria-label="Main" className="min-w-0 flex-[1_1_420px]">
          <ul className="flex flex-wrap gap-x-5 text-[15px] font-semibold">
            {NAV.map((n) => (
              <li key={n.href}><Link href={n.href} className="inline-flex min-h-11 items-center text-ink no-underline hover:text-action">{n.label}</Link></li>
            ))}
          </ul>
        </nav>
        <a href={SITE.phoneHref} className="inline-flex min-h-11 items-center font-bold tabular-nums text-ink no-underline">{SITE.phone}</a>
        <a href={SITE.whatsapp} className="inline-flex min-h-11 items-center rounded-[12px] bg-action px-[18px] font-bold text-white no-underline hover:bg-action-dark hover:text-white">WhatsApp</a>
      </div>
    </header>
  );
}
```

`apps/web/components/site-footer.tsx`:

```tsx
import Link from "next/link";
import { SITE } from "@web/lib/site";

// Hubs and legal pages only (spec: the footer stops linking every page equally).
const LINKS = [
  ["/services", "Services"], ["/areas/koramangala", "Areas"], ["/brands", "Brands"], ["/guides", "Guides"],
  ["/gallery", "Gallery"], ["/about", "About"], ["/contact", "Contact"], ["/privacy-policy", "Privacy"], ["/terms-conditions", "Terms"],
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="wrap flex flex-col gap-4 py-8 text-[15px] text-muted">
        <p className="m-0"><strong className="text-ink">{SITE.name}</strong> · {SITE.address.street}, {SITE.address.city} {SITE.address.postalCode} · <a href={SITE.phoneHref}>{SITE.phone}</a></p>
        <ul className="m-0 flex list-none flex-wrap gap-x-6 gap-y-1 p-0">
          {LINKS.map(([href, label]) => <li key={href}><Link href={href} className="inline-flex min-h-11 items-center">{label}</Link></li>)}
        </ul>
      </div>
    </footer>
  );
}
```

`apps/web/components/breadcrumbs.tsx`:

```tsx
import Link from "next/link";
import { breadcrumbSchema } from "@web/lib/schema";
import { JsonLd } from "./json-ld";

export function Breadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-7 text-[15px] text-muted">
      <ol className="m-0 flex list-none flex-wrap gap-2 p-0">
        {items.map((it, i) => (
          <li key={it.path}>
            {i < items.length - 1 ? <><Link href={it.path} className="text-muted">{it.name}</Link> /</> : <span aria-current="page" className="text-ink">{it.name}</span>}
          </li>
        ))}
      </ol>
      <JsonLd data={breadcrumbSchema(items)} />
    </nav>
  );
}
```

`apps/web/components/price-range-table.tsx`:

```tsx
import { formatRange, type Range } from "@p91/domain/price-ranges";

export function PriceRangeTable({ rows, caption }: { rows: { label: string; examples: string; range: Range | null; moves: string }[]; caption: string }) {
  return (
    <div className="overflow-x-auto rounded-[16px] border border-line bg-white">
      <table className="w-full min-w-[560px] border-collapse tabular-nums">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="text-left text-[15px] text-muted">
            <th scope="col" className="px-6 py-4 font-semibold">Body type</th>
            <th scope="col" className="px-6 py-4 font-semibold">Price range</th>
            <th scope="col" className="px-6 py-4 font-semibold">What moves it within the range</th>
          </tr>
        </thead>
        <tbody>
          {rows.filter((r) => r.range).map((r) => (
            <tr key={r.label} className="border-t border-line">
              <th scope="row" className="px-6 py-4 text-left text-lg font-bold">{r.label}<span className="block text-sm font-medium text-muted">{r.examples}</span></th>
              <td className="px-6 py-4 text-[22px] font-extrabold">{formatRange(r.range!)}</td>
              <td className="px-6 py-4 text-[15px] text-text-2">{r.moves}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

`apps/web/components/faq-list.tsx`:

```tsx
import { faqSchema } from "@web/lib/schema";
import { JsonLd } from "./json-ld";

export function FaqList({ items, withSchema = true }: { items: { q: string; a: string }[]; withSchema?: boolean }) {
  return (
    <>
      <dl className="m-0">
        {items.map((it, i) => (
          <div key={it.q} className={`border-t border-line py-5 ${i === items.length - 1 ? "border-b" : ""}`}>
            <dt className="mb-1.5 text-[19px] font-bold">{it.q}</dt>
            <dd className="m-0 text-text-2">{it.a}</dd>
          </div>
        ))}
      </dl>
      {withSchema && <JsonLd data={faqSchema(items)} />}
    </>
  );
}
```

`apps/web/components/before-after.tsx`:

```tsx
"use client";
import Image from "next/image";
import { ImgComparisonSlider } from "@img-comparison-slider/react";

type Img = { src: string; alt: string; width: number; height: number };

export function BeforeAfter({ before, after, caption }: { before: Img; after: Img; caption: React.ReactNode }) {
  return (
    <figure className="m-0 flex flex-col gap-3 rounded-[16px] bg-white p-4">
      <ImgComparisonSlider className="overflow-hidden rounded-[12px] [--divider-color:#4DB848] [--divider-width:3px]">
        <Image slot="first" src={before.src} alt={before.alt} width={before.width} height={before.height} className="h-[380px] w-full object-cover" />
        <Image slot="second" src={after.src} alt={after.alt} width={after.width} height={after.height} className="h-[380px] w-full object-cover" />
      </ImgComparisonSlider>
      <figcaption className="text-[15px] text-text-2">{caption}</figcaption>
    </figure>
  );
}
```

`apps/web/components/cta-band.tsx`:

```tsx
import { ButtonLink } from "./button-link";

export function CtaBand({ title, body, primary, secondary }: { title: string; body?: string; primary: { href: string; label: string }; secondary?: { href: string; label: string } }) {
  return (
    <div className="wrap pb-20">
      <div className="flex flex-wrap items-center justify-between gap-6 rounded-[16px] border-t-4 border-brand bg-ink p-8 text-white md:p-11">
        <div className="min-w-0 flex-[1_1_380px]">
          <h2 className="m-0 text-[clamp(28px,3.4vw,42px)] font-extrabold">{title}</h2>
          {body && <p className="m-0 mt-2 text-lg text-white/85">{body}</p>}
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href={primary.href} variant="on-ink">{primary.label}</ButtonLink>
          {secondary && <ButtonLink href={secondary.href} variant="outline-on-ink">{secondary.label}</ButtonLink>}
        </div>
      </div>
    </div>
  );
}
```

`apps/web/components/trust-strip.tsx`:

```tsx
export function TrustStrip({ items }: { items: { strong: string; sub: string }[] }) {
  return (
    <section aria-label="Why owners trust P91" className="bg-ink pb-10 pt-8 text-white">
      <ul className="wrap m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-x-7 gap-y-4">
        {items.map((it) => <li key={it.strong} className="flex flex-col"><strong className="text-[22px]">{it.strong}</strong><span className="text-sm text-white/75">{it.sub}</span></li>)}
      </ul>
    </section>
  );
}
```

- [ ] **Step 3: Wire header, footer and business JSON-LD into the layout**

Replace the `RootLayout` body in `apps/web/app/layout.tsx` with:

```tsx
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const hours = await getBusinessHours().catch(() => []);
  return (
    <html lang="en-IN" className={jakarta.variable}>
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
        <JsonLd data={businessSchema(hours)} />
      </body>
    </html>
  );
}
```

and add the imports:

```tsx
import { SiteHeader } from "@web/components/site-header";
import { SiteFooter } from "@web/components/site-footer";
import { JsonLd } from "@web/components/json-ld";
import { businessSchema } from "@web/lib/schema";
import { getBusinessHours } from "@web/lib/api";
```

- [ ] **Step 4: Build**

Run: `npm run web:build`
Expected: success; no type errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web
git commit -m "feat(web): header, footer, breadcrumbs, price-range table, FAQ, before/after and CTA components"
```

---

### Task 5: Page registry, content types and Home

**Files:**
- Create: `packages/content/src/site/types.ts`, `packages/content/src/site/home.ts`, `packages/content/src/site/registry.ts`
- Modify: `apps/web/app/page.tsx`
- Create: `tests/web-registry.test.mjs`
- Upload: real photos into `apps/web/public/photos/` (list below)

**Interfaces:**
- Produces:
  ```ts
  // types.ts
  export type FaqItem = { q: string; a: string };
  export type ProofPhoto = { src: string; alt: string; width: number; height: number; caption: string };
  export type PageEntry = { path: string; title: string; description: string; lastmod: string; changefreq?: "weekly" | "monthly"; content: unknown };
  // registry.ts
  export const PAGES: PageEntry[];
  export function pageFor(path: string): PageEntry;   // throws if missing
  ```

- [ ] **Step 1: Copy the verified photos**

These were opened and checked on 25 Nov (`docs/superpowers/specs/photo-catalogue.md`). Copy with new kebab-case names:

```bash
mkdir -p apps/web/public/photos
cp attached_assets/unnamed_1765537193657.webp apps/web/public/photos/creta-stek-ppf-studio.webp
cp "attached_assets/unnamed_(3)_1765537193657.webp" apps/web/public/photos/mahindra-be6-arrival-handover.webp
cp attached_assets/gallery/p91-exterior-before-orange-hyundai.webp apps/web/public/photos/i20-before-bird-droppings.webp
cp attached_assets/about/p91-studio-nasiol-floor-orange-hyundai.webp apps/web/public/photos/i20-after-studio.webp
cp attached_assets/gallery/p91-ppf-film-lift.webp apps/web/public/photos/ppf-install-rear-quarter.webp
cp attached_assets/gallery/p91-ppf-edge-trim.webp apps/web/public/photos/ppf-install-door-edge.webp
cp attached_assets/gallery/p91-ppf-fitting.webp apps/web/public/photos/ppf-install-door-handle.webp
cp attached_assets/gallery/p91-ceramic-gloss-wipe.webp apps/web/public/photos/ceramic-wipe-bonnet.webp
cp attached_assets/gallery/p91-polish-badge-pass.webp apps/web/public/photos/polish-porsche-bonnet.webp
cp attached_assets/gallery/p91-interior-vacuum-floor.webp apps/web/public/photos/interior-vacuum-footwell.webp
cp attached_assets/gallery/p91-lux-range-rover-evoque.webp apps/web/public/photos/evoque-studio.webp
cp attached_assets/gallery/p91-lux-vellfire-wide.webp apps/web/public/photos/vellfire-stek-wall.webp
cp attached_assets/gallery/p91-lux-xuv700.webp apps/web/public/photos/xuv700-stek-wall.webp
cp attached_assets/gallery/p91-lux-mercedes-gle.webp apps/web/public/photos/gle-nasiol-wall.webp
node -e 'const s=require("sharp");for(const f of require("fs").readdirSync("apps/web/public/photos"))s("apps/web/public/photos/"+f).metadata().then(m=>console.log(f,m.width,m.height))'
```

Record each printed width × height; use them in the content files below (the values shown in Step 3 are the ones measured on 25 Nov; correct any that differ).

- [ ] **Step 2: Failing registry test**

`tests/web-registry.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { PAGES, pageFor } from "../packages/content/src/site/registry.ts";

test("every page has a unique absolute path, a title of 30-60 chars and a description of 110-160 chars", () => {
  const paths = new Set();
  for (const p of PAGES) {
    assert.match(p.path, /^\/[a-z0-9/-]*$/, p.path);
    assert.ok(!paths.has(p.path), `duplicate ${p.path}`);
    paths.add(p.path);
    assert.ok(p.title.length >= 30 && p.title.length <= 60, `${p.path} title ${p.title.length}`);
    assert.ok(p.description.length >= 110 && p.description.length <= 160, `${p.path} description ${p.description.length}`);
    assert.match(p.lastmod, /^\d{4}-\d{2}-\d{2}$/);
  }
});

test("no page states an exact rupee price in its copy (ranges only)", () => {
  for (const p of PAGES) {
    const text = JSON.stringify(p.content);
    assert.doesNotMatch(text, /from ₹|₹\d{1,3}(,\d{3})+(?!\s*[–-])/, `${p.path} has an exact price`);
  }
});

test("no proof photo is an unverified installer clip", () => {
  for (const p of PAGES) assert.doesNotMatch(JSON.stringify(p.content), /p91-stek-|watermark/i, p.path);
});

test("pageFor finds home and PPF", () => {
  assert.equal(pageFor("/").path, "/");
  assert.equal(pageFor("/services/paint-protection-film").path, "/services/paint-protection-film");
});
```

Run: `node --test tests/web-registry.test.mjs`
Expected: FAIL (module missing).

- [ ] **Step 3: Content types and Home copy**

`packages/content/src/site/types.ts`:

```ts
export type FaqItem = { q: string; a: string };
export type ProofPhoto = { src: string; alt: string; width: number; height: number; caption: string };
export type PageEntry = {
  path: string;
  title: string;
  description: string;
  lastmod: string;
  changefreq?: "weekly" | "monthly";
  content: unknown;
};
```

`packages/content/src/site/home.ts` (copy approved on the v2 Home board, 25 Nov; `[NEEDS ...]` markers stay until the studio supplies the fact and block production via the ship gate):

```ts
import type { FaqItem, ProofPhoto } from "./types.ts";

export const HOME = {
  hero: {
    h1: "PPF and ceramic coating in Bangalore",
    lead: "STEK film and Nasiol coating, fitted in our studio in Adugodi, next to Koramangala. Every service shows its price range and what moves your car up or down it.",
    photo: { src: "/photos/creta-stek-ppf-studio.webp", alt: "Black Hyundai Creta in the P91 studio after STEK paint protection film, STEK wall behind", width: 3420, height: 1925, caption: "Hyundai Creta at handover, photographed in our studio" } satisfies ProofPhoto,
    primary: { href: "/services/paint-protection-film", label: "See the price range for your car" },
  },
  trust: [
    { strong: "[NEEDS: Google rating]", sub: "[NEEDS: review count] Google reviews" },
    { strong: "[NEEDS: N]-year warranty", sub: "Written terms at handover" },
    { strong: "STEK and Nasiol", sub: "You see the sealed roll first" },
    { strong: "Open daily", sub: "Adugodi studio" },
  ],
  services: [
    { family: "ppf", href: "/services/paint-protection-film", name: "Paint protection film", line: "STEK and P91 Premium film, full body.", photo: { src: "/photos/ppf-install-rear-quarter.webp", alt: "P91 installer positioning PPF on the rear quarter of a black SUV", width: 720, height: 1280 } },
    { family: "ceramic-car", href: "/services/ceramic-coating", name: "Ceramic coating", line: "Nasiol coating for gloss and easy washing.", photo: { src: "/photos/ceramic-wipe-bonnet.webp", alt: "Applicator block wiping ceramic coating onto a bonnet", width: 720, height: 1280 } },
    { family: "exterior-detailing", href: "/services/exterior-detailing", name: "Exterior detailing", line: "Polishing, hard-water spots, headlights.", photo: { src: "/photos/polish-porsche-bonnet.webp", alt: "Machine polisher beside the bonnet crest of a Porsche", width: 720, height: 1280 } },
    { family: "interior-detailing", href: "/services/interior-detailing", name: "Interior detailing", line: "Vacuum, steam, fabric and leather.", photo: { src: "/photos/interior-vacuum-footwell.webp", alt: "Vacuuming debris from a rear footwell carpet", width: 720, height: 1280 } },
    { family: "ceramic-bike", href: "/services/ceramic-coating/bike", name: "Bike ceramic coating", line: "Tank, fairings and painted panels.", photo: null },
    { family: "car-wash", href: "/services/car-wash", name: "Car wash", line: "Hand wash and foam, done as detailing prep.", photo: null },
  ],
  beforeAfter: [
    {
      before: { src: "/photos/i20-before-bird-droppings.webp", alt: "Before: orange Hyundai i20 with bird droppings on the bonnet", width: 1400, height: 2488 },
      after: { src: "/photos/i20-after-studio.webp", alt: "After: the same orange Hyundai i20, glossy, in the P91 studio", width: 1400, height: 2488 },
      caption: "Hyundai i20 · bird-dropping marks removed and paint polished",
      href: "/services/exterior-detailing",
    },
  ],
  work: [
    { src: "/photos/evoque-studio.webp", alt: "White Range Rover Evoque with copper roof under the P91 wall logo", width: 1000, height: 750, car: "Range Rover Evoque", job: "[NEEDS: service]" },
    { src: "/photos/vellfire-stek-wall.webp", alt: "White Toyota Vellfire beside the STEK wall", width: 1000, height: 750, car: "Toyota Vellfire", job: "STEK PPF" },
    { src: "/photos/xuv700-stek-wall.webp", alt: "Dark blue Mahindra XUV700 in front of the STEK wall", width: 1000, height: 750, car: "Mahindra XUV700", job: "[NEEDS: service]" },
    { src: "/photos/gle-nasiol-wall.webp", alt: "White Mercedes-Benz GLE in front of the Nasiol wall", width: 1000, height: 750, car: "Mercedes-Benz GLE", job: "[NEEDS: service]" },
  ],
  genuine: {
    h2: "How you know the film is genuine",
    lead: "Fake and relabelled PPF is common. Before we cut a single panel, you see:",
    steps: ["The sealed roll, with the brand label and batch number.", "The exact panels the quote covers, marked on your car.", "A written warranty card with that batch number, at handover."],
    photo: { src: "/photos/ppf-install-door-edge.webp", alt: "P91 installer fitting clear PPF around the rear door of a black SUV", width: 720, height: 1280 },
  },
  startHere: [
    { href: "/guides/what-is-ppf", label: "What is PPF?" },
    { href: "/guides/ppf-vs-ceramic-coating-bangalore", label: "PPF vs ceramic coating" },
    { href: "/guides/ppf-cost-bangalore", label: "PPF cost and why quotes differ" },
    { href: "/guides/how-much-ppf-does-your-car-need", label: "Full body or front only?" },
    { href: "/guides/is-your-ppf-really-made-in-usa", label: "Is your PPF genuine?" },
  ],
  faq: [
    { q: "PPF or ceramic coating?", a: "PPF is a clear film that takes stone chips and scratches. Ceramic coating is a hard, slick layer that sheds water and dirt. Many owners do both: film on the panels that take hits, coating over everything." },
    { q: "How long is my car with you?", a: "About 3 days for full-body PPF and about 1 day for car ceramic coating, from the studio's job times." },
    { q: "Why do PPF quotes differ so much?", a: "Film brand and line, how many panels are covered, the size of the car, and whether the paint is corrected first. Our PPF page shows the range for each body type and what moves a car within it." },
    { q: "Do you offer pickup and drop?", a: "On request. Call or WhatsApp us and we confirm pickup and drop for your area on the call." },
  ] satisfies FaqItem[],
  end: { title: "Send a photo of your car, get the exact price", primary: { href: "https://wa.me/917406619191", label: "WhatsApp us" } },
};
```

(The four `/guides/*` targets that do not exist until Plan 2b are allowed as links; `check-pages.mjs` in Task 7 reports them as "pending" rather than broken.)

`packages/content/src/site/registry.ts`:

```ts
import type { PageEntry } from "./types.ts";
import { HOME } from "./home.ts";
import { PPF } from "./paint-protection-film.ts";

export const PAGES: PageEntry[] = [
  {
    path: "/",
    title: "PPF and Ceramic Coating in Bangalore | P91 Car Care",
    description: "STEK paint protection film and Nasiol ceramic coating in Adugodi, next to Koramangala. Price ranges by car size, real studio work and written warranty terms.",
    lastmod: "2026-11-26",
    changefreq: "weekly",
    content: HOME,
  },
  {
    path: "/services/paint-protection-film",
    title: "Paint Protection Film (PPF) in Bangalore | P91",
    description: "STEK and P91 Premium PPF in Bangalore: price range by body type, what moves the price, the 5-step fitting process, warranty terms and real jobs from our studio.",
    lastmod: "2026-11-26",
    content: PPF,
  },
];

export function pageFor(path: string): PageEntry {
  const p = PAGES.find((x) => x.path === path);
  if (!p) throw new Error(`no registry entry for ${path}`);
  return p;
}
```

- [ ] **Step 4: Home page**

`apps/web/app/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { HOME } from "@p91/content/site/home";
import { pageFor } from "@p91/content/site/registry";
import { rangesFor, formatRange, type Family } from "@p91/domain/price-ranges";
import { getServices } from "@web/lib/api";
import { ButtonLink } from "@web/components/button-link";
import { Section } from "@web/components/section";
import { Photo } from "@web/components/photo";
import { TrustStrip } from "@web/components/trust-strip";
import { BeforeAfter } from "@web/components/before-after";
import { FaqList } from "@web/components/faq-list";
import { CtaBand } from "@web/components/cta-band";

export const revalidate = 300;
const PAGE = pageFor("/");

export const metadata: Metadata = {
  title: { absolute: PAGE.title },
  description: PAGE.description,
  alternates: { canonical: "/" },
  openGraph: { title: PAGE.title, description: PAGE.description, url: "/", images: [HOME.hero.photo.src] },
};

export default async function HomePage() {
  const rows = await getServices().catch(() => []);
  const range = (f: string) => { const r = rangesFor(f as Family, rows); return r ? formatRange(r.overall) : null; };
  const ppf = range("ppf");

  return (
    <main>
      <section aria-labelledby="home-h1" className="bg-ink">
        <div className="relative h-[460px] md:h-[620px]">
          <Photo src={HOME.hero.photo.src} alt={HOME.hero.photo.alt} width={HOME.hero.photo.width} height={HOME.hero.photo.height} priority className="object-[60%_55%]" />
        </div>
        <div className="wrap">
          <div className="relative -mt-40 flex max-w-[640px] flex-col gap-4 rounded-[16px] border-t-4 border-brand bg-ink p-8 text-white md:-mt-60 md:p-10">
            <h1 id="home-h1" className="m-0 text-[clamp(34px,4.6vw,60px)] font-extrabold">{HOME.hero.h1}</h1>
            <p className="m-0 text-lg text-white/85">{HOME.hero.lead}{ppf && <> Full-body PPF <strong className="text-white">{ppf}</strong> by car size and film.</>}</p>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href={HOME.hero.primary.href} variant="on-ink">{HOME.hero.primary.label}</ButtonLink>
              <ButtonLink href="https://wa.me/917406619191" variant="outline-on-ink">WhatsApp a photo of your car</ButtonLink>
            </div>
            <p className="m-0 text-sm text-on-ink">{HOME.hero.photo.caption}</p>
          </div>
        </div>
      </section>

      <TrustStrip items={HOME.trust} />

      <Section labelledBy="svc-h2">
        <h2 id="svc-h2" className="m-0 text-[clamp(30px,4vw,48px)] font-extrabold">Services and price ranges</h2>
        <p className="mb-8 mt-2 max-w-[680px] text-text-2">Price ranges, not teaser prices. Each service page explains what moves your car up or down its range.</p>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-4">
          {HOME.services.map((s) => (
            <Link key={s.href} href={s.href} className={`grid min-h-[190px] overflow-hidden rounded-[16px] text-ink no-underline ${s.photo ? "grid-cols-[150px_1fr] border border-line" : "bg-ground"}`}>
              {s.photo && <Photo src={s.photo.src} alt={s.photo.alt} width={s.photo.width} height={s.photo.height} />}
              <div className="flex flex-col gap-1.5 p-5">
                <h3 className="m-0 text-[21px] font-bold">{s.name}</h3>
                <p className="m-0 text-[15px] text-text-2">{s.line}</p>
                {range(s.family) && <p className="m-0 mt-auto text-lg font-extrabold tabular-nums">{range(s.family)}</p>}
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <Section labelledBy="ba-h2" tone="ground">
        <h2 id="ba-h2" className="m-0 text-[clamp(30px,4vw,48px)] font-extrabold">Same car, before and after</h2>
        <p className="mb-7 mt-2 max-w-[680px] text-text-2">Real jobs from our studio. Drag the line to compare.</p>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(380px,1fr))] gap-5">
          {HOME.beforeAfter.map((b) => <BeforeAfter key={b.caption} before={b.before} after={b.after} caption={<>{b.caption} · <Link href={b.href} className="font-bold">Exterior detailing</Link></>} />)}
        </div>
      </Section>

      <Section labelledBy="work-h2">
        <h2 id="work-h2" className="mb-7 mt-0 text-[clamp(30px,4vw,48px)] font-extrabold">Recent work at the studio</h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
          {HOME.work.map((w) => (
            <figure key={w.src} className="m-0 flex flex-col gap-2.5">
              <div className="h-[230px] overflow-hidden rounded-[14px]"><Photo src={w.src} alt={w.alt} width={w.width} height={w.height} /></div>
              <figcaption className="flex flex-col"><strong className="text-[17px]">{w.car}</strong><span className="text-sm text-muted">{w.job}</span></figcaption>
            </figure>
          ))}
        </div>
      </Section>

      <Section labelledBy="genuine-h2" tone="ink">
        <div className="flex flex-wrap items-center gap-10">
          <div className="h-[520px] min-w-0 max-w-[420px] flex-[1_1_320px] overflow-hidden rounded-[16px]">
            <Photo src={HOME.genuine.photo.src} alt={HOME.genuine.photo.alt} width={HOME.genuine.photo.width} height={HOME.genuine.photo.height} />
          </div>
          <div className="min-w-0 flex-[1_1_460px]">
            <h2 id="genuine-h2" className="m-0 text-[clamp(30px,4vw,48px)] font-extrabold">{HOME.genuine.h2}</h2>
            <p className="mb-6 mt-4 text-white/85">{HOME.genuine.lead}</p>
            <ol className="m-0 flex list-none flex-col gap-3.5 p-0">
              {HOME.genuine.steps.map((s, i) => (
                <li key={s} className="flex items-center gap-3.5"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-brand font-extrabold text-ink">{i + 1}</span><span>{s}</span></li>
              ))}
            </ol>
          </div>
        </div>
      </Section>

      <Section labelledBy="start-h2" tone="ground">
        <h2 id="start-h2" className="mb-6 mt-0 text-[clamp(28px,3.6vw,44px)] font-extrabold">New to PPF? Start here</h2>
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3 p-0">
          {HOME.startHere.map((g) => <li key={g.href}><Link href={g.href} className="flex min-h-[64px] items-center rounded-[14px] border border-line bg-white px-5 font-bold text-ink no-underline hover:border-action">{g.label}</Link></li>)}
        </ul>
      </Section>

      <Section labelledBy="faq-h2">
        <div className="flex flex-wrap gap-10">
          <h2 id="faq-h2" className="m-0 flex-[1_1_300px] text-[clamp(28px,3.6vw,44px)] font-extrabold">Quick answers</h2>
          <div className="min-w-0 flex-[999_1_520px]"><FaqList items={HOME.faq} /></div>
        </div>
      </Section>

      <CtaBand title={HOME.end.title} primary={HOME.end.primary} secondary={{ href: "/services", label: "All services" }} />
    </main>
  );
}
```

- [ ] **Step 5: Run the registry test and build**

Run: `node --test tests/web-registry.test.mjs` (fails until Task 6 adds `paint-protection-film.ts`; create that file with `export const PPF = {};` now and fill it in Task 6)
Expected: 4 pass.

Run: `npm run web:build`
Expected: success; `/` is ○ or ISR.

- [ ] **Step 6: Commit**

```bash
git add packages/content/src/site apps/web tests/web-registry.test.mjs
git commit -m "feat(web): page registry and the new Home page with live price ranges"
```

---

### Task 6: PPF service page

**Files:**
- Modify: `packages/content/src/site/paint-protection-film.ts`
- Create: `apps/web/app/services/paint-protection-film/page.tsx`

**Interfaces:**
- Consumes: `PriceRangeTable`, `Breadcrumbs`, `FaqList`, `CtaBand`, `serviceSchema`, `rangesFor`.

- [ ] **Step 1: PPF copy**

`packages/content/src/site/paint-protection-film.ts`:

```ts
import type { FaqItem } from "./types.ts";

export const PPF = {
  h1: "Paint protection film in Bangalore",
  eyebrow: "STEK · P91 Premium PPF · Adugodi",
  shortAnswer:
    "Paint protection film is a clear, self-healing urethane film fitted over the paint so stone chips and scratches hit the film, not the car. At P91 full-body PPF costs {range} depending on car size and film line, and the car stays about 3 days in the studio.",
  hero: { src: "/photos/ppf-install-door-handle.webp", alt: "A P91 fitter tucking paint protection film around a door handle in the Adugodi studio", width: 720, height: 1280 },
  rows: [
    { body: "hatchback", label: "Hatchback", examples: "Swift, i20, Altroz", moves: "Standard film at the low end, premium film at the top." },
    { body: "sedan", label: "Sedan", examples: "City, Verna, 3 Series", moves: "Film line, plus door cups and edge wrapping." },
    { body: "suv", label: "SUV", examples: "Creta, XUV700, GLE", moves: "Film line and paint correction on larger panels." },
  ] as const,
  steps: [
    { title: "Inspect and quote", text: "Paint checked under studio light. You see the film roll and the panels the quote covers.", photo: { src: "/photos/creta-stek-ppf-studio.webp", alt: "Hyundai Creta in the P91 studio beside the STEK wall", width: 3420, height: 1925 } },
    { title: "Wash and decontaminate", text: "Tar, iron and hard-water deposits come off so nothing is trapped under the film.", photo: null },
    { title: "Correct the paint", text: "Swirls and light scratches are polished out first, or they stay visible under the film.", photo: { src: "/photos/polish-porsche-bonnet.webp", alt: "Machine polisher beside the bonnet crest of a Porsche", width: 720, height: 1280 } },
    { title: "Fit the film", text: "Panel by panel, edges wrapped where the panel allows.", photo: { src: "/photos/ppf-install-rear-quarter.webp", alt: "P91 installer positioning PPF on the rear quarter of a black SUV", width: 720, height: 1280 } },
    { title: "Cure and hand over", text: "Final inspection, care sheet and the written warranty card with the batch number.", photo: { src: "/photos/vellfire-stek-wall.webp", alt: "Toyota Vellfire beside the STEK wall after PPF", width: 1000, height: 750 } },
  ],
  costFactors: [
    { title: "Film brand and line", text: "Genuine film with a traceable batch costs more than unbranded rolls, and premium lines cost more than standard." },
    { title: "Coverage", text: "Front only (bonnet, bumper, mirrors) versus every painted panel." },
    { title: "Car size and shape", text: "More panels and deeper curves mean more film and more fitting time." },
    { title: "Paint condition", text: "Swirls and scratches must be corrected before film goes on." },
  ],
  coverage: {
    h2: "Front only or full body?",
    paras: [
      "Front-only film covers the panels that take most stone chips on Bangalore roads: bonnet, front bumper, headlamps and mirrors.",
      "Full body also guards doors and quarters against parking-lot scrapes and keeps the finish even across the car.",
    ],
    warranty: "[NEEDS: warranty years per film line and what it covers: yellowing, peeling, cracking]. Written terms at handover.",
    aftercare: "[NEEDS: days before the first wash]. After that, a pH-neutral wash. Light swirls in the film fade in the sun.",
    photo: { src: "/photos/ppf-install-door-edge.webp", alt: "P91 installer fitting clear PPF around the rear door of a black SUV", width: 720, height: 1280 },
  },
  work: [
    { src: "/photos/vellfire-stek-wall.webp", alt: "Toyota Vellfire beside the STEK wall", width: 1000, height: 750, caption: "Toyota Vellfire · STEK PPF" },
    { src: "/photos/creta-stek-ppf-studio.webp", alt: "Hyundai Creta in the P91 studio", width: 3420, height: 1925, caption: "Hyundai Creta · STEK PPF" },
  ],
  faq: [
    { q: "How long does PPF last?", a: "[NEEDS: years per film line, from the warranty card]" },
    { q: "Will PPF change how my paint looks?", a: "Gloss film is close to invisible and adds depth. Matte film turns gloss paint satin; see matte PPF." },
    { q: "Can PPF be removed later?", a: "Yes. Genuine film peels off without lifting factory paint when a studio removes it." },
    { q: "Can I get ceramic coating over PPF?", a: "Yes. Coating on top makes the film easier to wash, and booked together it is done in the same visit." },
    { q: "Do you do front-only PPF?", a: "Yes. Front-only covers the bonnet, bumper, headlamps and mirrors, the panels that take most stone chips." },
    { q: "Is it really STEK?", a: "You see the sealed roll and its batch number before work starts, and the warranty card at handover carries the same batch." },
  ] satisfies FaqItem[],
  related: [
    { href: "/services/ceramic-coating", label: "Ceramic coating over PPF" },
    { href: "/services/paint-protection-film/matte", label: "Matte PPF" },
    { href: "/brands/stek", label: "STEK paint protection film" },
    { href: "/guides/ppf-vs-ceramic-coating-bangalore", label: "PPF vs ceramic coating" },
  ],
};
```

- [ ] **Step 2: The page**

`apps/web/app/services/paint-protection-film/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { PPF } from "@p91/content/site/paint-protection-film";
import { pageFor } from "@p91/content/site/registry";
import { rangesFor, formatRange } from "@p91/domain/price-ranges";
import { getServices } from "@web/lib/api";
import { serviceSchema } from "@web/lib/schema";
import { JsonLd } from "@web/components/json-ld";
import { Breadcrumbs } from "@web/components/breadcrumbs";
import { ButtonLink } from "@web/components/button-link";
import { Section } from "@web/components/section";
import { Photo } from "@web/components/photo";
import { PriceRangeTable } from "@web/components/price-range-table";
import { FaqList } from "@web/components/faq-list";
import { CtaBand } from "@web/components/cta-band";

export const revalidate = 300;
const PAGE = pageFor("/services/paint-protection-film");

export const metadata: Metadata = {
  title: { absolute: PAGE.title },
  description: PAGE.description,
  alternates: { canonical: PAGE.path },
  openGraph: { title: PAGE.title, description: PAGE.description, url: PAGE.path, images: [PPF.hero.src] },
};

export default async function PpfPage() {
  const ranges = rangesFor("ppf", await getServices().catch(() => []));
  const overall = ranges ? formatRange(ranges.overall) : "a range set by car size and film";

  return (
    <main>
      <section aria-labelledby="ppf-h1" className="pb-14 pt-8">
        <div className="wrap">
          <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Services", path: "/services" }, { name: "Paint protection film", path: PAGE.path }]} />
          <div className="flex flex-wrap items-stretch gap-4">
            <div className="max-h-[540px] min-h-[380px] min-w-0 flex-[1_1_380px] overflow-hidden rounded-[16px]">
              <Photo src={PPF.hero.src} alt={PPF.hero.alt} width={PPF.hero.width} height={PPF.hero.height} priority />
            </div>
            <div className="flex min-w-0 flex-[1_1_380px] flex-col justify-center gap-4 rounded-[16px] bg-ink p-8 text-white md:p-10">
              <p className="m-0 text-[15px] font-semibold text-on-ink">{PPF.eyebrow}</p>
              <h1 id="ppf-h1" className="m-0 text-[clamp(34px,4.2vw,56px)] font-extrabold">{PPF.h1}</h1>
              <p className="m-0 text-[34px] font-extrabold tabular-nums">{overall}<span className="text-[15px] font-medium text-white/70"> · full body, by car size and film</span></p>
              <div className="flex flex-wrap gap-3">
                <ButtonLink href="#prices" variant="on-ink">See the range for your car</ButtonLink>
                <ButtonLink href="https://wa.me/917406619191" variant="outline-on-ink">WhatsApp a photo for the exact price</ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="ans-h2" className="pb-16">
        <div className="wrap">
          <div className="flex flex-wrap gap-x-10 gap-y-4 rounded-[16px] border-[1.5px] border-[#D8F0D6] bg-tint px-8 py-7">
            <h2 id="ans-h2" className="m-0 flex-[1_1_220px] text-[22px] font-extrabold">PPF in one paragraph</h2>
            <p className="m-0 flex-[999_1_520px] text-lg">{PPF.shortAnswer.replace("{range}", overall)}</p>
          </div>
        </div>
      </section>

      <Section id="prices" labelledBy="price-h2" tone="ground">
        <h2 id="price-h2" className="m-0 text-[clamp(30px,4vw,52px)] font-extrabold">PPF price range by body type</h2>
        <p className="mb-7 mt-3 max-w-[680px] text-text-2">Full-body film, fitted in the studio. Where your car lands in its range depends on the film line, coverage and paint condition. Send a photo on WhatsApp for the exact figure.</p>
        <PriceRangeTable caption="PPF price range by body type" rows={PPF.rows.map((r) => ({ label: r.label, examples: r.examples, moves: r.moves, range: ranges?.byBody[r.body] ?? null }))} />
      </Section>

      <Section labelledBy="proc-h2">
        <h2 id="proc-h2" className="mb-8 mt-0 text-[clamp(30px,4vw,52px)] font-extrabold">Three days, five steps</h2>
        <ol className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-4 p-0">
          {PPF.steps.map((s, i) => (
            <li key={s.title} className="flex flex-col gap-2.5">
              {s.photo ? <div className="h-[180px] overflow-hidden rounded-[14px]"><Photo src={s.photo.src} alt={s.photo.alt} width={s.photo.width} height={s.photo.height} /></div> : <div aria-hidden="true" className="h-[180px] rounded-[14px] bg-ground" />}
              <span className="text-sm font-bold text-action">Step {i + 1}</span>
              <h3 className="m-0 text-xl font-bold">{s.title}</h3>
              <p className="m-0 text-[15px] text-text-2">{s.text}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section labelledBy="cost-h2" tone="ink">
        <div className="flex flex-wrap gap-10">
          <div className="min-w-0 flex-[1_1_340px]">
            <h2 id="cost-h2" className="m-0 text-[clamp(30px,4vw,48px)] font-extrabold">Why PPF prices in Bangalore vary so much</h2>
            <p className="mt-4 text-white/85">Four things explain most of the gap between quotes. <Link href="/guides/ppf-cost-bangalore" className="font-bold text-on-ink">Read the full PPF cost guide</Link></p>
          </div>
          <dl className="m-0 grid min-w-0 flex-[999_1_520px] grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5">
            {PPF.costFactors.map((c) => <div key={c.title} className="rounded-[14px] bg-white/5 p-5"><dt className="text-[19px] font-bold">{c.title}</dt><dd className="m-0 mt-1.5 text-[15px] text-white/80">{c.text}</dd></div>)}
          </dl>
        </div>
      </Section>

      <Section labelledBy="cov-h2">
        <div className="flex flex-wrap items-center gap-10">
          <div className="min-w-0 flex-[1_1_420px]">
            <h2 id="cov-h2" className="mb-5 mt-0 text-[clamp(30px,4vw,48px)] font-extrabold">{PPF.coverage.h2}</h2>
            {PPF.coverage.paras.map((p) => <p key={p} className="mb-3.5 mt-0 text-text-2">{p}</p>)}
            <p className="mb-3.5 mt-0 text-text-2"><strong className="text-ink">Aftercare:</strong> {PPF.coverage.aftercare} <Link href="/guides/how-much-ppf-does-your-car-need" className="font-bold">How much PPF does your car need?</Link></p>
            <p className="m-0 rounded-[12px] bg-ground px-4 py-4 text-[15px] text-text-2"><strong className="text-ink">Warranty:</strong> {PPF.coverage.warranty}</p>
          </div>
          <div className="h-[440px] min-w-0 flex-[1_1_380px] overflow-hidden rounded-[16px]"><Photo src={PPF.coverage.photo.src} alt={PPF.coverage.photo.alt} width={PPF.coverage.photo.width} height={PPF.coverage.photo.height} /></div>
        </div>
      </Section>

      <Section labelledBy="work-h2" tone="ground">
        <h2 id="work-h2" className="mb-7 mt-0 text-[clamp(30px,4vw,48px)] font-extrabold">PPF jobs from the studio</h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
          {PPF.work.map((w) => <figure key={w.src} className="m-0 flex flex-col gap-2"><div className="h-[220px] overflow-hidden rounded-[14px]"><Photo src={w.src} alt={w.alt} width={w.width} height={w.height} /></div><figcaption className="text-sm text-text-2">{w.caption}</figcaption></figure>)}
        </div>
      </Section>

      <Section labelledBy="faq-h2">
        <div className="flex flex-wrap gap-10">
          <h2 id="faq-h2" className="m-0 flex-[1_1_300px] text-[clamp(30px,3.6vw,46px)] font-extrabold">PPF questions</h2>
          <div className="min-w-0 flex-[999_1_520px]"><FaqList items={PPF.faq} /></div>
        </div>
      </Section>

      <section aria-labelledby="rel-h2" className="pb-20">
        <div className="wrap">
          <h2 id="rel-h2" className="mb-5 mt-0 text-2xl font-extrabold">Often booked with PPF</h2>
          <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3 p-0">
            {PPF.related.map((r) => <li key={r.href}><Link href={r.href} className="flex min-h-[64px] items-center rounded-[14px] border border-line px-5 font-bold text-ink no-underline hover:border-action">{r.label}</Link></li>)}
          </ul>
        </div>
      </section>

      <CtaBand title="See the film before you book" body="Visit the studio in Adugodi, near Koramangala. Open daily." primary={{ href: "https://wa.me/917406619191", label: "WhatsApp us" }} secondary={{ href: "tel:+917406619191", label: "+91 74066 19191" }} />

      <JsonLd data={serviceSchema({ name: "Paint protection film", path: PAGE.path, description: PAGE.description, range: ranges?.overall ?? null })} />
    </main>
  );
}
```

- [ ] **Step 3: Tests and build**

Run: `node --test tests/web-registry.test.mjs && npm run web:build`
Expected: 4 pass; build lists `/services/paint-protection-film`.

- [ ] **Step 4: Commit**

```bash
git add packages/content/src/site/paint-protection-film.ts apps/web/app/services
git commit -m "feat(web): PPF service page with price ranges, process, cost factors and FAQ"
```

---

### Task 7: Sitemap, robots, llms.txt, ship gate and page checks

**Files:**
- Create: `apps/web/app/sitemap.ts`, `apps/web/app/robots.ts`, `apps/web/app/llms.txt/route.ts`, `apps/web/app/not-found.tsx`
- Create: `scripts/web/ship-gate.mjs`, `scripts/web/check-pages.mjs`
- Modify: root `package.json` scripts: `"web:ship-gate": "node --import tsx scripts/web/ship-gate.mjs"`, `"web:check": "node scripts/web/check-pages.mjs"`

**Interfaces:**
- Consumes: `PAGES`.
- Produces: `/sitemap.xml` (registry pages only), `/robots.txt` (production host allows all except `/book/`, `/admin/`, `/api/admin/`, `/booking-confirmation/`; any other host disallows all), `/llms.txt`.

- [ ] **Step 1: Sitemap, robots, llms, 404**

`apps/web/app/sitemap.ts`:

```ts
import type { MetadataRoute } from "next";
import { PAGES } from "@p91/content/site/registry";
import { SITE } from "@web/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map((p) => ({ url: new URL(p.path, SITE.origin).toString(), lastModified: p.lastmod, changeFrequency: p.changefreq ?? "monthly" }));
}
```

`apps/web/app/robots.ts`:

```ts
import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { SITE } from "@web/lib/site";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get("host") ?? "";
  // Only the production host may be crawled; staging and previews are closed.
  if (host !== new URL(SITE.origin).host) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/book/", "/admin/", "/api/admin/", "/booking-confirmation/"] }],
    sitemap: `${SITE.origin}/sitemap.xml`,
  };
}
```

`apps/web/app/llms.txt/route.ts`:

```ts
import { PAGES } from "@p91/content/site/registry";
import { SITE } from "@web/lib/site";

export const revalidate = 3600;

export function GET() {
  const lines = [
    `# ${SITE.name}`,
    "",
    `> Paint protection film (STEK, P91 Premium), ceramic coating (Nasiol) and detailing studio at ${SITE.address.street}, ${SITE.address.city} ${SITE.address.postalCode}. Phone ${SITE.phone}. Prices are shown as ranges by car size; exact quotes on WhatsApp.`,
    "",
    "## Pages",
    ...PAGES.map((p) => `- [${p.title}](${new URL(p.path, SITE.origin)}): ${p.description}`),
  ];
  return new Response(lines.join("\n") + "\n", { headers: { "content-type": "text/plain; charset=utf-8" } });
}
```

`apps/web/app/not-found.tsx`:

```tsx
import Link from "next/link";

export const metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <main className="wrap py-24">
      <h1 className="m-0 text-5xl font-extrabold">This page is not here</h1>
      <p className="mt-4 text-text-2">It may have moved. Try <Link href="/services">all services</Link> or <Link href="/">the home page</Link>.</p>
    </main>
  );
}
```

- [ ] **Step 2: Ship gate**

`scripts/web/ship-gate.mjs`:

```js
#!/usr/bin/env node
/** Lists every registry page whose content still has a [NEEDS ...] marker. Exit 1 if any. */
import { PAGES } from "../../packages/content/src/site/registry.ts";

let blocked = 0;
for (const p of PAGES) {
  const hits = JSON.stringify(p.content).match(/\[NEEDS[^\]]*\]/g) ?? [];
  if (hits.length) { blocked++; console.log(`${p.path}\n  ${[...new Set(hits)].join("\n  ")}`); }
}
console.log(blocked ? `\n${blocked} page(s) blocked from production.` : "All pages clear.");
process.exit(blocked ? 1 : 0);
```

Run: `npm run web:ship-gate`
Expected: exit 1 listing `/` (rating, review count, warranty years, three work captions) and `/services/paint-protection-film` (warranty, aftercare days, lifespan FAQ). This list is what to ask the studio for.

- [ ] **Step 3: Page checks against a running build**

`scripts/web/check-pages.mjs`:

```js
#!/usr/bin/env node
/**
 * Starts the built web app on :3100 and checks every registry page:
 * 200, one <h1>, self canonical on p91carcare.com, title/description match the registry,
 * every JSON-LD block parses, no exact "₹NN,NNN" price outside JSON-LD, and every internal
 * link either resolves to 200 or is listed as pending (pages from later plans).
 */
import { spawn } from "node:child_process";
import { PAGES } from "../../packages/content/src/site/registry.ts";

const BASE = "http://localhost:3100";
const server = spawn("npm", ["run", "start", "-w", "apps/web"], { shell: true, stdio: "ignore" });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
for (let i = 0; i < 60; i++) { try { await fetch(BASE); break; } catch { await wait(1000); } }

let failures = 0;
const fail = (p, m) => { failures++; console.log(`FAIL ${p}: ${m}`); };
const pending = new Set();
for (const page of PAGES) {
  const res = await fetch(BASE + page.path);
  if (res.status !== 200) { fail(page.path, `status ${res.status}`); continue; }
  const html = await res.text();
  if ((html.match(/<h1\b/g) ?? []).length !== 1) fail(page.path, "not exactly one h1");
  const canon = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  if (canon !== new URL(page.path, "https://p91carcare.com").toString().replace(/\/$/, page.path === "/" ? "/" : "")) fail(page.path, `canonical ${canon}`);
  if (!html.includes(`<title>${page.title.replace(/&/g, "&amp;")}</title>`)) fail(page.path, "title differs from registry");
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) { try { JSON.parse(m[1]); } catch { fail(page.path, "JSON-LD does not parse"); } }
  const visible = html.replace(/<script[\s\S]*?<\/script>/g, "");
  if (/₹\d{1,3}(,\d{3})+/.test(visible)) fail(page.path, "exact rupee price in visible HTML");
  for (const href of new Set([...visible.matchAll(/href="(\/[^"#?]*)"/g)].map((m) => m[1]))) {
    if (href.startsWith("/_next") || /\.(png|webp|ico|xml|txt)$/.test(href)) continue;
    const r = await fetch(BASE + href, { redirect: "manual" });
    if (r.status === 404) pending.add(href); else if (r.status >= 400) fail(page.path, `${href} -> ${r.status}`);
  }
}
server.kill();
console.log(`\nPending links (pages planned in 2b/2c): ${[...pending].sort().join(", ") || "none"}`);
console.log(failures ? `${failures} failure(s)` : "All registry pages pass.");
process.exit(failures ? 1 : 0);
```

Add to root `package.json` scripts: `"web:check": "node --import tsx scripts/web/check-pages.mjs"`.

- [ ] **Step 4: Run**

Run:
```bash
npm run web:build && npm run web:check
```
Expected: `All registry pages pass.` and a pending-links list (`/services`, `/services/ceramic-coating`, `/areas/koramangala`, `/guides/...`, `/brands/stek`, ...).

- [ ] **Step 5: Commit**

```bash
git add apps/web/app scripts/web package.json
git commit -m "feat(web): sitemap, host-gated robots, llms.txt, ship gate and page checks"
```

---

### Task 8: Staging preview and handover

**Files:**
- Create: `docs/superpowers/plans/2026-11-26-plan-2a-staging.md` (how to run and what the owner should look at)

- [ ] **Step 1: Run locally for the owner**

Run: `npm run web:build && npm run web:start` (port 3100; no `.env` needed; reads prices from `https://p91carcare.com/api/services`).
Open `http://localhost:3100/` and `http://localhost:3100/services/paint-protection-film` at desktop width and at 390 px.

- [ ] **Step 2: Lighthouse mobile on both pages**

Run: `npx lighthouse http://localhost:3100/ --preset=perf --form-factor=mobile --screenEmulation.mobile --only-categories=performance,seo,accessibility --quiet --chrome-flags="--headless" --output=json --output-path=./.lh-home.json` and the same for the PPF page.
Expected: SEO 100, accessibility ≥ 95, LCP < 2.5 s. Fix any accessibility failure before handover. Delete the `.lh-*.json` files afterwards.

- [ ] **Step 3: Write the staging note and the ship-gate list**

`docs/superpowers/plans/2026-11-26-plan-2a-staging.md`: the two commands above, the Lighthouse scores, the full `npm run web:ship-gate` output (the facts the studio must supply), and the pending-links list.

- [ ] **Step 4: Full verification**

Run:
```bash
npm test 2>&1 | grep -E "^ℹ (tests|pass|fail)"
npm run web:build && npm run web:check
```
Expected: root unit tests pass (684 + new web tests), web check passes.

- [ ] **Step 5: Commit and offer merge**

```bash
git add docs/superpowers/plans/2026-11-26-plan-2a-staging.md
git commit -m "docs: plan 2a staging notes and the studio facts still needed"
```

Merging this branch to `main` is safe for production (the web app is not routed or deployed yet; the CI image is unchanged because the Dockerfile does not build `apps/web`). Ask the owner before merging anyway, since a push to `main` triggers a deploy of the unchanged API image.
