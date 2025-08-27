# Image Annotation Tool - Technical Design Document

## 1. Data Models & Structures

### 1.1 Database Schema

#### Images Collection
```typescript
interface Image {
  _id: ObjectId;
  url: string;
  status: 'new' | 'annotated' | 'needs_reannotation';
  metadata: {
    width: number;
    height: number;
    format: string;
    size_bytes: number;
  };
  added_at: Date;
  updated_at: Date;
  annotation_versions: ObjectId[];  // Keep last 120
  current_version: number;
  tags_used: string[];  // Denormalized for filtering
}
```

#### Annotations Collection with Diff Tracking
```typescript
interface AnnotationVersion {
  _id: ObjectId;
  image_id: ObjectId;
  version: number;
  base_version: number;  // Version this was based on
  changes: AnnotationChange[];  // Diff from base_version
  full_snapshot: Annotation[] | null;  // Store full snapshot every 10 versions
  source: 'manual' | 'ml' | 'import';
  created_at: Date;
  is_current: boolean;
}

interface AnnotationChange {
  type: 'add' | 'update' | 'delete';
  annotation_id: string;
  before?: Annotation;  // For update/delete
  after?: Annotation;   // For add/update
}

interface Annotation {
  id: string;  // UUID
  bbox: BoundingBox;
  tags: string[];  // Tag IDs
  description: string;
  ml_description?: string;  // From ML models
  confidence?: number;
  source: 'manual' | 'ml';
  created_at: Date;
  updated_at: Date;
}

interface BoundingBox {
  x: number;      // Top-left X
  y: number;      // Top-left Y
  width: number;
  height: number;
}
```

#### Tags Collection with Hierarchy
```typescript
interface Tag {
  _id: ObjectId;
  name: string;
  path: string;  // Full path like "vehicle/car/sedan"
  parent_id: ObjectId | null;
  children: ObjectId[];
  level: number;  // 0-63 (max depth)
  definition: string;  // Tag description/definition
  aliases: string[];  // Alternative names for search
  usage_count: number;
  color: string;  // Hex color for UI display
  created_at: Date;
  updated_at: Date;
  metadata: {
    examples?: string[];  // Example use cases
    deprecated?: boolean;
    replaced_by?: ObjectId;  // If deprecated
  };
}
```

#### ML Jobs Collection
```typescript
interface MLJob {
  _id: ObjectId;
  image_id: ObjectId;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'partial';
  model_endpoint: string;
  request_payload: object;
  response?: {
    predictions: MLPrediction[];
    processing_time_ms: number;
    error?: string;
  };
  retry_count: number;
  created_at: Date;
  completed_at?: Date;
}

interface MLPrediction {
  bbox: BoundingBox;
  tags: string[];
  description: string;
  confidence: number;
}
```

### 1.2 Export Format Specification

```typescript
// Export format as specified
type ExportFormat = {
  url: string;
  annotations: {
    bbox: BoundingBox;
    tags: string[];  // Tag names, not IDs
    description: string;
  }[];
}[];
```

### 1.3 Frontend State Management

#### Annotation Store
```typescript
interface AnnotationStore {
  currentImage: Image | null;
  annotations: Map<string, Annotation>;  // Keyed by annotation ID
  selectedAnnotation: string | null;
  hoveredAnnotation: string | null;

  // Undo/Redo
  history: HistoryEntry[];
  historyIndex: number;
  maxHistorySize: 20;

  // Dirty tracking
  isDirty: boolean;
  lastSaveTime: Date;
  pendingChanges: AnnotationChange[];

  // Canvas state
  canvasState: {
    zoom: number;
    panX: number;
    panY: number;
    isDrawing: boolean;
    drawingStart: Point | null;
  };
}

interface HistoryEntry {
  action: 'add' | 'update' | 'delete' | 'batch';
  timestamp: Date;
  changes: AnnotationChange[];
}
```

