================
Backend API
================

Python backend API documentation including FastAPI application, GraphQL implementation, and core services.

.. contents:: Table of Contents
   :depth: 2
   :local:

FastAPI Application
===================

Main Application Module
------------------------

.. automodule:: satin.main
   :members:
   :undoc-members:
   :show-inheritance:

The main FastAPI application is defined in ``satin.main`` and includes:

- GraphQL endpoint setup with Strawberry
- CORS middleware configuration
- Request logging middleware
- Static file serving for uploaded images
- Health check endpoints

Configuration
-------------

.. automodule:: satin.config
   :members:
   :undoc-members:
   :show-inheritance:

Application configuration is managed through environment variables and Pydantic settings:

- Database connection settings
- File upload configuration
- Server settings (host, port, etc.)
- Development vs production settings

Database Connection
-------------------

.. automodule:: satin.db
   :members:
   :undoc-members:
   :show-inheritance:

Database connectivity is managed through Motor (async MongoDB driver):

- Connection pooling and lifecycle management
- Database initialization
- Health check utilities

GraphQL Schema Implementation
=============================

The GraphQL schema is implemented using Strawberry GraphQL and organized into
logical modules for queries, mutations, and type definitions.

Query Resolvers
---------------

.. automodule:: satin.schema.query
   :members:
   :undoc-members:
   :show-inheritance:

Main query entry point that aggregates all available queries:

- Project queries (list, get by ID)
- Image queries (list, get by ID, filter by project)
- Task queries (list, get by ID, filter by project/status)

Mutation Resolvers
------------------

.. automodule:: satin.schema.mutation
   :members:
   :undoc-members:
   :show-inheritance:

Main mutation entry point for all data modifications:

- Project CRUD operations
- Image upload and management
- Task lifecycle management
- Annotation updates

Type Definitions
----------------

Project Types
~~~~~~~~~~~~~

.. automodule:: satin.schema.project
   :members:
   :undoc-members:
   :show-inheritance:

GraphQL types and resolvers for project-related operations.

Image Types
~~~~~~~~~~~

.. automodule:: satin.schema.image
   :members:
   :undoc-members:
   :show-inheritance:

GraphQL types and resolvers for image-related operations, including file upload handling.

Task Types
~~~~~~~~~~

.. automodule:: satin.schema.task
   :members:
   :undoc-members:
   :show-inheritance:

GraphQL types and resolvers for task management and annotation workflows.

Annotation Types
~~~~~~~~~~~~~~~~

.. automodule:: satin.schema.annotation
   :members:
   :undoc-members:
   :show-inheritance:

GraphQL types for annotation data structures (bounding boxes, labels, etc.).

Schema Utilities
~~~~~~~~~~~~~~~~

.. automodule:: satin.schema.utils
   :members:
   :undoc-members:
   :show-inheritance:

Common utilities for GraphQL schema implementation:

- Error handling decorators
- Input validation helpers
- Response formatting utilities

Filter Types
~~~~~~~~~~~~

.. automodule:: satin.schema.filters
   :members:
   :undoc-members:
   :show-inheritance:

Input types and utilities for filtering and pagination.

Middleware
==========

Logging Middleware
------------------

.. automodule:: satin.middleware.logging
   :members:
   :undoc-members:
   :show-inheritance:

Request/response logging middleware that provides:

- Structured logging of all API requests
- Performance metrics (request duration)
- Error tracking and reporting
- Request ID correlation

Exception Handling
==================

.. automodule:: satin.exceptions
   :members:
   :undoc-members:
   :show-inheritance:

Custom exception classes and error handling utilities:

- Domain-specific exceptions (ProjectNotFound, ImageNotFound, etc.)
- GraphQL error formatting
- Error code standardization
- Logging integration

Validation
==========

Input Sanitization
------------------

.. automodule:: satin.validators.input_sanitizer
   :members:
   :undoc-members:
   :show-inheritance:

Input validation and sanitization utilities:

- HTML content sanitization using bleach
- File upload validation
- User input cleaning
- XSS prevention

Data Access Layer
==================

The data access layer is implemented using the Repository pattern to provide
a clean abstraction over database operations. See the :doc:`repositories`
documentation for detailed information about:

- Base repository class
- Project repository
- Image repository
- Task repository
- Repository factory pattern

Security Considerations
========================

Current Security Measures
--------------------------

- **Input Sanitization**: All user inputs are sanitized using bleach
- **File Upload Validation**: Image uploads are validated for type and size
- **SQL Injection Prevention**: MongoDB queries use parameterized operations
- **CORS Configuration**: Configurable CORS settings for frontend integration

Planned Security Features
-------------------------

- **Authentication**: JWT-based user authentication
- **Authorization**: Role-based access control (RBAC)
- **Rate Limiting**: API rate limiting to prevent abuse
- **Content Security Policy**: CSP headers for XSS prevention
- **HTTPS Enforcement**: SSL/TLS termination configuration

Performance
===========

Database Performance
--------------------

- **Connection Pooling**: Efficient connection management with Motor
- **Indexing Strategy**: Strategic database indexes for common queries
- **Pagination**: Efficient pagination implementation for large datasets
- **Query Optimization**: Optimized MongoDB aggregation pipelines

API Performance
---------------

- **Async/Await**: Fully asynchronous request handling
- **GraphQL Efficiency**: Field-level resolution for minimal data transfer
- **File Handling**: Streaming file uploads for memory efficiency
- **Caching Strategy**: Prepared for Redis integration

Testing Integration
===================

The backend supports testing:

- **Unit Tests**: Individual component testing with pytest
- **Integration Tests**: Database integration with mongomock-motor
- **GraphQL Tests**: Schema and resolver testing with test client
- **Mock Support**: Mocking for external dependencies

Example test utilities:

.. code-block:: python

   from satin.db import get_database
   from tests.conftest import GraphQLTestClient

   async def test_create_project():
       client = GraphQLTestClient()
       mutation = '''
         mutation CreateProject($input: ProjectInput!) {
           createProject(input: $input) {
             id
             name
             description
           }
         }
       '''
       variables = {
         "input": {
           "name": "Test Project",
           "description": "Test Description"
         }
       }
       result = await client.execute(mutation, variables)
       assert result["data"]["createProject"]["name"] == "Test Project"

Usage Examples
==============

Creating a Custom Resolver
---------------------------

.. code-block:: python

   import strawberry
   from typing import List
   from satin.repositories.factory import RepositoryFactory

   @strawberry.type
   class CustomQuery:
       @strawberry.field
       async def custom_projects(
           self,
           info: strawberry.Info,
           status: str = "active"
       ) -> List[Project]:
           repo_factory: RepositoryFactory = info.context["repo_factory"]
           # Custom business logic here
           projects = await repo_factory.project_repo.find_by_status(status)
           return [Project.from_pydantic(p) for p in projects]

Adding Middleware
-----------------

.. code-block:: python

   from fastapi import Request, Response
   from starlette.middleware.base import BaseHTTPMiddleware

   class CustomMiddleware(BaseHTTPMiddleware):
       async def dispatch(self, request: Request, call_next):
           # Pre-processing
           start_time = time.time()

           response: Response = await call_next(request)

           # Post-processing
           process_time = time.time() - start_time
           response.headers["X-Process-Time"] = str(process_time)

           return response

   # Add to FastAPI app
   app.add_middleware(CustomMiddleware)

Related Documentation
=====================

- :doc:`models` - Pydantic data models
- :doc:`repositories` - Data access layer
- :doc:`graphql` - GraphQL schema reference
- :doc:`../developer/testing` - Testing guidelines
