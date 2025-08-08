System Architecture
===================

SATIn follows a modern full-stack architecture with clear separation of concerns between frontend, backend, and data layers. This document provides a comprehensive overview of the system design, components, and architectural decisions.

## Architecture Overview

SATIn implements a **3-tier architecture** with additional layers for better maintainability:

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   SvelteKit     │  │   TypeScript    │  │    URQL     │ │
│  │   Components    │  │     Client      │  │   GraphQL   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
                         GraphQL API
                                │
┌─────────────────────────────────────────────────────────────┐
│                     Backend Layer                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │     FastAPI     │  │   Strawberry    │  │   Pydantic  │ │
│  │   HTTP Server   │  │    GraphQL      │  │   Settings  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
│                                │                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Repository    │  │     Schema      │  │   Business  │ │
│  │     Layer       │  │     Layer       │  │    Logic    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
                           MongoDB Driver
                                │
┌─────────────────────────────────────────────────────────────┐
│                     Data Layer                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │     MongoDB     │  │   Collections   │  │   Indexes   │ │
│  │    Database     │  │   & Documents   │  │ & Queries   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### Frontend Architecture

**SvelteKit Application**

The frontend is a modern single-page application built with SvelteKit 2.0:

- **File-based routing**: Routes defined in `src/routes/` directory
- **Component-based**: Reusable Svelte components in `src/lib/components/`
- **Type safety**: Full TypeScript integration
- **Reactive**: Svelte's reactivity system for efficient UI updates

**Key Frontend Components**:

```
src/
├── routes/                     # SvelteKit routes
│   ├── +page.svelte           # Home page
│   └── projects/              # Project routes
│       ├── +page.svelte       # Projects list
│       └── [id]/              # Project detail routes
│           └── annotate/      # Annotation interface
├── lib/
│   ├── components/            # Reusable UI components
│   │   ├── AnnotationPanel.svelte     # Annotation management
│   │   ├── AnnotationToolbar.svelte   # Tool selection
│   │   ├── AnnotationWorkspace.svelte # Main workspace
│   │   └── ImageCanvas.svelte         # Canvas for annotation
│   ├── graphql/               # GraphQL client setup
│   │   ├── client.ts          # URQL client configuration
│   │   ├── queries.ts         # GraphQL queries
│   │   └── types.ts           # TypeScript types
│   ├── stores/                # Svelte stores for state
│   └── utils/                 # Utility functions
└── stories/                   # Storybook component stories
```

**State Management**

- **Svelte Stores**: Reactive state management for annotation data
- **URQL Caching**: Automatic GraphQL query caching
- **Local Component State**: Component-specific reactive variables

### Backend Architecture

**FastAPI Application**

The backend is a modern Python web API built with FastAPI:

- **Async/await**: Full asynchronous support for high performance
- **Type hints**: Complete type safety with Pydantic models
- **Auto-documentation**: Automatic OpenAPI/Swagger documentation
- **CORS support**: Cross-origin resource sharing for frontend integration

**GraphQL API Layer**

Using Strawberry GraphQL for type-safe API development:

- **Schema-first**: GraphQL schema defined with Python decorators
- **Type safety**: Automatic validation and serialization
- **Query optimization**: Efficient data fetching patterns
- **Subscription support**: Real-time updates (if implemented)

**Repository Pattern Implementation**

The data access layer uses the Repository pattern for clean separation:

```python
# Base repository with common operations
class BaseRepository[T](ABC):
    def __init__(self, db: AsyncDatabase, collection_name: str)

    # CRUD operations
    async def find_by_id(self, object_id: strawberry.ID) -> dict
    async def find_all(self, limit, offset, query_input) -> list[dict]
    async def create(self, data: dict) -> dict
    async def update_by_id(self, object_id, update_data) -> bool
    async def delete_by_id(self, object_id) -> bool

    # Query building
    def build_match_stage(self, query_input) -> dict
    def build_sort_stage(self, query_input) -> dict

    # Abstract method for domain conversion
    @abstractmethod
    async def to_domain_object(self, data: dict) -> T
```

**Repository Factory Pattern**

Centralized repository management with dependency injection:

```python
class RepositoryFactory:
    def __init__(self, db: AsyncDatabase)

    @property
    def project_repo(self) -> ProjectRepository

    @property
    def image_repo(self) -> ImageRepository

    @property
    def task_repo(self) -> TaskRepository
```

