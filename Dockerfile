FROM node:lts-alpine AS build

WORKDIR /build

# Copy package files and install all dependencies (including dev dependencies for build)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code and configuration files
COPY . .

# Generate Ponder types and build
RUN npm run codegen

# Production stage
FROM node:lts-alpine

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S ponder -u 1001

# Copy package files
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application files from build stage
COPY --from=build --chown=ponder:nodejs /build/src ./src
COPY --from=build --chown=ponder:nodejs /build/ponder.config.ts ./ponder.config.ts
COPY --from=build --chown=ponder:nodejs /build/ponder.schema.ts ./ponder.schema.ts
COPY --from=build --chown=ponder:nodejs /build/ponder-env.d.ts ./ponder-env.d.ts

RUN chown -R ponder:nodejs /app

# Switch to non-root user
USER ponder

# Expose Ponder's default port
EXPOSE 42069

# Health check - Ponder typically exposes metrics/health on the main port
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:42069/metrics || exit 1

# Start the application
CMD ["npm", "start"]
