Project Management
==================

Projects in SATIn are containers that organize your annotation work. Each project groups related images and tasks together, making it easy to manage large annotation datasets.

Creating a New Project
-----------------------

**Step 1: Navigate to Projects**

1. Open SATIn in your browser
2. Click on "Projects" in the main navigation
3. You'll see a list of existing projects (if any)

**Step 2: Create Project**

1. Click the "New Project" or "Create Project" button
2. Fill in the project details:

   * **Name**: Give your project a descriptive name (e.g., "Traffic Sign Detection", "Medical X-Ray Analysis")
   * **Description**: Add detailed information about the project goals, dataset source, and annotation requirements

3. Click "Create" to save your new project

.. note::
   Project names should be unique and descriptive to help team members understand the project's purpose.

Project Overview
----------------

Once created, each project provides:

**Project Dashboard**
* Total images uploaded
* Annotation progress statistics
* Task completion status
* Recent activity

**Key Project Information**
* **ID**: Unique identifier for API access
* **Name**: Display name for the project
* **Description**: Detailed project information
* **Creation Date**: When the project was created
* **Last Updated**: Most recent activity

Managing Project Settings
-------------------------

**Editing Project Details**

1. Navigate to your project
2. Click "Settings" or "Edit Project"
3. Update the name or description
4. Save changes

**Project Permissions**

Configure who can access and modify your project:

* **Owner**: Full control (you, by default)
* **Collaborators**: Can annotate and view
* **Viewers**: Read-only access

Adding Images to Projects
-------------------------

**Upload Methods**

1. **Single Upload**: Click "Add Image" and select one file
2. **Bulk Upload**: Click "Add Images" and select multiple files
3. **Drag and Drop**: Drag image files directly onto the project page

**Supported Formats**
* JPEG (.jpg, .jpeg)
* PNG (.png)
* TIFF (.tiff, .tif)
* WebP (.webp)

**Upload Guidelines**
* Maximum file size: 50MB per image
* Recommended resolution: 1024x1024 to 4096x4096 pixels
* Use consistent image sizes within a project for better annotation quality

.. tip::
   Organize images with consistent naming conventions before upload to maintain order and traceability.

Project Workflow Management
---------------------------

**Typical Project Lifecycle**

1. **Setup Phase**

   * Create project with clear description
   * Define annotation guidelines and labels
   * Upload initial batch of images

2. **Annotation Phase**

   * Create tasks for systematic annotation
   * Assign tasks to team members
   * Monitor progress through dashboard

3. **Review Phase**

   * Review completed annotations
   * Mark tasks as reviewed
   * Export annotated data

4. **Completion Phase**

   * Final quality checks
   * Export final dataset
   * Archive or close project

Organizing Multiple Projects
----------------------------

**Project Categories**

Consider organizing projects by:

* **Dataset Type**: "Medical Images", "Autonomous Driving", "Retail Products"
* **Client/Department**: "Research Team A", "Production Dataset"
* **Project Phase**: "Pilot Study", "Production Dataset", "Quality Control"

**Naming Conventions**

Use consistent naming patterns:

* Format: ``[Category]_[Purpose]_[Date]``
* Example: ``Medical_XRay_Pneumonia_2025-01``
* Example: ``Retail_ProductDetection_Training_2025-01``

**Project Templates**

For recurring annotation tasks:

1. Create a template project with standard settings
2. Define reusable annotation guidelines
3. Set up common label categories
4. Use as starting point for new projects

Best Practices
--------------

**Project Planning**

* **Define clear objectives**: What will the annotated data be used for?
* **Establish quality standards**: Consistency requirements, review processes
* **Plan annotation guidelines**: Label definitions, edge cases, examples

**Data Management**

* **Backup regularly**: Export annotations periodically
* **Version control**: Keep track of annotation changes
* **Quality assurance**: Regular reviews and consistency checks

**Team Collaboration**

* **Clear communication**: Use project descriptions for guidelines
* **Task assignment**: Distribute work evenly among annotators
* **Progress monitoring**: Regular check-ins on annotation quality and speed

**Performance Optimization**

* **Batch processing**: Upload and annotate images in manageable batches
* **Consistent workflow**: Establish and follow standard annotation procedures
* **Regular exports**: Don't wait until project completion to export data

Troubleshooting Common Issues
-----------------------------

**Upload Problems**

* **Large files**: Compress images or upload smaller batches
* **Format issues**: Ensure images are in supported formats
* **Network timeouts**: Upload during off-peak hours or use smaller batches

**Project Access Issues**

* **Permission denied**: Check project sharing settings
* **Missing projects**: Verify you're logged into the correct account
* **Slow loading**: Clear browser cache or try a different browser

**Data Management**

* **Missing images**: Check upload completion and file formats
* **Annotation loss**: Regular exports prevent data loss
* **Duplicate projects**: Use clear naming conventions to avoid confusion

.. warning::
   Always export your annotations regularly to prevent data loss. Projects should be backed up before making major changes.

Related Topics
--------------

* :doc:`tasks` - Learn about creating and managing annotation tasks
* :doc:`annotations` - Detailed guide to the annotation process
* :doc:`export` - How to export your annotated data
* :doc:`../quickstart` - Quick start guide for new users
