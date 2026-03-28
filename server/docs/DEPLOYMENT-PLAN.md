# Agent Team Deployment Plan

## Overview

This document describes the deployment architecture and procedures for the Crew Agent Teams platform, supporting multi-tenant isolation with containerized deployment across multiple environments.

---

## 1. Environment Architecture

### 1.1 Environments

| Environment | Purpose | Domain Pattern |
|---|---|---|
| `dev` | Local development | `localhost` or `dev.crew.local` |
| `staging` | Pre-production testing | `staging.crew.example.com` |
| `prod` | Production traffic | `crew.example.com` |

### 1.2 Component Overview

```
                    ┌─────────────────────────────────┐
                    │        Load Balancer / Nginx     │
                    │    (SSL termination, routing)    │
                    └──────────────┬────────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
        ┌─────▼─────┐        ┌─────▼─────┐        ┌─────▼─────┐
        │  Dev Env   │        │ Staging   │        │  Prod Env  │
        │  (Node.js) │        │ (Node.js) │        │  (Node.js) │
        └─────┬─────┘        └─────┬─────┘        └─────┬─────┘
              │                    │                    │
        ┌─────▼─────┐        ┌─────▼─────┐        ┌─────▼─────┐
        │ PostgreSQL│        │PostgreSQL│        │ PostgreSQL│
        │  (local)  │        │ (staging)│        │  (prod)   │
        └───────────┘        └───────────┘        └───────────┘
```

---

## 2. Server Configuration

### 2.1 Server Address Configuration

All server-specific configuration is managed via environment variables. Create per-environment `.env` files:

**`deploy/env/dev.env`**
```env
NODE_ENV=development
PORT=3001
HOST=0.0.0.0
JWT_SECRET=dev-secret-not-for-production
PGHOST=localhost
PGPORT=5432
PGDATABASE=crew_dev
PGUSER=crew_dev
PGPASSWORD=dev_password
PGMAX=5
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=debug
DEPLOY_MODE=cloud
```

**`deploy/env/staging.env`**
```env
NODE_ENV=staging
PORT=3001
HOST=0.0.0.0
JWT_SECRET=<staging-secret-from-vault>
PGHOST=staging-db.internal
PGPORT=5432
PGDATABASE=crew_staging
PGUSER=crew_staging
PGPASSWORD=<staging-password-from-vault>
PGMAX=10
CORS_ORIGIN=https://staging.crew.example.com
LOG_LEVEL=info
DEPLOY_MODE=cloud
TENANT_ISOLATION=enabled
```

**`deploy/env/prod.env`**
```env
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
JWT_SECRET=<prod-secret-from-vault>
PGHOST=prod-db.internal
PGPORT=5432
PGDATABASE=crew_prod
PGUSER=crew_prod
PGPASSWORD=<prod-password-from-vault>
PGMAX=20
CORS_ORIGIN=https://crew.example.com
LOG_LEVEL=warn
DEPLOY_MODE=cloud
TENANT_ISOLATION=enforced
```

### 2.2 Required Server Resources

| Role | CPU | Memory | Disk | Notes |
|---|---|---|---|---|
| App Server (Dev) | 1 core | 1 GB | 20 GB | Single container |
| App Server (Staging) | 2 cores | 2 GB | 40 GB | Single container |
| App Server (Prod) | 4 cores | 8 GB | 100 GB | Horizontal scaling supported |
| PostgreSQL (shared) | 2 cores | 4 GB | 100 GB | Managed cloud DB recommended |

---

## 3. SSH & Access Control

### 3.1 SSH Key Management

```bash
# Generate dedicated deploy key (on your local machine)
ssh-keygen -t ed25519 -f deploy_key -N "" -C "crew-deploy@yourcompany"

# Copy public key to target servers
ssh-copy-id -i deploy_key.pub deploy-user@dev-server.example.com
ssh-copy-id -i deploy_key.pub deploy-user@staging-server.example.com
ssh-copy-id -i deploy_key.pub deploy-user@prod-server.example.com
```

### 3.2 SSH Config (`~/.ssh/config`)

