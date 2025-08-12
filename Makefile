.DEFAULT_GOAL := help
SHELL=bash
PYCODE_PATHS=src/
PYTESTS_PATH=tests/

.PHONY: test
test:
	uv run pytest -n 5 --cov .
	cd frontend && pnpm test --browser.headless

.PHONY: test-all
test-all:
	uv run pytest -n 5 --cov .
	cd frontend && pnpm test --browser.headless
	cd frontend && pnpm run test:e2e

.PHONY: launch_backend
launch_backend:
	@echo "Starting MongoDB..."
	docker-compose up -d mongodb
	@echo "Waiting for MongoDB to be healthy..."
	@until docker-compose ps mongodb | grep -q "healthy"; do \
		echo "Waiting for MongoDB to start..."; \
		sleep 2; \
	done
	@echo "MongoDB is ready! Starting backend server..."
	uv run granian --interface asgi --host 0.0.0.0 --port 8000 --reload satin:app

.PHONY: launch_frontend
launch_frontend:
	cd frontend && pnpm run dev --host 0.0.0.0

.PHONY: stop_backend
stop_backend:
	@echo "Stopping MongoDB..."
	docker-compose down mongodb

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
