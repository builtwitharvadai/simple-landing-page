# Multi-stage build for optimized production image
FROM node:20-alpine AS builder

WORKDIR /build

# Copy source files
COPY index.html .
COPY styles.css .
COPY script.js .
COPY assets/ ./assets/

# Create directories for potential conversions
RUN mkdir -p converted

# Copy markdown files if they exist
RUN cp *.md . 2>/dev/null || true

# Production stage
FROM nginx:alpine

# Copy built files from builder stage
COPY --from=builder /build/*.html /usr/share/nginx/html/
COPY --from=builder /build/*.css /usr/share/nginx/html/
COPY --from=builder /build/*.js /usr/share/nginx/html/
COPY --from=builder /build/assets /usr/share/nginx/html/assets/

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Set proper permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Use non-root user
USER nginx

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# Build arguments for metadata
ARG BUILD_DATE
ARG VCS_REF

# Labels
LABEL maintainer="your-email@example.com" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.title="Simple Landing Page" \
      org.opencontainers.image.description="Production-ready static landing page with nginx"