### Data Architecture

**MongoDB Document Database**

SATIn uses MongoDB for flexible, schema-less data storage:

- **Document-oriented**: JSON-like documents with dynamic schemas
- **Async driver**: Motor for asynchronous database operations
- **Aggregation framework**: Complex queries and data processing
- **GridFS**: Large file storage (for images, if needed)

**Core Data Models**

```python
# Project: Container for annotation work
@strawberry.type
class Project:
    id: strawberry.ID
    name: str
    description: str

# Image: Metadata for images to be annotated
@strawberry.type
class Image:
    id: strawberry.ID
    filename: str
    width: int
    height: int
    file_path: str

# Task: Links images to projects with annotation work
@strawberry.type
class Task:
    id: strawberry.ID
    image: Image
    project: Project
    bboxes: list[BBox]
    status: TaskStatus  # DRAFT, FINISHED, REVIEWED
    created_at: datetime

# Annotation: Bounding box with label and tags
@strawberry.type
class BBox:
    x: float
    y: float
    width: float
    height: float
    annotation: Annotation

@strawberry.type
class Annotation:
    text: str | None = None
    tags: list[str] | None = None
```

## Data Flow Architecture

### Request Flow

1. **Frontend Request**
   ```
   User Action → Svelte Component → URQL Client → GraphQL Query
   ```

2. **Backend Processing**
   ```
   GraphQL Endpoint → Strawberry Resolver → Repository Layer → MongoDB
   ```

3. **Response Flow**
   ```
   MongoDB → Repository → Domain Object → GraphQL Response → URQL Cache → UI Update
   ```

### Annotation Workflow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User draws    │    │   Frontend      │    │   Backend       │
│   bounding box  │───▶│   creates       │───▶│   persists      │
│   on canvas     │    │   annotation    │    │   to MongoDB    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
          │                       │                       │
          ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Canvas        │    │   GraphQL       │    │   Task status   │
│   updates       │◀───│   mutation      │◀───│   updated       │
│   immediately   │    │   response      │    │   automatically │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Security Architecture

### Authentication & Authorization

Currently SATIn implements basic security patterns:

- **CORS Configuration**: Controlled cross-origin access
- **Request Validation**: Pydantic model validation
- **Input Sanitization**: GraphQL query validation
- **Error Handling**: Secure error responses

### Future Security Enhancements

- **JWT Authentication**: Stateless authentication tokens
- **Role-based Access Control**: User permissions and project access
- **API Rate Limiting**: Protection against abuse
- **Data Encryption**: Sensitive data protection

## Performance Architecture

### Frontend Performance

- **Component Lazy Loading**: Routes loaded on demand
- **GraphQL Caching**: URQL automatic query caching
- **Image Optimization**: Efficient canvas rendering
- **Bundle Splitting**: Code splitting for faster loads

### Backend Performance

- **Async Processing**: Non-blocking I/O operations
- **Connection Pooling**: Efficient database connections
- **Query Optimization**: MongoDB aggregation pipelines
- **Response Caching**: Future caching layer implementation

### Database Performance

- **Indexing Strategy**: Optimized queries on common fields
- **Aggregation Pipelines**: Efficient complex queries
- **Pagination**: Cursor-based pagination for large datasets
- **Connection Management**: Async connection pooling

## Scalability Architecture

### Horizontal Scaling

**Current Architecture Supports**:
- **Stateless Backend**: Multiple API server instances
- **Database Sharding**: MongoDB horizontal partitioning
- **CDN Integration**: Static asset distribution
- **Load Balancing**: Multiple backend instances

**Scaling Patterns**:

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │    │   Client    │    │   Client    │
└─────────────┘    └─────────────┘    └─────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                    ┌─────────────┐
                    │ Load        │
                    │ Balancer    │
                    └─────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ FastAPI     │    │ FastAPI     │    │ FastAPI     │
│ Instance 1  │    │ Instance 2  │    │ Instance 3  │
└─────────────┘    └─────────────┘    └─────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                    ┌─────────────┐
                    │  MongoDB    │
                    │  Cluster    │
                    └─────────────┘
