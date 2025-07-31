#!/bin/bash

set -e

# Install Python dependencies
uv sync
uv run pre-commit install

# Install frontend dependencies
(cd frontend && pnpm install && pnpm exec playwright install && pnpm exec playwright install-deps)


echo "postCreateCommand.sh complete."
