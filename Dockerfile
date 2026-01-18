# ============================================================================
# Multi-stage Dockerfile for litstatus.com
# Optimized for production builds with minimal image size
# =============================================================================

# Stage 1: Dependencies
# ============================================================================
FROM node:20-alpine AS deps
WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies with precise versioning
RUN npm ci --only=production && \
    npm cache clean --force

# Stage 2: Builder
# ============================================================================
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments for environment variables
# Only include public variables here - secrets should be runtime env vars
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_PLAUSIBLE_DOMAIN
ARG NEXT_PUBLIC_PLAUSIBLE_SRC
ARG NEXT_PUBLIC_GA_ID
ARG APP_VERSION
ARG BUILD_TIME

# Set build-time environment variables
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV NEXT_PUBLIC_PLAUSIBLE_DOMAIN=${NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
ENV NEXT_PUBLIC_PLAUSIBLE_SRC=${NEXT_PUBLIC_PLAUSIBLE_SRC}
ENV NEXT_PUBLIC_GA_ID=${NEXT_PUBLIC_GA_ID}
ENV APP_VERSION=${APP_VERSION:-0.1.0}
ENV BUILD_TIME=${BUILD_TIME}
ENV NODE_ENV=production

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# Install build dependencies (if any native modules need them)
RUN apk add --no-cache --virtual .gyp \
    python3 \
    make \
    g++ \
    && npm run build \
    && apk del .gyp

# Remove development files from .next
RUN find .next -type f -name "*.map" -delete && \
    find .next -type f -name "*.tsbuildinfo" -delete

# Stage 3: Production Runner
# ============================================================================
FROM node:20-alpine AS runner
WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Copy necessary files from builder
COPY --from=builder /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Create cache and logs directories
RUN mkdir -p /app/.next/cache && \
    chown -R nextjs:nodejs /app/.next/cache

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "server.js"]

# ============================================================================
# Build Notes:
# - Uses standalone output for minimal runtime dependencies
# - Multi-stage build reduces final image size
# - Non-root user improves security
# - Health check for container orchestration
# ============================================================================
