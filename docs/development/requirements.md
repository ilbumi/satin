# Image Annotation Tool - Requirements Specification

## Project Overview
**Purpose**: Web-based image annotation tool for gathering machine learning training data
**Primary User**: Individual researchers
**Secondary Users**: Small teams (future enhancement)
**Deployment**: Virtual Private Network (VPN)

## Functional Requirements

### 1. Image Management

#### User Stories
- **US-1.1**: As a researcher, I want to add images via URLs so that I don't need to upload files to the server
- **US-1.2**: As a researcher, I want the system to validate that URLs point to valid JPEG/PNG images before adding them to the dataset
- **US-1.3**: As a researcher, I want to handle large images (up to 10000x10000 pixels) without performance degradation
- **US-1.4**: As a researcher, I want to mark images for re-annotation so I can identify which images need review
- **US-1.5**: As a researcher, I want to filter images by their annotation status (not annotated, annotated, marked for re-annotation)
- **US-1.6**: As a researcher, I want to see image metadata (dimensions, file size, URL) while annotating

#### Technical Requirements
- Support JPEG and PNG formats
- Handle images up to 10000x10000 pixels
- Store only image URLs in database, not image data
- Implement image proxy/caching for performance
- Track image status: new, annotated, needs-reannotation

### 2. Annotation Features

#### User Stories
- **US-2.1**: As a researcher, I want to draw bounding boxes on images using mouse click-and-drag
- **US-2.2**: As a researcher, I want to add multiple tags to each bounding box from a hierarchical tag system
- **US-2.3**: As a researcher, I want to add free-text descriptions to each bounding box for detailed notes
- **US-2.4**: As a researcher, I want to resize and move existing bounding boxes for precise adjustments
- **US-2.5**: As a researcher, I want to delete individual bounding boxes or clear all annotations on an image
- **US-2.6**: As a researcher, I want to see a list of all bounding boxes on the current image with their tags and descriptions
- **US-2.7**: As a researcher, I want to handle hundreds of annotations per image without UI performance issues
- **US-2.8**: As a researcher, I want visual feedback (hover effects, selection highlights) when working with bounding boxes

#### Technical Requirements
- Support creating, editing, moving, and deleting bounding boxes
- Each bounding box must support:
  - Multiple tags from hierarchical taxonomy
  - Free-text description field
  - Unique identifier
  - Coordinates (x, y, width, height)
- Optimize rendering for hundreds of annotations per image

### 3. Tag Management System

#### User Stories
- **US-3.1**: As a researcher, I want to create a hierarchical tag structure with parent-child relationships
- **US-3.2**: As a researcher, I want to search tags by name when adding them to bounding boxes
- **US-3.3**: As a researcher, I want to see the full hierarchy path when selecting tags (e.g., "Vehicle > Car > Sedan")
- **US-3.4**: As a researcher, I want to add new tags to the hierarchy while annotating
- **US-3.5**: As a researcher, I want to bulk import a tag hierarchy from a file
- **US-3.6**: As a researcher, I want auto-complete suggestions when typing tag names
- **US-3.7**: As a researcher, I want to see tag usage statistics (how many times each tag is used)

#### Technical Requirements
- Hierarchical tag structure with unlimited depth
- Tag search with fuzzy matching
- Dynamic tag creation during annotation
- Tag import/export functionality
- Efficient tag retrieval for large hierarchies

### 4. ML Pipeline Integration

#### User Stories
- **US-4.1**: As a researcher, I want to trigger pre-annotation from external ML models before manual annotation
- **US-4.2**: As a researcher, I want to see AI-suggested bounding boxes that I can accept, modify, or reject
- **US-4.3**: As a researcher, I want to configure different ML pipeline endpoints for different types of pre-annotation
- **US-4.4**: As a researcher, I want to see the confidence scores of AI suggestions
- **US-4.5**: As a researcher, I want to batch-accept high-confidence AI suggestions
- **US-4.6**: As a researcher, I want the system to handle ML pipeline failures gracefully without losing my work

