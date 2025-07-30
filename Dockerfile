# Multi-stage Dockerfile for ICSHD GENIUSES Production

# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./
RUN npm ci --only=production

# Copy frontend source code
COPY frontend/ ./

# Build frontend for production
RUN npm run build

# Stage 2: Build Backend
FROM node:18-alpine AS backend-builder

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy backend source code
COPY backend/ ./

# Stage 3: Production Runtime
FROM node:18-alpine AS production

# Install system dependencies
RUN apk add --no-cache \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy backend from builder stage
COPY --from=backend-builder --chown=nodejs:nodejs /app/backend ./backend

# Copy built frontend from builder stage
COPY --from=frontend-builder --chown=nodejs:nodejs /app/frontend/build ./frontend/build

# Copy WordPress plugin files
COPY --chown=nodejs:nodejs wordpress-plugin/ ./wordpress-plugin/

# Create necessary directories
RUN mkdir -p /var/log/icshd-geniuses /var/uploads/icshd-geniuses
RUN chown -R nodejs:nodejs /var/log/icshd-geniuses /var/uploads/icshd-geniuses

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node backend/scripts/healthcheck.js

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "backend/server.js"]
