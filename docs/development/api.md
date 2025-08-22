# Image Annotation Tool - API Documentation

## Overview

The Image Annotation Tool API consists of two parts:
1. **GraphQL API** - Primary API for all data operations
2. **REST API** - Supplementary endpoints for ML integration, file operations, and health checks

**Base URLs:**
- GraphQL Endpoint: `http://localhost:8000/graphql`
- REST Endpoints: `http://localhost:8000/api/*`

**Headers:**
```http
Content-Type: application/json
Accept: application/json
```

## GraphQL API

### Queries

#### 1. Get Images List

Retrieve a paginated list of images with filtering and sorting options.

**Query:**
```graphql
query GetImages($status: ImageStatus, $limit: Int, $offset: Int, $sortBy: ImageSortField, $sortOrder: SortOrder) {
  images(status: $status, limit: $limit, offset: $offset, sortBy: $sortBy, sortOrder: $sortOrder) {
    total
    items {
      id
      url
      status
      metadata {
        width
        height
        format
        sizeBytes
      }
      addedAt
      updatedAt
      currentVersion
      tagsUsed
    }
  }
}
```

**Variables Example:**
```json
{
  "status": "NEW",
  "limit": 20,
  "offset": 0,
  "sortBy": "ADDED_AT",
  "sortOrder": "DESC"
}
```

**Response:**
```json
{
  "data": {
    "images": {
      "total": 150,
      "items": [
        {
          "id": "507f1f77bcf86cd799439011",
          "url": "https://example.com/image1.jpg",
          "status": "NEW",
          "metadata": {
            "width": 1920,
            "height": 1080,
            "format": "jpeg",
            "sizeBytes": 524288
          },
          "addedAt": "2024-01-15T10:30:00Z",
          "updatedAt": "2024-01-15T10:30:00Z",
          "currentVersion": 0,
          "tagsUsed": []
        }
      ]
    }
  }
}
```

#### 2. Get Single Image

Retrieve detailed information about a specific image.

**Query:**
```graphql
query GetImage($id: ID!) {
  image(id: $id) {
    id
    url
    status
    metadata {
      width
      height
      format
      sizeBytes
    }
    addedAt
    updatedAt
    currentVersion
    annotationVersions
    tagsUsed
  }
}
```

**Variables:**
```json
{
  "id": "507f1f77bcf86cd799439011"
}
```

#### 3. Get Adjacent Images

Get previous and next images for navigation.

**Query:**
```graphql
query GetAdjacentImages($currentId: ID!) {
  adjacentImages(currentId: $currentId) {
    previous {
      id
      url
      status
    }
    next {
      id
      url
      status
    }
  }
}
```

**Response:**
```json
{
  "data": {
    "adjacentImages": {
      "previous": {
        "id": "507f1f77bcf86cd799439010",
        "url": "https://example.com/image0.jpg",
        "status": "ANNOTATED"
      },
      "next": {
        "id": "507f1f77bcf86cd799439012",
        "url": "https://example.com/image2.jpg",
        "status": "NEW"
      }
    }
  }
}
```

#### 4. Get Annotations

Retrieve annotations for an image (current or specific version).

**Query:**
```graphql
query GetAnnotations($imageId: ID!, $version: Int) {
  annotations(imageId: $imageId, version: $version) {
    version
    annotations {
      id
      bbox {
        x
        y
        width
        height
      }
      tags
      description
      mlDescription
      confidence
      source
      createdAt
      updatedAt
    }
    createdAt
    source
  }
}
```

**Variables:**
```json
{
  "imageId": "507f1f77bcf86cd799439011",
  "version": null
}
```

**Response:**
```json
{
  "data": {
    "annotations": {
      "version": 5,
      "annotations": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "bbox": {
            "x": 100.5,
            "y": 200.5,
            "width": 300.0,
            "height": 400.0
          },
          "tags": ["vehicle", "car", "sedan"],
          "description": "Blue sedan parked on the street",
          "mlDescription": null,
          "confidence": null,
          "source": "manual",
          "createdAt": "2024-01-15T11:00:00Z",
          "updatedAt": "2024-01-15T11:05:00Z"
        }
      ],
      "createdAt": "2024-01-15T11:05:00Z",
      "source": "manual"
    }
  }
}
```

#### 5. Get Annotation History

Retrieve version history for an image's annotations.

