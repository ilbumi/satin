================
Developer Guide
================

Information for developers contributing to SATIn, extending functionality, or deploying in production.

.. toctree::
   :maxdepth: 2
   :caption: Development Setup

   setup
   architecture

.. toctree::
   :maxdepth: 2
   :caption: Development Guides

   backend
   frontend
   testing

.. toctree::
   :maxdepth: 2
   :caption: Project Management

   contributing
   deployment

Architecture Overview
=====================

SATIn uses a full-stack architecture with separated concerns:

.. mermaid::

   graph TD
       A[Frontend - SvelteKit] --> B[GraphQL API]
       B --> C[FastAPI Backend]
       C --> D[MongoDB Database]
       C --> E[File Storage]

       F[Repository Layer] --> D
       G[Domain Models] --> F
       H[GraphQL Schema] --> G

       C --> F
       B --> H

**Technology Stack:**

**Frontend:**
- **SvelteKit** with TypeScript
- **URQL** GraphQL client
- **TailwindCSS** styling
- **Konva.js** canvas
- **Vitest** unit testing, **Playwright** E2E testing

**Backend:**
- **FastAPI** with async/await
- **Strawberry GraphQL** API schema
- **Pydantic** data validation
- **Motor** async MongoDB driver
- **pytest** testing

**Infrastructure:**
- **MongoDB** document storage
- **Docker** containerization
- **uv** Python dependencies
- **pnpm** Node.js packages

Development Principles
======================

**Code Quality:**
- Type safety throughout the stack (TypeScript, Python typing)
- Test coverage (unit, integration, E2E)
- Automated code formatting and linting
- Pre-commit hooks for quality assurance

**Architecture Patterns:**
- **Repository Pattern** for clean data access abstraction
- **Domain-Driven Design** with clear domain models
- **Clean Architecture** with separated layers
- **Event-driven** patterns for real-time features

**Performance:**
- Async/await patterns for non-blocking operations
- Efficient database queries with proper indexing
- Frontend optimization with code splitting
- Caching strategies at multiple levels

**Security:**
- Input validation and sanitization
- Secure file upload handling
- CORS configuration for API access
- Planned authentication and authorization

Quick Start for Developers
===========================

1. **Clone and Setup:**

   .. code-block:: bash

      git clone https://github.com/your-org/satin.git
      cd satin

      # Setup backend
      uv sync --group dev

      # Setup frontend
      cd frontend && pnpm install

2. **Start Development Environment:**

   .. code-block:: bash

      # Start MongoDB (if not using Docker)
      sudo systemctl start mongod

      # Start backend in development mode
      uv run satin

      # In another terminal, start frontend
      cd frontend && pnpm run dev

3. **Run Tests:**

   .. code-block:: bash

      # Backend tests
      uv run pytest

      # Frontend tests
      cd frontend && pnpm run test:unit

4. **Code Quality Checks:**

   .. code-block:: bash

      make lint
      make format

Project Structure
=================

.. code-block:: text

   satin/
   ├── src/satin/              # Backend Python code
   │   ├── main.py             # FastAPI application entry point
   │   ├── config.py           # Configuration management
   │   ├── db.py               # Database connection
   │   ├── models/             # Pydantic domain models
   │   ├── repositories/       # Data access layer
   │   ├── schema/             # GraphQL schema definitions
   │   ├── middleware/         # FastAPI middleware
   │   └── validators/         # Input validation utilities
   ├── frontend/               # SvelteKit frontend
   │   ├── src/                # Frontend source code
   │   │   ├── lib/            # Shared libraries and components
   │   │   ├── routes/         # SvelteKit routes/pages
   │   │   └── app.html        # HTML template
   │   ├── e2e/                # End-to-end tests
   │   └── static/             # Static assets
   ├── tests/                  # Backend tests
   ├── docs/                   # Documentation source
   ├── docker/                 # Docker configuration
   ├── Makefile                # Development automation
   └── pyproject.toml          # Python project configuration

Development Workflow
====================

**Feature Development:**

1. **Create Feature Branch:**

   .. code-block:: bash

      git checkout -b feature/new-annotation-tool

2. **Implement Changes:**
   - Write tests first (TDD approach recommended)
   - Implement backend changes (models, repositories, schema)
   - Implement frontend changes (components, services, pages)
   - Update documentation

3. **Quality Checks:**

   .. code-block:: bash

      make lint          # Check code style
      make test          # Run all tests
      make format        # Format code

4. **Commit and Push:**

   .. code-block:: bash

      git add .
      git commit -m "feat: add new annotation tool"
      git push origin feature/new-annotation-tool

5. **Create Pull Request:**
   - Include clear description of changes
   - Reference related issues
   - Add screenshots for UI changes
   - Ensure CI/CD passes

**Bug Fix Workflow:**

1. **Reproduce the Issue:**
   - Create a failing test that demonstrates the bug
   - Document the expected vs actual behavior

2. **Implement Fix:**
   - Make minimal changes to fix the issue
   - Ensure the test now passes
   - Verify no regressions

3. **Test Thoroughly:**
   - Run full test suite
   - Manual testing in development environment
   - Consider edge cases

Development Guides
==================

**Backend Development:**
- :doc:`backend` - FastAPI, GraphQL, database design
- Repository pattern implementation
- Adding new GraphQL operations
- Database migration strategies

**Frontend Development:**
- :doc:`frontend` - SvelteKit, TypeScript, component development
- State management with stores
- GraphQL client configuration
- Canvas and annotation tools

**Testing Strategy:**
- :doc:`testing` - Testing approach
- Unit testing best practices
- Integration testing patterns
- E2E testing with Playwright

