================
GraphQL Schema
================

Complete GraphQL schema documentation for the SATIn API.

.. contents:: Table of Contents
   :depth: 2
   :local:

Queries
=======

Projects
--------

.. code-block:: graphql

   type Query {
     projects(
       filter: String
       limit: Int = 20
       offset: Int = 0
     ): ProjectPage!

     project(id: ID!): Project
   }

**projects**
   Retrieves a paginated list of projects with optional filtering.

   - ``filter`` (String, optional): Filter projects by name or description
   - ``limit`` (Int, optional): Maximum number of projects to return (default: 20)
   - ``offset`` (Int, optional): Number of projects to skip (default: 0)

   Returns: ``ProjectPage!``

**project**
   Retrieves a single project by ID.

   - ``id`` (ID, required): The unique identifier of the project

   Returns: ``Project`` (nullable)

Images
------

.. code-block:: graphql

   type Query {
     images(
       projectId: ID
       filter: String
       limit: Int = 20
       offset: Int = 0
     ): ImagePage!

     image(id: ID!): Image
   }

**images**
   Retrieves a paginated list of images, optionally filtered by project.

   - ``projectId`` (ID, optional): Filter images by project
   - ``filter`` (String, optional): Filter images by filename or metadata
   - ``limit`` (Int, optional): Maximum number of images to return (default: 20)
   - ``offset`` (Int, optional): Number of images to skip (default: 0)

   Returns: ``ImagePage!``

**image**
   Retrieves a single image by ID.

   - ``id`` (ID, required): The unique identifier of the image

   Returns: ``Image`` (nullable)

Tasks
-----

.. code-block:: graphql

   type Query {
     tasks(
       projectId: ID
       status: TaskStatus
       limit: Int = 20
       offset: Int = 0
     ): TaskPage!

     task(id: ID!): Task
   }

**tasks**
   Retrieves a paginated list of tasks with optional filtering.

   - ``projectId`` (ID, optional): Filter tasks by project
   - ``status`` (TaskStatus, optional): Filter tasks by status
   - ``limit`` (Int, optional): Maximum number of tasks to return (default: 20)
   - ``offset`` (Int, optional): Number of tasks to skip (default: 0)

   Returns: ``TaskPage!``

**task**
   Retrieves a single task by ID.

   - ``id`` (ID, required): The unique identifier of the task

   Returns: ``Task`` (nullable)

Mutations
=========

Project Mutations
------------------

.. code-block:: graphql

   type Mutation {
     createProject(input: ProjectInput!): Project!
     updateProject(id: ID!, input: ProjectInput!): Project!
     deleteProject(id: ID!): Boolean!
   }

**createProject**
   Creates a new project.

   - ``input`` (ProjectInput, required): Project creation data

   Returns: ``Project!``

**updateProject**
   Updates an existing project.

   - ``id`` (ID, required): The project ID to update
   - ``input`` (ProjectInput, required): Updated project data

   Returns: ``Project!``

**deleteProject**
   Deletes a project and all associated tasks and annotations.

   - ``id`` (ID, required): The project ID to delete

   Returns: ``Boolean!`` (true if successful)

Image Mutations
---------------

.. code-block:: graphql

   type Mutation {
     uploadImage(file: Upload!, projectId: ID!): Image!
     addImageByUrl(url: String!, projectId: ID!): Image!
     deleteImage(id: ID!): Boolean!
   }

**uploadImage**
   Uploads a new image file to a project.

   - ``file`` (Upload, required): The image file to upload
   - ``projectId`` (ID, required): The project to add the image to

   Returns: ``Image!``

**addImageByUrl**
   Adds an image by URL to a project.

   - ``url`` (String, required): The URL of the image
   - ``projectId`` (ID, required): The project to add the image to

   Returns: ``Image!``

**deleteImage**
   Deletes an image and all associated tasks.

   - ``id`` (ID, required): The image ID to delete

   Returns: ``Boolean!`` (true if successful)

Task Mutations
--------------

.. code-block:: graphql

   type Mutation {
     createTask(input: TaskInput!): Task!
     updateTask(id: ID!, input: TaskInput!): Task!
     updateTaskAnnotations(taskId: ID!, annotations: [BoundingBoxInput!]!): Task!
     deleteTask(id: ID!): Boolean!
   }

**createTask**
   Creates a new annotation task.

   - ``input`` (TaskInput, required): Task creation data

   Returns: ``Task!``

**updateTask**
   Updates task metadata (name, description, status).

   - ``id`` (ID, required): The task ID to update
   - ``input`` (TaskInput, required): Updated task data

   Returns: ``Task!``

**updateTaskAnnotations**
   Updates all annotations for a task (replaces existing annotations).

   - ``taskId`` (ID, required): The task ID to update
   - ``annotations`` (BoundingBoxInput[], required): New annotations data

   Returns: ``Task!``

**deleteTask**
   Deletes a task and all its annotations.

   - ``id`` (ID, required): The task ID to delete

   Returns: ``Boolean!`` (true if successful)

Types
=====

Project
-------

.. code-block:: graphql

   type Project {
     id: ID!
     name: String!
     description: String
     createdAt: DateTime!
     updatedAt: DateTime!
     imageCount: Int!
     taskCount: Int!
     completedTaskCount: Int!
     images: [Image!]!
     tasks: [Task!]!
   }

**Fields:**

