REST Endpoints Reference
========================

While SATIn primarily uses GraphQL for its API, there are a few REST endpoints for specific use cases like health checks and file uploads.

## Health Check Endpoint

### GET /health

Simple health check endpoint for monitoring and load balancer health checks.

**Request**:

.. code-block:: http

   GET /health HTTP/1.1
   Host: localhost:8000

**Response**:

.. code-block:: http

   HTTP/1.1 200 OK
   Content-Type: application/json

   {
     "status": "healthy"
   }

**Response Codes**:

- ``200 OK``: Service is healthy and operational
- ``503 Service Unavailable``: Service is unhealthy or unavailable

**Usage**:

.. code-block:: bash

   # Basic health check
   curl http://localhost:8000/health

   # With timeout for monitoring
   curl --max-time 5 http://localhost:8000/health

**Monitoring Integration**:

.. code-block:: yaml

   # Docker Compose healthcheck
   healthcheck:
     test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
     interval: 30s
     timeout: 10s
     retries: 3

.. code-block:: javascript

   // JavaScript monitoring
   async function checkServiceHealth() {
     try {
       const response = await fetch('/health', {
         method: 'GET',
         timeout: 5000
       });

       if (response.ok) {
         const data = await response.json();
         return data.status === 'healthy';
       }

       return false;
     } catch (error) {
       console.error('Health check failed:', error);
       return false;
     }
   }

## Static File Serving

### File Upload Endpoints (Future Implementation)

These endpoints are planned for future implementation to handle file uploads and static file serving.

### POST /api/upload/image

Upload image files for annotation.

**Request**:

.. code-block:: http

   POST /api/upload/image HTTP/1.1
   Host: localhost:8000
   Content-Type: multipart/form-data

   --boundary123
   Content-Disposition: form-data; name="file"; filename="image.jpg"
   Content-Type: image/jpeg

   [binary image data]
   --boundary123--

**Response**:

.. code-block:: http

   HTTP/1.1 201 Created
   Content-Type: application/json

   {
     "id": "img_123456789",
     "filename": "image.jpg",
     "width": 1920,
     "height": 1080,
     "fileUrl": "/api/files/img_123456789.jpg",
     "uploadedAt": "2025-01-15T10:30:00Z"
   }

**Error Responses**:

.. code-block:: http

   HTTP/1.1 400 Bad Request
   Content-Type: application/json

   {
     "error": "INVALID_FILE_TYPE",
     "message": "Only JPEG, PNG, and WebP images are supported"
   }

.. code-block:: http

   HTTP/1.1 413 Payload Too Large
   Content-Type: application/json

   {
     "error": "FILE_TOO_LARGE",
     "message": "File size must be less than 50MB"
   }

**JavaScript Usage**:

.. code-block:: javascript

   async function uploadImage(file) {
     const formData = new FormData();
     formData.append('file', file);

     try {
       const response = await fetch('/api/upload/image', {
         method: 'POST',
         body: formData
       });

       if (!response.ok) {
         const error = await response.json();
         throw new Error(error.message);
       }

       return await response.json();
     } catch (error) {
       console.error('Upload failed:', error);
       throw error;
     }
   }

   // Usage
   const fileInput = document.getElementById('imageInput');
   fileInput.addEventListener('change', async (event) => {
     const file = event.target.files[0];
     if (file) {
       const result = await uploadImage(file);
       console.log('Uploaded:', result);
     }
   });

### GET /api/files/{fileId}

Serve uploaded image files.

**Request**:

.. code-block:: http

   GET /api/files/img_123456789.jpg HTTP/1.1
   Host: localhost:8000

**Response**:

.. code-block:: http

   HTTP/1.1 200 OK
   Content-Type: image/jpeg
   Content-Length: 245760
   Cache-Control: public, max-age=31536000
   ETag: "abc123def456"

   [binary image data]

**Error Responses**:

.. code-block:: http

   HTTP/1.1 404 Not Found
   Content-Type: application/json

   {
     "error": "FILE_NOT_FOUND",
     "message": "The requested file could not be found"
   }