**Query:**
```graphql
query GetAnnotationHistory($imageId: ID!, $limit: Int) {
  annotationHistory(imageId: $imageId, limit: $limit) {
    version
    baseVersion
    changes {
      type
      annotationId
      before {
        id
        tags
        description
      }
      after {
        id
        tags
        description
      }
    }
    source
    createdAt
    isCurrent
  }
}
```

**Response:**
```json
{
  "data": {
    "annotationHistory": [
      {
        "version": 5,
        "baseVersion": 4,
        "changes": [
          {
            "type": "UPDATE",
            "annotationId": "550e8400-e29b-41d4-a716-446655440000",
            "before": {
              "id": "550e8400-e29b-41d4-a716-446655440000",
              "tags": ["vehicle"],
              "description": "Blue car"
            },
            "after": {
              "id": "550e8400-e29b-41d4-a716-446655440000",
              "tags": ["vehicle", "car", "sedan"],
              "description": "Blue sedan parked on the street"
            }
          }
        ],
        "source": "manual",
        "createdAt": "2024-01-15T11:05:00Z",
        "isCurrent": true
      }
    ]
  }
}
```

#### 6. Search Tags

Search for tags with optional text search.

**Query:**
```graphql
query SearchTags($search: String, $includeDeprecated: Boolean) {
  tags(search: $search, includeDeprecated: $includeDeprecated) {
    id
    name
    path
    definition
    aliases
    parentId
    level
    usageCount
    color
    metadata {
      deprecated
      replacedBy
    }
  }
}
```

**Variables:**
```json
{
  "search": "vehicle",
  "includeDeprecated": false
}
```

#### 7. Get Tag Hierarchy

Retrieve the complete tag hierarchy tree.

**Query:**
```graphql
query GetTagHierarchy {
  tagHierarchy {
    tag {
      id
      name
      path
      definition
      level
      usageCount
      color
    }
    children {
      tag {
        id
        name
        path
      }
      children {
        tag {
          id
          name
          path
        }
      }
    }
  }
}
```

#### 8. Get ML Job Status

Check the status of an ML pre-annotation job.

**Query:**
```graphql
query GetMLJobStatus($jobId: ID!) {
  mlJobStatus(jobId: $jobId) {
    id
    imageId
    status
    modelEndpoint
    response {
      predictions {
        bbox {
          x
          y
          width
          height
        }
        tags
        description
        confidence
      }
      processingTimeMs
      error
    }
    retryCount
    createdAt
    completedAt
  }
}
```

### Mutations

#### 1. Add Image

Add a new image by URL.

**Mutation:**
```graphql
mutation AddImage($url: String!) {
  addImage(url: $url) {
    id
    url
    status
    metadata {
      width
      height
      format
      sizeBytes
    }
    addedAt
  }
}
```

**Variables:**
```json
{
  "url": "https://example.com/new-image.jpg"
}
```

**Response:**
```json
{
  "data": {
    "addImage": {
      "id": "507f1f77bcf86cd799439012",
      "url": "https://example.com/new-image.jpg",
      "status": "NEW",
      "metadata": {
        "width": 3840,
        "height": 2160,
        "format": "jpeg",
        "sizeBytes": 1048576
      },
      "addedAt": "2024-01-15T12:00:00Z"
    }
  }
}
```

#### 2. Update Image Status

Change an image's annotation status.

**Mutation:**
```graphql
mutation UpdateImageStatus($id: ID!, $status: ImageStatus!) {
  updateImageStatus(id: $id, status: $status) {
    id
    status
    updatedAt
  }
}
```

