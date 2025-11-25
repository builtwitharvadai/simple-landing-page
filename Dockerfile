# Multi-stage build for optimized production image
FROM alpine:3.19 AS builder

# Install Python and markdown processor
RUN apk add --no-cache python3 py3-markdown

# Set working directory
WORKDIR /build

# Copy markdown files
COPY *.md ./

# Convert markdown to HTML if any .md files exist
RUN if ls *.md 1> /dev/null 2>&1; then \
        for file in *.md; do \
            [ -f "$file" ] && python3 -m markdown < "$file" > "${file%.md}.html"; \
        done; \
    fi

# Production stage
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy generated HTML files from builder stage
COPY --from=builder /build/*.html /usr/share/nginx/html/ 2>/dev/null || echo "No HTML files to copy"

# Create a default index.html if none exists
RUN if [ ! -f /usr/share/nginx/html/index.html ]; then \
        echo '<!DOCTYPE html><html><head><title>Landing Page</title></head><body><h1>Welcome</h1><p>Landing page is running.</p></body></html>' > /usr/share/nginx/html/index.html; \
    fi

# Create non-root user for security
RUN addgroup -g 1001 -S nginx-user && \
    adduser -u 1001 -S nginx-user -G nginx-user && \
    chown -R nginx-user:nginx-user /usr/share/nginx/html && \
    chown -R nginx-user:nginx-user /var/cache/nginx && \
    chown -R nginx-user:nginx-user /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx-user:nginx-user /var/run/nginx.pid

# Switch to non-root user
USER nginx-user

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]