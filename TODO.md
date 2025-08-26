# Image Annotation Tool - Development Plan

## Phase 1: Project Setup & Infrastructure (Week 1)

### 1.1 Repository & Development Environment
- [x] Initialize Git repository with .gitignore
- [x] Create project folder structure (frontend/, backend/, docker/)
- [x] Set up README.md with project description
- [x] Create development branch strategy (main, develop)

### 1.2 Backend Project Setup
- [x] Initialize Python project with uv
- [x] Create pyproject.toml with dependencies (FastAPI, Strawberry, pymongo, pydantic)
- [x] Set up backend folder structure (/app, /tests, /migrations)
- [x] Create basic FastAPI app with health endpoint
- [x] Configure CORS middleware
- [x] Add environment variables handling (python-dotenv)
- [x] Create config.py for configuration management
- [x] Set up Python logging configuration
- [x] Add black and ruff for code formatting

### 1.3 Frontend Project Setup
- [x] Initialize SvelteKit project with pnpm
- [x] Install core dependencies (Konva, URQL, Tailwind CSS)
- [x] Set up folder structure (/lib, /components, /stores, /routes)
- [x] Configure Vite for development
- [x] Set up Tailwind CSS
- [x] Create base layout component
- [x] Configure URQL client
- [x] Add ESLint and Prettier configuration
- [x] Create environment variable handling

### 1.4 Docker Setup
- [x] Create Dockerfile for backend
- [x] Create Dockerfile for frontend
- [x] Write docker-compose.yml with three services
- [x] Add MongoDB container configuration
- [x] Set up volume mounts for development
- [x] Configure network for container communication
- [x] Create .env.example file
- [x] Test docker compose up

### 1.5 Database Setup
- [x] Create MongoDB initialization script
- [x] Design database indexes
- [x] Create database connection module
- [x] Implement connection pooling
- [x] Add database health check
- [x] Create collections with validation rules
- [x] Test database connectivity from backend

### 1.6 CI/CD Pipeline
- [x] Create GitHub Actions workflow file
- [x] Configure Python test job
- [x] Configure Node.js test job
- [x] Add Docker build verification
- [x] Set up code coverage reporting
- [x] Configure branch protection rules

## Phase 2: Core Data Models & API Foundation (Week 2)

### 2.1 Pydantic Models
- [x] Create base model with common fields
- [x] Implement Image model
- [x] Implement Annotation model
- [x] Implement BoundingBox model
- [x] Implement Tag model
- [x] Implement MLJob model
- [ ] Create model validators
- [ ] Add model serialization helpers

### 2.2 Database Repositories
- [x] Create base repository class
- [x] Implement ImageRepository with CRUD operations
- [x] Implement AnnotationRepository with versioning
- [x] Implement TagRepository with hierarchy support
- [x] Implement MLJobRepository
- [x] Add repository error handling
- [x] Create repository tests

### 2.3 GraphQL Schema Foundation
- [x] Set up Strawberry GraphQL with FastAPI
- [x] Create GraphQL type definitions
- [x] Implement Image types
- [x] Implement Annotation types
- [x] Implement Tag types
- [x] Create input types for mutations
- [x] Add enum types (ImageStatus, ChangeType, etc.)
- [x] Configure GraphQL playground

### 2.4 Basic Queries
- [ ] Implement images query with pagination
- [x] Implement single image query
- [x] Implement tags query
- [x] Add query resolvers
- [x] Implement field resolvers
- [ ] Add query authorization placeholder
- [x] Create query tests

### 2.5 Basic Mutations
- [x] Implement addImage mutation
- [x] Implement updateImageStatus mutation
- [x] Implement createTag mutation
- [x] Add mutation resolvers
- [x] Implement input validation
- [x] Add mutation tests
- [ ] Create error handling for mutations

## Phase 3: Frontend Foundation (Week 3)

### 3.1 Layout & Navigation
- [x] Create main layout with header
- [x] Implement sidebar component structure
- [x] Create navigation between pages
- [x] Add routing for annotation page
- [x] Implement responsive layout
- [x] Create loading states
- [x] Add error boundary component

### 3.2 Image List Page
- [x] Create image grid component
- [x] Implement image card component
- [x] Add status badges (new, annotated, needs reannotation)
- [x] Implement pagination component
- [x] Add image status filter
- [x] Create "Add Image URL" dialog
- [x] Implement image URL validation
- [x] Connect to GraphQL queries
- [x] Add loading and error states

### 3.3 Svelte Stores
- [ ] Create image store
- [ ] Create annotation store
- [ ] Create UI state store
- [ ] Implement store persistence
- [ ] Add store subscriptions
- [ ] Create store actions
- [ ] Add store tests