**Variables:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "status": "NEEDS_REANNOTATION"
}
```

#### 3. Save Annotations

Save annotation changes (create, update, delete).

**Mutation:**
```graphql
mutation SaveAnnotations($imageId: ID!, $changes: [AnnotationChangeInput!]!, $source: ChangeSource!) {
  saveAnnotations(imageId: $imageId, changes: $changes, source: $source) {
    version
    baseVersion
    changes {
      type
      annotationId
    }
    source
    createdAt
  }
}
```

**Variables:**
```json
{
  "imageId": "507f1f77bcf86cd799439011",
  "changes": [
    {
      "type": "ADD",
      "annotation": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "bbox": {
          "x": 150.0,
          "y": 250.0,
          "width": 200.0,
          "height": 300.0
        },
        "tags": ["person", "pedestrian"],
        "description": "Person walking on sidewalk"
      }
    },
    {
      "type": "UPDATE",
      "annotationId": "550e8400-e29b-41d4-a716-446655440000",
      "annotation": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "bbox": {
          "x": 100.5,
          "y": 200.5,
          "width": 305.0,
          "height": 405.0
        },
        "tags": ["vehicle", "car", "sedan", "parked"],
        "description": "Blue sedan parked on the street - updated"
      }
    },
    {
      "type": "DELETE",
      "annotationId": "550e8400-e29b-41d4-a716-446655440002"
    }
  ],
  "source": "MANUAL"
}
```

#### 4. Create Tag

Create a new tag in the hierarchy.

**Mutation:**
```graphql
mutation CreateTag($input: TagInput!) {
  createTag(input: $input) {
    id
    name
    path
    definition
    aliases
    parentId
    level
    color
  }
}
```

**Variables:**
```json
{
  "input": {
    "name": "SUV",
    "parentId": "507f1f77bcf86cd799439020",
    "definition": "Sport Utility Vehicle - larger passenger vehicle with off-road capabilities",
    "aliases": ["sports utility vehicle", "4x4"],
    "color": "#FF5733"
  }
}
```

#### 5. Update Tag

Update an existing tag's properties.

**Mutation:**
```graphql
mutation UpdateTag($id: ID!, $input: TagUpdateInput!) {
  updateTag(id: $id, input: $input) {
    id
    name
    definition
    aliases
    color
  }
}
```

**Variables:**
```json
{
  "id": "507f1f77bcf86cd799439021",
  "input": {
    "definition": "Updated definition for SUV",
    "aliases": ["sports utility vehicle", "4x4", "off-roader"],
    "color": "#FF6B33"
  }
}
```

#### 6. Move Tag

Move a tag to a different parent in the hierarchy.

**Mutation:**
```graphql
mutation MoveTag($id: ID!, $newParentId: ID) {
  moveTag(id: $id, newParentId: $newParentId) {
    id
    path
    parentId
    level
  }
}
```

#### 7. Request Pre-Annotation

Start ML pre-annotation for an image.

**Mutation:**
```graphql
mutation RequestPreAnnotation($imageId: ID!, $modelEndpoint: String!) {
  requestPreAnnotation(imageId: $imageId, modelEndpoint: $modelEndpoint) {
    id
    imageId
    status
    modelEndpoint
    createdAt
  }
}
```

**Variables:**
```json
{
  "imageId": "507f1f77bcf86cd799439011",
  "modelEndpoint": "http://ml-server:5000/detect"
}
```

**Response:**
```json
{
  "data": {
    "requestPreAnnotation": {
      "id": "607f1f77bcf86cd799439011",
      "imageId": "507f1f77bcf86cd799439011",
      "status": "PENDING",
      "modelEndpoint": "http://ml-server:5000/detect",
      "createdAt": "2024-01-15T12:30:00Z"
    }
  }
}
```

#### 8. Retry ML Job

Retry a failed ML job.

**Mutation:**
```graphql
mutation RetryMLJob($jobId: ID!) {
  retryMLJob(jobId: $jobId) {
    id
    status
    retryCount
  }
}
```

#### 9. Export Annotations

Export annotations for specified images.

**Mutation:**
```graphql
mutation ExportAnnotations($imageIds: [ID!], $status: ImageStatus) {
  exportAnnotations(imageIds: $imageIds, status: $status) {
    jobId
    downloadUrl
    expiresAt
    imageCount
  }
}
```

**Variables:**
```json
{
  "imageIds": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"],
  "status": null
}
```

**Response:**
```json
{
  "data": {
    "exportAnnotations": {
      "jobId": "export_20240115_123000",
      "downloadUrl": "/api/exports/export_20240115_123000/download",
      "expiresAt": "2024-01-16T12:30:00Z",
      "imageCount": 2
    }
  }
}
```

## REST API

### ML Integration Endpoints

#### 1. Request Pre-Annotation

**Endpoint:** `POST /api/ml/pre-annotate`

**Request:**
```json
{
  "image_url": "https://example.com/image.jpg",
  "model_endpoint": "http://ml-server:5000/detect",
  "job_id": "607f1f77bcf86cd799439011"
}
```

**Response (202 Accepted):**
```json
{
  "job_id": "607f1f77bcf86cd799439011",
  "status": "processing",
  "message": "ML processing started"
}
```

#### 2. Get ML Job Status

**Endpoint:** `GET /api/ml/status/{job_id}`

**Response (Success):**
```json
{
  "status": "completed",
  "progress": 100,
  "result": [
    {
      "bbox": {
        "x": 100,
        "y": 200,
        "width": 300,
        "height": 400
      },
      "tags": ["vehicle", "car"],
      "description": "Red car detected with high confidence",
      "confidence": 0.95
    }
  ],
  "processing_time_ms": 2500
}
```

**Response (In Progress):**
```json
{
  "status": "processing",
  "progress": 45,
  "message": "Processing image through model"
}
```

**Response (Failed):**
```json
{
  "status": "failed",
  "error": "Model timeout after 300 seconds",
  "retry_available": true
}
```

**Response (Partial Success):**
```json
{
  "status": "partial",
  "result": [
    {
      "bbox": {
        "x": 100,
        "y": 200,
        "width": 300,
        "height": 400
      },
      "tags": ["vehicle"],
      "description": "Vehicle detected",
      "confidence": 0.85
    }
  ],
  "errors": [
    {
      "region": "bottom_right",
      "error": "Detection failed for region"
    }
  ]
}
```

### Export/Import Endpoints

#### 3. Download Export

**Endpoint:** `GET /api/exports/{job_id}/download`

**Response Headers:**
```http
Content-Type: application/json
Content-Disposition: attachment; filename="annotations_20240115_123000.json"
```

**Response Body:**
```json
[
  {
    "url": "https://example.com/image1.jpg",
    "annotations": [
      {
        "bbox": {
          "x": 100,
          "y": 200,
          "width": 300,
          "height": 400
        },
        "tags": ["vehicle", "car", "sedan"],
        "description": "Blue sedan parked on street"
      }
    ]
  },
  {
    "url": "https://example.com/image2.jpg",
    "annotations": [
      {
        "bbox": {
          "x": 50,
          "y": 100,
          "width": 200,
          "height": 300
        },
        "tags": ["person", "pedestrian"],
        "description": "Person crossing street"
      }
    ]
  }
]
```

#### 4. Upload Import

**Endpoint:** `POST /api/imports/upload`

**Request:**
```http
Content-Type: multipart/form-data

