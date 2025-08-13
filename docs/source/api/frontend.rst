Frontend API Reference
======================

The SATIn frontend provides a component-based architecture with TypeScript interfaces and utilities for building annotation interfaces.

## Core Components

### AnnotationPanel

The annotation panel displays and manages the list of annotations for the current image.

**Props Interface**:

.. code-block:: typescript

   interface AnnotationPanelProps {
     annotations: Annotation[];
     selectedAnnotation?: Annotation | null;
     onAnnotationSelect: (annotation: Annotation) => void;
     onAnnotationDelete: (annotationId: string) => void;
     onAnnotationEdit: (annotationId: string, updates: Partial<Annotation>) => void;
   }

**Usage Example**:

.. code-block:: svelte

   <script lang="ts">
     import AnnotationPanel from '$lib/components/AnnotationPanel.svelte';
     import type { Annotation } from '$lib/types';

     let annotations: Annotation[] = $state([]);
     let selectedAnnotation: Annotation | null = $state(null);

     function handleAnnotationSelect(annotation: Annotation) {
       selectedAnnotation = annotation;
     }

     function handleAnnotationDelete(annotationId: string) {
       annotations = annotations.filter(a => a.id !== annotationId);
     }
   </script>

   <AnnotationPanel
     {annotations}
     {selectedAnnotation}
     onAnnotationSelect={handleAnnotationSelect}
     onAnnotationDelete={handleAnnotationDelete}
   />

### AnnotationToolbar

Tool selection and control interface for the annotation workspace.

**Props Interface**:

.. code-block:: typescript

   interface AnnotationToolbarProps {
     activeTool: 'select' | 'bbox';
     onToolChange: (tool: 'select' | 'bbox') => void;
     onImageUpload?: (file: File) => void;
   }

**Tool States**:

- **select**: Selection tool for editing existing annotations
- **bbox**: Bounding box drawing tool for creating new annotations

**Usage Example**:

.. code-block:: svelte

   <script lang="ts">
     import AnnotationToolbar from '$lib/components/AnnotationToolbar.svelte';

     let activeTool: 'select' | 'bbox' = $state('select');

     function handleToolChange(tool: 'select' | 'bbox') {
       activeTool = tool;
     }

     function handleImageUpload(file: File) {
       // Handle image upload logic
       console.log('Uploaded file:', file.name);
     }
   </script>

   <AnnotationToolbar
     {activeTool}
     onToolChange={handleToolChange}
     onImageUpload={handleImageUpload}
   />

### ImageCanvas

The main canvas component for displaying images and handling annotation interactions.

**Props Interface**:

.. code-block:: typescript

   interface ImageCanvasProps {
     imageUrl: string;
     annotations: Annotation[];
     selectedAnnotation?: Annotation | null;
     activeTool: 'select' | 'bbox';
     isDrawing?: boolean;
     onAnnotationCreate: (bbox: BoundingBox) => void;
     onAnnotationSelect: (annotation: Annotation) => void;
     onAnnotationUpdate: (annotationId: string, updates: Partial<Annotation>) => void;
   }

**Canvas Events**:

- **Mouse Events**: Drawing and selection interactions
- **Keyboard Events**: Tool shortcuts and navigation
- **Resize Events**: Canvas resizing and zoom handling

**Usage Example**:

.. code-block:: svelte

   <script lang="ts">
     import ImageCanvas from '$lib/components/ImageCanvas.svelte';
     import type { Annotation, BoundingBox } from '$lib/types';

     let imageUrl = 'path/to/image.jpg';
     let annotations: Annotation[] = $state([]);
     let selectedAnnotation: Annotation | null = $state(null);
     let activeTool: 'select' | 'bbox' = $state('bbox');

     function handleAnnotationCreate(bbox: BoundingBox) {
       const newAnnotation: Annotation = {
         id: crypto.randomUUID(),
         bbox,
         text: '',
         tags: []
       };
       annotations = [...annotations, newAnnotation];
     }
   </script>

   <ImageCanvas
     {imageUrl}
     {annotations}
     {selectedAnnotation}
     {activeTool}
     onAnnotationCreate={handleAnnotationCreate}
     onAnnotationSelect={handleAnnotationSelect}
   />

### AnnotationWorkspace

The main workspace component that combines all annotation components.

**Props Interface**:

.. code-block:: typescript

   interface AnnotationWorkspaceProps {
     projectId: string;
     imageId?: string;
     initialAnnotations?: Annotation[];
   }

**Features**:

- Integrates toolbar, canvas, and annotation panel
- Handles state management between components
- Manages GraphQL operations for persistence
- Provides keyboard shortcuts and hotkeys

## Type Definitions

### Core Types