### 3.4 GraphQL Integration
- [x] Set up URQL client configuration
- [x] Create GraphQL query definitions
- [x] Create GraphQL mutation definitions
- [x] Implement query hooks
- [x] Add mutation handlers
- [x] Set up error handling
- [x] Configure caching strategy

## Phase 4: Canvas & Annotation UI (Week 4)

### 4.1 Konva.js Canvas Setup
- [x] Create AnnotationCanvas component
- [ ] Set up Konva Stage
- [x] Implement image layer
- [x] Add annotations layer
- [x] Implement UI overlay layer
- [x] Configure layer ordering
- [x] Add stage event handlers

### 4.2 Image Display
- [x] Implement image loading
- [ ] Add image error handling
- [ ] Create image preloader
- [ ] Implement image caching

### 4.3 Bounding Box Drawing
- [x] Implement mouse down handler for drawing start
- [x] Create temporary rectangle while drawing
- [x] Implement mouse move handler for drawing
- [x] Add mouse up handler for drawing complete
- [x] Create minimum size validation
- [x] Add drawing cancel on Escape
- [x] Add visual feedback during drawing

### 4.4 Bounding Box Selection
- [x] Implement click detection on boxes
- [x] Create selection algorithm for overlapping boxes
- [x] Add selection visual feedback
- [ ] Implement hover effects
- [ ] Add Tab key navigation between boxes
- [ ] Create selection info display

### 4.5 Bounding Box Editing
- [x] Add resize handles to selected box
- [x] Implement corner dragging
- [x] Add move functionality
- [x] Create bounds checking
- [x] Implement delete functionality
- [x] Add visual feedback during editing

## Phase 5: Annotation Management (Week 5)

### 5.1 Tag System UI
- [x] Create tag hierarchy component
- [ ] Implement tree view with expand/collapse
- [ ] Add tag search input
- [ ] Implement fuzzy search
- [ ] Create tag selection UI
- [ ] Add selected tags display
- [ ] Implement tag creation dialog
- [ ] Add tag definition display

### 5.2 Annotation Sidebar
- [ ] Create annotation list component
- [ ] Implement annotation item component
- [ ] Add description textarea
- [ ] Create tag selector integration
- [ ] Implement annotation deletion
- [ ] Add annotation source indicator
- [ ] Create confidence display for ML annotations
- [ ] Add annotation counter

### 5.3 Keyboard Shortcuts
- [ ] Create keyboard handler service
- [ ] Implement 'B' for new bounding box
- [ ] Add arrow keys for image navigation
- [ ] Implement Tab for box selection
- [ ] Add Ctrl+Z for undo
- [ ] Implement Delete for removal
- [ ] Create Escape for cancel operations
- [ ] Add keyboard shortcut help dialog

### 5.4 Undo/Redo System
- [ ] Create history manager
- [ ] Implement history stack (20 items)
- [ ] Add undo operation
- [ ] Add redo operation
- [ ] Create history entry types
- [ ] Implement batch operations
- [ ] Add UI buttons for undo/redo
- [ ] Create keyboard shortcut integration

## Phase 6: Data Persistence (Week 6)

### 6.1 Version Management Backend
- [ ] Implement version creation logic
- [ ] Create diff calculation algorithm
- [ ] Add snapshot generation (every 10 versions)
- [ ] Implement version pruning (keep 120)
- [ ] Create version reconstruction
- [ ] Add version comparison
- [ ] Implement rollback functionality
- [ ] Create version tests

### 6.2 Auto-save Implementation
- [ ] Create auto-save manager
- [ ] Implement 30-second timer
- [ ] Add change threshold counter (5 changes)
- [ ] Create change batching
- [ ] Implement dirty state tracking
- [ ] Add save status indicator UI
- [ ] Create save error handling
- [ ] Add retry logic

### 6.3 LocalStorage Backup
- [ ] Create LocalStorage manager
- [ ] Implement backup on changes
- [ ] Add backup restoration
- [ ] Create backup age checking (24h)
- [ ] Implement old backup cleanup
- [ ] Add corruption detection
- [ ] Create recovery UI
- [ ] Add backup tests

### 6.4 Save Annotations Mutation
- [ ] Implement saveAnnotations resolver
- [ ] Create change validation
- [ ] Add version creation call
- [ ] Implement source tracking
- [ ] Create response formatting
- [ ] Add optimistic updates
- [ ] Implement conflict resolution
- [ ] Create integration tests

## Phase 7: ML Integration (Week 7)

### 7.1 ML Service Communication
- [ ] Create ML integration service
- [ ] Implement REST client for ML server
- [ ] Add request timeout handling (5 minutes)
- [ ] Create job tracking system
- [ ] Implement async job processing
- [ ] Add job status polling
- [ ] Create abort functionality
- [ ] Add connection error handling

