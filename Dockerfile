# Multi-stage build for optimized production image
FROM alpine:3.19 AS builder

# Install Python and markdown processor
RUN apk add --no-cache py3-markdown

WORKDIR /build

# Copy markdown files if they exist
COPY *.md . 2>/dev/null || true

# Convert markdown to HTML if any .md files exist
RUN shopt -s nullglob 2>/dev/null || true; \
    for file in *.md; do \
        if [ -f "$file" ]; then \
            python3 -m markdown < "$file" > "${file%.md}.html"; \
        fi; \
    done

# Final stage - minimal nginx image
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy any HTML files from builder stage (if they exist)
COPY --from=builder /build/*.html /usr/share/nginx/html/ 2>/dev/null || true

# Create a default index.html if none exists
RUN if [ ! -f /usr/share/nginx/html/index.html ]; then \
        echo '<!DOCTYPE html><html><head><title>Welcome</title></head><body><h1>Welcome to Simple Landing Page</h1><p>This is a default page. Add your content by including HTML or Markdown files.</p></body></html>' > /usr/share/nginx/html/index.html; \
    fi

# Create non-root user for security
RUN addgroup -g 101 -S nginx && \
    adduser -S -D -H -u 101 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx 2>/dev/null || true

# Set proper permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Switch to non-root user
USER nginx

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]