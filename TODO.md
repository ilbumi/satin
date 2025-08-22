# TODO.md - Satin Development Tasks

This document breaks down the requirements from `docs/development/requirements.md` into small, implementable features. Tasks are organized by priority and dependencies.

## Phase 1: Foundation Setup ⚡ Priority: Critical

### Backend Core
- [x] Set up FastAPI application with basic structure
- [ ] Configure MongoDB connection with pymongo
- [ ] Create Strawberry GraphQL schema scaffolding
- [x] Set up CORS middleware for frontend communication
- [ ] Add health check endpoint `/health`
- [ ] Configure Docker container for backend
- [ ] Set up environment variables management

### Frontend Core
- [ ] Create basic SvelteKit layout structure
- [ ] Set up URQL GraphQL client
- [ ] Configure Tailwind CSS properly
- [ ] Create basic routing structure
- [ ] Set up Docker container for frontend
- [ ] Configure development proxy for API calls

### Database Schema
- [ ] Design MongoDB collections schema
- [ ] Create `images` collection with indexes
- [ ] Create `annotations` collection with versioning fields
- [ ] Create `tags` collection with hierarchy support
- [ ] Add database migration/seed scripts

## Phase 2: Image Management 🖼️

### Image URL Handling (US-1.1, US-1.2)
- [ ] Create GraphQL mutation for adding image by URL
- [ ] Implement URL validation for JPEG/PNG
- [ ] Add image metadata extraction (dimensions, format)
- [ ] Create image status enum (new, annotated, needs-reannotation)
- [ ] Build image list view component
- [ ] Add image URL input form with validation

### Image Display & Navigation
- [ ] Create image viewer component
- [ ] Implement image loading with error handling
- [ ] Add next/previous image navigation
- [ ] Display image metadata sidebar (US-1.6)
- [ ] Handle CORS issues with image proxy
- [ ] Add loading states and placeholders

### Image Filtering (US-1.5)
- [ ] Add filter UI for annotation status
- [ ] Implement GraphQL query with filters
- [ ] Create pagination for image list
- [ ] Add search by image URL/name
- [ ] Implement sorting options (date added, status)

## Phase 3: Basic Annotation Canvas 🎨

### Canvas Setup
- [ ] Integrate Konva.js library
- [ ] Create annotation canvas component
- [ ] Set up canvas layers (image, annotations, drawing)
- [ ] Handle canvas resize on window changes
- [ ] Add canvas coordinate system

### Bounding Box Creation (US-2.1)
- [ ] Implement click-and-drag box drawing
- [ ] Add visual feedback during drawing
- [ ] Create bounding box data model
- [ ] Store box coordinates (x, y, width, height)
- [ ] Generate unique IDs for boxes
- [ ] Add box creation GraphQL mutation

### Basic Box Interactions (US-2.4, US-2.5)
- [ ] Implement box selection on click
- [ ] Add resize handles to selected boxes
- [ ] Enable moving boxes by dragging
- [ ] Add delete box functionality
- [ ] Implement "Clear All" annotations button
- [ ] Add hover effects on boxes (US-2.8)

## Phase 4: Tag System 🏷️

### Tag Hierarchy (US-3.1)
- [ ] Design hierarchical tag data structure
- [ ] Create tag management UI panel
- [ ] Implement parent-child relationships
- [ ] Add tag creation mutation
- [ ] Build tag tree view component
- [ ] Support unlimited hierarchy depth

### Tag Selection (US-2.2, US-3.2)
- [ ] Create tag selector component for boxes
- [ ] Add tag search with fuzzy matching
- [ ] Display full hierarchy path (US-3.3)
- [ ] Support multiple tags per box
- [ ] Implement tag autocomplete (US-3.6)
- [ ] Add recently used tags section

### Tag Management
- [ ] Add inline tag creation during annotation (US-3.4)
- [ ] Implement bulk tag import from JSON (US-3.5)
- [ ] Create tag usage statistics query (US-3.7)
- [ ] Add tag edit/delete functionality
- [ ] Build tag export functionality

## Phase 5: Annotation Details 📝

### Text Descriptions (US-2.3)
- [ ] Add description field to box model
- [ ] Create description input UI
- [ ] Implement description edit modal
- [ ] Add description preview in box list
- [ ] Support markdown in descriptions

### Annotation List (US-2.6)
- [ ] Create annotation list sidebar
- [ ] Display all boxes for current image
- [ ] Show tags and descriptions for each box
- [ ] Add click-to-focus box from list
- [ ] Implement box visibility toggles
- [ ] Add box reordering in list

## Phase 6: Data Persistence 💾

### Auto-save System (US-7.1)
- [ ] Implement auto-save timer (30 seconds)
- [ ] Create dirty state tracking
- [ ] Add save status indicator
- [ ] Batch annotation updates
- [ ] Handle save conflicts
- [ ] Add manual save button

### Versioning System
- [ ] Implement annotation versioning schema
- [ ] Create new version on each save
- [ ] Mark previous versions as historical
- [ ] Add version history viewer
- [ ] Implement version restore functionality

### Error Recovery (US-7.3)
- [ ] Add local storage backup
- [ ] Implement offline queue for changes
- [ ] Handle connection interruption gracefully
- [ ] Create sync status indicator
- [ ] Add retry logic for failed saves

