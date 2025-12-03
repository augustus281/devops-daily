# =============================================================================
# Dockerfile for DevOps Daily
# Multi-stage build for optimized image size
# =============================================================================

# =============================================================================
# Stage 1: Dependencies
# Install production dependencies in a separate stage for better caching
# =============================================================================
FROM node:20-bullseye-slim AS deps

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files for dependency installation
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./


# Install dependencies
RUN pnpm install --frozen-lockfile

# =============================================================================
# Stage 2: Builder
# Build the Next.js application
# =============================================================================
FROM node:20-bullseye-slim AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy all source files
COPY . .

# Set environment to production for build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
# Using build:cf for faster builds (skips image generation)
# For full build with image generation, use: RUN pnpm run build
RUN pnpm run build:cf

# =============================================================================
# Stage 3: Production Runner
# Minimal image to serve the static export
# =============================================================================
FROM nginx:alpine AS runner

# Add labels for better container management
LABEL org.opencontainers.image.title="DevOps Daily"
LABEL org.opencontainers.image.description="A modern content platform for DevOps professionals"
LABEL org.opencontainers.image.source="https://github.com/The-DevOps-Daily/devops-daily"
LABEL org.opencontainers.image.licenses="MIT"

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy custom nginx configuration for SPA routing
COPY <<EOF /etc/nginx/conf.d/default.conf
server {
    listen 80;
    listen [::]:80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # (Cache static assets configuration is fine)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    location / {
      try_files \$uri $uri.html /index.html;
    }

    # (Error page handling is fine)
    error_page 404 /404.html;
    location = /404.html {
      internal;
    }
}
EOF

# Copy the static export from builder stage
COPY --from=builder /app/out /usr/share/nginx/html

# Create non-root user for security and adjust permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /run/nginx.pid && \
    chown -R nginx:nginx /run/nginx.pid

# Switch to non-root user 'nginx' (exists by default in nginx:alpine)
USER nginx

# Expose port 80 (matches listen 80 in nginx.conf)
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
