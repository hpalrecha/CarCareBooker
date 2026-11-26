# syntax=docker/dockerfile:1
#
# The new site (apps/web, Next.js standalone) as its own image, separate from the API image
# (./Dockerfile). Built by .github/workflows/build-web-image.yml and run on the host as
# carcarebooker-web on 127.0.0.1:8085 (Plan 3). Build context is the REPO ROOT:
#   docker build -f apps/web/Dockerfile .
#
# The lockfile lives at the root (apps/web is an npm workspace), so installs run there with
# -w apps/web and --include-workspace-root=false: only the web app's dependency tree, never the
# API's (no express, vite, drizzle...). Page copy comes from packages/content and pure logic from
# packages/domain, so those two are the only other sources copied in.

###############################################################################
# deps: the web workspace's dependencies (dev included: next build needs typescript, tailwind).
###############################################################################
FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
RUN npm ci -w apps/web --include-workspace-root=false --no-audit --no-fund

###############################################################################
# build: next build with output "standalone" (apps/web/next.config.ts). Pages are prerendered from
# the live API (GET only) and revalidate from it every 5 minutes at runtime.
###############################################################################
FROM node:20-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 \
    API_ORIGIN=https://p91carcare.com
COPY --from=deps /app/node_modules node_modules
COPY --from=deps /app/apps/web/node_modules apps/web/node_modules
COPY package.json package-lock.json ./
COPY packages/content packages/content
COPY packages/domain packages/domain
COPY apps/web apps/web
RUN npm run build -w apps/web

###############################################################################
# runtime: the traced standalone server plus the files it does not trace (static chunks, public/).
# With outputFileTracingRoot at the repo root, the server sits at apps/web/server.js.
###############################################################################
FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    API_ORIGIN=https://p91carcare.com \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=node:node /app/apps/web/public ./apps/web/public
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "apps/web/server.js"]