#### Tag Store with Caching
```typescript
interface TagStore {
  tags: Map<string, Tag>;  // All tags keyed by ID
  hierarchy: TagNode[];     // Tree structure
  aliases: Map<string, string>;  // alias -> tag_id mapping

  // Cache management
  cacheTimestamp: Date;
  cacheTimeout: 600000;  // 10 minutes in ms

  // Search state
  searchIndex: SearchIndex;
  recentlyUsed: string[];  // Last 10 used tag IDs
}

interface TagNode {
  tag: Tag;
  children: TagNode[];
  expanded: boolean;  // UI state
}
```

## 2. API Specifications

### 2.1 GraphQL Schema

```graphql
scalar DateTime
scalar JSON

type Query {
  # Image queries
  images(
    status: ImageStatus
    limit: Int = 20
    offset: Int = 0
    sortBy: ImageSortField = ADDED_AT
    sortOrder: SortOrder = DESC
  ): ImageList!

  image(id: ID!): Image

  # Get adjacent images for navigation
  adjacentImages(currentId: ID!): AdjacentImages!

  # Annotation queries
  annotations(
    imageId: ID!
    version: Int  # null for current
  ): AnnotationData!

  annotationHistory(
    imageId: ID!
    limit: Int = 10
  ): [AnnotationVersion!]!

  # Tag queries
  tags(
    search: String
    includeDeprecated: Boolean = false
  ): [Tag!]!

  tagHierarchy: [TagNode!]!

  # ML status
  mlJobStatus(jobId: ID!): MLJob
}

type Mutation {
  # Image mutations
  addImage(url: String!): Image!
  updateImageStatus(
    id: ID!
    status: ImageStatus!
  ): Image!

  # Annotation mutations
  saveAnnotations(
    imageId: ID!
    changes: [AnnotationChangeInput!]!
    source: ChangeSource!
  ): AnnotationVersion!

  # Tag mutations
  createTag(input: TagInput!): Tag!
  updateTag(id: ID!, input: TagUpdateInput!): Tag!
  moveTag(id: ID!, newParentId: ID): Tag!

  # ML operations
  requestPreAnnotation(
    imageId: ID!
    modelEndpoint: String!
  ): MLJob!

  retryMLJob(jobId: ID!): MLJob!

  # Export operations
  exportAnnotations(
    imageIds: [ID!]
    status: ImageStatus
  ): ExportResult!
}

# Input types
input AnnotationChangeInput {
  type: ChangeType!
  annotationId: String
  annotation: AnnotationInput
}

input AnnotationInput {
  id: String
  bbox: BBoxInput!
  tags: [String!]!
  description: String!
}

input BBoxInput {
  x: Float!
  y: Float!
  width: Float!
  height: Float!
}

# Enums
enum ImageStatus {
  NEW
  ANNOTATED
  NEEDS_REANNOTATION
}

enum ChangeType {
  ADD
  UPDATE
  DELETE
}

enum ChangeSource {
  MANUAL
  ML
  IMPORT
}
```

### 2.2 REST API Endpoints

```yaml
# ML Integration
POST /api/ml/pre-annotate:
  request:
    image_url: string
    model_endpoint: string
    job_id: string  # For tracking
  response:
    job_id: string
    status: string

GET /api/ml/status/{job_id}:
  response:
    status: string
    progress?: number
    result?: MLPrediction[]
    error?: string

# Export/Import
GET /api/exports/{job_id}/download:
  response: JSON file stream

POST /api/imports/upload:
  request: multipart/form-data with JSON file
  response:
    imported: number
    failed: number
    errors: ImportError[]

# Health
GET /api/health:
  response:
    status: string
    database: boolean
    ml_available: boolean
```

## 3. Component Specifications

### 3.1 Canvas Component Architecture

#### Konva.js Layer Structure
```
Stage
├── Image Layer (bottom)
│   └── Image Node
├── Annotations Layer
│   ├── Bounding Box Group 1
│   │   ├── Rect (stroke)
│   │   ├── Rect (fill with opacity)
│   │   └── Label Group
│   ├── Bounding Box Group 2
│   └── ...
├── Drawing Layer
│   └── Temporary Rectangle (while drawing)
└── UI Layer (top)
    ├── Selection Handles
    └── Hover Effects
```