------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="annotations.json"
Content-Type: application/json

[{"url": "...", "annotations": [...]}]
------WebKitFormBoundary--
```

**Response (Success):**
```json
{
  "imported": 25,
  "failed": 2,
  "errors": [
    {
      "url": "https://example.com/broken.jpg",
      "error": "Image URL not accessible"
    },
    {
      "url": "https://example.com/invalid.jpg",
      "error": "Invalid annotation format: missing bbox"
    }
  ],
  "message": "Import completed with 25 successful and 2 failed items"
}
```

### Health Check Endpoint

#### 5. Health Check

**Endpoint:** `GET /api/health`

**Response (Healthy):**
```json
{
  "status": "healthy",
  "database": true,
  "ml_available": true,
  "version": "1.0.0",
  "timestamp": "2024-01-15T12:00:00Z"
}
```

**Response (Degraded):**
```json
{
  "status": "degraded",
  "database": true,
  "ml_available": false,
  "version": "1.0.0",
  "timestamp": "2024-01-15T12:00:00Z",
  "errors": [
    "ML service unreachable"
  ]
}
```

## Error Responses

### GraphQL Errors

GraphQL errors follow the standard format:

```json
{
  "errors": [
    {
      "message": "Image not found",
      "extensions": {
        "code": "NOT_FOUND",
        "id": "507f1f77bcf86cd799439011"
      },
      "path": ["image"],
      "locations": [
        {
          "line": 2,
          "column": 3
        }
      ]
    }
  ],
  "data": null
}
```

### Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `NOT_FOUND` | Resource not found | 404 |
| `VALIDATION_ERROR` | Input validation failed | 400 |
| `DUPLICATE_URL` | Image URL already exists | 409 |
| `NETWORK_ERROR` | External service unreachable | 503 |
| `ML_TIMEOUT` | ML processing timeout | 504 |
| `VERSION_CONFLICT` | Concurrent modification detected | 409 |
| `MAX_VERSIONS_EXCEEDED` | Version limit reached | 400 |
| `INVALID_TAG_DEPTH` | Tag hierarchy too deep (>64) | 400 |
| `EXPORT_FAILED` | Export generation failed | 500 |
| `IMPORT_INVALID_FORMAT` | Import file format invalid | 400 |

### REST API Error Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid bounding box coordinates",
    "details": {
      "field": "bbox.x",
      "value": -100,
      "constraint": "Must be non-negative"
    }
  },
  "timestamp": "2024-01-15T12:00:00Z",
  "path": "/api/ml/pre-annotate"
}
```

