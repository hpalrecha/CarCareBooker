# syntax=docker/dockerfile:1

###############################################################################
# Images stage — generates the responsive AVIF/WebP ladder (attached_assets/_opt)
# and the image manifest.
#
# WHY A STAGE OF ITS OWN. Encoding the ladder is by far the slowest part of the
# build (about 6 minutes of CPU on an 8-core machine, against ~25 seconds for
# vite + prerender + esbuild together), and its output is gitignored, so every
# fresh build used to redo all of it. This stage's inputs are only the lockfile,
# the optimiser script and attached_assets/, so Docker's layer cache keys it on
# exactly those: a deploy that changes code but no image reuses it and skips the
# encoding entirely. OPTIMIZE_ALL=1 because this stage cannot see client/src to
# work out which images the site references (see scripts/optimize-images.mjs).
###############################################################################
FROM node:20-bookworm-slim AS images
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY scripts/optimize-images.mjs scripts/optimize-images.mjs
COPY attached_assets attached_assets
RUN OPTIMIZE_ALL=1 node scripts/optimize-images.mjs


###############################################################################
# Build stage — needs the FULL dependency tree, because vite and esbuild are
# devDependencies.
###############################################################################
FROM node:20-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# The generated variants and their manifest come from the images stage above, laid over the
# copy of the source (the manifest in Git is overwritten, as `npm run build` would have done).
COPY --from=images /app/attached_assets/_opt ./attached_assets/_opt
COPY --from=images /app/client/src/lib/image-manifest.json ./client/src/lib/image-manifest.json

# vite    -> dist/public    (client bundle + everything in client/public)
# esbuild -> dist/index.js  (server bundle, --packages=external)
# `build:app` is `npm run build` without its first step, the image optimiser, which the
# images stage already ran (tests/regression.test.mjs keeps the two in step).
RUN npm run build:app


###############################################################################
# Runtime stage
###############################################################################
FROM node:20-bookworm-slim AS runtime
WORKDIR /app

# Deliberately a FULL install, including devDependencies.
#
# esbuild bundles server/vite.ts into dist/index.js, and that file carries
# top-level ESM imports of `vite`, `@vitejs/plugin-react` and
# `@replit/vite-plugin-runtime-error-modal` — all devDependencies. Static
# imports resolve at module load, long before the development/production branch
# is reached, so an install without them dies immediately with
# `ERR_MODULE_NOT_FOUND: Cannot find package 'vite'`.
#
# NOTE: NODE_ENV is set AFTER this step on purpose. `npm ci` silently drops
# devDependencies when NODE_ENV=production is already in the environment, which
# is exactly how an earlier revision of this file shipped an image that could
# not boot. --include=dev makes it explicit even if the order is disturbed
# again, and the assertion below fails the build rather than the container.
COPY package.json package-lock.json ./
RUN npm ci --include=dev && npm cache clean --force
RUN test -f node_modules/vite/package.json \
    && test -f node_modules/@vitejs/plugin-react/package.json \
    || (echo "FATAL: devDependencies missing — dist/index.js imports vite at load time"; exit 1)

# server/index.ts branches on app.get("env"), which reads NODE_ENV. Anything
# other than "production" takes the Vite dev-middleware path instead of
# serveStatic(), so this must be set — but only once the install is done.
ENV NODE_ENV=production
ENV PORT=5000

COPY --from=build /app/dist ./dist

# ---------------------------------------------------------------------------
# THE FIX for the broken service images.
#
# server/index.ts serves /attached_assets from
#   path.resolve(import.meta.dirname, '..', 'attached_assets')  ->  /app/attached_assets
# express.static() on a directory that does not exist silently calls next(), so
# the request falls through to the SPA catch-all and every service image comes
# back as "200 text/html" (the 948-byte index.html shell) instead of an image.
# The previously deployed image was built without this directory, which is why
# all 9 attached_assets-backed services showed broken images on production.
#
# This is ~167 MB and cannot be trimmed: the two large MP4s are referenced by
# client/src/pages/service-landing.tsx.
#
# COPIED FROM THE BUILD STAGE, not from the build context. `npm run build` runs
# scripts/optimize-images.mjs, which writes the responsive AVIF/WebP ladder to
# attached_assets/_opt (~35 MB). That directory only exists inside the build
# stage — it is generated, so it is gitignored and is not in the context. Taking
# this from the context instead, as it used to, would ship a container whose
# /attached_assets/_opt/* URLs all 404 while the manifest insists they exist.
# ---------------------------------------------------------------------------
COPY --from=build /app/attached_assets ./attached_assets

# multer writes admin uploads to process.cwd()/uploads (server/routes.ts creates
# the directory on boot). Bind-mount a host directory over this at run time —
# anything written into the image layer dies with the container, which is how
# the original /uploads service images were lost in the first place.
RUN mkdir -p /app/uploads

EXPOSE 5000

# Catches the startup crash when SESSION_SECRET is missing (this build refuses
# to boot in production without it) rather than leaving a dead container up.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||5000)+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# node directly rather than `npm start`, so SIGTERM reaches the process and
# `docker stop` is not a 10-second kill.
CMD ["node", "dist/index.js"]


###############################################################################
# Slimming this image (optional follow-up, NOT required for this deploy)
#
# Make the Vite import lazy so it leaves the production module graph:
#   - in server/index.ts, replace the static `import { setupVite } from "./vite"`
#     with `const { setupVite } = await import("./vite")` inside the
#     development-only branch;
#   - then the runtime stage can use `npm ci --omit=dev`, dropping roughly
#     250 MB of build tooling.
# Verify with `docker run --rm <image> node -e "import('./dist/index.js')"`
# before shipping it.
###############################################################################
