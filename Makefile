.DEFAULT_GOAL := help
SHELL=bash
PYCODE_PATHS=src/
PYTESTS_PATH=tests/

.PHONY: start_mongo
start_mongo:
	docker run --name mongo-test -d mongo

.PHONY: stop_mongo
stop_mongo:
	docker stop mongo-test && docker rm mongo-test

.PHONY: test
test:
	uv run pytest -n 5 --cov .
	cd frontend && pnpm test

.PHONY: format
format: format-backend format-frontend

.PHONY: format-backend
format-backend:
	uv run ssort ${PYCODE_PATHS}
	uv run isort ${PYCODE_PATHS}
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
	cd frontend && pnpm run lint

.PHONY: sync
sync:
	uv sync

.PHONY: lock
lock:
	uv lock

.PHONY: docs
docs:
	sphinx-build docs docs/_build
