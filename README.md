# Satin

Web-based image annotation tool for ML data annotation with Svelte frontend and FastAPI/GraphQL backend.

## Features

- Web-based interface with Svelte 5
- ML pipeline integration for pre-annotation
- Versioned annotations with history tracking
- Canvas-based annotation with Konva.js layers
- Export to multiple formats
- Auto-save with batch mutations

## Tech Stack

### Frontend
- Framework: Svelte 5 + SvelteKit
- Styling: Tailwind CSS v4
- Build Tool: Vite
- Testing: Vitest + Playwright
- Package Manager: pnpm

### Backend
- Framework: FastAPI + Strawberry GraphQL
- Language: Python 3.13+
- Database: MongoDB 7.0
- Package Manager: uv
- Testing: pytest

## Quick Start

### Prerequisites
- Node.js 18+ and pnpm
- Python 3.13+ and uv
- Docker and Docker Compose

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd satin
   ```

2. **Install dependencies**
   ```bash
   # Backend dependencies
   uv pip install -e ".[dev]"

   # Frontend dependencies
   cd frontend && pnpm install
   ```

3. **Start development servers**
   ```bash
   # Run both frontend and backend
   make dev

   # Or run individually
   make dev-backend    # Backend only (includes MongoDB)
   make dev-frontend   # Frontend only
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:8000 (when implemented)
   - MongoDB: localhost:27017

## Available Commands

### Combined Commands
```bash
make dev        # Run both frontend and backend concurrently
make test       # Run all tests (backend + frontend)
make lint       # Lint all code (backend + frontend)
make format     # Format all code (backend + frontend)
make clean      # Clean build artifacts
make clean-mongo # Clean MongoDB data
```

### Frontend Commands
```bash
cd frontend
pnpm dev           # Start dev server
pnpm build         # Build production app
pnpm test          # Run unit tests
pnpm lint          # Check formatting and ESLint
pnpm format        # Auto-format with Prettier
pnpm check         # Type-check with svelte-check
```

### Backend Commands
```bash
uv run satin           # Run the application
uv run pytest -n auto # Run tests with parallel execution
uv run ruff check src/ # Lint with ruff
uv run mypy src/       # Type checking
uv run ruff format src/ # Format code
```

## Architecture

Modular monolith architecture with separated frontend and backend modules:

- GraphQL-First API for flexible data fetching
- Versioned annotations with complete history tracking
- Canvas layer management with separate layers for annotation types
- Docker Compose deployment with three containers (frontend, backend, MongoDB)

## Performance Targets

- Page load time < 2 seconds
- Annotation save latency < 500ms
- Support for 500+ annotations per image
- 40% reduction in annotation time with ML assistance


## Contributing

1. Follow the established code conventions and patterns
2. Run tests and linting before submitting changes
3. Use TypeScript for new frontend code
4. Follow the existing project st
