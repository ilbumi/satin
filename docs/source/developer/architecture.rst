================
Architecture
================

Overview of SATIn's system architecture, design patterns, and technical decisions.

.. contents:: Table of Contents
   :depth: 3
   :local:

System Overview
===============

SATIn uses a full-stack architecture with separated frontend, backend API, and data storage layers.

High-Level Architecture
-----------------------

.. code-block:: text

   ┌─────────────────────────────────────────────────┐
   │                 Frontend Layer                  │
   │              (SvelteKit + TypeScript)           │
   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
   │  │   Routes    │  │ Components  │  │   Stores    │
   │  │   Pages     │  │    UI       │  │   State     │
   │  └─────────────┘  └─────────────┘  └─────────────┘
   └─────────────────────────────────────────────────┘
                             │
                          GraphQL
                             │
   ┌─────────────────────────────────────────────────┐
   │                 Backend Layer                   │
   │               (FastAPI + Strawberry)            │
   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
   │  │  GraphQL    │  │ Middleware  │  │  Services   │
   │  │   Schema    │  │   Logging   │  │   Logic     │
   │  └─────────────┘  └─────────────┘  └─────────────┘
   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
   │  │ Repository  │  │   Models    │  │ Validation  │
   │  │   Layer     │  │  Pydantic   │  │  Security   │
   │  └─────────────┘  └─────────────┘  └─────────────┘
   └─────────────────────────────────────────────────┘
                             │
                           Motor
                             │
   ┌─────────────────────────────────────────────────┐
   │                 Data Layer                      │
   │                   (MongoDB)                     │
   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
   │  │  Projects   │  │    Images   │  │    Tasks    │
   │  │ Collection  │  │ Collection  │  │ Collection  │
   │  └─────────────┘  └─────────────┘  └─────────────┘
   └─────────────────────────────────────────────────┘

Technology Stack
----------------

**Frontend Stack:**
- **Framework**: SvelteKit 2.x with TypeScript
- **GraphQL Client**: URQL with caching and error handling
- **Styling**: TailwindCSS 3.x with custom components
- **Canvas**: Konva.js for high-performance annotation canvas
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Build**: Vite with SvelteKit adapter

**Backend Stack:**
- **Framework**: FastAPI 0.116+ with async/await
- **GraphQL**: Strawberry GraphQL with dataclasses
- **Database**: MongoDB 4.4+ with Motor async driver
- **Validation**: Pydantic v2 for data modeling
- **Testing**: pytest with mongomock-motor
- **Code Quality**: Ruff, mypy, isort

**Infrastructure:**
- **Development**: Docker Compose for local development
- **Package Management**: uv (Python), pnpm (Node.js)
- **Process Management**: Granian ASGI server
- **File Storage**: Local filesystem with configurable paths

Design Principles
==================

Clean Architecture
------------------

SATIn follows Clean Architecture principles with clearly defined layers:

1. **Domain Layer** (innermost):
   - Pydantic models representing business entities
   - Domain logic and business rules
   - Independent of external frameworks

2. **Application Layer**:
   - Repository interfaces defining data contracts
   - Service classes coordinating business workflows
   - GraphQL resolvers handling API operations

3. **Infrastructure Layer** (outermost):
   - Database implementations using Motor
   - File system operations
   - External service integrations

Dependency Inversion
--------------------

Dependencies point inward toward the domain:

.. code-block:: python

   # Domain model (no dependencies)
   class Project(BaseModel):
       id: str
       name: str
       description: Optional[str]

   # Application interface (depends on domain)
   class ProjectRepositoryInterface(ABC):
       async def create_project(self, project: Project) -> Project:
           pass

   # Infrastructure implementation (depends on interface)
   class MongoProjectRepository(ProjectRepositoryInterface):
       async def create_project(self, project: Project) -> Project:
           # MongoDB-specific implementation
           pass

Type Safety
-----------

Strong typing throughout the application:

- **Backend**: Python typing with mypy validation
- **Frontend**: TypeScript with strict configuration
- **API**: GraphQL provides type safety between layers
- **Database**: Pydantic models validate data shapes

Data Architecture
=================

Database Design
---------------

MongoDB collections are designed for efficient querying and scalability:

**Projects Collection:**

