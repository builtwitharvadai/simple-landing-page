# Multi-stage build for optimized production image
FROM node:20-alpine AS builder

# Install markdown-to-html converter
RUN npm install -g marked

# Set working directory
WORKDIR /build

# Copy source files
COPY index.html styles.css script.js ./
COPY assets/ ./assets/ 2>/dev/null || true

# Create directory for converted files
RUN mkdir -p /build/converted

# Copy markdown files if they exist
RUN cp *.md . 2>/dev/null || true

# Convert markdown to HTML (if markdown files exist)
RUN for file in *.md; do \
      if [ -f "$file" ]; then \
        marked "$file" -o "converted/${file%.md}.html"; \
      fi; \
    done 2>/dev/null || true

# Production stage
FROM nginx:alpine

# Install security updates
RUN apk update && \
    apk upgrade && \
    apk add --no-cache \
      ca-certificates \
      tzdata && \
    rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nginx && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx 2>/dev/null || true

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy application files
COPY --chown=nginx:nginx . /usr/share/nginx/html/

# Copy converted markdown files from builder stage
COPY --from=builder --chown=nginx:nginx /build/converted/*.html /usr/share/nginx/html/docs/ 2>/dev/null || true

# Set proper permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Switch to non-root user
USER nginx

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# Build arguments for metadata
ARG BUILD_DATE
ARG VCS_REF

# Labels
LABEL maintainer="your-email@example.com" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.url="https://github.com/builtwitharvadai/simple-landing-page" \
      org.opencontainers.image.source="https://github.com/builtwitharvadai/simple-landing-page" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.vendor="Built with Arvad AI" \
      org.opencontainers.image.title="Simple Landing Page" \
      org.opencontainers.image.description="Production-ready static landing page with Nginx"