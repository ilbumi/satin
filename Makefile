include .env

# Default target
.PHONY: help
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


.PHONY: dev
dev:
	@echo "Starting frontend and backend..."
	@make -j2 dev-backend dev-frontend

.PHONY: test
test: test-backend test-frontend

.PHONY: lint
lint: lint-backend lint-frontend

.PHONY: format
format: format-backend format-frontend

# Backend commands

.PHONY: dev-backend
dev-backend:
	@echo "Starting MongoDB..."
	@docker compose up -d mongodb
	@echo "Starting backend..."
	uv run satin

.PHONY: test-backend
test-backend:
	uv run pytest -n auto

.PHONY: lint-backend
lint-backend:
	uv run ruff check src/ tests/
	uv run mypy src/

.PHONY: format-backend
format-backend:
	uv run isort src/ tests/
	uv run ssort src/ tests/
	uv run ruff format src/ tests/
	uv run ruff check --fix -se src/ tests/

# frontend commands
.PHONY: install-frontend
install-frontend:
	cd frontend && pnpm install

.PHONY: dev-frontend
dev-frontend:
	cd frontend && pnpm dev

.PHONY: test-frontend
test-frontend:
	cd frontend && pnpm test

.PHONY: lint-frontend
lint-frontend:
	cd frontend && pnpm lint && pnpm check

.PHONY: format-frontend
format-frontend:
	cd frontend && pnpm format

.PHONY: build-frontend
build-frontend:
	cd frontend && pnpm build

# Utility commands
.PHONY: clean
clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	rm -rf frontend/build frontend/.svelte-kit
	rm -rf .pytest_cache .coverage htmlcov coverage.xml

.PHONY: mongo-clean
mongo-clean:
	docker compose down -v mongodb
