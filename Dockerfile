# Multi-stage build for optimal image size
FROM nginx:alpine AS builder

# Copy all files to builder stage
COPY . /usr/share/nginx/html/

# Set working directory
WORKDIR /usr/share/nginx/html

# Convert markdown files to HTML if any exist
# Using Alpine's native py3-markdown package
# This keeps the final image size minimal
RUN apk add --no-cache py3-markdown && \
    if ls *.md 1> /dev/null 2>&1; then \
        for file in *.md; do \
            [ -f "$file" ] && python3 -m markdown < "$file" > "${file%.md}.html"; \
        done; \
    fi && \
    apk del py3-markdown && \
    rm -f *.md
        
# Production stage
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built files from builder stage
COPY --from=builder /usr/share/nginx/html /usr/share/nginx/html

# Create non-root user for running nginx
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
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:8080/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]