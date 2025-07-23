# Multi-stage build for production optimization
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for TypeScript)
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create a non-root user for security
RUN addgroup -S ar-namecard-group && adduser -S ar-namecard-user -G ar-namecard-group

WORKDIR /app

# Copy necessary files from the builder stage
COPY --from=builder --chown=ar-namecard-user:ar-namecard-group /app/dist ./dist
COPY --from=builder --chown=ar-namecard-user:ar-namecard-group /app/public ./public
COPY --from=builder --chown=ar-namecard-user:ar-namecard-group /app/ssl ./ssl
COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Switch to the non-root user
USER ar-namecard-user

# Expose the application ports
EXPOSE 3000 3443

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); http.get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]