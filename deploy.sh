#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Crew AI Deployment Script ===${NC}\n"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Warning: .env file not found. Copying from .env.example...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}Please edit .env with your actual configuration values.${NC}\n"
fi

# Source environment variables
source .env

# Function to check health endpoint
check_health() {
    local service=$1
    local url=$2
    local max_attempts=30
    local attempt=1

    echo -n "Checking $service health... "
    while [ $attempt -le $max_attempts ]; do
        if curl -sf "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}OK${NC}"
            return 0
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    echo -e "${RED}FAILED${NC}"
    return 1
}

# Build and start containers
echo -e "${GREEN}1. Building and starting containers...${NC}"
docker compose down 2>/dev/null || true
docker compose build --no-cache
docker compose up -d

# Wait for services to be healthy
echo -e "\n${GREEN}2. Waiting for services to be healthy...${NC}"

# Check PostgreSQL
max_attempts=30
attempt=1
echo -n "PostgreSQL"
while [ $attempt -le $max_attempts ]; do
    if docker exec crew-postgres pg_isready -U "${POSTGRES_USER:-crew_user}" -d "${POSTGRES_DB:-crew}" > /dev/null 2>&1; then
        echo -e " ${GREEN}OK${NC}"
        break
    fi
    echo -n "."
    sleep 2
    attempt=$((attempt + 1))
done

# Check Redis
max_attempts=30
attempt=1
echo -n "Redis"
while [ $attempt -le $max_attempts ]; do
    if docker exec crew-redis redis-cli -a "${REDIS_PASSWORD}" ping > /dev/null 2>&1; then
        echo -e " ${GREEN}OK${NC}"
        break
    fi
    echo -n "."
    sleep 2
    attempt=$((attempt + 1))
done

# Check Backend API
check_health "Backend API" "http://localhost:3000/health"

# Check Frontend
check_health "Frontend" "http://localhost:80/health"

# Check Nginx
echo -n "Nginx config"
docker exec crew-nginx nginx -t > /dev/null 2>&1 && echo -e " ${GREEN}OK${NC}" || echo -e " ${RED}FAILED${NC}"

# Final status
echo -e "\n${GREEN}=== Deployment Complete ===${NC}\n"
echo "Services:"
echo "  - Nginx (Reverse Proxy): http://localhost:80"
echo "  - Backend API:          http://localhost:3000"
echo "  - Frontend:             http://localhost:80 (via nginx)"
echo "  - PostgreSQL:           localhost:5432"
echo "  - Redis:                localhost:6379"
echo "  - Docker-in-Docker:     localhost:2375"

echo -e "\nUseful commands:"
echo "  - docker compose logs -f        # View logs"
echo "  - docker compose ps             # Check status"
echo "  - docker compose restart <svc>   # Restart service"
