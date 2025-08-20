===============
API Reference
===============

Documentation for the SATIn GraphQL API and Python backend.

.. toctree::
   :maxdepth: 2
   :caption: API Documentation

   graphql
   backend
   models
   repositories
   frontend

Quick Links
===========

- :doc:`graphql` - GraphQL schema, queries, mutations, and types
- :doc:`backend` - FastAPI application and core backend functionality
- :doc:`models` - Pydantic data models (coming soon)
- :doc:`repositories` - Data access layer (coming soon)

API Overview
============

The SATIn API provides a GraphQL interface for managing image annotation projects, tasks, and annotations.

**Base URL:** ``http://localhost:8000/graphql``

**Authentication:** None currently (planned for future versions)

Core Concepts
=============

- **Project:** Container for organizing annotation tasks
- **Image:** Uploaded image files that can be annotated
- **Task:** Specific annotation job for an image
- **Annotation:** Individual bounding boxes with labels and metadata

GraphQL Features
================

**Queries:** Fetch projects, images, tasks, and annotations with filtering and pagination

**Mutations:** Create, update, delete operations and file uploads

**Types:** Strongly typed schema with validation

Code Examples
=============

**Fetching Projects**

.. code-block:: graphql

   query GetProjects {
     projects {
       objects {
         id
         name
         description
         createdAt
         taskCount
         imageCount
       }
       totalCount
       hasMore
     }
   }

**Creating a Task**

.. code-block:: graphql

   mutation CreateTask($input: TaskInput!) {
     createTask(input: $input) {
       id
       name
       status
       imageId
       projectId
       createdAt
     }
   }

**Updating Annotations**

.. code-block:: graphql

   mutation UpdateAnnotations($taskId: ID!, $annotations: [BoundingBoxInput!]!) {
     updateTaskAnnotations(taskId: $taskId, annotations: $annotations) {
       id
       annotations {
         id
         x
         y
         width
         height
         label
       }
       updatedAt
     }
   }

Error Handling
==============

The API uses standard GraphQL error handling with validation errors, not found errors, and database errors.

Introspection
=============

GraphQL introspection is available at ``http://localhost:8000/graphql`` for exploring the schema during development.
