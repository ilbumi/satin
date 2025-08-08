JavaScript SDK Reference
========================

The SATIn JavaScript SDK provides a high-level interface for integrating with the SATIn API from web applications and Node.js environments.

.. note::
   This SDK is planned for future implementation. Current integration should use the GraphQL API directly or the client examples provided in this documentation.

## Installation

.. code-block:: bash

   # NPM
   npm install @satin/sdk

   # Yarn
   yarn add @satin/sdk

   # PNPM
   pnpm add @satin/sdk

## Quick Start

### Basic Setup

.. code-block:: javascript

   import { SATInClient } from '@satin/sdk';

   const client = new SATInClient({
     baseUrl: 'http://localhost:8000',
     apiKey: 'your-api-key', // Optional, for authenticated requests
   });

### Browser Setup

.. code-block:: html

   <!DOCTYPE html>
   <html>
   <head>
     <script src="https://unpkg.com/@satin/sdk@latest/dist/satin.min.js"></script>
   </head>
   <body>
     <script>
       const client = new SATIn.Client({
         baseUrl: 'http://localhost:8000'
       });
     </script>
   </body>
   </html>

## Client Configuration

### Constructor Options

.. code-block:: typescript

   interface SATInClientOptions {
     baseUrl: string;                    // API base URL
     apiKey?: string;                    // Authentication key
     timeout?: number;                   // Request timeout in ms (default: 10000)
     retries?: number;                   // Number of retries (default: 3)
     retryDelay?: number;                // Delay between retries in ms (default: 1000)
     cache?: boolean;                    // Enable caching (default: true)
     cacheTimeout?: number;              // Cache timeout in ms (default: 300000)
     headers?: Record<string, string>;   // Custom headers
     onError?: (error: Error) => void;   // Global error handler
     onRetry?: (attempt: number) => void; // Retry callback
   }

### Advanced Configuration

.. code-block:: javascript

   const client = new SATInClient({
     baseUrl: 'https://api.satin.example.com',
     apiKey: process.env.SATIN_API_KEY,
     timeout: 30000,
     retries: 5,
     retryDelay: 2000,
     cache: true,
     cacheTimeout: 600000, // 10 minutes
     headers: {
       'X-Client-Version': '1.0.0',
       'X-User-Agent': 'MyApp/1.0'
     },
     onError: (error) => {
       console.error('SATIn API Error:', error);
       // Send to error tracking service
       errorTracker.captureError(error);
     },
     onRetry: (attempt) => {
       console.log(`Retry attempt ${attempt}`);
     }
   });

## Project Management

### Projects API

.. code-block:: typescript

   interface Project {
     id: string;
     name: string;
     description: string;
     createdAt: string;
     updatedAt: string;
   }

   interface ProjectInput {
     name: string;
     description: string;
   }

**Get All Projects**:

.. code-block:: javascript

   async function getProjects() {
     const projects = await client.projects.list({
       limit: 20,
       offset: 0,
       sortBy: 'createdAt',
       sortOrder: 'desc'
     });

     console.log(`Found ${projects.length} projects`);
     return projects;
   }

**Get Single Project**:

.. code-block:: javascript

   async function getProject(projectId) {
     try {
       const project = await client.projects.get(projectId);
       return project;
     } catch (error) {
       if (error.code === 'NOT_FOUND') {
         console.log('Project not found');
         return null;
       }
       throw error;
     }
   }

**Create Project**:

.. code-block:: javascript

   async function createProject(name, description) {
     const project = await client.projects.create({
       name,
       description
     });

     console.log(`Created project: ${project.name} (${project.id})`);
     return project;
   }

**Update Project**:

.. code-block:: javascript

   async function updateProject(projectId, updates) {
     const project = await client.projects.update(projectId, updates);
     return project;
   }

**Delete Project**:

.. code-block:: javascript

   async function deleteProject(projectId) {
     const success = await client.projects.delete(projectId);
     if (success) {
       console.log('Project deleted successfully');
     }
     return success;
   }

### Project Search and Filtering