#### Bounding Box Selection Algorithm
```
function selectBoundingBox(clickPoint: Point, annotations: Annotation[]): string | null {
  const candidates = annotations.filter(ann =>
    pointInRectangle(clickPoint, ann.bbox)
  );

  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0].id;

  // Multiple overlapping boxes - find closest corner
  let minDistance = Infinity;
  let selected = null;

  for (const candidate of candidates) {
    const corners = [
      { x: candidate.bbox.x, y: candidate.bbox.y },  // top-left
      { x: candidate.bbox.x + candidate.bbox.width,
        y: candidate.bbox.y + candidate.bbox.height }  // bottom-right
    ];

    for (const corner of corners) {
      const distance = euclideanDistance(clickPoint, corner);
      if (distance < minDistance) {
        minDistance = distance;
        selected = candidate.id;
      }
    }
  }

  return selected;
}
```

#### Zoom Behavior Implementation
```
Zoom centers on cursor position:
- Calculate cursor position in image coordinates
- Apply zoom factor
- Adjust pan to keep cursor position fixed
- Clamp zoom between 0.1x and 10x
```

### 3.2 Keyboard Shortcuts Implementation

```typescript
interface KeyboardShortcut {
  key: string;
  modifiers?: ('ctrl' | 'shift' | 'alt')[];
  action: string;
  handler: () => void;
}

const shortcuts: KeyboardShortcut[] = [
  { key: 'b', action: 'draw_bbox', handler: startDrawing },
  { key: 'ArrowLeft', action: 'prev_image', handler: loadPreviousImage },
  { key: 'ArrowRight', action: 'next_image', handler: loadNextImage },
  { key: 'Tab', action: 'next_bbox', handler: selectNextBbox },
  { key: 'Tab', modifiers: ['shift'], action: 'prev_bbox', handler: selectPrevBbox },
  { key: 'Delete', action: 'delete_bbox', handler: deleteSelected },
  { key: 'z', modifiers: ['ctrl'], action: 'undo', handler: undo },
  { key: 'y', modifiers: ['ctrl'], action: 'redo', handler: redo },
  { key: 'Escape', action: 'cancel', handler: cancelCurrentOperation },
];
```

### 3.3 Auto-save Strategy

```typescript
interface AutoSaveConfig {
  timeInterval: 30000;  // 30 seconds
  changeThreshold: 5;   // Save after 5 changes
  maxBatchSize: 50;     // Maximum changes per batch
}

class AutoSaveManager {
  private timer: Timer;
  private changeCount: number = 0;
  private pendingChanges: AnnotationChange[] = [];

  scheduleAutoSave() {
    // Save when either condition is met:
    // 1. 30 seconds elapsed with changes
    // 2. 5 or more changes accumulated

    if (this.changeCount >= this.config.changeThreshold) {
      this.performSave();
    } else {
      this.resetTimer();
    }
  }

  performSave() {
    // Group changes by type for efficient diffing
    const grouped = this.groupChanges(this.pendingChanges);

    // Send to backend
    this.saveAnnotations(grouped);

    // Reset state
    this.pendingChanges = [];
    this.changeCount = 0;
    this.resetTimer();
  }
}
```

### 3.4 LocalStorage Backup Strategy

```typescript
interface LocalBackup {
  imageId: string;
  annotations: Annotation[];
  timestamp: Date;
  version: number;
}

class LocalStorageManager {
  private readonly KEY_PREFIX = 'annotation_backup_';
  private readonly MAX_AGE = 86400000;  // 24 hours

  saveBackup(imageId: string, annotations: Annotation[]) {
    const backup: LocalBackup = {
      imageId,
      annotations,
      timestamp: new Date(),
      version: 1
    };

    localStorage.setItem(
      `${this.KEY_PREFIX}${imageId}`,
      JSON.stringify(backup)
    );
  }

  restoreBackup(imageId: string): Annotation[] | null {
    const stored = localStorage.getItem(`${this.KEY_PREFIX}${imageId}`);
    if (!stored) return null;

    const backup = JSON.parse(stored) as LocalBackup;

    // Check age
    if (Date.now() - backup.timestamp.getTime() > this.MAX_AGE) {
      this.clearBackup(imageId);
      return null;
    }

    return backup.annotations;
  }

  clearOldBackups() {
    // Run periodically to clean up old backups
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.KEY_PREFIX)) {
        const backup = JSON.parse(localStorage.getItem(key));
        if (Date.now() - backup.timestamp.getTime() > this.MAX_AGE) {
          localStorage.removeItem(key);
        }
      }
    }
  }
}
```

