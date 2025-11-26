# Multi-stage build for static landing page
FROM node:20-alpine AS builder

# Install marked for markdown processing
RUN npm install -g marked

# Set working directory
WORKDIR /build

# Copy source files
COPY index.html styles.css script.js ./
COPY assets/ ./assets/

# Create directory for converted files
RUN mkdir -p converted

# Copy and convert markdown files if they exist
RUN cp *.md . 2>/dev/null || true

# Production stage
FROM nginx:alpine

# Install curl for healthchecks
RUN apk add --no-cache curl

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy static files from builder
COPY --from=builder /build/*.html /usr/share/nginx/html/
COPY --from=builder /build/*.css /usr/share/nginx/html/
COPY --from=builder /build/*.js /usr/share/nginx/html/
COPY --from=builder /build/assets /usr/share/nginx/html/assets/

# Create non-root user for nginx
RUN addgroup -g 101 -S nginx && \
    adduser -S -D -H -u 101 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx

# Set proper permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d

RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Switch to non-root user
USER nginx

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# Build arguments for metadata
ARG BUILD_DATE
ARG VCS_REF

# Labels
LABEL org.opencontainers.image.created=$BUILD_DATE \
      org.opencontainers.image.revision=$VCS_REF \
      org.opencontainers.image.title="Simple Landing Page" \
      org.opencontainers.image.description="Production-ready static landing page with Nginx" \
      org.opencontainers.image.authors="builtwitharvadai" \
      org.opencontainers.image.vendor="builtwitharvadai"