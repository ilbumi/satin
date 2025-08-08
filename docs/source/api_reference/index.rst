API Reference
=============

Complete reference for SATIn's APIs and interfaces.

.. toctree::
   :maxdepth: 2

   graphql_api
   rest_endpoints
   javascript_sdk
   python_client

Overview
--------

SATIn provides several APIs for integration:

- **GraphQL API**: Primary API for all data operations
- **REST endpoints**: Simple HTTP endpoints for basic operations
- **JavaScript SDK**: Frontend integration utilities
- **Python client**: Backend integration and automation

Authentication
--------------

All API access requires authentication. See the authentication guide for setup instructions.

Rate Limits
-----------

API endpoints have rate limiting to ensure fair usage:

- GraphQL: 1000 requests/hour per user
- REST: 500 requests/hour per user
- File uploads: 100MB per hour per user