## 4. Caching Strategy

### 4.1 Tag Cache Implementation

```typescript
class TagCache {
  private cache: Map<string, Tag> = new Map();
  private hierarchyCache: TagNode[] | null = null;
  private aliasIndex: Map<string, string> = new Map();
  private lastRefresh: Date = new Date();
  private readonly TTL = 600000;  // 10 minutes

  async getTags(): Promise<Tag[]> {
    if (this.isExpired()) {
      await this.refresh();
    }
    return Array.from(this.cache.values());
  }

  private isExpired(): boolean {
    return Date.now() - this.lastRefresh.getTime() > this.TTL;
  }

  invalidate() {
    this.cache.clear();
    this.hierarchyCache = null;
    this.aliasIndex.clear();
  }

  async refresh() {
    const tags = await fetchTagsFromAPI();

    // Rebuild cache
    this.cache.clear();
    tags.forEach(tag => this.cache.set(tag._id, tag));

    // Build alias index
    this.aliasIndex.clear();
    tags.forEach(tag => {
      tag.aliases.forEach(alias =>
        this.aliasIndex.set(alias.toLowerCase(), tag._id)
      );
    });

    // Build hierarchy
    this.hierarchyCache = this.buildHierarchy(tags);

    this.lastRefresh = new Date();
  }
}
```

### 4.2 Image Prefetching Strategy

```typescript
class ImagePrefetcher {
  private cache: Map<string, HTMLImageElement> = new Map();
  private readonly MAX_CACHE_SIZE = 3;  // Current + prev + next

  async prefetchAdjacent(currentImageId: string) {
    const { previous, next } = await fetchAdjacentImages(currentImageId);

    // Clear old cache entries if needed
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const keysToKeep = new Set([currentImageId, previous?.id, next?.id].filter(Boolean));
      for (const key of this.cache.keys()) {
        if (!keysToKeep.has(key)) {
          this.cache.delete(key);
        }
      }
    }

    // Prefetch images
    if (previous) this.preloadImage(previous.url, previous.id);
    if (next) this.preloadImage(next.url, next.id);
  }

  private preloadImage(url: string, id: string) {
    if (this.cache.has(id)) return;

    const img = new Image();
    img.src = url;
    img.onload = () => {
      this.cache.set(id, img);
    };
  }

  getImage(id: string): HTMLImageElement | null {
    return this.cache.get(id) || null;
  }
}
```

## 5. ML Integration

### 5.1 ML Request Handling

```typescript
class MLIntegrationService {
  private readonly MAX_TIMEOUT = 300000;  // 5 minutes
  private activeJobs: Map<string, AbortController> = new Map();

  async requestPreAnnotation(
    imageId: string,
    modelEndpoint: string
  ): Promise<MLJob> {
    // Create job record
    const job = await createMLJob(imageId, modelEndpoint);

    // Start async processing
    this.processMLRequest(job);

    return job;
  }

  private async processMLRequest(job: MLJob) {
    const controller = new AbortController();
    this.activeJobs.set(job._id, controller);

    try {
      // Set timeout
      const timeoutId = setTimeout(() => controller.abort(), this.MAX_TIMEOUT);

      // Make request to ML server
      const response = await fetch(job.model_endpoint, {
        method: 'POST',
        body: JSON.stringify({
          image_url: job.image.url,
          job_id: job._id
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const predictions = await response.json();
        await updateMLJob(job._id, {
          status: 'completed',
          response: predictions
        });
      } else {
        throw new Error(`ML server returned ${response.status}`);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        await updateMLJob(job._id, {
          status: 'failed',
          error: 'Request timeout'
        });
      } else {
        await updateMLJob(job._id, {
          status: 'failed',
          error: error.message
        });
      }
    } finally {
      this.activeJobs.delete(job._id);
    }
  }

  async retryJob(jobId: string): Promise<MLJob> {
    const job = await getMLJob(jobId);
    if (job.status === 'processing') {
      throw new Error('Job is already processing');
    }

    // Reset job status
    job.status = 'pending';
    job.retry_count++;

    // Reprocess
    this.processMLRequest(job);

    return job;
  }
}
```

