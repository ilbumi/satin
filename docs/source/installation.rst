Installation
============

Requirements
------------

* Python 3.13 or higher
* Node.js 18+ and pnpm
* MongoDB 4.4+
* uv package manager

Development Setup
-----------------

1. Clone the repository::

    git clone https://github.com/your-username/satin.git
    cd satin

2. Install backend dependencies::

    uv sync

3. Install frontend dependencies::

    cd frontend
    pnpm install

4. Start MongoDB (using Docker)::

    docker compose up -d mongodb

5. Run the development servers::

    # Backend (in one terminal)
    make launch_backend

    # Frontend (in another terminal)
    make launch_frontend

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- GraphQL Playground: http://localhost:8000/graphql

Docker Setup
------------

For a complete Docker setup::

    docker compose up

This will start all services including MongoDB, backend, and frontend.

Environment Variables
--------------------

Backend
~~~~~~~

Create a ``.env`` file in the root directory:

.. code-block:: bash

    MONGODB_DSN=mongodb://localhost:27017
    DATABASE_NAME=satin
    CORS_ORIGINS=["http://localhost:5173", "http://localhost:3000"]

Frontend
~~~~~~~~

Create a ``.env`` file in the ``frontend`` directory:

.. code-block:: bash

    BACKEND_URL=http://localhost:8000

Production Deployment
--------------------

1. Build the frontend::

    cd frontend
    pnpm run build

2. Set production environment variables
3. Start the backend with a production ASGI server like Gunicorn
4. Serve the frontend build with a web server like Nginx

See the deployment guide for detailed production setup instructions.
