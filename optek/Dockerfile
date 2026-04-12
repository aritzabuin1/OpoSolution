# ── OpoRuta — Multi-stage Dockerfile for Next.js standalone ──────────────────
# Optimized for Railway / any Docker-based platform.
# Build: docker build -t oporuta .
# Run:   docker run -p 3000:3000 --env-file .env.production oporuta

FROM node:20-alpine AS base

# ── Stage 1: Install dependencies ────────────────────────────────────────────
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy lockfile + package manifests
COPY package.json pnpm-lock.yaml ./
COPY .npmrc* ./

# Install pnpm and dependencies
RUN corepack enable && corepack prepare pnpm@10.6.5 --activate
RUN pnpm install --frozen-lockfile --prod=false

# ── Stage 2: Build the application ──────────────────────────────────────────
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Sharp for image optimization in standalone mode
# (devDependency in package.json, but needed at runtime for next/image)
ENV NEXT_SHARP_PATH=/app/node_modules/sharp

# Disable Next.js telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

RUN corepack enable && corepack prepare pnpm@10.6.5 --activate
RUN pnpm build

# ── Stage 3: Production runner ───────────────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output + static assets + public files
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Sharp binary for image optimization
COPY --from=builder /app/node_modules/sharp ./node_modules/sharp
COPY --from=builder /app/node_modules/@img ./node_modules/@img
ENV NEXT_SHARP_PATH=/app/node_modules/sharp

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
