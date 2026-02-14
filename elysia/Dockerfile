# Use multi-stage build for smaller final image
FROM oven/bun:1.1-slim as base

# Set working directory
WORKDIR /app

# Install dependencies in a separate layer for better caching
FROM base as deps

COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile


# Production dependencies only
FROM base as production-deps

COPY package.json bun.lockb ./
RUN bun install --production --frozen-lockfile


# Build stage (if needed for future builds)
FROM base as build

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Type checking
RUN bun run typecheck


# Production image
FROM base as production

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copy production dependencies
COPY --from=production-deps --chown=appuser:appuser /app/node_modules ./node_modules

# Copy application code
COPY --chown=appuser:appuser package.json ./
COPY --chown=appuser:appuser tsconfig.json ./
COPY --chown=appuser:appuser src ./src

# Set environment to production
ENV NODE_ENV=production

# Use non-root user
USER appuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun fetch http://localhost:3000/health || exit 1

# Start application
CMD [ "bun", "src/index.ts" ]