.. code-block:: javascript

   // Search projects by name
   const projects = await client.projects.list({
     search: 'traffic detection',
     limit: 10
   });

   // Filter by date range
   const recentProjects = await client.projects.list({
     createdAfter: '2025-01-01T00:00:00Z',
     createdBefore: '2025-01-31T23:59:59Z'
   });

   // Complex filtering
   const filteredProjects = await client.projects.list({
     filters: {
       name: { contains: 'annotation' },
       description: { notEmpty: true }
     },
     sortBy: 'updatedAt',
     sortOrder: 'desc'
   });

## Image Management

### Images API

.. code-block:: typescript

   interface Image {
     id: string;
     filename: string;
     width: number;
     height: number;
     filePath: string;
     fileSize: number;
     mimeType: string;
     uploadedAt: string;
   }

**Upload Image**:

.. code-block:: javascript

   async function uploadImage(file) {
     // Browser file upload
     const image = await client.images.upload(file, {
       onProgress: (progress) => {
         console.log(`Upload progress: ${progress}%`);
       }
     });

     return image;
   }

   // Usage with file input
   const fileInput = document.getElementById('imageInput');
   fileInput.addEventListener('change', async (event) => {
     const file = event.target.files[0];
     if (file) {
       try {
         const image = await uploadImage(file);
         console.log('Image uploaded:', image);
       } catch (error) {
         console.error('Upload failed:', error);
       }
     }
   });

**Upload from URL**:

.. code-block:: javascript

   async function uploadFromUrl(imageUrl) {
     const image = await client.images.uploadFromUrl(imageUrl);
     return image;
   }

**Get Images**:

.. code-block:: javascript

   // List all images
   const images = await client.images.list({ limit: 50 });

   // Get single image
   const image = await client.images.get('img_123');

   // Search images
   const searchResults = await client.images.list({
     search: 'car',
     mimeType: 'image/jpeg',
     minWidth: 800,
     maxFileSize: 5000000 // 5MB
   });

## Task Management

### Tasks API

.. code-block:: typescript

   enum TaskStatus {
     DRAFT = 'draft',
     FINISHED = 'finished',
     REVIEWED = 'reviewed'
   }

   interface Task {
     id: string;
     imageId: string;
     projectId: string;
     status: TaskStatus;
     annotations: Annotation[];
     createdAt: string;
     updatedAt: string;
     assignedTo?: string;
     completedAt?: string;
   }

**Create Task**:

.. code-block:: javascript

   async function createAnnotationTask(projectId, imageId) {
     const task = await client.tasks.create({
       projectId,
       imageId,
       status: 'draft',
       annotations: []
     });

     return task;
   }

**Get Tasks**:

.. code-block:: javascript

   // Get tasks for a project
   const projectTasks = await client.tasks.list({
     projectId: 'proj_123',
     status: 'draft',
     limit: 20
   });

   // Get single task with annotations
   const task = await client.tasks.get('task_456', {
     includeAnnotations: true
   });

**Update Task Status**:

.. code-block:: javascript

   async function finishTask(taskId) {
     const task = await client.tasks.update(taskId, {
       status: 'finished',
       completedAt: new Date().toISOString()
     });

     return task;
   }

**Assign Task**:

.. code-block:: javascript

   async function assignTask(taskId, userId) {
     const task = await client.tasks.update(taskId, {
       assignedTo: userId
     });

     return task;
   }

## Annotation Management

### Annotations API

.. code-block:: typescript

   interface BoundingBox {
     x: number;
     y: number;
     width: number;
     height: number;
   }

   interface Annotation {
     id: string;
     taskId: string;
     boundingBox: BoundingBox;
     label: string;
     tags: string[];
     confidence?: number;
     createdAt: string;
     updatedAt: string;
   }

**Add Annotation**:

.. code-block:: javascript

   async function addAnnotation(taskId, boundingBox, label, tags = []) {
     const annotation = await client.annotations.create({
       taskId,
       boundingBox,
       label,
       tags
     });

     return annotation;
   }

**Bulk Update Annotations**:

.. code-block:: javascript

   async function updateTaskAnnotations(taskId, annotations) {
     const updatedAnnotations = await client.annotations.bulkUpdate(taskId, annotations);
     return updatedAnnotations;
   }

**Delete Annotation**:

.. code-block:: javascript

   async function removeAnnotation(annotationId) {
     const success = await client.annotations.delete(annotationId);
     return success;
   }

## Export Functionality

### Export API

.. code-block:: typescript

   enum ExportFormat {
     COCO = 'coco',
     YOLO = 'yolo',
     PASCAL_VOC = 'pascal',
     CSV = 'csv'
   }

   interface ExportJob {
     id: string;
     format: ExportFormat;
     status: 'pending' | 'processing' | 'completed' | 'failed';
     progress: number;
     downloadUrl?: string;
     createdAt: string;
     completedAt?: string;
   }

**Start Export**:

.. code-block:: javascript

   async function exportProject(projectId, format = 'coco') {
     const exportJob = await client.exports.create({
       projectIds: [projectId],
       format,
       includeImages: true,
       onlyReviewed: true
     });

     return exportJob;
   }

**Monitor Export Progress**:

.. code-block:: javascript

   async function monitorExport(exportId) {
     return new Promise((resolve, reject) => {
       const checkStatus = async () => {
         try {
           const job = await client.exports.getStatus(exportId);

           console.log(`Export progress: ${job.progress}%`);

           if (job.status === 'completed') {
             resolve(job);
           } else if (job.status === 'failed') {
             reject(new Error('Export failed'));
           } else {
             setTimeout(checkStatus, 2000); // Check every 2 seconds
           }
         } catch (error) {
           reject(error);
         }
       };

       checkStatus();
     });
   }

**Download Export**:

.. code-block:: javascript

   async function downloadExport(exportId, filename = 'export.zip') {
     const blob = await client.exports.download(exportId);

     // Browser download
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = filename;
     a.click();
     URL.revokeObjectURL(url);

     return blob;
   }

## Real-time Features

### WebSocket Connection

.. code-block:: javascript

   // Connect to real-time updates
   const ws = client.realtime.connect();

   // Subscribe to project updates
   ws.subscribe('project:proj_123', (update) => {
     console.log('Project update:', update);
   });

   // Subscribe to task updates
   ws.subscribe('task:task_456', (update) => {
     console.log('Task update:', update);
   });

   // Handle connection events
   ws.on('connected', () => {
     console.log('Connected to real-time updates');
   });

   ws.on('disconnected', () => {
     console.log('Disconnected from real-time updates');
   });

   ws.on('error', (error) => {
     console.error('WebSocket error:', error);
   });

### Event Listeners

.. code-block:: javascript

   // Listen for annotation changes
   client.on('annotation:created', (annotation) => {
     console.log('New annotation:', annotation);
     updateUI(annotation);
   });

   client.on('annotation:updated', (annotation) => {
     console.log('Updated annotation:', annotation);
     updateUI(annotation);
   });

   client.on('task:statusChanged', (task) => {
     console.log('Task status changed:', task.status);
     updateTaskList(task);
   });

## Error Handling

### Error Types

.. code-block:: typescript

   class SATInError extends Error {
     code: string;
     status: number;
     details?: any;
   }

   class ValidationError extends SATInError {
     fields: string[];
   }

   class NotFoundError extends SATInError {}
   class UnauthorizedError extends SATInError {}
   class RateLimitError extends SATInError {}

### Error Handling Examples

.. code-block:: javascript

   try {
     const project = await client.projects.create({
       name: '', // Invalid: empty name
       description: 'Test project'
     });
   } catch (error) {
     if (error instanceof ValidationError) {
       console.log('Validation failed:', error.fields);
       // Handle validation errors
     } else if (error instanceof RateLimitError) {
       console.log('Rate limit exceeded, retrying in:', error.retryAfter);
       // Handle rate limiting
     } else {
       console.error('Unexpected error:', error);
       // Handle other errors
     }
   }

### Global Error Handling

