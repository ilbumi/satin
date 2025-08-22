.PHONY: help install dev test lint format clean
.PHONY: install-backend install-frontend
.PHONY: dev-backend dev-frontend
.PHONY: test-backend test-frontend test-backend-fast test-backend-cov
.PHONY: lint-backend lint-frontend
.PHONY: format-backend format-frontend

# Default target
help:
	@echo "Available commands:"
	@echo "  make dev        - Run both frontend and backend"
	@echo "  make test       - Run all tests"
	@echo "  make lint       - Lint all code"
	@echo "  make format     - Format all code"
	@echo "  make clean      - Clean build artifacts"
	@echo ""
	@echo "Component-specific commands:"
	@echo "  make dev-backend     - Run backend only"
	@echo "  make dev-frontend    - Run frontend only"

# Combined commands (default)

dev:
	@echo "Starting frontend and backend..."
	@make -j2 dev-backend dev-frontend

test: test-backend test-frontend

lint: lint-backend lint-frontend

format: format-backend format-frontend

# Backend commands

dev-backend:
	uv run satin

test-backend:
	uv run pytest -n auto

lint-backend:
	uv run ruff check src/
	uv run mypy src/

format-backend:
	uv run isort src/
	uv run ssort src/ --diff --check || ssort src/
	uv run ruff format src/

# Frontend commands
install-frontend:
	cd frontend && pnpm install

dev-frontend:
	cd frontend && pnpm dev

test-frontend:
	cd frontend && pnpm test

lint-frontend:
	cd frontend && pnpm lint

format-frontend:
	cd frontend && pnpm format

build-frontend:
	cd frontend && pnpm build

# Utility commands
clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	rm -rf frontend/build frontend/.svelte-kit
	rm -rf .pytest_cache .coverage htmlcov coverage.xml
