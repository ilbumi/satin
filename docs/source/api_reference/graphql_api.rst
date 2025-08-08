GraphQL API Guide
=================

This guide provides comprehensive information about using the SATIn GraphQL API for building integrations and custom applications.

## Quick Start

### Making Your First Request

**Basic Query Example**:

.. code-block:: bash

   curl -X POST http://localhost:8000/graphql \
     -H "Content-Type: application/json" \
     -d '{
       "query": "query { projects { id name description } }"
     }'

**Response**:

.. code-block:: json

   {
     "data": {
       "projects": [
         {
           "id": "proj_123",
           "name": "My Annotation Project",
           "description": "Sample project for testing"
         }
       ]
     }
   }

### Using Variables

**Query with Variables**:

.. code-block:: bash

   curl -X POST http://localhost:8000/graphql \
     -H "Content-Type: application/json" \
     -d '{
       "query": "query GetProject($id: ID!) { project(id: $id) { id name description } }",
       "variables": { "id": "proj_123" }
     }'

## Authentication

.. note::
   Authentication is not currently implemented but will be added in future versions.

When authentication is added, you'll need to include authentication headers:

.. code-block:: bash

   curl -X POST http://localhost:8000/graphql \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -d '{"query": "..."}'

## Common Patterns

### Pagination Pattern

**Cursor-based Pagination**:

.. code-block:: graphql

   query GetProjectsPaginated($limit: Int!, $offset: Int!) {
     projects(queryInput: {
       limit: $limit
       offset: $offset
       sorts: [{
         field: "created_at"
         direction: DESC
       }]
     }) {
       id
       name
       description
     }
   }

**Variables**:

.. code-block:: json

   {
     "limit": 20,
     "offset": 0
   }

### Filtering Pattern

**Multiple Filters**:

.. code-block:: graphql

   query FilterTasks($projectId: ID!, $status: String!) {
     tasks(queryInput: {
       stringFilters: [
         {
           field: "project_id"
           operator: EQ
           value: $projectId
         },
         {
           field: "status"
           operator: EQ
           value: $status
         }
       ]
       sorts: [{
         field: "created_at"
         direction: DESC
       }]
     }) {
       id
       status
       createdAt
       image {
         filename
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

### Mutation Pattern

**Error Handling with Mutations**:

.. code-block:: graphql

   mutation CreateProjectSafe($input: ProjectInput!) {
     createProject(input: $input) {
       id
       name
       description
     }
   }

**JavaScript Example with Error Handling**:

.. code-block:: javascript

   async function createProject(name, description) {
     const query = `
       mutation CreateProject($input: ProjectInput!) {
         createProject(input: $input) {
           id
           name
           description
         }
       }
     `;

     const variables = {
       input: { name, description }
     };

     try {
       const response = await fetch('/graphql', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({ query, variables })
       });

       const result = await response.json();

       if (result.errors) {
         console.error('GraphQL Errors:', result.errors);
         return null;
       }

       return result.data.createProject;
     } catch (error) {
       console.error('Network Error:', error);
       return null;
     }
   }

## Integration Examples

### Python Client

**Using `requests` library**:

.. code-block:: python

   import requests
   import json

   class SATInClient:
       def __init__(self, base_url="http://localhost:8000"):
           self.base_url = base_url
           self.graphql_endpoint = f"{base_url}/graphql"

       def execute_query(self, query, variables=None):
           payload = {"query": query}
           if variables:
               payload["variables"] = variables

           response = requests.post(
               self.graphql_endpoint,
               json=payload,
               headers={"Content-Type": "application/json"}
           )

           if response.status_code != 200:
               raise Exception(f"HTTP {response.status_code}: {response.text}")

           result = response.json()

           if "errors" in result:
               raise Exception(f"GraphQL Errors: {result['errors']}")

           return result["data"]

       def get_projects(self, limit=None, offset=0):
           query = """
               query GetProjects($limit: Int, $offset: Int) {
                   projects(queryInput: {
                       limit: $limit
                       offset: $offset
                   }) {
                       id
                       name
                       description
                   }
               }
           """

           variables = {"offset": offset}
           if limit:
               variables["limit"] = limit

           return self.execute_query(query, variables)["projects"]

       def create_project(self, name, description):
           query = """
               mutation CreateProject($input: ProjectInput!) {
                   createProject(input: $input) {
                       id
                       name
                       description
                   }
               }
           """

           variables = {
               "input": {
                   "name": name,
                   "description": description
               }
           }

           return self.execute_query(query, variables)["createProject"]

   # Usage
   client = SATInClient()

   # Get all projects
   projects = client.get_projects(limit=10)
   print(f"Found {len(projects)} projects")

   # Create new project
   new_project = client.create_project(
       "Python API Test",
       "Created via Python client"
   )
   print(f"Created project: {new_project['name']}")

### JavaScript/Node.js Client

**Using `fetch` and async/await**:

.. code-block:: javascript

   class SATInClient {
     constructor(baseUrl = 'http://localhost:8000') {
       this.baseUrl = baseUrl;
       this.graphqlEndpoint = `${baseUrl}/graphql`;
     }

     async executeQuery(query, variables = null) {
       const payload = { query };
       if (variables) {
         payload.variables = variables;
       }

       const response = await fetch(this.graphqlEndpoint, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify(payload)
       });

       if (!response.ok) {
         throw new Error(`HTTP ${response.status}: ${response.statusText}`);
       }

       const result = await response.json();

       if (result.errors) {
         throw new Error(`GraphQL Errors: ${JSON.stringify(result.errors)}`);
       }

       return result.data;
     }

     async getProjects(limit = null, offset = 0) {
       const query = `
         query GetProjects($limit: Int, $offset: Int) {
           projects(queryInput: {
             limit: $limit
             offset: $offset
           }) {
             id
             name
             description
           }
         }
       `;

       const variables = { offset };
       if (limit) variables.limit = limit;

       const data = await this.executeQuery(query, variables);
       return data.projects;
     }

     async createTask(imageId, projectId, bboxes, status = 'DRAFT') {
       const query = `
         mutation CreateTask($input: TaskInput!) {
           createTask(input: $input) {
             id
             status
             createdAt
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

       const variables = {
         input: {
           imageId,
           projectId,
           bboxes,
           status
         }
       };

       const data = await this.executeQuery(query, variables);
       return data.createTask;
     }

     async updateTaskAnnotations(taskId, bboxes) {
       const query = `
         mutation UpdateTask($id: ID!, $input: TaskInput!) {
           updateTask(id: $id, input: $input) {
             id
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

       const variables = {
         id: taskId,
         input: { bboxes }
       };

       const data = await this.executeQuery(query, variables);
       return data.updateTask;
     }
   }

   // Usage
   const client = new SATInClient();

   // Create annotation task
   const task = await client.createTask(
     'image_123',
     'project_456',
     [
       {
         x: 100,
         y: 200,
         width: 150,
         height: 100,
         annotation: {
           text: 'car',
           tags: ['vehicle', 'red']
         }
       }
     ]
   );

   console.log('Created task:', task.id);

## Batch Operations

### Batch Queries

**Multiple Queries in Single Request**:

.. code-block:: graphql

   query BatchOperations($projectId: ID!) {
     project: project(id: $projectId) {
       id
       name
       description
     }

     projectTasks: tasks(queryInput: {
       stringFilters: [{
         field: "project_id"
         operator: EQ
         value: $projectId
       }]
     }) {
       id
       status
       image {
         filename
       }
     }

     allImages: images(queryInput: { limit: 10 }) {
       id
       filename
       width
       height
     }
   }

### Batch Mutations

**Multiple Mutations (Execute Sequentially)**:

.. code-block:: graphql

   mutation BatchCreate($project: ProjectInput!, $image: ImageInput!) {
     newProject: createProject(input: $project) {
       id
       name
     }

     newImage: createImage(input: $image) {
       id
       filename
     }
   }

## Advanced Filtering

### Complex Query Combinations

**Date Range and Status Filtering**:

.. code-block:: graphql

   query AdvancedTaskFilter(
     $projectId: ID!,
     $startDate: DateTime!,
     $endDate: DateTime!
   ) {
     tasks(queryInput: {
       stringFilters: [
         {
           field: "project_id"
           operator: EQ
           value: $projectId
         },
         {
           field: "status"
           operator: IN
           value: "FINISHED,REVIEWED"
         }
       ]
       # Note: Date filtering would require custom implementation
       sorts: [{
         field: "created_at"
         direction: DESC
       }]
       limit: 50
     }) {
       id
       status
       createdAt
       image {
         filename
       }
       bboxes {
         annotation {
           text
           tags
         }
       }
     }
   }

### Search Patterns

**Text Search in Annotations**:

.. code-block:: graphql

   query SearchAnnotations($searchTerm: String!) {
     tasks {
       id
       image {
         filename
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

Note: Full-text search requires additional filtering logic in the application.

## Performance Optimization

### Query Optimization Tips

1. **Select Only Needed Fields**:

.. code-block:: graphql

   # Good: Only request what you need
   query OptimizedProjectList {
     projects {
       id
       name
     }
   }

   # Avoid: Requesting unnecessary data
   query UnoptimizedProjectList {
     projects {
       id
       name
       description  # Only include if needed
     }
   }

2. **Use Proper Pagination**:

.. code-block:: graphql

   # Good: Reasonable page size
   query PaginatedTasks {
     tasks(queryInput: { limit: 20, offset: 0 }) {
       id
       status
     }
   }

   # Avoid: Very large page sizes
   query UnpaginatedTasks {
     tasks(queryInput: { limit: 1000 }) {
       id
       status
     }
   }

3. **Filter at Database Level**:

.. code-block:: graphql

   # Good: Filter using queryInput
   query FilteredTasks($projectId: ID!) {
     tasks(queryInput: {
       stringFilters: [{
         field: "project_id"
         operator: EQ
         value: $projectId
       }]
     }) {
       id
       status
     }
   }

### Caching Strategies

**HTTP Caching Headers**:

.. code-block:: bash

   curl -X POST http://localhost:8000/graphql \
     -H "Content-Type: application/json" \
     -H "Cache-Control: max-age=300" \
     -d '{"query": "..."}'

**Application-Level Caching**:

.. code-block:: javascript

   class CachedSATInClient extends SATInClient {
     constructor(baseUrl) {
       super(baseUrl);
       this.cache = new Map();
       this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
     }

     async executeQuery(query, variables = null) {
       const cacheKey = JSON.stringify({ query, variables });
       const cached = this.cache.get(cacheKey);

       if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
         return cached.data;
       }

       const data = await super.executeQuery(query, variables);

       this.cache.set(cacheKey, {
         data,
         timestamp: Date.now()
       });

       return data;
     }
   }

## Error Handling Best Practices

### Comprehensive Error Handling

.. code-block:: javascript

   async function robustGraphQLRequest(query, variables) {
     try {
       const response = await fetch('/graphql', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({ query, variables })
       });

       // Handle HTTP errors
       if (!response.ok) {
         if (response.status >= 500) {
           throw new Error('Server error - please try again later');
         } else if (response.status === 400) {
           throw new Error('Bad request - check your query syntax');
         } else {
           throw new Error(`HTTP ${response.status}: ${response.statusText}`);
         }
       }

       const result = await response.json();

       // Handle GraphQL errors
       if (result.errors && result.errors.length > 0) {
         const errorMessages = result.errors.map(err => err.message).join(', ');
         throw new Error(`GraphQL Error: ${errorMessages}`);
       }

       return result.data;

     } catch (error) {
       // Handle network errors
       if (error.name === 'TypeError' && error.message.includes('fetch')) {
         throw new Error('Network error - check your connection');
       }

       // Re-throw GraphQL and HTTP errors
       throw error;
     }
   }

### Retry Logic

.. code-block:: javascript

   async function withRetry(operation, maxRetries = 3, delay = 1000) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await operation();
       } catch (error) {
         if (i === maxRetries - 1) throw error;

         // Only retry on network errors or 5xx server errors
         if (error.message.includes('Network error') ||
             error.message.includes('Server error')) {
           await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
         } else {
           throw error; // Don't retry client errors
         }
       }
     }
   }

   // Usage
   const projects = await withRetry(() =>
     client.getProjects(10, 0)
   );

## Monitoring and Debugging

### Query Performance Monitoring

.. code-block:: javascript

   class MonitoredSATInClient extends SATInClient {
     async executeQuery(query, variables = null) {
       const startTime = Date.now();
       const queryName = this.extractQueryName(query);

       try {
         const result = await super.executeQuery(query, variables);
         const duration = Date.now() - startTime;

         console.log(`Query ${queryName} completed in ${duration}ms`);

         // Log slow queries
         if (duration > 1000) {
           console.warn(`Slow query detected: ${queryName} (${duration}ms)`);
         }

         return result;
       } catch (error) {
         const duration = Date.now() - startTime;
         console.error(`Query ${queryName} failed after ${duration}ms:`, error);
         throw error;
       }
     }

     extractQueryName(query) {
       const match = query.match(/(?:query|mutation)\s+(\w+)/);
       return match ? match[1] : 'anonymous';
     }
   }

## Related Documentation

- :doc:`graphql` - Complete GraphQL schema reference
- :doc:`../api/backend` - Backend implementation details
- :doc:`../development/testing` - API testing guidelines
- :doc:`../user_guide/index` - User interface for the API
