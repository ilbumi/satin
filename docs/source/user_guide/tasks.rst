Task Management
===============

Tasks in SATIn help organize annotation work by connecting specific images to projects and tracking annotation progress. This system enables efficient workflow management and team collaboration.

Understanding Tasks
-------------------

**What are Tasks?**

A task represents a single annotation assignment that connects:

* **Image**: The specific image to be annotated
* **Project**: The project this work belongs to
* **Annotations**: All bounding boxes and labels for this image
* **Status**: Current progress state
* **Metadata**: Creation date and other tracking information

**Task Components**

Each task contains:

* **Unique ID**: System-generated identifier
* **Image Reference**: Link to the source image
* **Project Assignment**: Which project this task belongs to
* **Bounding Box List**: All annotations created for this image
* **Status Tracking**: Current workflow state
* **Timestamps**: When created and last modified

Task Status Workflow
--------------------

Tasks progress through three main states:

**Draft Status**
* Initial state when a task is created
* Annotation work is in progress
* Changes can be made freely
* Not ready for review

**Finished Status**
* Annotation work is complete
* Ready for quality review
* Should not be modified without reason
* Awaiting review approval

**Reviewed Status**
* Quality review has been completed
* Annotations are approved and final
* Task is considered complete
* Becomes part of the final dataset

**Status Transitions**

Typical workflow progression:
``Draft → Finished → Reviewed``

.. note::
   Only move tasks to "Finished" when you're confident the annotations are complete and accurate.

Creating Tasks
--------------

**Automatic Task Creation**

Tasks are automatically created when:

1. You upload images to a project
2. You start annotating an image
3. The system creates a task linking the image to the project

**Manual Task Management**

While tasks are typically created automatically, you can:

* View all tasks in a project
* Filter tasks by status
* Search for specific tasks
* Monitor task progress

Working with Tasks
------------------

**Accessing Tasks**

1. **From Project View**

   * Navigate to your project
   * View the task list or dashboard
   * Click on any task to start annotation

2. **From Image Annotation**

   * Open any image for annotation
   * The associated task is automatically loaded
   * Your work is saved to the task

3. **Task Dashboard**

   * View all tasks across projects
   * Filter by status, project, or date
   * Monitor overall progress

**Task Information Display**

When working with tasks, you'll see:

* **Task ID**: For reference and API access
* **Image Preview**: Thumbnail of the image
* **Project Name**: Which project this belongs to
* **Status Badge**: Current workflow state
* **Progress Indicator**: Annotation completion
* **Last Modified**: When work was last saved

Managing Task Status
--------------------

**Marking Tasks as Finished**

When your annotation work is complete:

1. Review all annotations for accuracy
2. Ensure all required objects are annotated
3. Check labels and tags are correct
4. Mark the task as "Finished"

**Quality Review Process**

For tasks in "Finished" status:

1. **Reviewer Access**: Designated reviewers examine the work
2. **Quality Check**: Annotations are evaluated for accuracy
3. **Feedback**: Comments or corrections may be provided
4. **Approval**: Task moves to "Reviewed" status when approved

**Handling Revisions**

If revisions are needed:

1. Task may be moved back to "Draft" status
2. Address reviewer feedback
3. Make necessary corrections
4. Re-submit as "Finished" when complete

Task Organization and Filtering
-------------------------------

**Viewing Options**

* **List View**: Detailed task information in table format
* **Grid View**: Visual thumbnails with status indicators
* **Calendar View**: Tasks organized by creation or due dates

**Filtering Tasks**

Filter your task list by:

* **Status**: Draft, Finished, or Reviewed
* **Project**: Show tasks from specific projects
* **Date Range**: Tasks created or modified within a timeframe
* **Assignee**: Tasks assigned to specific team members

**Search Functionality**

Search for tasks using:

* Task ID numbers
* Image names or filenames
* Project names
* Annotation labels or text

Team Collaboration with Tasks
-----------------------------

**Task Assignment**

For team projects:

* **Individual Assignment**: Specific tasks assigned to team members
* **Pool Assignment**: Tasks available for anyone to claim
* **Load Balancing**: Even distribution of work across the team

**Progress Monitoring**

Track team progress through:

* **Task Completion Rates**: How many tasks finished per day/week
* **Quality Metrics**: Review approval rates
* **Individual Performance**: Progress by team member
* **Project Timeline**: Overall project completion estimates

**Communication**

* **Task Comments**: Leave notes or feedback on specific tasks
* **Status Updates**: Automatic notifications on status changes
* **Review Feedback**: Structured feedback from quality reviewers

Task Batch Operations
---------------------

**Bulk Status Changes**

Efficiently manage multiple tasks:

1. Select multiple tasks using checkboxes
2. Choose "Change Status" from batch actions
3. Update all selected tasks simultaneously

**Mass Assignment**

For team coordination:

1. Select unassigned tasks
2. Assign to team members in batches
3. Set due dates or priorities

**Export Operations**

* Export task lists for external tracking
* Generate progress reports
* Create work assignment documents

Best Practices for Task Management
----------------------------------

**Personal Workflow**

* **Consistent Status Updates**: Keep status current as you work
* **Regular Saving**: Don't rely on auto-save alone
* **Quality Self-Review**: Check your work before marking "Finished"

**Team Coordination**

* **Clear Assignment**: Make sure everyone knows their tasks
* **Status Transparency**: Keep status updated for team visibility
* **Communication**: Use comments for questions or issues

**Project Management**

* **Progress Monitoring**: Regularly check completion rates
* **Quality Standards**: Maintain consistent review criteria
* **Timeline Management**: Track progress against project deadlines

Advanced Task Features
----------------------

**Task Dependencies**

Some workflows may require:

* **Sequential Tasks**: Some tasks must be completed before others
* **Review Dependencies**: Tasks requiring specific reviewer approval
* **Project Milestones**: Groups of tasks that represent project phases

**Custom Task Properties**

Depending on configuration:

* **Priority Levels**: High, medium, low priority assignments
* **Difficulty Ratings**: Complex vs. simple annotation tasks
* **Estimated Time**: How long tasks are expected to take

**Integration Features**

* **API Access**: Programmatic task management
* **External Tools**: Integration with project management systems
* **Reporting**: Automated progress and quality reports

Troubleshooting Task Issues
---------------------------

**Status Problems**

* **Can't Change Status**: Check permissions and task state rules
* **Status Reverted**: May indicate automatic quality checks failed
* **Missing Tasks**: Verify project assignment and filters

**Performance Issues**

* **Slow Task Loading**: Large projects may take time to display
* **Search Problems**: Try more specific search terms
* **Filter Issues**: Clear filters and try again

**Data Consistency**

* **Annotation Loss**: Tasks preserve annotation data automatically
* **Duplicate Tasks**: Contact system administrator
* **Missing Assignments**: Check project membership and permissions

Related Topics
--------------

* :doc:`projects` - Managing annotation projects
* :doc:`annotations` - Detailed annotation workflow
* :doc:`export` - Exporting task data and annotations
* :doc:`../api_reference/index` - API access for task management