#### Technical Requirements
- API interface for ML pipeline communication
- Configurable ML pipeline endpoints
- Async processing for pre-annotation requests
- Display confidence scores for AI suggestions
- Error handling and timeout management for ML requests
- Support for different pre-annotation model types

### 5. Data Import/Export

#### User Stories
- **US-5.1**: As a researcher, I want to export all annotations in a custom JSON format for use in ML training
- **US-5.2**: As a researcher, I want to export filtered subsets of data (by tags, date range, or annotation status)
- **US-5.3**: As a researcher, I want to import existing datasets with annotations to continue work
- **US-5.4**: As a researcher, I want API endpoints to programmatically import/export annotations
- **US-5.5**: As a researcher, I want to see import validation errors if the data format is incorrect
- **US-5.6**: As a researcher, I want to download a backup of all my annotations

#### Technical Requirements
- Custom JSON format specification for annotations
- API for import/export operations
- Validation of imported data structure
- Bulk import capability
- Export filters and options
- API authentication and rate limiting

### 6. User Interface & Interaction

#### User Stories
- **US-6.1**: As a researcher, I want keyboard shortcuts for common actions (create box, delete, save, next/previous image)
- **US-6.2**: As a researcher, I want zoom and pan controls for working with large images
- **US-6.3**: As a researcher, I want a responsive UI that works on different screen sizes
- **US-6.4**: As a researcher, I want to see my annotation progress (X of Y images completed)
- **US-6.5**: As a researcher, I want an undo/redo function for recent actions
- **US-6.6**: As a researcher, I want to toggle visibility of annotations for clean image viewing
- **US-6.7**: As a researcher, I want adjustable UI panels that I can resize or collapse

#### Technical Requirements
- Keyboard shortcut system with customizable bindings
- Image zoom/pan with mouse wheel and drag
- Responsive design for screens ≥1280px width
- Progress tracking and statistics dashboard
- Undo/redo stack for annotation actions
- Collapsible UI panels

### 7. Data Persistence & Performance

#### User Stories
- **US-7.1**: As a researcher, I want my annotations to auto-save to prevent data loss
- **US-7.3**: As a researcher, I want the system to handle connection interruptions without losing work
- **US-7.4**: As a researcher, I want fast image loading even for large images
- **US-7.5**: As a researcher, I want smooth annotation drawing without lag

#### Technical Requirements
- Auto-save with configurable intervals (default: every 10 seconds)
- Optimistic UI updates with background synchronization
- Local storage backup for offline resilience
- Canvas-based rendering for smooth annotation
- Database indexing for fast queries

## Non-Functional Requirements

### Performance
- Support up to 500 bounding boxes per image without UI lag
- Auto-save completion within 1 second
- ML pre-annotation timeout: 10 seconds

### Scalability
- Handle datasets with 100,000+ images
- Support tag hierarchies with 10,000+ tags
- Database capable of storing millions of annotations

### Reliability
- 99.9% uptime within VPN environment
- Zero data loss for saved annotations
- Graceful degradation when ML pipeline unavailable

### Usability
- Intuitive UI requiring minimal training
- Comprehensive keyboard shortcuts
- Clear visual feedback for all actions
- Helpful error messages

### Security
- No authentication in v1
- No Rate limiting in v1
- Input validation on all user inputs
- No XSS and injection attack prevention in v1

## Constraints
- Must run within VPN environment
- No image data stored on server
- Images accessed via URL only
- Initial version is single-user focused

## Future Enhancements (Out of Scope for v1)
- Authentication and security features
- Multi-user collaboration features
- User roles and permissions
- Annotation review workflows
- Additional annotation types (polygons, segmentation)
- Support for video annotation
- Additional export formats (COCO, YOLO, Pascal VOC)

## Glossary
- **Bounding Box**: Rectangular annotation defining an object's location
- **Tag**: Hierarchical label applied to bounding boxes
- **Pre-annotation**: AI-generated annotation suggestions
- **Re-annotation**: Marking images that need annotation review
- **ML Pipeline**: External machine learning service for pre-annotation