**Architecture Deep Dive:**
- :doc:`architecture` - System design and patterns
- Database schema design
- API design principles
- Performance optimization

Contributing Guidelines
=======================

See the :doc:`contributing` guide for:

- Code of conduct and community guidelines
- Issue reporting and feature requests
- Pull request process and requirements
- Development environment setup
- Code style and standards

**Quick Contribution Steps:**

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Ensure code quality checks pass
5. Submit a pull request with clear description

Deployment Guide
================

For production deployment instructions, see :doc:`deployment` which covers:

- Production environment setup
- Docker-based deployment
- Environment variable configuration
- Database setup and migrations
- Monitoring and logging
- Security considerations
- Performance optimization

Monitoring and Debugging
========================

**Development Tools:**

- **Backend API**: GraphiQL interface at ``/graphql`` for API exploration
- **Database**: MongoDB Compass for database inspection
- **Logging**: Structured logging with configurable levels
- **Profiling**: Built-in FastAPI profiling capabilities

**Debug Information:**

.. code-block:: python

   # Enable debug mode in development
   DEBUG=true
   LOG_LEVEL=debug

**Common Debug Scenarios:**

- GraphQL query debugging with detailed error messages
- Database query optimization with MongoDB explain
- Frontend state debugging with browser dev tools
- Performance profiling with timing middleware

API Development
===============

**Adding New GraphQL Operations:**

1. **Define Pydantic Model** (if needed):

   .. code-block:: python

      # src/satin/models/new_feature.py
      from pydantic import BaseModel
      from typing import Optional

      class NewFeature(BaseModel):
          id: str
          name: str
          description: Optional[str] = None

2. **Create Repository Methods:**

   .. code-block:: python

      # src/satin/repositories/new_feature.py
      from .base import BaseRepository

      class NewFeatureRepository(BaseRepository[NewFeature]):
          async def find_by_name(self, name: str) -> Optional[NewFeature]:
              # Implementation here
              pass

3. **Define GraphQL Schema:**

   .. code-block:: python

      # src/satin/schema/new_feature.py
      import strawberry
      from typing import List, Optional

      @strawberry.type
      class NewFeature:
          id: strawberry.ID
          name: str
          description: Optional[str] = None

          @classmethod
          def from_pydantic(cls, model: models.NewFeature) -> "NewFeature":
              return cls(
                  id=strawberry.ID(model.id),
                  name=model.name,
                  description=model.description
              )

4. **Add to Query/Mutation Root:**

   .. code-block:: python

      # src/satin/schema/query.py
      @strawberry.field
      async def new_features(
          self,
          info: strawberry.Info
      ) -> List[NewFeature]:
          repo_factory = info.context["repo_factory"]
          features = await repo_factory.new_feature_repo.find_all()
          return [NewFeature.from_pydantic(f) for f in features]

Testing Best Practices
======================

**Test Organization:**

.. code-block:: text

   tests/
   ├── unit/                   # Unit tests
   │   ├── test_models.py      # Model validation tests
   │   ├── test_repositories.py # Repository logic tests
   │   └── test_schema.py      # GraphQL resolver tests
   ├── integration/            # Integration tests
   │   ├── test_api.py         # Full API workflow tests
   │   └── test_database.py    # Database integration tests
   └── conftest.py             # Shared test fixtures

**Writing Tests:**

.. code-block:: python

   import pytest
   from satin.models import Project
   from tests.conftest import GraphQLTestClient

   async def test_create_project():
       client = GraphQLTestClient()

       mutation = """
       mutation CreateProject($input: ProjectInput!) {
         createProject(input: $input) {
           id
           name
           description
         }
       }
       """

       variables = {
           "input": {
               "name": "Test Project",
               "description": "Test Description"
           }
       }

       result = await client.execute(mutation, variables)

       assert result["data"]["createProject"]["name"] == "Test Project"
       assert result["data"]["createProject"]["description"] == "Test Description"

Learning Resources
==================

**Technologies Used:**
- `FastAPI Documentation <https://fastapi.tiangolo.com/>`_
- `Strawberry GraphQL <https://strawberry.rocks/>`_
- `SvelteKit Documentation <https://kit.svelte.dev/>`_
- `MongoDB Motor Driver <https://motor.readthedocs.io/>`_
- `Pydantic Documentation <https://docs.pydantic.dev/>`_

**Best Practices:**
- `Python Typing Best Practices <https://docs.python.org/3/library/typing.html>`_
- `GraphQL Best Practices <https://graphql.org/learn/best-practices/>`_
- `Svelte Best Practices <https://svelte.dev/docs>`_
- `Testing Best Practices <https://docs.pytest.org/en/stable/>`_

Getting Help
============

**Development Questions:**
- Check existing GitHub issues and discussions
- Review the documentation sections
- Ask questions in GitHub discussions

**Bug Reports:**
- Use the issue template
- Include reproduction steps
- Provide system information
- Add relevant logs and screenshots

**Feature Requests:**
- Describe the use case and motivation
- Provide implementation ideas if you have them
- Consider contributing the feature yourself

Roadmap
=======

**Current Focus:**
- Performance optimization for large image datasets
- Annotation tools (polygons, points)
- Real-time collaboration features
- Export system enhancements

**Future Plans:**
- Mobile app development
- ML model integration for assisted annotation
- Analytics and reporting
- Enterprise features (SSO, RBAC)

**Contributing Priorities:**
- Test coverage improvements
- Documentation enhancements
- Performance optimizations
- Bug fixes and stability improvements

.. note::
   This developer guide is continuously updated. If you find missing information
   or have suggestions for improvement, please contribute to the documentation!