- ``id``: Unique identifier for the project
- ``name``: Project name (required)
- ``description``: Optional project description
- ``createdAt``: Project creation timestamp
- ``updatedAt``: Last modification timestamp
- ``imageCount``: Total number of images in the project
- ``taskCount``: Total number of tasks in the project
- ``completedTaskCount``: Number of completed tasks
- ``images``: List of images in the project
- ``tasks``: List of tasks in the project

Image
-----

.. code-block:: graphql

   type Image {
     id: ID!
     filename: String!
     url: String!
     width: Int
     height: Int
     fileSize: Int
     projectId: ID!
     project: Project!
     createdAt: DateTime!
     tasks: [Task!]!
   }

**Fields:**

- ``id``: Unique identifier for the image
- ``filename``: Original filename of the image
- ``url``: URL where the image can be accessed
- ``width``: Image width in pixels (if available)
- ``height``: Image height in pixels (if available)
- ``fileSize``: File size in bytes (if available)
- ``projectId``: ID of the parent project
- ``project``: The parent project object
- ``createdAt``: Upload timestamp
- ``tasks``: List of annotation tasks for this image

Task
----

.. code-block:: graphql

   type Task {
     id: ID!
     name: String!
     description: String
     status: TaskStatus!
     imageId: ID!
     image: Image!
     projectId: ID!
     project: Project!
     annotations: [BoundingBox!]!
     annotationCount: Int!
     createdAt: DateTime!
     updatedAt: DateTime!
   }

**Fields:**

- ``id``: Unique identifier for the task
- ``name``: Task name (required)
- ``description``: Optional task description
- ``status``: Current task status (enum)
- ``imageId``: ID of the associated image
- ``image``: The associated image object
- ``projectId``: ID of the parent project
- ``project``: The parent project object
- ``annotations``: List of bounding box annotations
- ``annotationCount``: Total number of annotations
- ``createdAt``: Task creation timestamp
- ``updatedAt``: Last modification timestamp

BoundingBox
-----------

.. code-block:: graphql

   type BoundingBox {
     id: ID!
     x: Float!
     y: Float!
     width: Float!
     height: Float!
     label: String
     description: String
     confidence: Float
     metadata: JSON
   }

**Fields:**

- ``id``: Unique identifier for the annotation
- ``x``: X coordinate of the top-left corner (0.0-1.0, relative to image)
- ``y``: Y coordinate of the top-left corner (0.0-1.0, relative to image)
- ``width``: Width of the bounding box (0.0-1.0, relative to image)
- ``height``: Height of the bounding box (0.0-1.0, relative to image)
- ``label``: Optional text label for the annotation
- ``description``: Optional description or notes
- ``confidence``: Optional confidence score (0.0-1.0)
- ``metadata``: Optional JSON metadata

Input Types
===========

ProjectInput
------------

.. code-block:: graphql

   input ProjectInput {
     name: String!
     description: String
   }

**Fields:**

- ``name`` (required): Project name
- ``description`` (optional): Project description

TaskInput
---------

.. code-block:: graphql

   input TaskInput {
     name: String!
     description: String
     status: TaskStatus
     imageId: ID!
     projectId: ID!
   }

**Fields:**

- ``name`` (required): Task name
- ``description`` (optional): Task description
- ``status`` (optional): Task status (defaults to PENDING)
- ``imageId`` (required): Associated image ID
- ``projectId`` (required): Parent project ID

BoundingBoxInput
----------------

.. code-block:: graphql

   input BoundingBoxInput {
     id: ID
     x: Float!
     y: Float!
     width: Float!
     height: Float!
     label: String
     description: String
     confidence: Float
     metadata: JSON
   }

**Fields:**

- ``id`` (optional): Existing annotation ID (for updates)
- ``x`` (required): X coordinate (0.0-1.0, relative to image)
- ``y`` (required): Y coordinate (0.0-1.0, relative to image)
- ``width`` (required): Width (0.0-1.0, relative to image)
- ``height`` (required): Height (0.0-1.0, relative to image)
- ``label`` (optional): Text label
- ``description`` (optional): Description or notes
- ``confidence`` (optional): Confidence score (0.0-1.0)
- ``metadata`` (optional): JSON metadata

Enums
=====

TaskStatus
----------

.. code-block:: graphql

   enum TaskStatus {
     PENDING
     IN_PROGRESS
     COMPLETED
     REVIEWED
   }

**Values:**

- ``PENDING``: Task has been created but work has not started
- ``IN_PROGRESS``: Task is currently being worked on
- ``COMPLETED``: Task has been finished but may need review
- ``REVIEWED``: Task has been completed and reviewed/approved

Pagination Types
================

All list queries return paginated results with the following structure:

ProjectPage
-----------

.. code-block:: graphql

   type ProjectPage {
     objects: [Project!]!
     totalCount: Int!
     hasMore: Boolean!
   }

ImagePage
---------

.. code-block:: graphql

   type ImagePage {
     objects: [Image!]!
     totalCount: Int!
     hasMore: Boolean!
   }

TaskPage
--------

.. code-block:: graphql

   type TaskPage {
     objects: [Task!]!
     totalCount: Int!
     hasMore: Boolean!
   }

**Common Fields:**

- ``objects``: Array of objects for the current page
- ``totalCount``: Total number of objects available
- ``hasMore``: Whether more results are available

Scalar Types
============

Custom scalar types used in the schema:

DateTime
--------
ISO 8601 formatted datetime string (e.g., "2023-12-01T10:30:00Z")

Upload
------
File upload scalar for handling multipart form data

JSON
----
Arbitrary JSON data for flexible metadata storage