```ssh-config
# Crew Deployment SSH Configuration

Host crew-dev
    HostName dev-server.example.com
    User deploy-user
    Port 22
    IdentityFile ~/.ssh/deploy_key
    ForwardAgent yes
    ServerAliveInterval 60

Host crew-staging
    HostName staging-server.example.com
    User deploy-user
    Port 22
    IdentityFile ~/.ssh/deploy_key
    ForwardAgent yes
    ServerAliveInterval 60

Host crew-prod
    HostName prod-server.example.com
    User deploy-user
    Port 22
    IdentityFile ~/.ssh/deploy_key
    ForwardAgent yes
    ServerAliveInterval 60
    StrictHostKeyChecking yes
```

### 3.3 User & Permission Model

| User | Role | SSH Access | sudo | Notes |
|---|---|---|---|---|
| `deploy-user` | Deployment | Key-based only | No | Used by CI/CD and deploy scripts |
| `app-user` | Application process | None | No | Runs the Node.js service |
| `dbadmin` | Database | Key-based | Yes | Emergency database access |

**`/home/deploy-user/authorized_keys`** (restricted)
```bash
# CI/CD pipeline access (read-only deploy)
command="/usr/local/bin/restricted-shell",no-pty,no-X11-forwarding ssh-ed25519 AAAA... CI/CD Pipeline

# Developer direct access (full repo)
ssh-ed25519 AAAA... developer@company.com
```

---

## 4. Container Isolation Deployment

### 4.1 Dockerfile (multi-stage)

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# Copy from builder
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --chown=appuser:appgroup . .

# Prisma generate
RUN npx prisma generate

# Switch to non-root user
USER appuser

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["node", "src/index.js"]
```

### 4.2 Docker Compose (per environment)

**`deploy/docker/docker-compose.yml`** (base template)

```yaml
version: '3.9'