```

### Vertical Scaling

- **Resource Optimization**: Memory and CPU usage optimization
- **Database Tuning**: Query optimization and indexing
- **Caching Layers**: Redis for session and query caching
- **Asset Optimization**: Image compression and optimization

## Development Architecture

### Code Organization

```
satin/
├── src/satin/                 # Backend source code
│   ├── main.py               # FastAPI application
│   ├── config.py             # Configuration management
│   ├── db.py                 # Database connection
│   ├── repositories/         # Data access layer
│   │   ├── base.py          # Abstract base repository
│   │   ├── factory.py       # Repository factory
│   │   ├── project.py       # Project repository
│   │   ├── image.py         # Image repository
│   │   └── task.py          # Task repository
│   └── schema/              # GraphQL schema definitions
│       ├── query.py         # Root query operations
│       ├── mutation.py      # Root mutations
│       ├── project.py       # Project schema
│       ├── image.py         # Image schema
│       ├── task.py          # Task schema
│       ├── annotation.py    # Annotation schema
│       ├── filters.py       # Query filters
│       └── utils.py         # Schema utilities
├── frontend/                # Frontend source code
│   └── src/                 # SvelteKit application
└── tests/                   # Test suites
```

### Dependency Management

- **Backend**: `uv` with `pyproject.toml`
- **Frontend**: `pnpm` with `package.json`
- **Development**: Makefile for common operations
- **Containerization**: Docker multi-stage builds

## Testing Architecture

### Test Organization

```
tests/
├── conftest.py              # Pytest configuration
├── test_graphql_queries.py  # GraphQL query tests
├── test_graphql_mutations.py # GraphQL mutation tests
├── test_graphql_schema.py   # Schema validation tests
├── test_project.py          # Project repository tests
├── test_image.py            # Image repository tests
├── test_task.py             # Task repository tests
└── test_annotation.py       # Annotation tests
```

### Testing Strategy

- **Unit Tests**: Individual component testing
- **Integration Tests**: API endpoint testing
- **Repository Tests**: Database integration testing
- **Frontend Tests**: Component and browser testing
- **E2E Tests**: Full application workflow testing

## Deployment Architecture

### Development Environment

```
Developer Machine
├── Backend: localhost:8000 (FastAPI + hot reload)
├── Frontend: localhost:5173 (Vite dev server)
└── Database: localhost:27017 (MongoDB)
```

### Production Environment

```
Production Stack
├── Web Server: Nginx (reverse proxy, static files)
├── Application: Gunicorn/Granian (FastAPI instances)
├── Database: MongoDB (replica set)
├── Monitoring: Logging and metrics
└── Backup: Automated data backup
```

## Future Architecture Enhancements

### Planned Improvements

1. **Microservices**: Break down monolith into focused services
2. **Event Sourcing**: Event-driven architecture for audit trails
3. **CQRS**: Command Query Responsibility Segregation
4. **Message Queues**: Async processing with Redis/RabbitMQ
5. **File Storage**: S3-compatible object storage for images
6. **Real-time Features**: WebSocket support for live collaboration

### Technology Roadmap

- **Authentication**: Auth0 or similar identity provider
- **Monitoring**: Prometheus + Grafana observability stack
- **Logging**: Structured logging with ELK stack
- **CI/CD**: GitHub Actions with automated deployments
- **Infrastructure**: Kubernetes orchestration
- **CDN**: CloudFlare or AWS CloudFront integration

## Architecture Decision Records

### ADR-001: Repository Pattern
**Decision**: Use Repository pattern for data access
**Rationale**: Clean separation of concerns, testability, flexibility
**Status**: Implemented

### ADR-002: GraphQL API
**Decision**: Use GraphQL instead of REST API
**Rationale**: Type safety, efficient queries, single endpoint
**Status**: Implemented

### ADR-003: MongoDB Database
**Decision**: Use MongoDB for primary data storage
**Rationale**: Flexible schema, JSON documents, horizontal scaling
**Status**: Implemented

### ADR-004: Async/Await Architecture
**Decision**: Full async backend architecture
**Rationale**: High performance, scalability, modern Python patterns
**Status**: Implemented

## Related Documentation

- :doc:`setup` - Development environment setup
- :doc:`contributing` - Contribution guidelines and workflow
- :doc:`testing` - Testing strategy and guidelines
- :doc:`../api_reference/index` - Complete API reference