.. code-block:: javascript

   {
     _id: ObjectId,
     name: "string",
     description: "string?",
     created_at: ISODate,
     updated_at: ISODate,
     // Denormalized counts for performance
     image_count: 0,
     task_count: 0,
     completed_task_count: 0
   }

**Images Collection:**

.. code-block:: javascript

   {
     _id: ObjectId,
     filename: "string",
     url: "string",
     width: 1920,
     height: 1080,
     file_size: 2048000,
     project_id: ObjectId,
     created_at: ISODate,
     // Metadata for image processing
     metadata: {
       format: "JPEG",
       color_space: "RGB"
     }
   }

**Tasks Collection:**

.. code-block:: javascript

   {
     _id: ObjectId,
     name: "string",
     description: "string?",
     status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "REVIEWED",
     image_id: ObjectId,
     project_id: ObjectId,
     created_at: ISODate,
     updated_at: ISODate,
     // Embedded annotations for performance
     annotations: [
       {
         id: "string",
         x: 0.1,
         y: 0.2,
         width: 0.3,
         height: 0.4,
         label: "string?",
         description: "string?",
         confidence: 0.95,
         metadata: {}
       }
     ]
   }

Indexing Strategy
-----------------

Strategic indexes for common query patterns:

.. code-block:: javascript

   // Projects
   db.projects.createIndex({ "name": 1 })
   db.projects.createIndex({ "created_at": -1 })

   // Images
   db.images.createIndex({ "project_id": 1 })
   db.images.createIndex({ "project_id": 1, "created_at": -1 })
   db.images.createIndex({ "filename": 1 })

   // Tasks
   db.tasks.createIndex({ "project_id": 1 })
   db.tasks.createIndex({ "image_id": 1 })
   db.tasks.createIndex({ "status": 1 })
   db.tasks.createIndex({ "project_id": 1, "status": 1 })
   db.tasks.createIndex({ "updated_at": -1 })

Data Flow Architecture
======================

Request Flow
------------

1. **Client Request**:
   - User action in frontend triggers GraphQL operation
   - URQL client handles request with caching logic

2. **API Gateway**:
   - FastAPI receives HTTP request
   - Logging middleware captures request details
   - CORS middleware validates origin

3. **GraphQL Processing**:
   - Strawberry parses and validates GraphQL query
   - Resolver functions are called with context

4. **Business Logic**:
   - Repository factory provides data access instances
   - Domain models validate business rules
   - Database operations execute asynchronously

5. **Response Formatting**:
   - Pydantic models serialize to GraphQL types
   - Response includes proper error handling
   - Client receives typed response data

Annotation Workflow
-------------------

The annotation workflow demonstrates the complete data flow:

.. code-block:: text

   Frontend Canvas → GraphQL Mutation → Backend Validation
        ↑                                        ↓
   State Update ← Response Data ← Database Update

1. **User Draws Annotation**:
   - Konva.js captures canvas events
   - Frontend validates coordinates
   - Annotation store updates local state

2. **Save Operation**:
   - GraphQL mutation with annotation data
   - Backend validates annotation format
   - Database transaction updates task

3. **Real-time Updates**:
   - Response updates frontend state
   - Other users see changes (future feature)
   - Canvas reflects saved state

Frontend Architecture
=====================

Component Hierarchy
--------------------

.. code-block:: text

   App Shell (Layout)
   ├── Header (Navigation)
   ├── Sidebar (Navigation)
   └── Main Content Area
       ├── Routes (SvelteKit Pages)
       │   ├── Projects Page
       │   │   ├── Project List
       │   │   ├── Project Card
       │   │   └── Create Modal
       │   ├── Tasks Page
       │   │   ├── Task List
       │   │   ├── Task Card
       │   │   └── Filters
       │   └── Annotation Page
       │       ├── Annotation Canvas
       │       ├── Tool Panel
       │       └── Properties Panel
       └── UI Components
           ├── Button
           ├── Input
           ├── Modal
           └── Toast

State Management
----------------

SvelteKit's built-in state management with strategic patterns:

