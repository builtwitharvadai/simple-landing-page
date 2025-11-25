# Multi-stage build for production-ready Docker image
FROM nginx:alpine AS builder

# Set working directory
WORKDIR /usr/share/nginx/html

# Copy markdown files
COPY *.md ./

# Install Python and markdown package, convert files, then cleanup
# This keeps the final image size minimal
RUN apk add --no-cache python3 py3-pip && \
    python3 -m pip install --no-cache-dir markdown && \
    for file in *.md; do \
        [ -f "$file" ] && python3 -m markdown "$file" > "${file%.md}.html"; \
    done && \
    apk del python3 && \
    rm -f *.md

# Production stage
FROM nginx:alpine

# Create non-root user for security
RUN addgroup -g 1001 -S appuser && \
    adduser -u 1001 -S appuser -G appuser

# Copy converted HTML files from builder
COPY --from=builder --chown=appuser:appuser /usr/share/nginx/html/*.html /usr/share/nginx/html/

# Copy nginx configuration
COPY --chown=appuser:appuser nginx.conf /etc/nginx/nginx.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]