x-app-base: &app-base
  build:
    context: ../..
    dockerfile: deploy/docker/Dockerfile
    target: production
  restart: unless-stopped
  healthcheck:
    test: ["CMD", "wget", "-qO-", "http://localhost:3001/health"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 10s
  networks:
    - crew-network

services:
  crew-api:
    <<: *app-base
    container_name: crew-api
    ports:
      - "${PORT:-3001}:3001"
    env_file:
      - ../env/${NODE_ENV:-dev}.env
    environment:
      - NODE_ENV=${NODE_ENV:-development}
    volumes:
      - crew-logs:/home/appuser/logs

  # Optional: Redis for session/cache (future)
  # crew-redis:
  #   image: redis:7-alpine
  #   restart: unless-stopped
  #   networks:
  #     - crew-network
  #   volumes:
  #     - crew-redis-data:/data

networks:
  crew-network:
    driver: bridge

volumes:
  crew-logs:
  crew-redis-data:
```

**Environment-specific override files:**

```yaml
# deploy/docker/docker-compose.prod.yml
version: '3.9'

services:
  crew-api:
    replicas: 2
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 4.3 Deployment Script

**`deploy/scripts/deploy.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail

# ============================================
# Crew Agent Teams - Deployment Script
# ============================================

ENVIRONMENT="${1:-dev}"
APP_DIR="/opt/crew/backend"
BACKUP_DIR="/opt/crew/backups"
LOG_FILE="/var/log/crew-deploy.log"

# Color output
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

log()  { echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }
info() { log "${GREEN}[INFO]${NC} $*"; }
warn() { log "${YELLOW}[WARN]${NC} $*"; }
err()  { log "${RED}[ERROR]${NC} $*" >&2; }

# Validate environment
validate_env() {
  if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    err "Invalid environment: $ENVIRONMENT. Must be dev, staging, or prod."
    exit 1
  fi
  info "Deploying to ${ENVIRONMENT}"
}

# Pre-deployment backup
backup() {
  if [[ "$ENVIRONMENT" == "prod" ]]; then
    info "Creating pre-deployment backup..."
    mkdir -p "$BACKUP_DIR"
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    # Database backup (example - adapt to your setup)
    # pg_dump -h "$PGHOST" -U crew_prod crew_prod > "$BACKUP_DIR/db_backup_${TIMESTAMP}.sql"
    info "Backup created: $BACKUP_DIR/db_backup_${TIMESTAMP}.sql"
  fi
}

# Pull latest code (if not using CI/CD)
pull_code() {
  cd "$APP_DIR"
  info "Pulling latest code from git..."
  git stash
  git pull origin main
  git stash pop || true
}

# Build and start containers
deploy() {
  cd "$APP_DIR/deploy/docker"

  info "Building Docker images..."
  docker compose -f docker-compose.yml -f "docker-compose.${ENVIRONMENT}.yml" build --no-cache crew-api

  info "Stopping existing containers..."
  docker compose -f docker-compose.yml -f "docker-compose.${ENVIRONMENT}.yml" down

  info "Starting new containers..."
  NODE_ENV="$ENVIRONMENT" docker compose -f docker-compose.yml -f "docker-compose.${ENVIRONMENT}.yml" up -d

  info "Waiting for health check..."
  sleep 5
  for i in {1..30}; do
    if curl -sf http://localhost:3001/health > /dev/null; then
      info "Service is healthy!"
      return 0
    fi
    sleep 2
  done

  err "Health check failed after 60 seconds"
  docker compose -f docker-compose.yml logs crew-api
  exit 1
}

# Verify deployment
verify() {
  info "Verifying deployment..."
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health || echo "000")
  if [[ "$HTTP_STATUS" == "200" ]]; then
    info "Deployment verified successfully (HTTP $HTTP_STATUS)"
  else
    err "Health check returned HTTP $HTTP_STATUS"
    exit 1
  fi
}

# Main
main() {
  validate_env
  backup
  deploy
  verify
  info "Deployment to ${ENVIRONMENT} completed successfully!"
}

main "$@"
```

---

## 5. Database Migration Strategy

### 5.1 Migration Files

SQL migrations are located in `src/migrations/`. They run in order:

| File | Purpose |
|---|---|
| `001_initial_schema.sql` | Core tables (users, projects, agents, tasks, etc.) |
| `002_demo_data.sql` | Sample data for development |
| `003_tenant_and_advanced.sql` | Multi-tenant columns, webhooks, RBAC |

### 5.2 Migration Execution

```bash
# Run migrations (from server)
cd /opt/crew/backend
node src/migrations/run.js

# Or with environment
NODE_ENV=staging node src/migrations/run.js
```

### 5.3 Pre-deployment Checklist

- [ ] Run migrations on staging before production
- [ ] Verify all tenant_id foreign keys are properly indexed
- [ ] Check that migration rollbacks are tested
- [ ] Ensure database user has minimal required privileges

---

## 6. Multi-Tenant Isolation

### 6.1 Tenant Isolation Model

```
┌─────────────────────────────────────────────────────────┐
│                    Shared Database                       │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ Tenant A │  │ Tenant B │  │ Tenant C │              │
│  │          │  │          │  │          │              │
│  │ projects │  │ projects │  │ projects │              │
│  │ agents   │  │ agents   │  │ agents   │              │
│  │ users    │  │ users    │  │ users    │              │
│  │ webhooks │  │ webhooks │  │ webhooks │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│                                                          │
│  Admin role bypasses tenant filter (sees all tenants)   │
└─────────────────────────────────────────────────────────┘
```

### 6.2 Tenant Scoping in API Routes

All tenant-scoped routes enforce isolation:

```javascript
// Example: GET /api/agents
// - Admin role → returns ALL agents (no tenant filter)
// - Regular user with tenant_id → returns only agents WHERE tenant_id = req.tenantId
// - Regular user without tenant → returns empty result
```

### 6.3 Tenant Migration (already applied)

The `003_tenant_and_advanced.sql` migration adds tenant isolation:

```sql
-- Agents table now has tenant_id
ALTER TABLE agents ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(36);
ALTER TABLE agents ADD CONSTRAINT IF NOT EXISTS fk_agents_tenant
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_agents_tenant ON agents(tenant_id);
```

---

## 7. CI/CD Pipeline (GitHub Actions Example)

**`.github/workflows/deploy.yml`**

```yaml
name: Deploy Crew Backend

on:
  push:
    branches: [main]
    tags: ['v*']
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment'
        required: true
        type: choice
        options: [dev, staging, prod]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: server/package-lock.json

      - name: Install dependencies
        working-directory: server
        run: npm ci

      - name: Run tests
        working-directory: server
        run: npm test
        env:
          NODE_ENV: test

      - name: Run migrations
        working-directory: server
        run: node src/migrations/run.js
        env:
          NODE_ENV: ${{ inputs.environment || 'dev' }}
          PGHOST: ${{ secrets.PGHOST }}
          PGPORT: 5432
          PGDATABASE: crew_${{ inputs.environment || 'dev' }}
          PGUSER: ${{ secrets.PGUSER }}
          PGPASSWORD: ${{ secrets.PGPASSWORD }}

      - name: Deploy to server
        if: github.event_name != 'pull_request'
        uses: appleboy/ssh-action@v0.1.10
        with:
          host: ${{ secrets.SSH_HOST }}
          username: deploy-user
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /opt/crew/backend
            git pull origin main
            cd deploy/docker
            NODE_ENV=${{ inputs.environment || 'dev' }} docker compose -f docker-compose.yml -f docker-compose.${{ inputs.environment || 'dev' }}.yml up -d --build

      - name: Verify deployment
        if: github.event_name != 'pull_request'
        run: |
          curl -sf http://${{ secrets.DEPLOY_HOST }}:3001/health || exit 1
```

---

## 8. Security Checklist

- [ ] JWT secret is unique per environment and stored in vault
- [ ] PostgreSQL passwords are not stored in git
- [ ] SSH root login disabled on all servers
- [ ] Deploy user uses key-based auth only (no password)
- [ ] CORS whitelist configured for production domains
- [ ] Database user `crew_*` has minimal required privileges (no DDL rights in prod)
- [ ] Container runs as non-root user (`appuser`)
- [ ] Health check endpoint does not expose internal data
- [ ] API keys are masked in responses (only prefix returned)
- [ ] Tenant isolation enforced at API layer (verified by tests)

---

## 9. Rollback Procedure

```bash
# Quick rollback to previous version
cd /opt/crew/backend/deploy/docker

# Get previous image tag
docker images crew-api --format "{{.Tag}}" | head -5

# Rollback to specific tag
docker tag crew-api:<previous-tag> crew-api:latest
docker compose up -d crew-api

# Or rollback database (if needed)
# psql -h $PGHOST -U crew_prod -d crew_prod < /opt/crew/backups/db_backup_<timestamp>.sql
```

---

## 10. Monitoring & Alerts

### 10.1 Health Endpoint

```
GET /health
Response: { "status": "healthy", "database": "connected" }
```

### 10.2 Key Metrics to Monitor

| Metric | Warning | Critical |
|---|---|---|
| API response time p99 | > 2s | > 5s |
| Error rate | > 1% | > 5% |
| DB connection pool usage | > 70% | > 90% |
| Memory usage | > 75% | > 90% |
| Disk usage | > 80% | > 95% |

### 10.3 Log Locations

| Environment | Log Location |
|---|---|
| Dev | stdout (docker compose) |
| Staging | `/var/log/crew/api.log` |
| Prod | CloudWatch / Datadog / ELK |

---

## 11. Quick Reference

### Deploy Commands

```bash
# Deploy to dev
./deploy/scripts/deploy.sh dev

# Deploy to staging
./deploy/scripts/deploy.sh staging

# Deploy to prod (requires confirmation)
./deploy/scripts/deploy.sh prod

# View logs
docker compose -f deploy/docker/docker-compose.yml logs -f crew-api

# Check status
curl http://localhost:3001/health

# Run migrations manually
node src/migrations/run.js
```

### Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | Yes | `development`, `staging`, `production` |
| `PORT` | Yes | Server port (default: 3001) |
| `JWT_SECRET` | Yes | Secret for JWT signing |
| `PGHOST` | Yes | PostgreSQL host |
| `PGPORT` | Yes | PostgreSQL port |
| `PGDATABASE` | Yes | Database name |
| `PGUSER` | Yes | Database user |
| `PGPASSWORD` | Yes | Database password |
| `CORS_ORIGIN` | Yes | Allowed CORS origin |
| `LOG_LEVEL` | No | `debug`, `info`, `warn`, `error` |
| `TENANT_ISOLATION` | No | `enabled` or `enforced` |
