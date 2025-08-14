#!/bin/bash
set -e

echo "🧪 Running E2E tests with Docker Compose..."

# Start test services
docker compose -f docker-compose.e2e.yml up -d --remove-orphans --build

# Wait for services to be healthy
echo "⏳ Waiting for services..."
sleep 30

# Set environment variables for the host tests
export API_BASE_URL=http://localhost:8001
export BASE_URL=http://localhost:3001
export VITE_BACKEND_URL=http://localhost:8001

# Run the tests (without opening browser report)
cd frontend && pnpm run test:e2e --reporter=list

# Cleanup
docker compose -f docker-compose.e2e.yml down --volumes
