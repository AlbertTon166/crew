FROM node:22-alpine

WORKDIR /app

# Install Docker CLI and utilities
RUN apk add --no-cache docker-cli curl

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev && npm cache clean --force

# Copy source
COPY src/ ./src/

# Create nodejs user and setup Docker socket access
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Fix Docker socket permissions (docker group GID typically 999 or similar)
RUN chown root:docker /var/run/docker.sock 2>/dev/null || true && \
    chmod 660 /var/run/docker.sock 2>/dev/null || true

EXPOSE 3002

CMD ["node", "src/index.js"]
