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

.PHONY: format
format:
	uv run ssort ${PYCODE_PATHS}
	uv run isort ${PYCODE_PATHS}
	uv run ruff format ${PYCODE_PATHS} ${PYTESTS_PATH}
	uv run ruff check --fix ${PYCODE_PATHS} ${PYTESTS_PATH}

.PHONY: lint
lint:
	uv run ruff check ${CODE_PATHS} ${TESTS_PATH}
	uv run mypy ${CODE_PATHS}

.PHONY: sync
sync:
	uv sync

.PHONY: lock
lock:
	uv lock

.PHONY: docs
docs:
	sphinx-build docs docs/_build