.. code-block:: typescript

   interface Annotation {
     id: string;
     bbox: BoundingBox;
     text: string | null;
     tags: string[] | null;
   }

   interface BoundingBox {
     x: number;      // X coordinate (pixels from left)
     y: number;      // Y coordinate (pixels from top)
     width: number;  // Box width in pixels
     height: number; // Box height in pixels
   }

   interface Project {
     id: string;
     name: string;
     description: string;
   }

   interface Image {
     id: string;
     filename: string;
     width: number;
     height: number;
     filePath: string;
   }

   interface Task {
     id: string;
     image: Image;
     project: Project;
     bboxes: Annotation[];
     status: TaskStatus;
     createdAt: string;
   }

   enum TaskStatus {
     DRAFT = "draft",
     FINISHED = "finished",
     REVIEWED = "reviewed"
   }

### GraphQL Types

.. code-block:: typescript

   // GraphQL input types for mutations
   interface ProjectInput {
     name: string;
     description: string;
   }

   interface AnnotationInput {
     text?: string;
     tags?: string[];
   }

   interface BBoxInput {
     x: number;
     y: number;
     width: number;
     height: number;
     annotation: AnnotationInput;
   }

   interface TaskInput {
     imageId: string;
     projectId: string;
     bboxes: BBoxInput[];
     status?: TaskStatus;
   }

## GraphQL Client

### Client Configuration

The frontend uses URQL for GraphQL operations with automatic caching and error handling.

**Client Setup** (`src/lib/graphql/client.ts`):

.. code-block:: typescript

   import { Client, cacheExchange, fetchExchange } from '@urql/svelte';
   import { browser } from '$app/environment';
   import { VITE_BACKEND_URL } from '$env/static/private';

   const client = new Client({
     url: browser ? `${VITE_BACKEND_URL}/graphql` : 'http://localhost:8000/graphql',
     exchanges: [cacheExchange, fetchExchange],
     requestPolicy: 'cache-and-network'
   });

   export default client;

### Query Operations

**Projects Query**:

.. code-block:: typescript

   import { query } from '@urql/svelte';

   const PROJECTS_QUERY = `
     query GetProjects($limit: Int, $offset: Int) {
       projects(limit: $limit, offset: $offset) {
         id
         name
         description
       }
     }
   `;

   // Usage in component
   const projectsStore = query({
     query: PROJECTS_QUERY,
     variables: { limit: 10, offset: 0 }
   });

**Tasks Query**:

.. code-block:: typescript

   const TASKS_QUERY = `
     query GetTasks($projectId: ID!, $limit: Int, $offset: Int) {
       tasks(
         queryInput: {
           stringFilters: [
             { field: "project_id", operator: EQ, value: $projectId }
           ]
           limit: $limit
           offset: $offset
         }
       ) {
         id
         status
         createdAt
         image {
           id
           filename
           width
           height
         }
         bboxes {
           x
           y
           width
           height
           annotation {
             text
             tags
           }
         }
       }
     }
   `;

### Mutation Operations

**Create Project**:

.. code-block:: typescript

   import { mutation } from '@urql/svelte';

   const CREATE_PROJECT_MUTATION = `
     mutation CreateProject($input: ProjectInput!) {
       createProject(input: $input) {
         id
         name
         description
       }
     }
   `;

   // Usage in component
   const createProjectMutation = mutation(CREATE_PROJECT_MUTATION);

   async function createProject(name: string, description: string) {
     const result = await createProjectMutation({
       input: { name, description }
     });

     if (result.error) {
       console.error('Failed to create project:', result.error);
       return null;
     }

     return result.data.createProject;
   }

**Update Task**:

.. code-block:: typescript

   const UPDATE_TASK_MUTATION = `
     mutation UpdateTask($id: ID!, $input: TaskInput!) {
       updateTask(id: $id, input: $input) {
         id
         status
         bboxes {
           x
           y
           width
           height
           annotation {
             text
             tags
           }
         }
       }
     }
   `;

   async function updateTaskAnnotations(taskId: string, bboxes: BBoxInput[]) {
     const result = await updateTaskMutation({
       id: taskId,
       input: { bboxes }
     });

     return result.data?.updateTask;
   }

## Utilities

### Format Utilities

**Coordinate Formatting** (`src/lib/utils/format.ts`):

.. code-block:: typescript

   export function formatCoordinate(value: number, precision: number = 1): string {
     return value.toFixed(precision);
   }

   export function formatBoundingBox(bbox: BoundingBox): string {
     const { x, y, width, height } = bbox;
     return `(${formatCoordinate(x)}, ${formatCoordinate(y)}) ${formatCoordinate(width)}×${formatCoordinate(height)}`;
   }

   export function formatAnnotationSummary(annotation: Annotation): string {
     const coords = formatBoundingBox(annotation.bbox);
     const label = annotation.text || 'Unlabeled';
     return `${label} ${coords}`;
   }

### Validation Utilities

**Input Validation** (`src/lib/utils/validation.ts`):

