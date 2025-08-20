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
	@echo "  docs               Build documentation (HTML)"
	@echo "  docs-serve         Build and serve documentation locally"
	@echo "  docs-clean         Clean documentation build files"
	@echo "  docs-api           Generate API documentation from source"
	@echo "  docs-watch         Watch and auto-rebuild documentation"
	@echo "  docs-linkcheck     Check for broken links in documentation"
	@echo "  docs-pdf           Build PDF documentation (requires LaTeX)"

.PHONY: test
test: test-backend test-frontend

.PHONY: test-backend
test-backend:
	DISABLE_RATE_LIMITING=true uv run pytest -n 5 --cov .

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
	docker compose up -d mongodb
	@echo "Waiting for MongoDB to be ready..."
	@sleep 2
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
backend-dev: mongo-clean mongo-start
	@echo "Starting backend server..."
	uv run satin --reload --host 0.0.0.0 --port 8000

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

# Documentation commands
.PHONY: docs
docs:
	@echo "Building HTML documentation..."
	cd docs && uv run sphinx-build -b html source build/html
	@echo "Documentation built successfully! Open docs/build/html/index.html"

.PHONY: docs-serve
docs-serve: docs
	@echo "Serving documentation at http://localhost:8080"
	python -m http.server 8080 --directory docs/build/html

.PHONY: docs-clean
docs-clean:
	@echo "Cleaning documentation build files..."
	rm -rf docs/build/
	@echo "Documentation build files removed."

.PHONY: docs-api
docs-api:
	@echo "Generating API documentation from source code..."
	cd docs && uv run sphinx-apidoc -o source/api ../src/satin --force --module-first
	@echo "API documentation generated."

.PHONY: docs-watch
docs-watch:
	@echo "Starting documentation auto-rebuild server..."
	cd docs && uv run sphinx-autobuild source build/html --open-browser

.PHONY: docs-linkcheck
docs-linkcheck:
	@echo "Checking documentation for broken links..."
	cd docs && uv run sphinx-build -b linkcheck source build/linkcheck
	@echo "Link check completed. See docs/build/linkcheck/ for results."

.PHONY: docs-pdf
docs-pdf:
	@echo "Building PDF documentation..."
	cd docs && uv run sphinx-build -b latex source build/latex
	@cd docs/build/latex && make all-pdf
	@echo "PDF documentation built at docs/build/latex/SATIn.pdf"

.PHONY: docs-strict
docs-strict:
	@echo "Building documentation with warnings as errors..."
	cd docs && uv run sphinx-build -b html -W source build/html
	@echo "Strict documentation build completed."
