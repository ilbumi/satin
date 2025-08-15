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

# Project paths
PYCODE_PATHS := src/
PYTESTS_PATH := tests/

.PHONY: help
help:
	@echo "Available commands:"
	@echo "  test               Run backend and frontend unit tests"
	@echo "  format            Format all code"
	@echo "  lint              Lint all code"
	@echo "  sync              Sync dependencies"
	@echo "  docs              Build documentation"

.PHONY: test
test:
	uv run pytest -n 5 --cov .

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
	cd frontend && pnpm run lint && pnpm check

.PHONY: sync
sync:
	uv sync

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
