# Stage 1: Builder stage for processing markdown files
FROM alpine:3.19 AS builder

# Install Python and markdown package from Alpine repositories
RUN apk add --no-cache python3 py3-markdown

# Set working directory
WORKDIR /build

# Copy markdown files if they exist
COPY *.md . 2>/dev/null || true

# Convert markdown to HTML if any .md files exist
RUN if ls *.md 1> /dev/null 2>&1; then \
        for file in *.md; do \
            [ -f "$file" ] && python3 -m markdown < "$file" > "${file%.md}.html"; \
        done; \
    fi

# Stage 2: Production stage with nginx
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf
    
# Copy generated HTML files from builder stage if they exist, otherwise create default
RUN mkdir -p /usr/share/nginx/html
COPY --from=builder /build/*.html /usr/share/nginx/html/ 2>/dev/null || true
    
# Create a default index.html if none exists
RUN if [ ! -f /usr/share/nginx/html/index.html ]; then \
        echo '<!DOCTYPE html>' > /usr/share/nginx/html/index.html && \
        echo '<html lang="en">' >> /usr/share/nginx/html/index.html && \
        echo '<head>' >> /usr/share/nginx/html/index.html && \
        echo '    <meta charset="UTF-8">' >> /usr/share/nginx/html/index.html && \
        echo '    <meta name="viewport" content="width=device-width, initial-scale=1.0">' >> /usr/share/nginx/html/index.html && \
        echo '    <title>Welcome</title>' >> /usr/share/nginx/html/index.html && \
        echo '</head>' >> /usr/share/nginx/html/index.html && \
        echo '<body>' >> /usr/share/nginx/html/index.html && \
        echo '    <h1>Welcome to the Landing Page</h1>' >> /usr/share/nginx/html/index.html && \
        echo '    <p>This is a simple landing page served by nginx.</p>' >> /usr/share/nginx/html/index.html && \
        echo '</body>' >> /usr/share/nginx/html/index.html && \
        echo '</html>' >> /usr/share/nginx/html/index.html; \
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

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]