## Export Endpoints (Future Implementation)

### POST /api/export/{format}

Export annotation data in various formats.

**Supported Formats**:
- ``coco`` - COCO JSON format
- ``yolo`` - YOLO text format
- ``pascal`` - Pascal VOC XML format
- ``csv`` - Comma-separated values

**Request**:

.. code-block:: http

   POST /api/export/coco HTTP/1.1
   Host: localhost:8000
   Content-Type: application/json

   {
     "projectIds": ["proj_123", "proj_456"],
     "includeImages": true,
     "statusFilter": ["REVIEWED"],
     "dateRange": {
       "start": "2025-01-01T00:00:00Z",
       "end": "2025-01-31T23:59:59Z"
     }
   }

**Response**:

.. code-block:: http

   HTTP/1.1 202 Accepted
   Content-Type: application/json

   {
     "exportId": "export_789",
     "status": "processing",
     "format": "coco",
     "estimatedCompletion": "2025-01-15T10:35:00Z",
     "downloadUrl": null
   }

### GET /api/export/{exportId}/status

Check export job status.

**Response** (Processing):

.. code-block:: http

   HTTP/1.1 200 OK
   Content-Type: application/json

   {
     "exportId": "export_789",
     "status": "processing",
     "progress": 45,
     "estimatedCompletion": "2025-01-15T10:35:00Z"
   }

**Response** (Completed):

.. code-block:: http

   HTTP/1.1 200 OK
   Content-Type: application/json

   {
     "exportId": "export_789",
     "status": "completed",
     "progress": 100,
     "downloadUrl": "/api/export/export_789/download",
     "fileSize": 2458112,
     "completedAt": "2025-01-15T10:34:22Z"
   }

### GET /api/export/{exportId}/download

Download completed export file.

**Response**:

.. code-block:: http

   HTTP/1.1 200 OK
   Content-Type: application/zip
   Content-Disposition: attachment; filename="annotations_export.zip"
   Content-Length: 2458112

   [binary zip data]

## Webhook Endpoints (Future Implementation)

### POST /api/webhooks/{eventType}

Receive webhooks from external services.

**Supported Event Types**:
- ``task_completed`` - Task status changed to completed
- ``project_created`` - New project created
- ``export_finished`` - Export job completed

**Request**:

.. code-block:: http

   POST /api/webhooks/task_completed HTTP/1.1
   Host: localhost:8000
   Content-Type: application/json
   X-Webhook-Signature: sha256=abc123def456

   {
     "event": "task_completed",
     "timestamp": "2025-01-15T10:30:00Z",
     "data": {
       "taskId": "task_123",
       "projectId": "proj_456",
       "previousStatus": "FINISHED",
       "newStatus": "REVIEWED",
       "reviewer": "user_789"
     }
   }

**Response**:

.. code-block:: http

   HTTP/1.1 200 OK
   Content-Type: application/json

   {
     "received": true,
     "processedAt": "2025-01-15T10:30:01Z"
   }

## Error Handling

### Standard Error Response Format

All REST endpoints use consistent error response format:

.. code-block:: json

   {
     "error": "ERROR_CODE",
     "message": "Human readable error message",
     "details": {
       "field": "Additional error context",
       "timestamp": "2025-01-15T10:30:00Z"
     },
     "requestId": "req_123456789"
   }

### Common Error Codes

**Client Errors (4xx)**:

- ``INVALID_REQUEST`` - Malformed request data
- ``VALIDATION_ERROR`` - Request validation failed
- ``FILE_TOO_LARGE`` - Uploaded file exceeds size limit
- ``INVALID_FILE_TYPE`` - Unsupported file format
- ``RATE_LIMIT_EXCEEDED`` - Too many requests
- ``UNAUTHORIZED`` - Authentication required
- ``FORBIDDEN`` - Insufficient permissions
- ``NOT_FOUND`` - Resource not found

**Server Errors (5xx)**:

