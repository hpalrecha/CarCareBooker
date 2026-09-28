# Graph Report - CarCareBooker  (2026-09-24)

## Corpus Check
- 283 files · ~3,041,490 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 21 file(s) not represented in the graph (top: .css 6, (none) 4, .avif 4)

## Summary
- 2186 nodes · 4553 edges · 128 communities (111 shown, 17 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 19 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `468fd6c3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- dependencies
- react
- crawlable-content.ts
- package.json
- deploy-manual.sh
- server/routes.ts
- cn
- objectStorage.ts
- admin-campaigns.tsx
- ppf-ceramic-landing.tsx
- blog-posts.ts
- schema.ts
- App.tsx
- @neondatabase/serverless
- whatsapp.ts
- campaign-landing.tsx
- ref_fs
- service-landing.tsx
- blog-post.tsx
- campaign-window.itest.mjs
- contact.tsx
- pagination.tsx
- DatabaseStorage
- webhook.ts
- slots.ts
- devDependencies
- ref_node_url
- IStorage
- P91 Car Care Booking Portal
- ref_node_assert
- rate-limit.ts
- landing-booking-e2e.itest.mjs
- client_src_components_ui_tabs_tabs
- challenge-invite-state.ts
- compilerOptions
- service-taxonomy.test.mjs
- phase1-verification.itest.mjs
- seo-service-page.tsx
- home.tsx
- Web design
- menubar.tsx
- optimize-images.mjs
- admin-campaigns.itest.mjs
- ref_node_fs
- components.json
- callback-popup.tsx
- WhatsApp Message Templates for Meta Approval
- wouter
- service-taxonomy.ts
- use-toast.ts
- countdown-render.itest.mjs
- carousel.tsx
- booking-calendar.tsx
- Accessibility
- build-erp-poller-scheduled.mjs
- pending-appointments-report.mjs
- Design tokens: colour, spacing, radius, elevation
- Landing pages and conversion-focused layouts
- booking-payment-integration.itest.mjs
- analytics.ts
- Components
- chart.tsx
- apply-sql.mjs
- Campaign
- TimeSlot
- Redesigning a site you did not build
- Performance-conscious design
- fix-service-content.mjs
- BusinessHour
- scripts
- auto-deploy.test.mjs
- prerender.mjs
- PpfLead
- SiteSetting
- blog-seo.test.mjs
- navigation-menu.tsx
- label.tsx
- payment-race.test.mjs
- build-erp-poller-workflow.mjs
- erp-reconciliation-report.ts
- Verifying the rendered result
- use-upload.ts
- auto-deploy.sh
- run-migration.mjs
- recover-booking.mjs
- Admin
- lead-forms-and-login.test.mjs
- purchase-conversion.test.mjs
- service-page-layout.test.mjs
- sitemap-indexable.itest.mjs
- ObjectUploader.tsx
- Responsive layout
- deploy-gc.sh
- fix-service-durations-and-titles.mjs
- Typography
- ppf-ceramic-pricing.test.mjs
- booking-confirmation.tsx
- build-erp-sync-workflow.mjs
- provenance-audit.mjs
- verify-recovery-candidates.mjs
- ref_node_path
- set-car-polishing-hero-video.mjs
- install-auto-deploy.sh
- nawaf-state.mjs
- set-ceramic-coating-hero-video.mjs
- MemoryStorage
- design-unification.test.mjs
- set-ppf-car-hero-video.mjs
- set-service-hero-video.mjs
- booking-amount.ts
- express-session
- ensure-n8n-pg-credential.mjs
- ui-design/SKILL.md
- vite.config.ts
- optionalDependencies
- p91-healthcheck.sh
- @radix-ui/react-aspect-ratio
- @radix-ui/react-collapsible
- drizzle-kit
- tailwindcss
- 2026-09-23-glass-pricing-updates.mjs
- 2026-09-23-pricing-catalog-updates.mjs
- service-auto-image.test.mjs
- 2026-09-23-car-wash-package-benefits.mjs
- 2026-09-23-ppf-premium-warranty-visible.mjs
- CLAUDE.md

## God Nodes (most connected - your core abstractions)
1. `cn()` - 226 edges
2. `react` - 81 edges
3. `DatabaseStorage` - 51 edges
4. `IStorage` - 49 edges
5. `lucide-react` - 44 edges
6. `@neondatabase/serverless` - 36 edges
7. `formatINR()` - 35 edges
8. `ws` - 35 edges
9. `registerRoutes()` - 33 edges
10. `@tanstack/react-query` - 30 edges

## Surprising Connections (you probably didn't know these)
- `Pass/fail — a change that fails any of these is not shippable` --references--> `h1()`  [INFERRED]
  .claude/skills/web-design/references/review-criteria.md → client/src/lib/crawlable-content.ts
- `Per page` --references--> `h2()`  [INFERRED]
  .claude/skills/web-design/references/seo-structure.md → client/src/lib/crawlable-content.ts
- `BookingCalendarProps` --references--> `BusinessHour`  [EXTRACTED]
  client/src/components/booking-calendar.tsx → shared/schema.ts
- `slugFor()` --calls--> `getLandingPage()`  [EXTRACTED]
  tests/landing-booking-e2e.itest.mjs → client/src/lib/landing-pages.ts
- `registerRoutes()` --calls--> `buildLlmsTxt()`  [EXTRACTED]
  server/routes.ts → client/src/lib/llms-txt.ts

## Import Cycles
- None detected.

## Communities (128 total, 17 thin omitted)

### Community 0 - "dependencies"
Cohesion: 0.02
Nodes (87): dependencies, bcryptjs, class-variance-authority, clsx, cmdk, compression, connect-pg-simple, cors (+79 more)

### Community 1 - "react"
Cohesion: 0.05
Nodes (35): AccordionContent, AccordionItem, AccordionTrigger, Avatar, AvatarFallback, AvatarImage, Checkbox, HoverCardContent (+27 more)

### Community 2 - "crawlable-content.ts"
Cohesion: 0.05
Nodes (61): Before/after design review criteria, Capture, both times, Improvement — did it get better?, Pass/fail — a change that fails any of these is not shippable, Reporting a review, The honest questions, Checklist, Do not let pages compete with each other (+53 more)

### Community 3 - "package.json"
Cohesion: 0.04
Nodes (50): license, name, type, version, autoprefixer, bufferutil, clsx, cors (+42 more)

### Community 4 - "deploy-manual.sh"
Cohesion: 0.10
Nodes (41): APP, APP_PORT, backup_uploads(), CANDIDATE_PORT, capture_run_config(), check_app(), check_public_matches(), container_env() (+33 more)

### Community 5 - "server/routes.ts"
Cohesion: 0.09
Nodes (26): bcryptjs, connect-pg-simple, ref_crypto, multer, nodemailer, razorpay, authenticateAdmin(), comparePassword() (+18 more)

### Community 6 - "cn"
Cohesion: 0.04
Nodes (89): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator(), Command (+81 more)

### Community 7 - "objectStorage.ts"
Cohesion: 0.11
Nodes (23): express, @google-cloud/storage, BaseObjectAccessGroup, canAccessObject(), createObjectAccessGroup(), getObjectAclPolicy(), isPermissionAllowed(), ObjectAccessGroup (+15 more)

### Community 8 - "admin-campaigns.tsx"
Cohesion: 0.09
Nodes (40): Campaign, emptyForm, FormState, LANDING_PAGES, ServiceRow, STATE_STYLES, AdminServiceForm(), Card (+32 more)

### Community 9 - "ppf-ceramic-landing.tsx"
Cohesion: 0.08
Nodes (55): AdminServiceFormProps, formSchema, FormValues, BookingModalProps, formatPosted(), ReelCard(), QuoteForm(), quoteSchema (+47 more)

### Community 10 - "blog-posts.ts"
Cohesion: 0.18
Nodes (23): BLOG_INDEX_DESCRIPTION, BLOG_INDEX_TITLE, BLOG_POSTS, BlogBlock, blogCategories(), categoryDescription(), categoryFromSlug(), categorySlug() (+15 more)

### Community 11 - "schema.ts"
Cohesion: 0.09
Nodes (30): drizzle-orm, drizzle-zod, db, pool, adminLoginSchema, admins, blackoutDates, bookingFormSchema (+22 more)

### Community 12 - "App.tsx"
Cohesion: 0.13
Nodes (14): AdminDashboard, AdminLogin, AdminWhatsApp, BlogIndex, BookingConfirmation, ClarityRouteGuard(), Products, ServiceLanding (+6 more)

### Community 13 - "@neondatabase/serverless"
Cohesion: 0.06
Nodes (22): @neondatabase/serverless, ws, APPLY, JSON_COLS, pool, UPDATES, pool, pool (+14 more)

### Community 14 - "whatsapp.ts"
Cohesion: 0.12
Nodes (14): node-cron, maskPhoneDigits(), normalizeIndianMobile(), PhoneNormalizeResult, bad(), ok(), schedulerService, maskPhone() (+6 more)

### Community 15 - "campaign-landing.tsx"
Cohesion: 0.13
Nodes (26): CampaignLanding, BookingModal(), CampaignOffer(), CampaignOfferProps, HeroOfferStrip(), HeroOfferStripProps, Navbar(), VehicleSelector() (+18 more)

### Community 16 - "ref_fs"
Cohesion: 0.06
Nodes (33): ref_fs, ref_path, ref_url, APPLY, backup, PLAN, pool, repoRoot (+25 more)

### Community 17 - "service-landing.tsx"
Cohesion: 0.12
Nodes (22): ServiceCard(), ServiceCardProps, HeroVideoGateOptions, useHeroVideoGate(), deriveCategory(), DURATION_RANGE_OVERRIDES, formatServiceTime(), cleanIncluded() (+14 more)

### Community 18 - "blog-post.tsx"
Cohesion: 0.08
Nodes (32): BlogPost, BY_BASENAME, findVariants(), ImageWithFallback(), MANIFEST, ManifestEntry, Props, srcSet() (+24 more)

### Community 19 - "campaign-window.itest.mjs"
Cohesion: 0.15
Nodes (22): CAMPAIGN_LANDING_PAGES, campaignFreeBookingForService(), CampaignInput, campaignInputSchema, effectiveCampaignForLandingPage(), findOverlaps(), isoInstant, validateCampaignInput() (+14 more)

### Community 20 - "contact.tsx"
Cohesion: 0.08
Nodes (35): Contact, Services, MenuKey, MENUS, SiteHeader(), SeoMeta, upsert(), useSeoMeta() (+27 more)

### Community 21 - "pagination.tsx"
Cohesion: 0.09
Nodes (22): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle (+14 more)

### Community 22 - "DatabaseStorage"
Cohesion: 0.12
Nodes (4): DatabaseStorage, SlotFullError, Booking, InsertBooking

### Community 23 - "webhook.ts"
Cohesion: 0.13
Nodes (22): ref_http, ref_net, booking, check(), main(), Mode, server, service (+14 more)

### Community 24 - "slots.ts"
Cohesion: 0.16
Nodes (15): OK, SlotValidationDeps, SlotValidationInput, SlotValidationResult, base, validateAppointmentSlot(), AvailabilityInput, AvailabilityResult (+7 more)

### Community 25 - "devDependencies"
Cohesion: 0.08
Nodes (24): devDependencies, autoprefixer, cross-env, drizzle-kit, esbuild, postcss, @replit/vite-plugin-cartographer, @replit/vite-plugin-runtime-error-modal (+16 more)

### Community 26 - "ref_node_url"
Cohesion: 0.15
Nodes (6): esbuild, ref_node_url, repoRoot, repoRoot, repoRoot, SERVICE

### Community 27 - "IStorage"
Cohesion: 0.12
Nodes (3): IStorage, InsertService, Service

### Community 28 - "P91 Car Care Booking Portal"
Cohesion: 0.07
Nodes (27): Admin Panel Features, Backend Architecture, Booking Process, Communication Services, Customer Booking Flow, Data Flow, Data Models, Database Architecture (+19 more)

### Community 29 - "ref_node_assert"
Cohesion: 0.11
Nodes (13): ref_node_assert, ref_node_test, storage, repoRoot, { resolveBookingAmount, isFreeBookingWindow, DEFAULT_BOOKING_FEE, FULL_PRICE_SLUG }, routeCode, src, { isValidMobile } (+5 more)

### Community 30 - "rate-limit.ts"
Cohesion: 0.14
Nodes (17): AttributionInput, attributionSchema, deriveSource(), EMPTY, isControlChar(), MAX_ATTRIBUTION_LENGTH, parseAttribution(), sanitise() (+9 more)

### Community 31 - "landing-booking-e2e.itest.mjs"
Cohesion: 0.11
Nodes (16): getLandingPage(), db, req(), SlotFullError, storage, AD_ATTRIBUTION, bookFromLanding(), CATALOGUE (+8 more)

### Community 33 - "challenge-invite-state.ts"
Cohesion: 0.17
Nodes (17): aDialogIsOpen(), canShowNow(), CHALLENGE_DONE_KEY, challengeAlreadyCompleted(), INVITE_DELAY_MS, INVITE_MAX_SNOOZES, INVITE_MAX_WAIT_MS, INVITE_RETRY_MS (+9 more)

### Community 34 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, baseUrl, esModuleInterop, incremental, jsx, lib, module (+11 more)

### Community 35 - "service-taxonomy.test.mjs"
Cohesion: 0.17
Nodes (11): CSS_OUT, FAMILIES, main(), OUT_DIR, ROOT, slug(), { deriveCategory, deriveVehicle, fitsVehicle, matchesQuery }, factory (+3 more)

### Community 36 - "phase1-verification.itest.mjs"
Cohesion: 0.07
Nodes (28): CampaignTracking(), Attribution, __ATTRIBUTION_STORAGE_KEY, __ATTRIBUTION_TTL_MS, captureAttribution(), clean(), externalReferrer(), getAttribution() (+20 more)

### Community 37 - "seo-service-page.tsx"
Cohesion: 0.24
Nodes (11): SeoServicePage, getSeoPage(), SEO_PAGES, SeoPage, SeoPageFaq, SeoPageSection, cleanIncluded(), firstSentence() (+3 more)

### Community 38 - "home.tsx"
Cohesion: 0.19
Nodes (16): BlogCarousel(), BlogCarouselProps, ScrollRow(), Props, TransformationCTA(), BlogPost, CanonicalService, resolveCanonical() (+8 more)

### Community 39 - "Web design"
Cohesion: 0.14
Nodes (13): 1. Inspect, 2. Understand the existing system, 3. Plan, 4. Implement, 5. Verify, 6. Review, Avoid the generic-AI look, Core principles (+5 more)

### Community 40 - "menubar.tsx"
Cohesion: 0.11
Nodes (12): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+4 more)

### Community 41 - "optimize-images.mjs"
Cohesion: 0.16
Nodes (16): sharp, collect(), FORCE, isFresh(), loadSharp(), log(), main(), MANIFEST (+8 more)

### Community 42 - "admin-campaigns.itest.mjs"
Cohesion: 0.18
Nodes (13): AdminCampaigns(), postCampaign(), browserIsOutsideIst(), formatIst(), instantToIstLocal(), IST_LABEL, IST_OFFSET, istLocalToInstant() (+5 more)

### Community 43 - "ref_node_fs"
Cohesion: 0.15
Nodes (8): LANDING_PAGES, ref_node_fs, APPLY, IDS, pool, repoRoot, repoRoot, script

### Community 44 - "components.json"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 45 - "callback-popup.tsx"
Cohesion: 0.28
Nodes (14): CallbackPopup(), CALLBACK_DELAY_MS, CALLBACK_MAX_WAIT_MS, CALLBACK_RETRY_MS, CALLBACK_SEEN_KEY, CALLBACK_SENT_KEY, callbackAlreadyRequested(), callbackPopupAlreadyShown() (+6 more)

### Community 46 - "WhatsApp Message Templates for Meta Approval"
Cohesion: 0.15
Nodes (12): Code Implementation Variables, For Confirmation Message:, For Reminder Message:, Meta Template Submission Guidelines, Sample Data for Testing:, Template 1: Booking Confirmation, Template 2: Booking Reminder, Template Content: (+4 more)

### Community 47 - "wouter"
Cohesion: 0.15
Nodes (18): PrivacyPolicy, RefundPolicy, TermsConditions, Footer(), Header(), NAV_LINKS, useServicesLink(), BrandFooter() (+10 more)

### Community 48 - "service-taxonomy.ts"
Cohesion: 0.18
Nodes (17): ServiceFilter(), ServiceFilterProps, ServiceLike, CATEGORY_ORDER, CATEGORY_RULES, deriveVehicle(), fitsVehicle(), haystack() (+9 more)

### Community 49 - "use-toast.ts"
Cohesion: 0.11
Nodes (25): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, client_src_components_ui_toast_toastprovider, ToastTitle (+17 more)

### Community 50 - "countdown-render.itest.mjs"
Cohesion: 0.09
Nodes (25): App(), CampaignCountdown(), CampaignCountdownProps, UNITS, IMAGE_PLACEHOLDER, ActiveCampaign, CampaignResponse, UseCampaignResult (+17 more)

### Community 51 - "carousel.tsx"
Cohesion: 0.17
Nodes (14): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+6 more)

### Community 52 - "booking-calendar.tsx"
Cohesion: 0.19
Nodes (7): BookingCalendar(), BookingCalendarProps, todayInIST(), toKey(), WEEKDAY_LABELS, BlackoutDate, InsertBlackoutDate

### Community 53 - "Accessibility"
Cohesion: 0.17
Nodes (11): Accessibility, Colour is never the only signal, Contrast, Images, Keyboard, Live regions, Motion, Names (+3 more)

### Community 54 - "build-erp-poller-scheduled.mjs"
Cohesion: 0.14
Nodes (10): claimSql, connections, erp, ERP_CRED, markFailed, markSynced, nodes, pg (+2 more)

### Community 55 - "pending-appointments-report.mjs"
Cohesion: 0.15
Nodes (11): byPhoneDate, byYear, csv, csvEsc(), fields, header, pool, rows (+3 more)

### Community 56 - "Design tokens: colour, spacing, radius, elevation"
Cohesion: 0.17
Nodes (11): Adding a token, Choosing neutrals, Colour, Dark mode, Design tokens: colour, spacing, radius, elevation, Elevation, Finding the existing system, How many colours (+3 more)

### Community 57 - "Landing pages and conversion-focused layouts"
Cohesion: 0.18
Nodes (10): CTAs, Forms, Landing pages and conversion-focused layouts, Measuring, Message match, Offer clarity, Structure, The first screen (+2 more)

### Community 58 - "booking-payment-integration.itest.mjs"
Cohesion: 0.19
Nodes (9): bookingPayload(), chargedAmounts, createBooking(), db, futureDate(), notifications, post(), SlotFullError (+1 more)

### Community 59 - "analytics.ts"
Cohesion: 0.36
Nodes (6): reportedPurchases, track(), trackBeginCheckout(), trackFreeBooking(), trackPurchase(), Window

### Community 60 - "Components"
Cohesion: 0.20
Nodes (9): Buttons, Cards, Components, Empty, loading, error states, Forms, Modals and dialogs, Navigation, Selection controls (+1 more)

### Community 61 - "chart.tsx"
Cohesion: 0.23
Nodes (10): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, getPayloadConfigFromPayload(), THEMES (+2 more)

### Community 62 - "apply-sql.mjs"
Cohesion: 0.29
Nodes (6): ref_pg, code, env, forbidden, pool, sql

### Community 65 - "Redesigning a site you did not build"
Cohesion: 0.20
Nodes (9): Content you did not write, Default position, Inspect first, always, Preserve, Redesigning a site you did not build, Scoping, Sequence, Shared components (+1 more)

### Community 66 - "Performance-conscious design"
Cohesion: 0.22
Nodes (8): Animation, Checking, CSS and JS, Fonts, Images, Performance-conscious design, The three that matter, Third parties

### Community 67 - "fix-service-content.mjs"
Cohesion: 0.18
Nodes (8): APPLY, backup, BIKE, BIKE_CONTENT, BIKE_FAQ_REPLACEMENTS, pool, repoRoot, STEK_ROWS

### Community 69 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, check, db:push, dev, images:force, start, test (+2 more)

### Community 70 - "auto-deploy.test.mjs"
Cohesion: 0.20
Nodes (7): ref_node_child_process, ref_node_os, AUTO, GC, repoRoot, SHA_NEW, SHA_OLD

### Community 71 - "prerender.mjs"
Cohesion: 0.27
Nodes (11): breadcrumbs(), die(), DIST, esc(), headFor(), HERO_IMAGE_WIDTHS, heroPreloadTag(), loadContent() (+3 more)

### Community 74 - "blog-seo.test.mjs"
Cohesion: 0.20
Nodes (5): editorial, index, posts, repoRoot, routes

### Community 75 - "navigation-menu.tsx"
Cohesion: 0.25
Nodes (8): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport, @radix-ui/react-navigation-menu

### Community 76 - "label.tsx"
Cohesion: 0.14
Nodes (15): Alert, AlertDescription, AlertTitle, alertVariants, Label, labelVariants, ToggleGroup, ToggleGroupContext (+7 more)

### Community 77 - "payment-race.test.mjs"
Cohesion: 0.28
Nodes (6): ref_node_crypto, makeSystem(), repoRoot, routeCode, signPayment(), verifyPaymentSignature()

### Community 78 - "build-erp-poller-workflow.mjs"
Cohesion: 0.22
Nodes (6): claimSql, connections, ERP_CRED, markFailed, markSynced, nodes

### Community 79 - "erp-reconciliation-report.ts"
Cohesion: 0.33
Nodes (8): digits10(), erpBase, erpGet(), erpToken, main(), maskEmail(), maskPhone(), SINCE

### Community 80 - "Verifying the rendered result"
Cohesion: 0.22
Nodes (8): Checklist per viewport, Getting a real viewport, Interaction, not just render, Measure, do not eyeball, Reporting, The rule, Then the project's own checks, Verifying the rendered result

### Community 81 - "use-upload.ts"
Cohesion: 0.25
Nodes (6): IMPORTANT: This function receives the UppyFile object from Uppy., IMPORTANT: Send JSON metadata, NOT the file itself., UploadMetadata, UploadResponse, UseUploadOptions, @uppy/core

### Community 82 - "auto-deploy.sh"
Cohesion: 0.39
Nodes (6): die(), g(), note(), running_revision(), auto-deploy.sh script, STATE_DIR

### Community 83 - "run-migration.mjs"
Cohesion: 0.32
Nodes (5): splitStatements(), dryRun, pool, sqlText, repoRoot

### Community 84 - "recover-booking.mjs"
Cohesion: 0.29
Nodes (7): erpBase, erpGet(), erpToken, log(), marked(), pool, USE_PROD

### Community 86 - "lead-forms-and-login.test.mjs"
Cohesion: 0.29
Nodes (7): code(), DEAD_CLASSES, login, quote, read(), repoRoot, schema

### Community 87 - "purchase-conversion.test.mjs"
Cohesion: 0.25
Nodes (4): mod, PAYMENT, repoRoot, src

### Community 88 - "service-page-layout.test.mjs"
Cohesion: 0.18
Nodes (9): hero, heroEnd, heroStart, overview, overviewEnd, overviewStart, raw, repoRoot (+1 more)

### Community 89 - "sitemap-indexable.itest.mjs"
Cohesion: 0.25
Nodes (6): built, DIST, repoRoot, SERVICE_SLUGS, services, SlotFullError

### Community 90 - "ObjectUploader.tsx"
Cohesion: 0.29
Nodes (5): ObjectUploaderProps, IMPORTANT: This receives the file object - use file.name, file.size, file.type, @uppy/aws-s3, @uppy/dashboard, @uppy/react

### Community 91 - "Responsive layout"
Cohesion: 0.25
Nodes (7): Breakpoints, Images, Layout patterns worth knowing, Reordering on mobile, Responsive layout, Traps, Widths that matter

### Community 92 - "deploy-gc.sh"
Cohesion: 0.52
Nodes (6): act(), die(), disk_free(), note(), deploy-gc.sh script, STATE_DIR

### Community 93 - "fix-service-durations-and-titles.mjs"
Cohesion: 0.33
Nodes (6): APPLY, DURATION_FIXES, fmtDuration(), main(), pool, TITLE_FIXES

### Community 94 - "Typography"
Cohesion: 0.25
Nodes (7): Common mistakes, Hierarchy without size, Pairing, Scale, Setting text, Typography, Use what the project already loads

### Community 95 - "ppf-ceramic-pricing.test.mjs"
Cohesion: 0.29
Nodes (5): CATALOGUE, page, { PPF_CERAMIC_PRICE_SLUGS, resolveCataloguePrice, maxDiscountPercent }, repoRoot, src

### Community 96 - "booking-confirmation.tsx"
Cohesion: 0.36
Nodes (4): Badge(), BadgeProps, badgeVariants, Skeleton()

### Community 97 - "build-erp-sync-workflow.mjs"
Cohesion: 0.33
Nodes (3): connections, ERP_CRED, nodes

### Community 99 - "verify-recovery-candidates.mjs"
Cohesion: 0.33
Nodes (3): erpBase, erpToken, pool

### Community 100 - "ref_node_path"
Cohesion: 0.25
Nodes (4): ref_node_path, FIXED_PAGES, repoRoot, repoRoot

### Community 101 - "set-car-polishing-hero-video.mjs"
Cohesion: 0.25
Nodes (7): APPLY, head, onDisk, pool, repoRoot, sizeMb, TARGET

### Community 102 - "install-auto-deploy.sh"
Cohesion: 0.80
Nodes (4): act(), die(), note(), install-auto-deploy.sh script

### Community 103 - "nawaf-state.mjs"
Cohesion: 0.40
Nodes (3): erpBase, erpToken, pool

### Community 104 - "set-ceramic-coating-hero-video.mjs"
Cohesion: 0.25
Nodes (7): APPLY, head, onDisk, pool, repoRoot, sizeMb, TARGET

### Community 106 - "design-unification.test.mjs"
Cohesion: 0.40
Nodes (5): code(), FULL_P91X, read(), repoRoot, UNIFIED

### Community 107 - "set-ppf-car-hero-video.mjs"
Cohesion: 0.25
Nodes (7): APPLY, head, onDisk, pool, repoRoot, sizeMb, TARGETS

### Community 108 - "set-service-hero-video.mjs"
Cohesion: 0.25
Nodes (7): APPLY, head, onDisk, pool, repoRoot, sizeMb, TARGET

### Community 109 - "booking-amount.ts"
Cohesion: 0.32
Nodes (7): DEFAULT_BOOKING_FEE, FULL_PRICE_SLUG, isFreeBookingWindow(), resolveBookingAmount(), ResolveBookingAmountInput, ResolvedBookingAmount, usableAmount()

### Community 110 - "express-session"
Cohesion: 0.50
Nodes (3): express-session, express-session, SessionData

### Community 111 - "ensure-n8n-pg-credential.mjs"
Cohesion: 0.50
Nodes (3): apiKey, body, u

### Community 112 - "ui-design/SKILL.md"
Cohesion: 0.33
Nodes (5): Anti-patterns specific to data-driven UI, Execution Steps, Role and Objective, This repo (P91 Car Care), Verify before claiming it looks good

### Community 113 - "vite.config.ts"
Cohesion: 0.33
Nodes (3): @replit/vite-plugin-runtime-error-modal, vite, @vitejs/plugin-react

### Community 114 - "optionalDependencies"
Cohesion: 0.67
Nodes (3): optionalDependencies, bufferutil, sharp

### Community 122 - "2026-09-23-glass-pricing-updates.mjs"
Cohesion: 0.47
Nodes (5): APPLY, getRow(), main(), pool, substitute()

### Community 123 - "2026-09-23-pricing-catalog-updates.mjs"
Cohesion: 0.40
Nodes (5): APPLY, getRow(), main(), pool, NOTE: the `duration` column is minutes and only carries a single number, so

### Community 124 - "service-auto-image.test.mjs"
Cohesion: 0.33
Nodes (5): autoImageSrc, { deriveAutoImage, AUTO_IMAGE_CANDIDATES, IMAGE_DIR }, factory, repoRoot, taxonomySrc

### Community 125 - "2026-09-23-car-wash-package-benefits.mjs"
Cohesion: 0.40
Nodes (3): APPLY, NEW_WHAT_INCLUDED, pool

### Community 126 - "2026-09-23-ppf-premium-warranty-visible.mjs"
Cohesion: 0.40
Nodes (3): APPLY, pool, SLUGS

## Knowledge Gaps
- **800 isolated node(s):** `ObjectUploaderProps`, `LANDING_PAGES`, `Campaign`, `ServiceRow`, `emptyForm` (+795 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 988 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `package.json`, `cn`, `admin-campaigns.tsx`, `ppf-ceramic-landing.tsx`, `App.tsx`, `campaign-landing.tsx`, `service-landing.tsx`, `blog-post.tsx`, `contact.tsx`, `pagination.tsx`, `seo-service-page.tsx`, `home.tsx`, `menubar.tsx`, `callback-popup.tsx`, `wouter`, `service-taxonomy.ts`, `use-toast.ts`, `countdown-render.itest.mjs`, `carousel.tsx`, `booking-calendar.tsx`, `chart.tsx`, `navigation-menu.tsx`, `label.tsx`, `use-upload.ts`, `ObjectUploader.tsx`, `booking-confirmation.tsx`?**
  _High betweenness centrality (0.139) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `booking-confirmation.tsx`, `react`, `admin-campaigns.tsx`, `ppf-ceramic-landing.tsx`, `menubar.tsx`, `navigation-menu.tsx`, `label.tsx`, `use-toast.ts`, `carousel.tsx`, `pagination.tsx`, `chart.tsx`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **What connects `ObjectUploaderProps`, `LANDING_PAGES`, `Campaign` to the rest of the system?**
  _800 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.022988505747126436 - nodes in this community are weakly interconnected._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.051418439716312055 - nodes in this community are weakly interconnected._
- **Should `crawlable-content.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0546583850931677 - nodes in this community are weakly interconnected._