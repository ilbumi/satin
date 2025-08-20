=====================================
SATIn - Simple Annotation Tool for Images
=====================================

SATIn is an image annotation platform for creating datasets for computer vision tasks.

Quick Links
===========

- :doc:`user_guide/installation` - Installation instructions
- :doc:`api/index` - API documentation
- :doc:`developer/architecture` - System architecture
- :doc:`developer/index` - Developer guide

Features
========

- Bounding box annotation with zoom and pan
- Flexible labeling system
- MongoDB storage with export to COCO, YOLO, Pascal VOC formats
- GraphQL API built with FastAPI and Strawberry
- SvelteKit frontend with responsive design
- Project and task management

Documentation Contents
======================

.. toctree::
   :maxdepth: 2
   :caption: User Guide

   user_guide/index
   user_guide/installation
   user_guide/quickstart
   user_guide/projects
   user_guide/annotations
   user_guide/tasks
   user_guide/export

.. toctree::
   :maxdepth: 2
   :caption: API Reference

   api/index
   api/graphql
   api/backend
   api/models
   api/repositories
   api/frontend

.. toctree::
   :maxdepth: 2
   :caption: Developer Guide

   developer/index
   developer/setup
   developer/architecture
   developer/backend
   developer/frontend
   developer/testing
   developer/contributing
   developer/deployment

Project Status
==============

SATIn is in active development with core functionality implemented:

**Implemented:**
- Project and task management
- Image upload and management
- Bounding box annotation tools
- GraphQL API with full CRUD operations
- SvelteKit frontend
- Test suite

**In Development:**
- Annotation tools (polygons, points)
- Export system integration
- ML prediction integration

Architecture Overview
====================

**Backend:** FastAPI with Strawberry GraphQL, MongoDB with Motor, Pydantic models

**Frontend:** SvelteKit with TypeScript, URQL GraphQL client, Konva.js canvas, TailwindCSS

**Development:** uv (Python), pnpm (Node.js), Vitest, Playwright, Docker

Contributing
============

See the :doc:`developer/contributing` guide for development setup, code standards, and pull request process.

License
=======

MIT License - see the LICENSE file for details.

Search
======

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`