- ``INTERNAL_ERROR`` - Unexpected server error
- ``DATABASE_ERROR`` - Database operation failed
- ``STORAGE_ERROR`` - File storage operation failed
- ``SERVICE_UNAVAILABLE`` - Service temporarily unavailable

### Error Handling Examples

**Python Error Handling**:

.. code-block:: python

   import requests

   def handle_rest_response(response):
       if response.status_code == 200:
           return response.json()
       elif response.status_code == 400:
           error = response.json()
           raise ValueError(f"Bad Request: {error['message']}")
       elif response.status_code == 404:
           raise FileNotFoundError("Resource not found")
       elif response.status_code >= 500:
           raise ConnectionError("Server error - please try again")
       else:
           response.raise_for_status()

   # Usage
   try:
       response = requests.get("/health")
       data = handle_rest_response(response)
       print(f"Service status: {data['status']}")
   except Exception as error:
       print(f"Health check failed: {error}")

**JavaScript Error Handling**:

.. code-block:: javascript

   class RestClient {
     async request(url, options = {}) {
       try {
         const response = await fetch(url, {
           ...options,
           headers: {
             'Content-Type': 'application/json',
             ...options.headers
           }
         });

         if (!response.ok) {
           const error = await response.json();

           switch (response.status) {
             case 400:
               throw new Error(`Validation Error: ${error.message}`);
             case 401:
               throw new Error('Authentication required');
             case 403:
               throw new Error('Permission denied');
             case 404:
               throw new Error('Resource not found');
             case 413:
               throw new Error('File too large');
             case 429:
               throw new Error('Rate limit exceeded');
             case 500:
               throw new Error('Server error - please try again');
             default:
               throw new Error(error.message || 'Unknown error');
           }
         }

         return await response.json();
       } catch (error) {
         if (error.name === 'TypeError' && error.message.includes('fetch')) {
           throw new Error('Network error - check your connection');
         }
         throw error;
       }
     }

     async checkHealth() {
       return this.request('/health');
     }
   }

## Rate Limiting

REST endpoints have rate limiting applied:

**Rate Limits**:
- ``/health``: 60 requests/minute per IP
- ``/api/upload/*``: 10 requests/minute per user
- ``/api/export/*``: 5 requests/minute per user
- ``/api/files/*``: 100 requests/minute per IP

**Rate Limit Headers**:

.. code-block:: http

   HTTP/1.1 200 OK
   X-RateLimit-Limit: 60
   X-RateLimit-Remaining: 45
   X-RateLimit-Reset: 1705315800

**Rate Limit Exceeded**:

.. code-block:: http

   HTTP/1.1 429 Too Many Requests
   Content-Type: application/json
   Retry-After: 60

   {
     "error": "RATE_LIMIT_EXCEEDED",
     "message": "Rate limit exceeded. Please try again in 60 seconds."
   }

## CORS Configuration

REST endpoints support CORS for browser-based applications:

**CORS Headers**:

.. code-block:: http

   HTTP/1.1 200 OK
   Access-Control-Allow-Origin: http://localhost:5173
   Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
   Access-Control-Allow-Headers: Content-Type, Authorization
   Access-Control-Max-Age: 86400

**Preflight Request**:

.. code-block:: http

   OPTIONS /api/upload/image HTTP/1.1
   Origin: http://localhost:5173
   Access-Control-Request-Method: POST
   Access-Control-Request-Headers: Content-Type

## Authentication (Future Implementation)

When authentication is implemented, REST endpoints will require authentication headers:

**Bearer Token Authentication**:

.. code-block:: http

   GET /api/files/img_123.jpg HTTP/1.1
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

**API Key Authentication**:

.. code-block:: http

   GET /health HTTP/1.1
   X-API-Key: your-api-key-here

## Related Documentation

- :doc:`graphql_api` - Primary GraphQL API documentation
- :doc:`../api/backend` - Backend implementation details
- :doc:`../development/architecture` - System architecture overview
- :doc:`../user_guide/export` - User guide for export functionality
