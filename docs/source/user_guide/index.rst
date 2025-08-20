============
User Guide
============

Guide for using SATIn's image annotation features.

.. toctree::
   :maxdepth: 2
   :caption: Getting Started

   installation
   quickstart

.. toctree::
   :maxdepth: 2
   :caption: Core Features

   projects
   annotations
   tasks
   export

What is SATIn?
===============

SATIn (Simple Annotation Tool for Images) is a web-based tool for creating image annotation datasets.

**Key Features:**

- Responsive web interface
- Bounding box annotation tools
- Project organization and management
- Export to COCO, YOLO, Pascal VOC formats
- Task-based workflow
- Quality review system

Quick Navigation
================

- :doc:`installation` - Setup instructions
- :doc:`quickstart` - Create first project
- :doc:`projects` - Project management
- :doc:`annotations` - Annotation tools
- :doc:`tasks` - Task workflow
- :doc:`export` - Export annotations

Typical Workflow
================

1. Install SATIn on your system
2. Create new annotation project
3. Upload images to project
4. Create annotation tasks
5. Annotate images with bounding boxes
6. Review and validate annotations
7. Export annotated dataset

Best Practices
==============

**Project Organization**
- Use descriptive project names and detailed descriptions
- Establish clear labeling guidelines before starting annotation
- Keep related annotation tasks within the same project

**Image Management**
- Upload high-quality images with consistent dimensions when possible
- Use descriptive filenames for easy identification
- Consider image privacy and security requirements

**Annotation Quality**
- Be consistent with bounding box placement and sizing
- Use clear, standardized label names across your team
- Review and validate annotations regularly

**Team Collaboration**
- Define annotation standards and share them with your team
- Use the task assignment system to distribute work efficiently
- Implement regular quality review sessions

System Requirements
===================

**Minimum Requirements:**
- Web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Internet connection for web-based deployment
- JavaScript enabled

**Recommended Specifications:**
- 8GB+ RAM for handling large images
- SSD storage for faster image loading
- High-resolution monitor for precise annotation work
- Graphics card acceleration (optional, improves canvas performance)

**Server Requirements (for deployment):**
- Python 3.13+
- MongoDB 4.4+
- Node.js 18+ (for frontend development)
- 4GB+ RAM
- Sufficient storage for image uploads

Additional Resources
====================

**Community & Support**
- GitHub Repository: https://github.com/your-org/satin
- Issue Tracker: Report bugs and request features
- Discussions: Community Q&A and tips

**Related Tools**
- Label Studio: Alternative annotation tool
- CVAT: Computer Vision Annotation Tool
- VGG Image Annotator: Web-based annotation tool

**Learning Resources**
- Computer Vision Datasets
- Annotation Best Practices
- Machine Learning Tutorials

Getting Help
============

If you need assistance with SATIn:

1. **Check this Documentation** - Most questions are answered here
2. **Search Issues** - Check if your question has been asked before
3. **Create an Issue** - Report bugs or request new features
4. **Community Discussions** - Ask questions and share experiences

.. tip::
   When reporting issues, please include:
   - Your browser version and operating system
   - Steps to reproduce the problem
   - Screenshots (if applicable)
   - Error messages from the browser console

What's Next?
============

Ready to get started? Here's what to do next:

1. Follow the :doc:`installation` guide to set up SATIn
2. Work through the :doc:`quickstart` tutorial to create your first project
3. Explore the detailed guides for :doc:`projects`, :doc:`annotations`, and :doc:`tasks`
4. Learn about :doc:`export` options for your completed datasets

.. note::
   This user guide covers the current stable version of SATIn. Features marked
   as "planned" or "coming soon" are under development and will be available
   in future releases.