### 5.2 Partial Result Handling

```typescript
function handlePartialMLResults(
  predictions: MLPrediction[],
  errors: MLError[]
): AnnotationChange[] {
  const changes: AnnotationChange[] = [];

  // Add successful predictions
  for (const prediction of predictions) {
    if (prediction.confidence > 0) {  // Accept all since ML controls threshold
      changes.push({
        type: 'add',
        annotation_id: generateUUID(),
        after: {
          id: generateUUID(),
          bbox: prediction.bbox,
          tags: prediction.tags,
          description: prediction.description,
          ml_description: prediction.description,
          confidence: prediction.confidence,
          source: 'ml',
          created_at: new Date(),
          updated_at: new Date()
        }
      });
    }
  }

  // Log errors for debugging
  if (errors.length > 0) {
    console.error('Partial ML failures:', errors);
  }

  // Return successful predictions
  return changes;
}
```

## 6. Version Management

### 6.1 Diff Tracking Implementation

```typescript
class VersionManager {
  private readonly MAX_VERSIONS = 120;
  private readonly SNAPSHOT_INTERVAL = 10;

  async createVersion(
    imageId: string,
    changes: AnnotationChange[],
    source: ChangeSource
  ): Promise<AnnotationVersion> {
    const currentVersion = await getCurrentVersion(imageId);
    const newVersionNumber = (currentVersion?.version || 0) + 1;

    // Determine if we need a full snapshot
    const needsSnapshot = newVersionNumber % this.SNAPSHOT_INTERVAL === 0;

    const version: AnnotationVersion = {
      image_id: imageId,
      version: newVersionNumber,
      base_version: currentVersion?.version || 0,
      changes: changes,
      full_snapshot: needsSnapshot ? await this.computeFullState(imageId, changes) : null,
      source: source,
      created_at: new Date(),
      is_current: true
    };

    // Mark previous as non-current
    if (currentVersion) {
      await markAsHistorical(currentVersion._id);
    }

    // Save new version
    const saved = await saveVersion(version);

    // Cleanup old versions
    await this.pruneOldVersions(imageId);

    return saved;
  }

  private async pruneOldVersions(imageId: string) {
    const versions = await getVersions(imageId);

    if (versions.length > this.MAX_VERSIONS) {
      const toDelete = versions
        .sort((a, b) => b.version - a.version)
        .slice(this.MAX_VERSIONS);

      for (const version of toDelete) {
        await deleteVersion(version._id);
      }
    }
  }

  async reconstructVersion(
    imageId: string,
    targetVersion: number
  ): Promise<Annotation[]> {
    // Find nearest snapshot
    const snapshot = await findNearestSnapshot(imageId, targetVersion);

    if (!snapshot) {
      // Reconstruct from beginning
      return this.reconstructFromStart(imageId, targetVersion);
    }

    // Apply diffs from snapshot to target
    let state = [...snapshot.full_snapshot];
    const diffs = await getVersionsBetween(
      imageId,
      snapshot.version,
      targetVersion
    );

    for (const diff of diffs) {
      state = this.applyChanges(state, diff.changes);
    }

    return state;
  }

  private applyChanges(
    state: Annotation[],
    changes: AnnotationChange[]
  ): Annotation[] {
    const result = [...state];

    for (const change of changes) {
      switch (change.type) {
        case 'add':
          result.push(change.after);
          break;
        case 'update':
          const updateIndex = result.findIndex(a => a.id === change.annotation_id);
          if (updateIndex >= 0) {
            result[updateIndex] = change.after;
          }
          break;
        case 'delete':
          const deleteIndex = result.findIndex(a => a.id === change.annotation_id);
          if (deleteIndex >= 0) {
            result.splice(deleteIndex, 1);
          }
          break;
      }
    }

    return result;
  }
}
```

## 7. Error Handling

### 7.1 Error Message Strategy

