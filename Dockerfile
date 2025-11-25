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
RUN if ls *.md 1> /dev/null 2>&1; then cp *.md .; fi

# Convert markdown to HTML (if markdown files exist)
RUN for file in *.md; do \
        [ -f "$file" ] && python3 -m markdown "$file" > "converted/${file%.md}.html" || true; \
    done

# Stage 2: Production stage with nginx
FROM nginx:1.25-alpine

# Create non-root user for running nginx
RUN addgroup -g 1001 -S appuser && \
    adduser -u 1001 -S appuser -G appuser

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy static files
COPY --chown=appuser:appuser . /usr/share/nginx/html/

# Copy converted markdown files from builder stage
COPY --from=builder --chown=appuser:appuser /build/converted/*.html /usr/share/nginx/html/

# Set proper permissions
RUN chown -R appuser:appuser /usr/share/nginx/html && \
    chown -R appuser:appuser /var/cache/nginx && \
    chown -R appuser:appuser /var/log/nginx && \
    chown -R appuser:appuser /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R appuser:appuser /var/run/nginx.pid

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]