# ============================================================
# Rahila Labs — Next.js Frontend Dockerfile
# ============================================================
# Multi-stage build for the Next.js frontend application.
# Uses standalone output mode for minimal production image.
#
# Build:  docker build -t rahila-labs-frontend:v1.0 .
# Run:    docker run -d -p 3000:3000 --name frontend rahila-labs-frontend:v1.0
# ============================================================

# ── Stage 1: Install Dependencies ───────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files for dependency installation
# Using package.json only (lockfile may not be committed)
COPY package.json ./
COPY package-lock.json* ./

# Install dependencies
RUN npm ci --legacy-peer-deps 2>/dev/null || npm install --legacy-peer-deps

# ── Stage 2: Build the Application ─────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from the deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set the backend API URL for the build
# This can be overridden at build time with --build-arg
ARG NEXT_PUBLIC_API_URL=http://localhost:5000
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Build the Next.js application in standalone mode
RUN npm run build

# ── Stage 3: Production Runner ──────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy the standalone build output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Set ownership to non-root user
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start the application
CMD ["node", "server.js"]
