# Minimal development container for SATIn project
FROM mcr.microsoft.com/devcontainers/javascript-node:24
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
RUN wget -qO- https://get.pnpm.io/install.sh | SHELL="$(which bash)" bash -
