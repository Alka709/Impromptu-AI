FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies cleanly
RUN npm ci

# Copy source code
COPY . .

# Production stage
FROM node:20-alpine

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy only production dependencies and source code
COPY package*.json ./
RUN npm ci --only=production

COPY src/ ./src/

# Change ownership to the non-root node user
RUN chown -R node:node /app

# Switch to non-root user
USER node

# Set port env
ENV PORT=4000

# Expose port
EXPOSE 4000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

# Start the server
CMD ["node", "src/server.js"]
