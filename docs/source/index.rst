SATIn Documentation
===================

**SATIn** (Semi-Automated Tool for Image Annotation) is a comprehensive image annotation tool designed for creating datasets for computer vision tasks. It features a Python FastAPI backend with GraphQL API and a SvelteKit frontend.

.. image:: https://img.shields.io/badge/python-3.13+-blue.svg
   :target: https://www.python.org/downloads/
   :alt: Python 3.13+

.. image:: https://img.shields.io/badge/fastapi-0.116+-green.svg
   :target: https://fastapi.tiangolo.com/
   :alt: FastAPI

.. image:: https://img.shields.io/badge/svelte-5+-orange.svg
   :target: https://svelte.dev/
   :alt: Svelte 5

Quick Start
-----------

SATIn provides a full-stack solution for image annotation workflows:

- **Backend**: Python FastAPI application with GraphQL API using Strawberry GraphQL
- **Frontend**: SvelteKit application with TypeScript and URQL GraphQL client
- **Database**: MongoDB for persistent storage
- **Architecture**: Repository pattern with factory for data access layer

Features
--------

* 🖼️ **Image Management**: Upload, organize, and manage images for annotation projects
* 🏷️ **Annotation Tools**: Bounding box annotation with labeling capabilities
* 📊 **Project Management**: Organize annotation work into projects and tasks
* 🔄 **GraphQL API**: Flexible and efficient, while simple, data access with GraphQL

Documentation Contents
----------------------

.. toctree::
   :maxdepth: 2
   :caption: User Guide:

   installation
   quickstart
   user_guide/index
   api_reference/index

.. toctree::
   :maxdepth: 2
   :caption: Developer Guide:

   development/setup
   development/architecture
   development/contributing
   development/testing

.. toctree::
   :maxdepth: 1
   :caption: API Reference:

   api/backend
   api/frontend
   api/graphql

Indices and tables
==================

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`
