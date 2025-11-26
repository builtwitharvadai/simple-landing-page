# Multi-stage build for production-ready Docker image
# Stage 1: Builder stage for markdown conversion
FROM alpine:3.19 AS builder

# Install Python and markdown package for converting README.md
RUN apk add --no-cache \
    python3 \
    py3-pip \
    py3-markdown

# Set working directory
WORKDIR /build

# Create directory for converted files
RUN mkdir -p /build/converted

# Copy markdown files if they exist
COPY *.md . 2>/dev/null || true

# Convert markdown to HTML (if markdown files exist)
RUN for file in *.md; do \
        [ -f "$file" ] && python3 -m markdown "$file" > "converted/${file%.md}.html" || true; \
    done

# Stage 2: Production stage with nginx
FROM nginx:1.25-alpine

# Create non-root user for running nginx
RUN addgroup -g 101 -S nginx && \
    adduser -S -D -H -u 101 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx 2>/dev/null || true

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy static files
COPY --chown=nginx:nginx . /usr/share/nginx/html/

# Copy converted markdown files from builder stage
COPY --from=builder --chown=nginx:nginx /build/converted/*.html /usr/share/nginx/html/ 2>/dev/null || true

# Set proper permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Switch to non-root user
USER nginx

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]