## Phase 7: UI Enhancements 🎮

### Keyboard Shortcuts (US-6.1)
- [ ] Define keyboard shortcut system
- [ ] Add shortcuts for box creation (e.g., 'B')
- [ ] Implement delete shortcut (Delete/Backspace)
- [ ] Add save shortcut (Ctrl+S)
- [ ] Create next/previous shortcuts (Arrow keys)
- [ ] Build keyboard shortcut help modal

### Zoom & Pan (US-6.2)
- [ ] Implement mouse wheel zoom
- [ ] Add zoom controls UI (+/-, reset)
- [ ] Enable pan with mouse drag
- [ ] Add fit-to-screen button
- [ ] Implement zoom to selection
- [ ] Maintain zoom on image switch

### Progress Tracking (US-6.4)
- [ ] Create progress bar component
- [ ] Track annotated vs total images
- [ ] Add session statistics
- [ ] Display time spent annotating
- [ ] Show annotations per hour rate

### Undo/Redo (US-6.5)
- [ ] Implement action history stack
- [ ] Add undo functionality (Ctrl+Z)
- [ ] Add redo functionality (Ctrl+Y)
- [ ] Create undo/redo UI buttons
- [ ] Limit history stack size

## Phase 8: Import/Export 📤

### Export Functionality (US-5.1, US-5.2)
- [ ] Define custom JSON export format
- [ ] Create export configuration UI
- [ ] Implement filter options for export
- [ ] Add export by tag selection
- [ ] Support date range filtering
- [ ] Generate downloadable export file

### Import Functionality (US-5.3)
- [ ] Create import UI with file upload
- [ ] Implement JSON format validation (US-5.5)
- [ ] Add import preview/confirmation
- [ ] Handle duplicate detection
- [ ] Support incremental imports
- [ ] Show import progress and errors

### API Endpoints (US-5.4)
- [ ] Create REST endpoint for export
- [ ] Add REST endpoint for import
- [ ] Implement API documentation
- [ ] Add curl examples in docs
- [ ] Support batch operations

## Phase 9: ML Integration 🤖

### ML Pipeline Connection (US-4.1)
- [ ] Design ML pipeline API interface
- [ ] Add ML endpoint configuration
- [ ] Create pre-annotation trigger button
- [ ] Implement async job queue
- [ ] Add ML job status tracking

### AI Suggestions UI (US-4.2, US-4.4)
- [ ] Display AI-suggested boxes differently
- [ ] Show confidence scores on suggestions
- [ ] Add accept/reject/modify controls
- [ ] Implement batch accept for high confidence (US-4.5)
- [ ] Create suggestion review mode

### Error Handling (US-4.6)
- [ ] Add ML request timeout (10 seconds)
- [ ] Implement graceful failure handling
- [ ] Show ML service status indicator
- [ ] Add retry mechanism for failed requests
- [ ] Log ML pipeline errors

## Phase 10: Performance Optimization 🚀

### Large Dataset Support
- [ ] Optimize for 100,000+ images (US-7.4)
- [ ] Implement virtual scrolling for image list
- [ ] Add lazy loading for images
- [ ] Create database query optimization
- [ ] Add caching layer for frequently accessed data

### Annotation Performance (US-2.7)
- [ ] Optimize rendering for 500+ boxes per image
- [ ] Implement canvas layer optimization
- [ ] Add viewport culling for off-screen boxes
- [ ] Use Web Workers for heavy computations
- [ ] Profile and fix performance bottlenecks

### UI Responsiveness (US-7.5)
- [ ] Debounce expensive operations
- [ ] Add loading skeletons
- [ ] Implement optimistic UI updates
- [ ] Reduce unnecessary re-renders
- [ ] Optimize bundle size

## Phase 11: Polish & Refinements ✨

### UI Polish (US-6.3, US-6.7)
- [ ] Make UI responsive for different screens
- [ ] Add panel resize functionality
- [ ] Implement collapsible panels
- [ ] Create dark mode toggle
- [ ] Add tooltips and help text

### Visual Feedback
- [ ] Enhance hover effects
- [ ] Add smooth transitions
- [ ] Implement selection animations
- [ ] Create success/error notifications
- [ ] Add confirmation dialogs

### Quality of Life
- [ ] Add annotation templates
- [ ] Create quick actions menu
- [ ] Implement annotation copy/paste
- [ ] Add bulk operations support
- [ ] Create user preferences storage

## Testing & Documentation 📚

### Testing
- [ ] Write unit tests for GraphQL resolvers
- [ ] Add integration tests for API endpoints
- [ ] Create component tests for UI elements
- [ ] Implement E2E tests for critical flows
- [ ] Add performance benchmarks

### Documentation
- [ ] Create API documentation
- [ ] Write user guide
- [ ] Add inline code documentation
- [ ] Create video tutorials
- [ ] Document deployment process

## Notes

- Tasks marked with user story references (US-X.X) directly implement requirements from `requirements.md`
- Each task is designed to be completable in 1-4 hours
- Dependencies between tasks should be considered when planning sprints
- Performance targets: <2s page load, <500ms save, 500+ annotations per image
- All features assume single-user usage (multi-user is out of scope for v1)
