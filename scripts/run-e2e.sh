#!/bin/bash
set -e

echo "🧪 Running E2E tests with Docker Compose..."

# Start test services
docker compose -f docker-compose.e2e.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services..."
sleep 30

# Run the tests (without opening browser report)
cd frontend && pnpm run test:e2e --reporter=list

# Cleanup
docker compose -f docker-compose.e2e.yml down --volumes
