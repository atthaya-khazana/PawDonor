# syntax=docker/dockerfile:1

# =============================================================================
# PawDonor - multi-stage build:  builder  ->  runtime
# The builder has everything needed to compile Next.js (full node_modules,
# TypeScript, Tailwind). The runtime stage only receives the compiled output,
# so the final image stays small and contains no source code or dev tools.
# =============================================================================

# ---------- Stage 1: builder ----------
# Pinned version tag (never "latest") so builds are reproducible.
FROM node:22.12.0-alpine AS builder

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Copy ONLY the dependency manifests first. Docker caches this layer and the
# slow `npm ci` below until package.json / package-lock.json change.
COPY package.json package-lock.json ./
RUN npm ci

# Copy the source code afterwards: editing a file re-runs only the steps from
# here, not the dependency installation above.
COPY . .
RUN npm run build

# ---------- Stage 2: runtime ----------
FROM node:22.12.0-alpine AS runtime

WORKDIR /app
# NODE_ENV=production: optimized Next.js server.
# HOSTNAME=0.0.0.0: listen on all interfaces so the published port works.
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Run as an unprivileged user instead of root.
RUN addgroup -S app && adduser -S app -G app

# COPY (not ADD): ADD can also extract archives and download URLs, which we do
# not need here, so the simpler and more predictable COPY is used.
# "standalone" is a minimal server + only the node_modules the app really uses.
COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static

USER app
EXPOSE 3000

# Exec form: node runs as PID 1 and receives SIGTERM from `docker compose stop`.
CMD ["node", "server.js"]