### 7.2 Pre-annotation UI
- [ ] Create ML toolbar section
- [ ] Add "Request AI Annotation" button
- [ ] Implement ML endpoint configuration
- [ ] Create processing indicator
- [ ] Add progress display
- [ ] Implement cancel button
- [ ] Create timeout warning
- [ ] Add retry UI for failures

### 7.3 ML Results Handling
- [ ] Create ML prediction parser
- [ ] Implement suggestion display UI
- [ ] Add accept/reject controls
- [ ] Create confidence threshold filter
- [ ] Implement partial result handling
- [ ] Add ML annotation indicators
- [ ] Create bulk accept functionality
- [ ] Add ML description display

### 7.4 ML REST Endpoints
- [ ] Implement /api/ml/pre-annotate endpoint
- [ ] Create /api/ml/status endpoint
- [ ] Add ML job status tracking
- [ ] Implement retry endpoint
- [ ] Create error response handling
- [ ] Add request validation
- [ ] Implement timeout management
- [ ] Create endpoint tests

## Phase 8: Import/Export (Week 8)

### 8.1 Export Functionality
- [ ] Create export service
- [ ] Implement annotation aggregation
- [ ] Format data to custom JSON structure
- [ ] Create temporary file storage
- [ ] Implement 24-hour TTL cleanup
- [ ] Add download endpoint
- [ ] Create export UI button
- [ ] Add export progress indicator

### 8.2 Import Functionality
- [ ] Create import file parser
- [ ] Implement JSON validation
- [ ] Add annotation format conversion
- [ ] Create duplicate checking
- [ ] Implement batch image creation
- [ ] Add import progress tracking
- [ ] Create import error reporting
- [ ] Build import UI with file upload

### 8.3 Export/Import UI
- [ ] Create export dialog
- [ ] Add filter options for export
- [ ] Implement file download trigger
- [ ] Create import dialog
- [ ] Add file picker
- [ ] Create validation feedback
- [ ] Add import summary display
- [ ] Implement error display

## Phase 9: Tag Management (Week 9)

### 9.1 Tag Hierarchy Management
- [ ] Implement tag creation with hierarchy
- [ ] Add parent-child relationship handling
- [ ] Create path calculation
- [ ] Implement depth validation (max 64)
- [ ] Add tag moving functionality
- [ ] Create tag reorganization
- [ ] Implement usage counting
- [ ] Add cascade operations

### 9.2 Tag Search & Aliases
- [ ] Create tag search index
- [ ] Implement fuzzy search algorithm
- [ ] Add alias support
- [ ] Create alias search
- [ ] Implement search suggestions
- [ ] Add recent tags tracking
- [ ] Create popular tags display
- [ ] Add search tests

### 9.3 Tag Management UI
- [ ] Create tag management page
- [ ] Add tag creation form
- [ ] Implement tag editor
- [ ] Create tag definition editor
- [ ] Add alias management
- [ ] Implement color picker
- [ ] Create tag deletion with confirmation
- [ ] Add tag statistics display

### 9.4 Tag Cache Implementation
- [ ] Create tag cache service
- [ ] Implement cache refresh (10-minute TTL)
- [ ] Add cache invalidation
- [ ] Create memory cache structure
- [ ] Implement cache warming
- [ ] Add cache hit tracking
- [ ] Create fallback to database
- [ ] Add cache tests

## Phase 10: Performance & Optimization (Week 10)

### 10.1 Image Performance
- [ ] Implement adjacent image prefetching
- [ ] Create image cache manager
- [ ] Add progressive image loading
- [ ] Optimize large image handling
- [ ] Implement viewport culling
- [ ] Add image format detection
- [ ] Create loading placeholders
- [ ] Add performance monitoring

### 10.2 Canvas Optimization
- [ ] Implement requestAnimationFrame batching
- [ ] Add layer update optimization
- [ ] Create viewport-based rendering
- [ ] Implement LOD for many annotations
- [ ] Add render performance monitoring
- [ ] Create canvas memory management
- [ ] Optimize redraw cycles
- [ ] Add performance tests

### 10.3 Database Optimization
- [ ] Create compound indexes
- [ ] Implement query optimization
- [ ] Add aggregation pipelines
- [ ] Create database connection pooling
- [ ] Implement cursor pagination
- [ ] Add query performance logging
- [ ] Create slow query detection
- [ ] Add index usage analysis

### 10.4 Frontend Bundle Optimization
- [ ] Implement code splitting
- [ ] Add dynamic imports
- [ ] Create production build config
- [ ] Optimize bundle size
- [ ] Add tree shaking
- [ ] Implement asset optimization
- [ ] Create service worker (future)
- [ ] Add lighthouse testing