.. code-block:: typescript

   export function validateBoundingBox(bbox: BoundingBox): boolean {
     return (
       bbox.width > 0 &&
       bbox.height > 0 &&
       bbox.x >= 0 &&
       bbox.y >= 0
     );
   }

   export function validateAnnotation(annotation: Annotation): string[] {
     const errors: string[] = [];

     if (!validateBoundingBox(annotation.bbox)) {
       errors.push('Invalid bounding box coordinates');
     }

     if (annotation.text && annotation.text.trim().length === 0) {
       errors.push('Annotation text cannot be empty when provided');
     }

     return errors;
   }

   export function validateProject(project: Partial<Project>): string[] {
     const errors: string[] = [];

     if (!project.name || project.name.trim().length === 0) {
       errors.push('Project name is required');
     }

     if (project.name && project.name.length > 100) {
       errors.push('Project name must be less than 100 characters');
     }

     return errors;
   }

## State Management

### Svelte Stores

**Annotation Store** (`src/lib/stores/annotationStore.ts`):

.. code-block:: typescript

   import { writable } from 'svelte/store';
   import type { Annotation } from '$lib/types';

   interface AnnotationState {
     annotations: Annotation[];
     selectedAnnotation: Annotation | null;
     activeTool: 'select' | 'bbox';
     isDrawing: boolean;
   }

   const initialState: AnnotationState = {
     annotations: [],
     selectedAnnotation: null,
     activeTool: 'select',
     isDrawing: false
   };

   function createAnnotationStore() {
     const { subscribe, set, update } = writable<AnnotationState>(initialState);

     return {
       subscribe,

       // Actions
       setAnnotations: (annotations: Annotation[]) =>
         update(state => ({ ...state, annotations })),

       addAnnotation: (annotation: Annotation) =>
         update(state => ({
           ...state,
           annotations: [...state.annotations, annotation]
         })),

       updateAnnotation: (id: string, updates: Partial<Annotation>) =>
         update(state => ({
           ...state,
           annotations: state.annotations.map(a =>
             a.id === id ? { ...a, ...updates } : a
           )
         })),

       deleteAnnotation: (id: string) =>
         update(state => ({
           ...state,
           annotations: state.annotations.filter(a => a.id !== id),
           selectedAnnotation: state.selectedAnnotation?.id === id
             ? null
             : state.selectedAnnotation
         })),

       selectAnnotation: (annotation: Annotation | null) =>
         update(state => ({ ...state, selectedAnnotation: annotation })),

       setActiveTool: (tool: 'select' | 'bbox') =>
         update(state => ({ ...state, activeTool: tool })),

       setDrawing: (isDrawing: boolean) =>
         update(state => ({ ...state, isDrawing }))
     };
   }

   export const annotationStore = createAnnotationStore();

### Usage in Components

.. code-block:: svelte

   <script lang="ts">
     import { annotationStore } from '$lib/stores/annotationStore';
     import type { Annotation } from '$lib/types';

     // Reactive state from store
     let {
       annotations,
       selectedAnnotation,
       activeTool
     } = $state($annotationStore);

     function handleAnnotationCreate(bbox: BoundingBox) {
       const annotation: Annotation = {
         id: crypto.randomUUID(),
         bbox,
         text: null,
         tags: null
       };

       annotationStore.addAnnotation(annotation);
       annotationStore.selectAnnotation(annotation);
     }

     function handleToolChange(tool: 'select' | 'bbox') {
       annotationStore.setActiveTool(tool);
     }
   </script>

## Testing Utilities

### Component Testing Helpers

.. code-block:: typescript

   import { render } from '@testing-library/svelte';
   import type { RenderResult } from '@testing-library/svelte';

   export function renderWithProps<T extends Record<string, any>>(
     Component: any,
     props: T
   ): RenderResult<T> {
     return render(Component, { props });
   }

   export function createMockAnnotation(overrides: Partial<Annotation> = {}): Annotation {
     return {
       id: crypto.randomUUID(),
       bbox: { x: 10, y: 20, width: 100, height: 200 },
       text: 'Test Object',
       tags: ['test'],
       ...overrides
     };
   }

   export function createMockProject(overrides: Partial<Project> = {}): Project {
     return {
       id: crypto.randomUUID(),
       name: 'Test Project',
       description: 'Test project description',
       ...overrides
     };
   }

## Error Handling

### GraphQL Error Handling

.. code-block:: typescript

   import type { CombinedError } from '@urql/svelte';

   export function handleGraphQLError(error: CombinedError): string {
     if (error.networkError) {
       return 'Network error: Please check your connection';
     }

     if (error.graphQLErrors?.length > 0) {
       return error.graphQLErrors[0].message;
     }

     return 'An unexpected error occurred';
   }

   // Usage in components
   $: if ($projectsStore.error) {
     const errorMessage = handleGraphQLError($projectsStore.error);
     console.error('Projects query failed:', errorMessage);
   }

## Related Documentation

- :doc:`../user_guide/annotations` - User guide for annotation features
- :doc:`../user_guide/keyboard_shortcuts` - Keyboard shortcuts reference
- :doc:`../development/architecture` - System architecture overview
- :doc:`graphql` - GraphQL API reference
