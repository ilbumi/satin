============
Installation
============

This guide will help you install and set up SATIn on your system. Choose the
installation method that best fits your needs.

.. contents:: Table of Contents
   :depth: 2
   :local:

System Requirements
===================

- Operating System: Linux, macOS
- Python: 3.13+
- Node.js: 18+
- MongoDB: 4.4+
- Memory: 4GB RAM minimum

Docker Installation (Recommended)
==================================

Install Docker and Docker Compose, then:

.. code-block:: bash

   git clone https://github.com/your-org/satin.git
   cd satin
   cp .env.example .env
   # Edit .env file with your database credentials
   docker-compose up -d

Access the application:
- Backend API: http://localhost:8000/graphql
- Frontend UI: http://localhost:3000

To use different ports, edit the ``.env`` file. Data is automatically persisted in Docker volumes.

Manual Installation
===================

Install dependencies:

.. code-block:: bash

   # Install uv and pnpm
   curl -LsSf https://astral.sh/uv/install.sh | sh
   npm install -g pnpm

   # Install MongoDB (varies by OS)
   # Linux: sudo apt install mongodb
   # macOS: brew install mongodb-community

Clone and setup:

.. code-block:: bash

   git clone https://github.com/your-org/satin.git
   cd satin
   uv sync
   cd frontend && pnpm install && cd ..

Start MongoDB and create database user, then configure ``.env`` file and start services:

.. code-block:: bash

   # Start backend
   uv run satin

   # Start frontend (in another terminal)
   cd frontend && pnpm run dev

Development Setup
=================

For development:

.. code-block:: bash

   uv sync --group dev
   cd frontend && pnpm install --include=dev
   uv run pre-commit install

Run tests with ``make test`` and linting with ``make lint``.

Troubleshooting
===============

For installation issues, check system requirements, verify MongoDB is running, and ensure ports are available. See GitHub issues for common problems and solutions.