## Phase 11: Testing & Documentation (Week 11)

### 11.1 Backend Testing
- [ ] Create unit tests for models
- [ ] Add repository tests
- [ ] Implement service tests
- [ ] Create GraphQL resolver tests
- [ ] Add version management tests
- [ ] Implement ML integration tests
- [ ] Create end-to-end tests
- [ ] Add test coverage reporting

### 11.2 Frontend Testing
- [ ] Create component unit tests
- [ ] Add store tests
- [ ] Implement canvas operation tests
- [ ] Create integration tests
- [ ] Add keyboard shortcut tests
- [ ] Implement auto-save tests
- [ ] Create E2E tests with Playwright
- [ ] Add visual regression tests

### 11.3 Documentation
- [ ] Create API documentation site
- [ ] Add code documentation
- [ ] Create user guide
- [ ] Write deployment guide
- [ ] Add troubleshooting guide
- [ ] Create developer onboarding
- [ ] Add architecture diagrams
- [ ] Create video tutorials

### 11.4 Error Handling & Logging
- [ ] Implement comprehensive error boundaries
- [ ] Add user-friendly error messages
- [ ] Create error reporting service
- [ ] Implement structured logging
- [ ] Add log aggregation
- [ ] Create debugging utilities
- [ ] Add performance profiling
- [ ] Create error recovery strategies

## Phase 12: Polish & Deployment (Week 12)

### 12.1 UI/UX Polish
- [ ] Add loading animations
- [ ] Create smooth transitions
- [ ] Implement tooltips
- [ ] Add confirmation dialogs
- [ ] Create success notifications
- [ ] Improve responsive design
- [ ] Add accessibility features
- [ ] Create dark mode (future)

### 12.2 Production Configuration
- [ ] Create production environment variables
- [ ] Configure production builds
- [ ] Set up production database
- [ ] Create backup strategy
- [ ] Implement monitoring
- [ ] Add health checks
- [ ] Configure log rotation
- [ ] Create deployment scripts

### 12.3 Deployment
- [ ] Create production Docker images
- [ ] Set up Docker registry
- [ ] Configure production docker-compose
- [ ] Create deployment documentation
- [ ] Set up monitoring dashboards
- [ ] Configure alerting
- [ ] Create rollback procedures
- [ ] Perform load testing

### 12.4 Final Testing
- [ ] Conduct full system testing
- [ ] Perform security audit
- [ ] Execute performance testing
- [ ] Run accessibility audit
- [ ] Conduct user acceptance testing
- [ ] Create bug tracking system
- [ ] Fix critical issues
- [ ] Create release notes

## Future Enhancements (Post-MVP)

### Multi-user Support
- [ ] Add authentication system
- [ ] Implement user roles
- [ ] Create collaborative features
- [ ] Add annotation assignment
- [ ] Implement review workflows

### Advanced Features
- [ ] Add polygon annotations
- [ ] Implement semantic segmentation
- [ ] Create annotation templates
- [ ] Add batch operations
- [ ] Implement advanced search

### Performance Scaling
- [ ] Add Redis caching
- [ ] Implement job queues
- [ ] Create microservices architecture
- [ ] Add horizontal scaling
- [ ] Implement CDN for images

## Development Guidelines

### Task Completion Criteria
- Code is written and tested
- Unit tests pass
- Documentation is updated
- Code review completed (if team)
- Feature works in Docker environment

### Daily Workflow
1. Pick tasks from current week
2. Create feature branch
3. Implement and test locally
4. Test in Docker environment
5. Commit with descriptive message
6. Update task status

### Weekly Goals
- Complete all tasks in weekly phase
- Review and refactor code
- Update documentation
- Plan next week's tasks
- Address technical debt

## Time Estimates

### Phase Duration
- **Phase 1-2**: Foundation (2 weeks)
- **Phase 3-6**: Core Features (4 weeks)
- **Phase 7-9**: Advanced Features (3 weeks)
- **Phase 10-12**: Polish & Deploy (3 weeks)
- **Total**: 12 weeks for MVP

### Daily Time Allocation
- Development: 60%
- Testing: 20%
- Documentation: 10%
- Review & Refactor: 10%

## Risk Mitigation

### Technical Risks
- **Large Image Handling**: Test early with 10000x10000 images
- **ML Integration Timeout**: Implement robust timeout handling
- **Version Storage Growth**: Monitor database size
- **Canvas Performance**: Profile with 500+ annotations

### Mitigation Strategies
- Start with most risky features
- Create proof of concepts
- Regular performance testing
- Incremental deployment
- Maintain rollback capability