```typescript
// User-friendly error messages
const ERROR_MESSAGES = {
  NETWORK_ERROR: "Connection lost. Please check your network and try again.",
  IMAGE_LOAD_ERROR: "Failed to load image. Please verify the URL is accessible.",
  SAVE_ERROR: "Failed to save annotations. Your changes are backed up locally.",
  ML_TIMEOUT: "AI processing is taking longer than expected. You can continue annotating manually.",
  ML_PARTIAL: "Some AI predictions failed, showing successful results only.",
  TAG_LOAD_ERROR: "Failed to load tags. Using cached version.",
  EXPORT_ERROR: "Export failed. Please try again with fewer images.",
  VERSION_LIMIT: "Maximum version history reached. Oldest versions will be removed.",
  VALIDATION_ERROR: "Invalid annotation data. Please check your inputs.",
};

// Detailed console logging
function logError(error: Error, context: object) {
  console.error('[Annotation Tool Error]', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent
  });
}
```

### 7.2 Error Recovery

```typescript
class ErrorRecovery {
  async handleSaveError(error: Error, changes: AnnotationChange[]) {
    // 1. Log error
    logError(error, { action: 'save', changes });

    // 2. Store to localStorage
    localStorageManager.saveBackup(currentImageId, annotations);

    // 3. Show user-friendly message
    showNotification({
      type: 'error',
      message: ERROR_MESSAGES.SAVE_ERROR,
      action: {
        label: 'Retry',
        handler: () => this.retrySave(changes)
      }
    });

    // 4. Attempt recovery
    setTimeout(() => this.retrySave(changes), 5000);
  }

  async handleImageLoadError(url: string) {
    // Try alternative loading strategies
    const strategies = [
      () => this.loadWithCORS(url),
      () => this.loadWithProxy(url),
      () => this.loadWithoutCORS(url)
    ];

    for (const strategy of strategies) {
      try {
        return await strategy();
      } catch (e) {
        continue;
      }
    }

    throw new Error(ERROR_MESSAGES.IMAGE_LOAD_ERROR);
  }
}
```

## 8. Performance Optimizations

### 8.1 Canvas Rendering Optimizations

```typescript
class CanvasOptimizer {
  // Use requestAnimationFrame for smooth updates
  private rafId: number | null = null;
  private pendingUpdates: Set<string> = new Set();

  scheduleUpdate(layerId: string) {
    this.pendingUpdates.add(layerId);

    if (!this.rafId) {
      this.rafId = requestAnimationFrame(() => this.performUpdates());
    }
  }

  private performUpdates() {
    // Batch layer updates
    const stage = this.konvaStage;

    // Disable automatic draw
    stage.batchDraw(() => {
      for (const layerId of this.pendingUpdates) {
        const layer = stage.findOne(`#${layerId}`);
        if (layer) {
          layer.draw();
        }
      }
    });

    this.pendingUpdates.clear();
    this.rafId = null;
  }

  // Viewport culling for large annotation sets
  getVisibleAnnotations(
    annotations: Annotation[],
    viewport: Rectangle
  ): Annotation[] {
    return annotations.filter(ann =>
      this.rectanglesIntersect(ann.bbox, viewport)
    );
  }

  // Level of detail rendering
  getAnnotationLOD(zoom: number): 'full' | 'simplified' | 'dots' {
    if (zoom > 0.5) return 'full';
    if (zoom > 0.2) return 'simplified';
    return 'dots';
  }
}
```

### 8.2 Database Query Optimizations

```typescript
// Indexes to create
const INDEXES = [
  // Images
  { collection: 'images', index: { url: 1 }, options: { unique: true } },
  { collection: 'images', index: { status: 1, added_at: -1 } },
  { collection: 'images', index: { tags_used: 1 } },

  // Annotations
  { collection: 'annotations', index: { image_id: 1, version: -1 } },
  { collection: 'annotations', index: { image_id: 1, is_current: 1 } },
  { collection: 'annotations', index: { 'changes.annotation_id': 1 } },

  // Tags
  { collection: 'tags', index: { path: 1 } },
  { collection: 'tags', index: { name: 'text', aliases: 'text' } },
  { collection: 'tags', index: { parent_id: 1 } },
  { collection: 'tags', index: { usage_count: -1 } },

  // ML Jobs
  { collection: 'ml_jobs', index: { image_id: 1, created_at: -1 } },
  { collection: 'ml_jobs', index: { status: 1 } }
];

