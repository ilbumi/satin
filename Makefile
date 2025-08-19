.DEFAULT_GOAL := help
SHELL := bash

# Load environment variables from .env file (optional)
-include .env
export

# Default values for environment variables
MONGO_USERNAME ?= admin
MONGO_PASSWORD ?= password
MONGO_PORT ?= 27017
MONGO_DATABASE ?= satin
BACKEND_PORT ?= 8000
FRONTEND_PORT ?= 3000
VITE_BACKEND_URL ?= http://localhost:8000

# Project paths
PYCODE_PATHS := src/
PYTESTS_PATH := tests/

.PHONY: help
help:
	@echo "Available commands:"
	@echo ""
	@echo "Development:"
	@echo "  dev                Start backend and frontend development servers (with MongoDB)"
	@echo "  backend-dev        Start backend development server (with MongoDB)"
	@echo "  frontend-dev       Start frontend development server"
	@echo "  dev-stop           Stop all development services"
	@echo ""
	@echo "Database:"
	@echo "  mongo-start        Start MongoDB in Docker"
	@echo "  mongo-stop         Stop MongoDB container"
	@echo "  mongo-clean        Remove MongoDB container and data"
	@echo ""
	@echo "Testing:"
	@echo "  test               Run backend and frontend tests"
	@echo "  test-backend       Run backend tests only"
	@echo "  test-frontend      Run frontend tests only"
	@echo "  frontend-test-unit Run frontend unit tests"
	@echo "  frontend-test-e2e  Run frontend E2E tests"
	@echo ""
	@echo "Building:"
	@echo "  frontend-build     Build frontend for production"
	@echo ""
	@echo "Code Quality:"
	@echo "  format             Format all code"
	@echo "  lint               Lint all code"
	@echo "  frontend-check     TypeScript type checking"
	@echo ""
	@echo "Dependencies:"
	@echo "  sync               Sync dependencies"
	@echo ""
	@echo "Documentation:"
	@echo "  docs               Build documentation"

.PHONY: test
test: test-backend test-frontend

.PHONY: test-backend
test-backend:
	uv run pytest -n 5 --cov .

.PHONY: test-frontend
test-frontend:
	cd frontend && pnpm run test

# Frontend specific test commands
.PHONY: frontend-test-unit
frontend-test-unit:
	cd frontend && pnpm run test:unit

.PHONY: frontend-test-e2e
frontend-test-e2e:
	cd frontend && pnpm run test:e2e

# MongoDB commands
.PHONY: mongo-start
mongo-start:
	@echo "Starting MongoDB in Docker..."
	docker-compose up -d mongodb
	@echo "Waiting for MongoDB to be ready..."
	@sleep 5
	@docker compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1 && echo "MongoDB is ready!" || echo "MongoDB may still be starting..."

.PHONY: mongo-stop
mongo-stop:
	@echo "Stopping MongoDB..."
	docker compose stop mongodb

.PHONY: mongo-clean
mongo-clean:
	@echo "Stopping and removing MongoDB container and data..."
	docker compose down -v mongodb

# Development commands
.PHONY: dev
dev:
	@echo "Starting backend and frontend in parallel..."
	@make -j2 backend-dev frontend-dev

.PHONY: backend-dev
backend-dev: mongo-start
	@echo "Starting backend server..."
	uv run uvicorn satin:app --host 0.0.0.0 --port 8000 --reload

.PHONY: dev-stop
dev-stop:
	@echo "Stopping all development services..."
	@make mongo-stop
	@echo "Development services stopped."

.PHONY: frontend-dev
frontend-dev:
	cd frontend && pnpm run dev

# Frontend build commands
.PHONY: frontend-build
frontend-build:
	cd frontend && pnpm run build

# Frontend type checking
.PHONY: frontend-check
frontend-check:
	cd frontend && pnpm run check

.PHONY: format
format: format-backend format-frontend

.PHONY: format-backend
format-backend:
	uv run ssort ${PYCODE_PATHS} ${PYTESTS_PATH}
	uv run isort ${PYCODE_PATHS} ${PYTESTS_PATH}
	uv run ruff format ${PYCODE_PATHS} ${PYTESTS_PATH}
	uv run ruff check --fix ${PYCODE_PATHS} ${PYTESTS_PATH}

.PHONY: format-frontend
format-frontend:
	cd frontend && pnpm run format

.PHONY: lint
lint: lint-backend lint-frontend

.PHONY: lint-backend
lint-backend:
	uv run ruff check ${PYCODE_PATHS} ${PYTESTS_PATH}
	uv run mypy ${PYCODE_PATHS}

.PHONY: lint-frontend
lint-frontend:
	cd frontend && pnpm run lint && pnpm run check

.PHONY: sync
sync:
	uv sync
	cd frontend && pnpm install

.PHONY: lock
lock:
	uv lock

.PHONY: docs
docs:
	uv run sphinx-build -b html docs/source docs/build/html

.PHONY: docs-clean
docs-clean:
	rm -rf docs/build/

.PHONY: docs-serve
docs-serve: docs
	python -m http.server 8080 --directory docs/build/html
