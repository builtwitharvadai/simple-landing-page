# Multi-stage build for production-ready static site
FROM alpine:3.19 AS builder

# Install Python and markdown processor
RUN apk add --no-cache python3 py3-markdown

WORKDIR /build

# Copy markdown files if they exist and convert to HTML
RUN mkdir -p /build && \
    if ls /*.md 1> /dev/null 2>&1; then \
        cp /*.md /build/ 2>/dev/null || true; \
    fi

# Convert markdown to HTML if any .md files exist
RUN if ls *.md 1> /dev/null 2>&1; then \
        for file in *.md; do \
            python3 -m markdown "$file" > "${file%.md}.html"; \
        done; \
    fi

# Production stage
FROM nginx:alpine

# Create non-root user
RUN addgroup -g 1001 -S appuser && \
    adduser -u 1001 -S appuser -G appuser

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy static files
COPY --chown=appuser:appuser *.html /usr/share/nginx/html/ 2>/dev/null || true
COPY --chown=appuser:appuser *.css /usr/share/nginx/html/ 2>/dev/null || true
COPY --chown=appuser:appuser *.js /usr/share/nginx/html/ 2>/dev/null || true
COPY --chown=appuser:appuser assets/ /usr/share/nginx/html/assets/ 2>/dev/null || true

# Copy converted markdown files from builder
COPY --from=builder --chown=appuser:appuser /build/*.html /usr/share/nginx/html/ 2>/dev/null || true

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