.. code-block:: typescript

   // Global application state
   export const globalStore = writable({
     currentProject: null,
     currentTask: null,
     user: null
   });

   // Feature-specific state
   export const annotationStore = writable({
     annotations: [],
     selectedAnnotation: null,
     activeTool: 'select',
     canvasState: {}
   });

   // Derived state for computed values
   export const annotationCount = derived(
     annotationStore,
     $store => $store.annotations.length
   );

GraphQL Integration
-------------------

URQL client configuration with caching and error handling:

.. code-block:: typescript

   import { Client, cacheExchange, fetchExchange } from '@urql/core';

   const client = new Client({
     url: 'http://localhost:8000/graphql',
     exchanges: [
       cacheExchange,
       fetchExchange
     ],
     requestPolicy: 'cache-first'
   });

   // Typed GraphQL operations
   const CreateProjectDocument = gql`
     mutation CreateProject($input: ProjectInput!) {
       createProject(input: $input) {
         id
         name
         description
       }
     }
   `;

Backend Architecture
====================

Repository Pattern
------------------

Clean separation between business logic and data access:

.. code-block:: python

   # Base repository interface
   class BaseRepository(ABC, Generic[T]):
       @abstractmethod
       async def create(self, entity: T) -> T:
           pass

       @abstractmethod
       async def find_by_id(self, entity_id: str) -> Optional[T]:
           pass

   # Domain-specific repository
   class ProjectRepository(BaseRepository[Project]):
       def __init__(self, db: AsyncIOMotorDatabase):
           self.collection = db.projects

       async def create(self, project: Project) -> Project:
           doc = project.model_dump()
           result = await self.collection.insert_one(doc)
           doc["id"] = str(result.inserted_id)
           return Project(**doc)

Factory Pattern
---------------

Repository factory provides consistent access to data layer:

.. code-block:: python

   class RepositoryFactory:
       def __init__(self, db: AsyncIOMotorDatabase):
           self._db = db
           self._project_repo = None
           self._task_repo = None

       @property
       def project_repo(self) -> ProjectRepository:
           if self._project_repo is None:
               self._project_repo = ProjectRepository(self._db)
           return self._project_repo

GraphQL Schema Organization
---------------------------

Modular schema organization for maintainability:

.. code-block:: python

   # Type definitions
   @strawberry.type
   class Project:
       id: strawberry.ID
       name: str
       description: Optional[str]

       @classmethod
       def from_pydantic(cls, model: models.Project) -> "Project":
           return cls(
               id=strawberry.ID(model.id),
               name=model.name,
               description=model.description
           )

   # Query resolvers
   @strawberry.type
   class Query:
       @strawberry.field
       async def projects(
           self,
           info: strawberry.Info,
           limit: int = 20,
           offset: int = 0
       ) -> ProjectPage:
           repo_factory = info.context["repo_factory"]
           # Implementation
           pass

Security Architecture
=====================

Current Security Measures
--------------------------

**Input Validation:**
- Pydantic models validate all input data
- GraphQL schema enforces type constraints
- Bleach library sanitizes HTML content

**File Upload Security:**
- File type validation based on content, not extension
- File size limits configurable per deployment
- Secure file path generation prevents directory traversal

**Database Security:**
- Parameterized queries prevent injection attacks
- Connection string authentication
- Database user with minimal required permissions

Planned Security Features
-------------------------

**Authentication & Authorization:**

.. code-block:: python

   # Planned JWT-based authentication
   @strawberry.field
   async def projects(
       self,
       info: strawberry.Info,
       user: User = strawberry.Private[User]
   ) -> List[Project]:
       # Only return projects accessible to user
       pass

**API Security:**
- Rate limiting per user/IP address
- Request size limits
- CORS configuration for production
- Content Security Policy headers

Performance Architecture
========================

Database Performance
--------------------

**Connection Pooling:**
- Motor manages async connection pool
- Configurable pool size and timeout
- Health checks and automatic reconnection

**Query Optimization:**
- Strategic indexes for common patterns
- Aggregation pipelines for complex queries
- Projection to limit returned fields

**Caching Strategy:**
- GraphQL query-level caching with URQL
- Planned Redis integration for session data
- Static asset caching with appropriate headers

Frontend Performance
--------------------

**Bundle Optimization:**
- Code splitting at route level
- Dynamic imports for heavy libraries (Konva.js)
- Tree shaking to eliminate dead code

