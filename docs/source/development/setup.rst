Development Setup
=================

This guide covers setting up a development environment for contributing to SATIn.

Prerequisites
-------------

Before starting development, ensure you have:

* Python 3.13+
* Node.js 18+ and pnpm
* MongoDB 4.4+
* uv package manager
* Git
* Docker (optional, for containerized development)

Development Environment
----------------------

1. **Fork and Clone**

   Fork the repository on GitHub and clone your fork::

       git clone https://github.com/your-username/satin.git
       cd satin

2. **Backend Setup**

   Install Python dependencies::

       uv sync

   This installs both production and development dependencies.

3. **Frontend Setup**

   Install Node.js dependencies::

       cd frontend
       pnpm install

4. **Database Setup**

   Start MongoDB::

       # Using Docker
       docker compose up -d mongodb

       # Or use your local MongoDB installation
       mongod --dbpath /path/to/your/data

5. **Environment Configuration**

   Create ``.env`` files as described in the :doc:`../installation` guide.

Running the Development Servers
-------------------------------

**Backend Development Server**

Start the FastAPI backend with hot reload::

    make launch_backend

Or manually::

    granian --interface asgi --host 0.0.0.0 --port 8000 --reload satin:app

**Frontend Development Server**

Start the SvelteKit frontend with hot reload::

    make launch_frontend

Or manually::

    cd frontend && pnpm run dev --host 0.0.0.0

Development Commands
-------------------

The project includes several make targets for development:

**Testing**

Run all tests::

    make test

Run backend tests only::

    uv run pytest -n 5 --cov .

Run frontend tests only::

    cd frontend && pnpm test --browser.headless

**Code Quality**

Format all code::

    make format

Lint all code::

    make lint

Backend-specific commands::

    make format-backend  # Format Python code
    make lint-backend    # Lint Python code

Frontend-specific commands::

    make format-frontend # Format TypeScript/Svelte code
    make lint-frontend   # Lint TypeScript/Svelte code

**Documentation**

Build documentation::

    make docs

Or manually::

    sphinx-build docs docs/_build

Development Workflow
-------------------

1. **Create Feature Branch**

   Create a branch for your feature::

       git checkout -b feature/your-feature-name

2. **Make Changes**

   - Write code following the project conventions
   - Add tests for new functionality
   - Update documentation as needed

3. **Test Your Changes**

   Run the full test suite::

       make test

   Ensure linting passes::

       make lint

4. **Commit Changes**

   Use descriptive commit messages::

       git add .
       git commit -m "feat: add new annotation tool"

5. **Push and Create PR**

   Push to your fork and create a pull request::

       git push origin feature/your-feature-name

Code Style and Conventions
-------------------------

**Python (Backend)**

- Use ``ruff`` for linting and formatting
- Follow PEP 8 with line length of 120 characters
- Use type hints for all functions
- Write docstrings for all public functions

**TypeScript/Svelte (Frontend)**

- Use ESLint and Prettier for code formatting
- Follow the existing component structure
- Write unit tests for components
- Use TypeScript for type safety

**Git Conventions**

- Use conventional commits (feat:, fix:, docs:, etc.)
- Keep commits atomic and well-documented
- Rebase feature branches before merging

IDE Configuration
----------------

**VS Code**

Recommended extensions:

- Python
- Svelte for VS Code
- ESLint
- Prettier
- REST Client

**PyCharm/IntelliJ**

- Enable Python plugin
- Configure code style to match project settings
- Set up run configurations for backend and tests

Debugging
---------

**Backend Debugging**

Use the Python debugger::

    import pdb; pdb.set_trace()

Or use your IDE's debugging capabilities.

**Frontend Debugging**

Use browser developer tools and Svelte DevTools extension.

**Database Debugging**

Connect to MongoDB::

    # Using MongoDB Compass (GUI)
    mongodb://localhost:27017

    # Using mongosh (CLI)
    mongosh "mongodb://localhost:27017/satin"

Docker Development
-----------------

For a fully containerized development environment::

    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

This provides:

- Hot reload for backend and frontend
- Persistent MongoDB data
- Isolated development environment

Troubleshooting
--------------

**Common Issues**

* **Port conflicts**: Ensure ports 8000, 5173, and 27017 are available
* **Python path issues**: Make sure the src directory is in your Python path
* **Node version**: Use Node.js 18+ for frontend development
* **MongoDB connection**: Verify MongoDB is running and accessible

**Getting Help**

- Check existing GitHub issues
- Ask questions in discussions
- Review the troubleshooting documentation
