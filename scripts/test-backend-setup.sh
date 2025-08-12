#!/bin/bash
set -e

# Test backend setup script for Playwright tests
# This script ensures MongoDB and backend services are running properly for testing

echo "🧪 Starting test backend setup..."

# Configuration
MONGO_PORT=${MONGO_PORT:-27017}
BACKEND_PORT=${BACKEND_PORT:-8000}
MONGO_DSN=${MONGO_DSN:-"mongodb://localhost:27017/satin-test"}
MAX_WAIT_TIME=60
HEALTH_CHECK_INTERVAL=2

# Function to check if MongoDB is running
check_mongodb() {
    echo "📡 Checking MongoDB connection..."

    # Try to connect to MongoDB
    if command -v mongosh >/dev/null 2>&1; then
        # Use mongosh if available
        if mongosh --eval "db.adminCommand('ping')" --quiet "$MONGO_DSN" >/dev/null 2>&1; then
            return 0
        fi
    elif command -v mongo >/dev/null 2>&1; then
        # Fall back to legacy mongo client
        if mongo --eval "db.adminCommand('ping')" --quiet "$MONGO_DSN" >/dev/null 2>&1; then
            return 0
        fi
    else
        # Use curl as last resort to check if port is open
        if curl -s "http://localhost:$MONGO_PORT" >/dev/null 2>&1; then
            return 0
        fi
    fi

    return 1
}

# Function to check if backend GraphQL endpoint is responding
check_backend() {
    echo "🔍 Checking backend GraphQL endpoint..."

    # Check health endpoint first
    if curl -s -f "http://localhost:$BACKEND_PORT/health" >/dev/null 2>&1; then
        # Check GraphQL endpoint
        response=$(curl -s -X POST \
            -H "Content-Type: application/json" \
            -d '{"query": "{ __schema { types { name } } }"}' \
            "http://localhost:$BACKEND_PORT/graphql" 2>/dev/null || echo "")

        if echo "$response" | grep -q "types"; then
            return 0
        fi
    fi

    return 1
}

# Function to wait for a service to be ready
wait_for_service() {
    local service_name=$1
    local check_function=$2
    local wait_time=0

    echo "⏳ Waiting for $service_name to be ready..."

    while [ $wait_time -lt $MAX_WAIT_TIME ]; do
        if $check_function; then
            echo "✅ $service_name is ready!"
            return 0
        fi

        echo "⏱️  $service_name not ready yet, waiting... ($wait_time/${MAX_WAIT_TIME}s)"
        sleep $HEALTH_CHECK_INTERVAL
        wait_time=$((wait_time + HEALTH_CHECK_INTERVAL))
    done

    echo "❌ Timeout waiting for $service_name to be ready"
    return 1
}

# Start MongoDB if not running
if ! check_mongodb; then
    echo "🚀 Starting MongoDB..."

    # Try to start MongoDB using Docker Compose
    if [ -f "docker-compose.yml" ]; then
        echo "📦 Using Docker Compose to start MongoDB..."
        docker-compose up -d mongodb
        wait_for_service "MongoDB" check_mongodb
    else
        echo "❌ No docker-compose.yml found. Please ensure MongoDB is running manually."
        exit 1
    fi
else
    echo "✅ MongoDB is already running"
fi

# Check if backend is already running
if check_backend; then
    echo "✅ Backend is already running and ready"
    echo "🎉 Test environment is ready!"
    exit 0
fi

# Start backend server
echo "🚀 Starting backend server..."

# Export environment variables for the backend
export MONGO_DSN="$MONGO_DSN"
export ENVIRONMENT="test"
export LOG_LEVEL="info"

# Start backend server in background
echo "🔧 Running: uv run granian --interface asgi --host 0.0.0.0 --port $BACKEND_PORT --reload satin:app"

if command -v uv >/dev/null 2>&1; then
    # Start backend server
    uv run granian --interface asgi --host 0.0.0.0 --port "$BACKEND_PORT" --reload satin:app &
    BACKEND_PID=$!

    # Wait for backend to be ready
    if wait_for_service "Backend" check_backend; then
        echo "🎉 Test environment is ready!"
        echo "📝 Backend PID: $BACKEND_PID"
        echo "📝 MongoDB DSN: $MONGO_DSN"
        echo "📝 Backend URL: http://localhost:$BACKEND_PORT"
        exit 0
    else
        echo "❌ Failed to start backend server"
        if [ -n "$BACKEND_PID" ]; then
            kill $BACKEND_PID 2>/dev/null || true
        fi
        exit 1
    fi
else
    echo "❌ uv command not found. Please install uv or ensure backend dependencies are available."
    exit 1
fi