// Aggregation pipeline for efficient annotation retrieval
const getAnnotationsWithHistory = {
  pipeline: [
    { $match: { image_id: ObjectId(imageId) } },
    { $sort: { version: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'tags',
        localField: 'changes.after.tags',
        foreignField: '_id',
        as: 'tag_details'
      }
    },
    {
      $project: {
        version: 1,
        changes: 1,
        created_at: 1,
        source: 1,
        tag_names: '$tag_details.name'
      }
    }
  ]
};
```

## 9. Testing Strategy

### 9.1 Unit Test Coverage

```typescript
// Key areas requiring unit tests
const TEST_COVERAGE = {
  // Frontend
  'Canvas Operations': [
    'Bounding box drawing',
    'Selection algorithm',
    'Zoom/pan calculations',
    'Coordinate transformations'
  ],

  'State Management': [
    'Undo/redo operations',
    'Change tracking',
    'Auto-save triggering',
    'Cache invalidation'
  ],

  // Backend
  'Version Management': [
    'Diff calculation',
    'Version reconstruction',
    'Snapshot creation',
    'Version pruning'
  ],

  'Data Validation': [
    'Annotation structure',
    'Tag hierarchy depth',
    'Export format',
    'Import parsing'
  ],

  'ML Integration': [
    'Request timeout handling',
    'Partial result processing',
    'Retry logic',
    'Error recovery'
  ]
};
```

### 9.2 Integration Test Scenarios

```typescript
const INTEGRATION_TESTS = [
  {
    name: 'Complete annotation workflow',
    steps: [
      'Load image from URL',
      'Draw multiple bounding boxes',
      'Add tags and descriptions',
      'Trigger auto-save',
      'Verify version created',
      'Export annotations',
      'Verify export format'
    ]
  },
  {
    name: 'ML pipeline integration',
    steps: [
      'Request pre-annotation',
      'Handle timeout scenario',
      'Process partial results',
      'User modifies ML annotations',
      'Save combined results',
      'Verify source tracking'
    ]
  },
  {
    name: 'Version history management',
    steps: [
      'Create 130 versions',
      'Verify oldest 10 pruned',
      'Reconstruct middle version',
      'Verify snapshot creation',
      'Test diff accuracy'
    ]
  }
];
```

## 10. Migration & Deployment

### 10.1 Database Migrations

```python
# Migration to add version tracking
def migration_001_add_versioning():
    """Add versioning support to existing annotations"""

    # 1. Create new versioned collection
    db.create_collection('annotations_v2')

    # 2. Migrate existing data
    for doc in db.annotations.find():
        versioned = {
            'image_id': doc['image_id'],
            'version': 1,
            'base_version': 0,
            'changes': [{
                'type': 'add',
                'annotation_id': ann['id'],
                'after': ann
            } for ann in doc['annotations']],
            'full_snapshot': doc['annotations'],
            'source': 'manual',
            'created_at': doc.get('created_at', datetime.now()),
            'is_current': True
        }
        db.annotations_v2.insert_one(versioned)

    # 3. Rename collections
    db.annotations.rename('annotations_old')
    db.annotations_v2.rename('annotations')

    # 4. Create indexes
    create_indexes()
```

### 10.2 Configuration Files

```yaml
# config/development.yaml
database:
  url: mongodb://localhost:27017
  name: annotation_tool_dev

api:
  host: 0.0.0.0
  port: 8000
  cors_origins:
    - http://localhost:5173

ml:
  timeout: 300000  # 5 minutes
  retry_attempts: 3

storage:
  export_ttl: 86400  # 24 hours
  export_path: /tmp/exports

cache:
  tag_ttl: 600  # 10 minutes
  image_prefetch: 3

autosave:
  interval: 30000  # 30 seconds
  change_threshold: 5

versioning:
  max_versions: 120
  snapshot_interval: 10
```
