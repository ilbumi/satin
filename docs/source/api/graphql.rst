GraphQL API Reference
=====================

SATIn provides a complete GraphQL API for all data operations. This reference covers the schema, queries, mutations, and usage examples.

## GraphQL Endpoint

**URL**: ``/graphql``
**Methods**: ``POST`` (for operations), ``GET`` (for GraphQL Playground in development)
**Content-Type**: ``application/json``

**GraphQL Playground**: Available at ``http://localhost:8000/graphql`` in development mode

## Schema Overview

The SATIn GraphQL schema is built with Strawberry GraphQL and provides type-safe operations for:

- **Projects**: Managing annotation projects
- **Images**: Image metadata and references
- **Tasks**: Annotation assignments linking images to projects
- **Annotations**: Bounding box annotations with labels and tags

## Root Operations

### Query

The root Query type provides read-only operations:

.. code-block:: graphql

   type Query {
     projects(limit: Int, offset: Int, queryInput: QueryInput): [Project!]!
     project(id: ID!): Project

     images(limit: Int, offset: Int, queryInput: QueryInput): [Image!]!
     image(id: ID!): Image

     tasks(limit: Int, offset: Int, queryInput: QueryInput): [Task!]!
     task(id: ID!): Task
   }

### Mutation

The root Mutation type provides write operations:

.. code-block:: graphql

   type Mutation {
     createProject(input: ProjectInput!): Project!
     updateProject(id: ID!, input: ProjectInput!): Project!
     deleteProject(id: ID!): Boolean!

     createImage(input: ImageInput!): Image!
     updateImage(id: ID!, input: ImageInput!): Image!
     deleteImage(id: ID!): Boolean!

     createTask(input: TaskInput!): Task!
     updateTask(id: ID!, input: TaskInput!): Task!
     deleteTask(id: ID!): Boolean!
   }

## Core Types

### Project

Represents an annotation project container:

.. code-block:: graphql

   type Project {
     id: ID!
     name: String!
     description: String!
   }

   input ProjectInput {
     name: String!
     description: String!
   }

**Example Usage**:

.. code-block:: graphql

   # Create a new project
   mutation CreateProject {
     createProject(input: {
       name: "Traffic Sign Detection"
       description: "Annotating traffic signs for autonomous driving"
     }) {
       id
       name
       description
     }
   }

### Image

Represents image metadata and file information:

.. code-block:: graphql

   type Image {
     id: ID!
     filename: String!
     width: Int!
     height: Int!
     filePath: String!
   }

   input ImageInput {
     filename: String!
     width: Int!
     height: Int!
     filePath: String!
   }

**Example Usage**:

.. code-block:: graphql

   # Get image details
   query GetImage($id: ID!) {
     image(id: $id) {
       id
       filename
       width
       height
       filePath
     }
   }

### Task

Represents an annotation assignment with status tracking:

.. code-block:: graphql

   type Task {
     id: ID!
     image: Image!
     project: Project!
     bboxes: [BBox!]!
     status: TaskStatus!
     createdAt: DateTime!
   }

   enum TaskStatus {
     DRAFT
     FINISHED
     REVIEWED
   }

   input TaskInput {
     imageId: ID!
     projectId: ID!
     bboxes: [BBoxInput!]!
     status: TaskStatus
   }

**Example Usage**:

.. code-block:: graphql

   # Get tasks for a project
   query GetProjectTasks($projectId: ID!) {
     tasks(queryInput: {
       stringFilters: [{
         field: "project_id"
         operator: EQ
         value: $projectId
       }]
     }) {
       id
       status
       createdAt
       image {
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

### Annotations

Bounding box annotations with labels and tags:

.. code-block:: graphql

   type BBox {
     x: Float!
     y: Float!
     width: Float!
     height: Float!
     annotation: Annotation!
   }

   type Annotation {
     text: String
     tags: [String!]
   }

   input BBoxInput {
     x: Float!
     y: Float!
     width: Float!
     height: Float!
     annotation: AnnotationInput!
   }

   input AnnotationInput {
     text: String
     tags: [String!]
   }

**Example Usage**:

.. code-block:: graphql

   # Update task with new annotations
   mutation UpdateTaskAnnotations($taskId: ID!, $bboxes: [BBoxInput!]!) {
     updateTask(id: $taskId, input: {
       bboxes: $bboxes
     }) {
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

## Filtering and Pagination

### QueryInput

All list queries support filtering, sorting, and pagination:

.. code-block:: graphql

   input QueryInput {
     limit: Int
     offset: Int
     stringFilters: [StringFilterInput!]
     numberFilters: [NumberFilterInput!]
     listFilters: [ListFilterInput!]
     sorts: [SortInput!]
   }

### Filter Types

**String Filters**:

.. code-block:: graphql

   input StringFilterInput {
     field: String!
     operator: StringOperator!
     value: String!
   }

   enum StringOperator {
     EQ          # Equal
     NE          # Not Equal
     CONTAINS    # Contains substring
     STARTS_WITH # Starts with
     ENDS_WITH   # Ends with
     IN          # In list
     NOT_IN      # Not in list
   }

**Number Filters**:

.. code-block:: graphql

   input NumberFilterInput {
     field: String!
     operator: NumberOperator!
     value: Float!
   }

   enum NumberOperator {
     EQ    # Equal
     NE    # Not Equal
     GT    # Greater than
     GTE   # Greater than or equal
     LT    # Less than
     LTE   # Less than or equal
     IN    # In list
     NOT_IN # Not in list
   }

**Sorting**:

.. code-block:: graphql

   input SortInput {
     field: String!
     direction: SortDirection!
   }

   enum SortDirection {
     ASC   # Ascending
     DESC  # Descending
   }

### Filter Examples

**Filter projects by name**:

.. code-block:: graphql

   query FilterProjectsByName {
     projects(queryInput: {
       stringFilters: [{
         field: "name"
         operator: CONTAINS
         value: "traffic"
       }]
     }) {
       id
       name
       description
     }
   }

**Get recent tasks with pagination**:

.. code-block:: graphql

   query GetRecentTasks {
     tasks(queryInput: {
       sorts: [{
         field: "created_at"
         direction: DESC
       }]
       limit: 10
       offset: 0
     }) {
       id
       createdAt
       status
       project {
         name
       }
       image {
         filename
       }
     }
   }

**Filter tasks by status**:

.. code-block:: graphql

   query GetFinishedTasks {
     tasks(queryInput: {
       stringFilters: [{
         field: "status"
         operator: EQ
         value: "FINISHED"
       }]
     }) {
       id
       status
       project {
         name
       }
       image {
         filename
       }
     }
   }

## Common Operations

### Project Management

**List all projects**:

.. code-block:: graphql

   query GetAllProjects {
     projects {
       id
       name
       description
     }
   }

**Create project**:

.. code-block:: graphql

   mutation CreateProject($input: ProjectInput!) {
     createProject(input: $input) {
       id
       name
       description
     }
   }

   # Variables:
   {
     "input": {
       "name": "New Annotation Project",
       "description": "Description of the project goals"
     }
   }

**Update project**:

.. code-block:: graphql

   mutation UpdateProject($id: ID!, $input: ProjectInput!) {
     updateProject(id: $id, input: $input) {
       id
       name
       description
     }
   }

**Delete project**:

.. code-block:: graphql

   mutation DeleteProject($id: ID!) {
     deleteProject(id: $id)
   }

### Image Operations

**Add image to system**:

.. code-block:: graphql

   mutation CreateImage($input: ImageInput!) {
     createImage(input: $input) {
       id
       filename
       width
       height
       filePath
     }
   }

   # Variables:
   {
     "input": {
       "filename": "image001.jpg",
       "width": 1920,
       "height": 1080,
       "filePath": "/uploads/images/image001.jpg"
     }
   }

**Get images with metadata**:

.. code-block:: graphql

   query GetImages($limit: Int, $offset: Int) {
     images(limit: $limit, offset: $offset) {
       id
       filename
       width
       height
       filePath
     }
   }

### Task Workflows

**Create annotation task**:

.. code-block:: graphql

   mutation CreateTask($input: TaskInput!) {
     createTask(input: $input) {
       id
       status
       createdAt
       image {
         filename
       }
       project {
         name
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

   # Variables:
   {
     "input": {
       "imageId": "image_123",
       "projectId": "project_456",
       "status": "DRAFT",
       "bboxes": [
         {
           "x": 100,
           "y": 200,
           "width": 150,
           "height": 100,
           "annotation": {
             "text": "car",
             "tags": ["vehicle", "sedan"]
           }
         }
       ]
     }
   }

**Update task status**:

.. code-block:: graphql

   mutation FinishTask($id: ID!) {
     updateTask(id: $id, input: {
       status: FINISHED
     }) {
       id
       status
     }
   }

**Add annotations to task**:

.. code-block:: graphql

   mutation AddAnnotations($taskId: ID!, $bboxes: [BBoxInput!]!) {
     updateTask(id: $taskId, input: {
       bboxes: $bboxes
     }) {
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

### Complex Queries

**Get project with task summary**:

.. code-block:: graphql

   query GetProjectDetails($projectId: ID!) {
     project(id: $projectId) {
       id
       name
       description
     }

     tasks(queryInput: {
       stringFilters: [{
         field: "project_id"
         operator: EQ
         value: $projectId
       }]
     }) {
       id
       status
       createdAt
       image {
         filename
         width
         height
       }
       bboxes {
         annotation {
           text
         }
       }
     }
   }

**Search annotations by label**:

.. code-block:: graphql

   query SearchAnnotations($searchTerm: String!) {
     tasks(queryInput: {
       # Note: This would require custom filtering implementation
       # for searching within nested annotation text
     }) {
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

## Error Handling

### GraphQL Error Format

Errors follow the GraphQL specification:

.. code-block:: json

   {
     "errors": [
       {
         "message": "Project not found",
         "locations": [
           {
             "line": 3,
             "column": 5
           }
         ],
         "path": ["project"],
         "extensions": {
           "code": "NOT_FOUND",
           "exception": {
             "stacktrace": ["..."]
           }
         }
       }
     ],
     "data": null
   }

### Common Error Codes

- **NOT_FOUND**: Requested resource doesn't exist
- **VALIDATION_ERROR**: Input validation failed
- **PERMISSION_DENIED**: Insufficient permissions
- **INTERNAL_ERROR**: Server-side error

### Error Examples

**Resource not found**:

.. code-block:: graphql

   query GetNonexistentProject {
     project(id: "nonexistent_id") {
       id
       name
     }
   }

   # Response:
   {
     "errors": [
       {
         "message": "Project with id 'nonexistent_id' not found",
         "path": ["project"]
       }
     ],
     "data": {
       "project": null
     }
   }

**Validation error**:

.. code-block:: graphql

   mutation CreateInvalidProject {
     createProject(input: {
       name: ""
       description: "Valid description"
     }) {
       id
       name
     }
   }

   # Response:
   {
     "errors": [
       {
         "message": "Project name cannot be empty",
         "path": ["createProject"]
       }
     ]
   }

## Performance Considerations

### Query Optimization

**Use field selection wisely**:

.. code-block:: graphql

   # Good: Only request needed fields
   query GetProjectNames {
     projects {
       id
       name
     }
   }

   # Avoid: Requesting unnecessary nested data
   query GetProjectsWithAllData {
     projects {
       id
       name
       description
       # Avoid requesting related data if not needed
     }
   }

**Use pagination for large datasets**:

.. code-block:: graphql

   query GetTasksPaginated($limit: Int!, $offset: Int!) {
     tasks(queryInput: {
       limit: $limit
       offset: $offset
     }) {
       id
       status
       createdAt
     }
   }

**Filter at the database level**:

.. code-block:: graphql

   # Good: Filter using queryInput
   query GetDraftTasks {
     tasks(queryInput: {
       stringFilters: [{
         field: "status"
         operator: EQ
         value: "DRAFT"
       }]
     }) {
       id
       status
     }
   }

### Caching

The GraphQL API supports caching through:

- **HTTP Caching**: Standard HTTP cache headers
- **Query-level Caching**: Intelligent query result caching
- **Field-level Caching**: Individual field result caching

## Rate Limiting

API endpoints have rate limiting to ensure fair usage:

- **GraphQL Queries**: 1000 requests/hour per client
- **GraphQL Mutations**: 500 requests/hour per client
- **Complex Queries**: Lower limits for resource-intensive operations

## Schema Evolution

### Versioning Strategy

SATIn uses **additive schema evolution**:

- **Adding Fields**: New optional fields can be added
- **Adding Types**: New types don't break existing queries
- **Deprecation**: Old fields marked as deprecated before removal
- **Breaking Changes**: Require major version updates

### Deprecation Example

.. code-block:: graphql

   type Project {
     id: ID!
     name: String!
     description: String!

     # Deprecated field
     oldField: String @deprecated(reason: "Use newField instead")
     newField: String
   }

## Development Tools

### GraphQL Playground

Access the interactive GraphQL Playground at:
``http://localhost:8000/graphql``

Features:
- **Query Explorer**: Browse schema and build queries
- **Auto-completion**: IntelliSense for GraphQL operations
- **Documentation**: Built-in schema documentation
- **History**: Query execution history

### Schema Introspection

Get the complete schema definition:

.. code-block:: graphql

   query IntrospectionQuery {
     __schema {
       types {
         name
         kind
         description
         fields {
           name
           type {
             name
           }
         }
       }
     }
   }

## Related Documentation

- :doc:`backend` - Backend implementation details
- :doc:`frontend` - Frontend GraphQL client usage
- :doc:`../user_guide/index` - User guide for application features
- :doc:`../development/architecture` - System architecture overview
