# Multi-stage build for optimal image size
FROM nginx:alpine AS builder

# Copy source files
COPY . /usr/share/nginx/html/

WORKDIR /usr/share/nginx/html

# Convert markdown to HTML if any .md files exist
# Using Alpine's native py3-markdown package instead of pip to avoid PEP 668 restrictions
# Install markdown processor, convert files, then remove to keep image small
# This keeps the final image size minimal
RUN apk add --no-cache py3-markdown && \
    for file in *.md; do \
        [ -f "$file" ] && python3 -m markdown "$file" > "${file%.md}.html"; \
    done && \
    apk del py3-markdown && \
    rm -f *.md
    
# Production stage
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built files from builder stage
COPY --from=builder /usr/share/nginx/html /usr/share/nginx/html

# Create non-root user for security
RUN addgroup -g 1001 -S nginx-user && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx-user -g nginx-user nginx-user && \
    chown -R nginx-user:nginx-user /usr/share/nginx/html && \
    chown -R nginx-user:nginx-user /var/cache/nginx && \
    chown -R nginx-user:nginx-user /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx-user:nginx-user /var/run/nginx.pid

# Switch to non-root user
USER nginx-user

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]