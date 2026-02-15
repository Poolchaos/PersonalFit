# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Create non-root user and group
RUN addgroup -g 101 -S nginx-user && \
    adduser -S -D -H -u 101 -h /var/cache/nginx -s /sbin/nologin -G nginx-user nginx-user && \
    # Create directories and set permissions
    mkdir -p /var/cache/nginx /var/run/nginx && \
    chown -R nginx-user:nginx-user /var/cache/nginx /var/run/nginx

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Change ownership of web files
RUN chown -R nginx-user:nginx-user /usr/share/nginx/html

# Use nginx.conf that allows non-root
RUN sed -i 's/listen 80;/listen 8080;/' /etc/nginx/conf.d/default.conf && \
    sed -i '/user  nginx;/d' /etc/nginx/nginx.conf && \
    sed -i 's|/var/run/nginx.pid|/var/run/nginx/nginx.pid|' /etc/nginx/nginx.conf

# Expose port 8080 (non-privileged port)
EXPOSE 8080

# Switch to non-root user
USER nginx-user

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