.. code-block:: javascript

   client.on('error', (error) => {
     switch (error.code) {
       case 'NETWORK_ERROR':
         showNotification('Connection lost. Retrying...', 'warning');
         break;
       case 'UNAUTHORIZED':
         redirectToLogin();
         break;
       case 'RATE_LIMIT_EXCEEDED':
         showNotification('Too many requests. Please wait.', 'error');
         break;
       default:
         showNotification('An error occurred. Please try again.', 'error');
     }
   });

## Advanced Features

### Caching

.. code-block:: javascript

   // Configure caching
   const client = new SATInClient({
     baseUrl: 'http://localhost:8000',
     cache: {
       enabled: true,
       timeout: 300000, // 5 minutes
       maxSize: 100 // Max cached items
     }
   });

   // Manual cache control
   await client.cache.clear(); // Clear all cache
   await client.cache.delete('projects'); // Clear specific cache
   const cached = client.cache.get('projects:list'); // Get cached data

### Batch Operations

.. code-block:: javascript

   // Batch create annotations
   const annotations = await client.annotations.batchCreate([
     {
       taskId: 'task_123',
       boundingBox: { x: 10, y: 20, width: 100, height: 200 },
       label: 'car',
       tags: ['vehicle']
     },
     {
       taskId: 'task_123',
       boundingBox: { x: 150, y: 80, width: 60, height: 120 },
       label: 'person',
       tags: ['human']
     }
   ]);

   // Batch update tasks
   const tasks = await client.tasks.batchUpdate([
     { id: 'task_123', status: 'finished' },
     { id: 'task_456', status: 'reviewed' }
   ]);

### Middleware

.. code-block:: javascript

   // Add request middleware
   client.use((request, next) => {
     // Add custom headers
     request.headers['X-Request-ID'] = generateRequestId();

     // Log request
     console.log(`Making request to ${request.url}`);

     return next(request);
   });

   // Add response middleware
   client.use((request, next) => {
     return next(request).then(response => {
       // Log response
       console.log(`Response from ${request.url}:`, response.status);
       return response;
     });
   });

## TypeScript Support

### Type Definitions

.. code-block:: typescript

   import { SATInClient, Project, Task, Annotation } from '@satin/sdk';

   const client = new SATInClient({
     baseUrl: 'http://localhost:8000'
   });

   // Fully typed responses
   const projects: Project[] = await client.projects.list();
   const task: Task = await client.tasks.get('task_123');
   const annotation: Annotation = await client.annotations.create({
     taskId: 'task_123',
     boundingBox: { x: 10, y: 20, width: 100, height: 200 },
     label: 'car',
     tags: ['vehicle']
   });

### Generic Methods

.. code-block:: typescript

   // Custom types
   interface CustomProject extends Project {
     customField: string;
   }

   // Type-safe custom queries
   const customProjects = await client.query<CustomProject[]>(`
     query GetCustomProjects {
       projects {
         id
         name
         description
         customField
       }
     }
   `);

## Testing Utilities

### Mock Client

.. code-block:: javascript

   import { createMockClient } from '@satin/sdk/testing';

   const mockClient = createMockClient();

   // Mock responses
   mockClient.projects.list.mockResolvedValue([
     { id: 'proj_1', name: 'Test Project', description: 'Test' }
   ]);

   // Use in tests
   const projects = await mockClient.projects.list();
   expect(projects).toHaveLength(1);
   expect(mockClient.projects.list).toHaveBeenCalledTimes(1);

### Test Helpers

.. code-block:: javascript

   import { createTestData } from '@satin/sdk/testing';

   // Generate test data
   const project = createTestData.project({ name: 'Test Project' });
   const task = createTestData.task({ projectId: project.id });
   const annotation = createTestData.annotation({ taskId: task.id });

## Related Documentation

- :doc:`graphql_api` - GraphQL API that the SDK wraps
- :doc:`../api/frontend` - Frontend integration examples
- :doc:`../development/testing` - Testing guidelines for SDK usage
- :doc:`../user_guide/index` - User interface built with the SDK
