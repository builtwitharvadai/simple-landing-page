# Multi-stage build for production-ready Docker image
# Stage 1: Builder stage for processing markdown files
FROM alpine:3.19 AS builder

# Install required tools for markdown processing
RUN apk add --no-cache python3 py3-markdown

# Create working directory
WORKDIR /build

# Copy markdown files if they exist and convert to HTML
RUN mkdir -p /build/converted

# Copy any markdown files (will be empty if none exist)
COPY *.md . 2>/dev/null || true

# Convert markdown to HTML if files exist
RUN if ls *.md 1> /dev/null 2>&1; then \
        for file in *.md; do \
            python3 -m markdown "$file" > "/build/converted/${file%.md}.html"; \
        done; \
    fi

# Stage 2: Production nginx image
FROM nginx:alpine

# Create non-root user for security
RUN addgroup -g 1001 -S appuser && \
    adduser -u 1001 -S appuser -G appuser

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Set working directory
WORKDIR /usr/share/nginx/html

# Copy static files with proper ownership
COPY --chown=appuser:appuser *.html /usr/share/nginx/html/
COPY --chown=appuser:appuser *.css /usr/share/nginx/html/
COPY --chown=appuser:appuser *.js /usr/share/nginx/html/
    
# Copy converted markdown files from builder
COPY --from=builder --chown=appuser:appuser /build/converted/* /usr/share/nginx/html/ 2>/dev/null || true

# Set proper permissions
RUN chown -R appuser:appuser /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html && \
    # Create nginx cache and pid directories with proper permissions
    mkdir -p /var/cache/nginx /var/run && \
    chown -R appuser:appuser /var/cache/nginx /var/run && \
    # Ensure nginx can write to log files
    touch /var/log/nginx/access.log /var/log/nginx/error.log && \
    chown appuser:appuser /var/log/nginx/access.log /var/log/nginx/error.log

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]