**Canvas Performance:**
- Object pooling for annotation elements
- Viewport-based rendering for large images
- Debounced updates to prevent excessive renders

**Network Optimization:**
- GraphQL field selection reduces payload size
- Request batching with URQL
- Image lazy loading and progressive enhancement

Monitoring Architecture
=======================

Logging Strategy
----------------

Structured logging throughout the application:

.. code-block:: python

   import structlog

   logger = structlog.get_logger(__name__)

   # Contextual logging in middleware
   logger.info(
       "request_completed",
       method=request.method,
       path=request.url.path,
       status_code=response.status_code,
       duration=duration,
       request_id=request_id
   )

Error Handling
--------------

Error handling and reporting:

.. code-block:: python

   # Custom exception hierarchy
   class SATInException(Exception):
       def __init__(self, message: str, code: str = None):
           self.message = message
           self.code = code

   class ProjectNotFound(SATInException):
       def __init__(self, project_id: str):
           super().__init__(
               f"Project {project_id} not found",
               code="PROJECT_NOT_FOUND"
           )

   # GraphQL error formatting
   def format_error(error: GraphQLError, debug: bool = False):
       return {
           "message": str(error),
           "code": getattr(error.original_error, 'code', None),
           "locations": error.locations,
           "path": error.path
       }

Testing Architecture
====================

Testing Strategy
----------------

**Unit Tests:**
- Repository layer with mocked database
- GraphQL resolvers with test client
- Frontend components with Vitest

**Integration Tests:**
- Full API workflows with test database
- Database operations with mongomock-motor
- Frontend integration with Playwright

**End-to-End Tests:**
- Complete user workflows
- Cross-browser compatibility
- Performance benchmarks

Test Organization
-----------------

.. code-block:: text

   tests/
   ├── unit/
   │   ├── test_models.py          # Pydantic model validation
   │   ├── test_repositories.py    # Repository logic
   │   └── test_schema.py          # GraphQL resolvers
   ├── integration/
   │   ├── test_api.py             # Full API workflows
   │   └── test_database.py        # Database operations
   ├── e2e/
   │   ├── projects.spec.ts        # Project management
   │   ├── annotations.spec.ts     # Annotation workflows
   │   └── utils/                  # Test utilities
   └── conftest.py                 # Shared fixtures

Deployment Architecture
=======================

Development Environment
-----------------------

Local development with Docker Compose:

.. code-block:: yaml

   version: '3.8'
   services:
     backend:
       build: .
       ports:
         - "8000:8000"
       environment:
         - DEBUG=true
       volumes:
         - ./src:/app/src
     frontend:
       build: ./frontend
       ports:
         - "3000:3000"
       volumes:
         - ./frontend/src:/app/src
     mongodb:
       image: mongo:latest
       ports:
         - "27017:27017"

Production Considerations
-------------------------

**Scalability:**
- Horizontal scaling with load balancer
- Database read replicas for query distribution
- CDN for static asset delivery

**Reliability:**
- Health check endpoints
- Graceful shutdown handling
- Database backup and recovery procedures

**Security:**
- TLS termination at load balancer
- Environment variable secrets management
- Regular security updates and patches

Future Architecture
===================

Planned Enhancements
--------------------

**Real-time Collaboration:**
- WebSocket integration with FastAPI
- Conflict resolution for concurrent edits
- Real-time cursor and annotation sharing

**Microservices Evolution:**
- ML prediction service
- Image processing service
- Notification service

**Additional Features:**
- Event sourcing for audit trails
- CQRS pattern for read/write separation
- Message queues for async processing

**Mobile Support:**
- React Native app with shared GraphQL client
- Offline synchronization capabilities
- Touch-optimized annotation tools

Technology Evolution
--------------------

**Backend Improvements:**
- Migration to Python 3.14+ features
- Async patterns with asyncio
- Machine learning model integration

**Frontend Enhancements:**
- Progressive Web App (PWA) capabilities
- Canvas optimizations
- WebAssembly for compute-intensive operations

**Infrastructure Updates:**
- Kubernetes orchestration
- Service mesh for microservices
- Observability with OpenTelemetry

.. note::
   This architecture documentation evolves with the system. Major architectural
   changes are discussed in GitHub issues and documented here after implementation.