## Rate Limiting

Currently no rate limiting is implemented as the system is designed for VPN deployment with single/small team usage.

Future considerations:
- GraphQL query complexity limiting
- REST endpoint rate limiting per IP
- Export size limitations

## WebSocket Support (Future)

Placeholder for future real-time features:

```graphql
subscription AnnotationUpdates($imageId: ID!) {
  annotationUpdated(imageId: $imageId) {
    id
    bbox {
      x
      y
      width
      height
    }
    tags
    description
    updatedAt
  }
}
```

## SDK Examples

### JavaScript/TypeScript (Frontend)

```typescript
// Using URQL client
import { Client, cacheExchange, fetchExchange } from 'urql';

const client = new Client({
  url: 'http://localhost:8000/graphql',
  exchanges: [cacheExchange, fetchExchange],
});

// Query example
const GET_IMAGES = `
  query GetImages($status: ImageStatus) {
    images(status: $status, limit: 20) {
      total
      items {
        id
        url
        status
      }
    }
  }
`;

const result = await client.query(GET_IMAGES, { status: 'NEW' }).toPromise();

// Mutation example
const SAVE_ANNOTATIONS = `
  mutation SaveAnnotations($imageId: ID!, $changes: [AnnotationChangeInput!]!) {
    saveAnnotations(imageId: $imageId, changes: $changes, source: MANUAL) {
      version
    }
  }
`;

const result = await client.mutation(SAVE_ANNOTATIONS, {
  imageId: '507f1f77bcf86cd799439011',
  changes: [/* ... */]
}).toPromise();
```

### Python (Backend Testing)

```python
import requests
import json

# GraphQL request
url = "http://localhost:8000/graphql"
query = """
  query GetImage($id: ID!) {
    image(id: $id) {
      id
      url
      status
    }
  }
"""

response = requests.post(
    url,
    json={
        "query": query,
        "variables": {"id": "507f1f77bcf86cd799439011"}
    }
)

data = response.json()

# REST request for ML
ml_response = requests.post(
    "http://localhost:8000/api/ml/pre-annotate",
    json={
        "image_url": "https://example.com/image.jpg",
        "model_endpoint": "http://ml-server:5000/detect",
        "job_id": "test_job_001"
    }
)
```

### cURL Examples

```bash
# GraphQL query
curl -X POST http://localhost:8000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { images(status: NEW, limit: 5) { total items { id url } } }"
  }'

# REST ML request
curl -X POST http://localhost:8000/api/ml/pre-annotate \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/image.jpg",
    "model_endpoint": "http://ml-server:5000/detect",
    "job_id": "job_001"
  }'

# Health check
curl http://localhost:8000/api/health

# Download export
curl -O http://localhost:8000/api/exports/export_20240115_123000/download
```

## API Versioning

Current version: **v1** (unversioned in URL)

Future versioning strategy:
- GraphQL: Schema evolution with deprecation fields
- REST: URL versioning (`/api/v2/...`)

## Performance Considerations

### Query Optimization Tips

1. **Use field selection** - Only request fields you need
2. **Implement pagination** - Use limit/offset for large datasets
3. **Batch operations** - Save multiple annotation changes in one mutation
4. **Cache tag hierarchy** - It changes infrequently
5. **Prefetch adjacent images** - For smooth navigation

### Response Time Targets

| Operation | Target Time |
|-----------|------------|
| Simple query | < 100ms |
| Complex query | < 500ms |
| Annotation save | < 500ms |
| Export generation | < 5s for 1000 images |
| ML pre-annotation | 30s - 5min (depends on model) |

## Security Notes

### Current Implementation (v1)
- No authentication required (VPN-only deployment)
- Input validation on all endpoints
- SQL injection prevention via parameterized queries
- XSS prevention in responses
- CORS configured for known origins only

### Future Enhancements
- JWT authentication
- API key management
- Rate limiting
- Request signing for ML endpoints
- Audit logging
