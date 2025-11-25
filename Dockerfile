FROM nginx:1.27-alpine

LABEL maintainer="devops@example.com" \
      version="1.0.0" \
      description="Simple Landing Page"

WORKDIR /usr/share/nginx/html

RUN rm -rf ./*

COPY *.md ./

RUN apk add --no-cache python3 && \
    python3 -m pip install --no-cache-dir markdown && \
    for file in *.md; do \
        [ -f "$file" ] && python3 -m markdown "$file" > "${file%.md}.html"; \
    done && \
    apk del python3 && \
    rm -f *.md

RUN addgroup -g 1001 -S nginx && \
    adduser -S nginx -u 1001 -G nginx && \
    chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /var/run /var/log/nginx && \
    chmod -R 755 /usr/share/nginx/html

USER nginx

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

STOPSIGNAL SIGTERM

CMD ["nginx", "-g", "daemon off;"]