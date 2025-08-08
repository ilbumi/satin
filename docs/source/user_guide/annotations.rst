Annotation Workflow
===================

This guide covers the complete process of annotating images in SATIn, from basic bounding box creation to advanced annotation techniques.

Getting Started with Annotations
---------------------------------

**Opening the Annotation Interface**

1. Navigate to your project
2. Click on any image to open the annotation workspace
3. The interface displays:

   * **Left Panel**: Annotation toolbar with tools and controls
   * **Center**: Image canvas for annotation work
   * **Right Panel**: Annotation list and properties

**Interface Overview**

* **Image Canvas**: The main area where you draw and edit annotations
* **Annotation Toolbar**: Tool selection and image upload controls
* **Annotation Panel**: List of all annotations with editing capabilities
* **Status Indicators**: Current tool, drawing state, and save status

Annotation Tools
----------------

**Select Tool**

The select tool allows you to:

* Click annotations to select and edit them
* View annotation details in the right panel
* Delete unwanted annotations

*Usage*:
1. Click the "Select" tool in the toolbar (default selection)
2. Click any existing annotation to select it
3. Use the annotation panel to edit labels or delete

**Bounding Box Tool**

The primary annotation tool for object detection:

* Draw rectangular bounding boxes around objects
* Automatically creates annotation entries
* Supports labeling and tagging

*Usage*:
1. Click the "Bounding Box" tool in the toolbar
2. Click and drag on the image to create a bounding box
3. Release to complete the annotation
4. Add labels in the annotation panel

.. note::
   Minimum bounding box size is enforced to prevent accidental tiny annotations. Boxes that are too small will not be created.

Creating Bounding Box Annotations
----------------------------------

**Step-by-Step Process**

1. **Select the Bounding Box Tool**

   * Click the bounding box icon in the toolbar
   * The cursor changes to indicate drawing mode
   * Instructions appear in the toolbar area

2. **Draw the Bounding Box**

   * Position cursor at one corner of the object
   * Click and hold the mouse button
   * Drag to the opposite corner of the object
   * Release the mouse button to complete

3. **Add Labels and Tags**

   * The new annotation appears in the right panel
   * Click the text field to add a descriptive label
   * Add tags if needed for categorization

**Bounding Box Guidelines**

* **Tight fitting**: Draw boxes as close to object edges as possible
* **Complete objects**: Include the entire object within the box
* **Avoid partial objects**: Don't annotate cut-off or partially visible objects
* **Consistent methodology**: Use the same approach throughout your dataset

Annotation Properties
---------------------

Each annotation contains:

**Core Properties**

* **Coordinates**: X, Y position and width, height dimensions
* **Text Label**: Descriptive name for the annotated object
* **Tags**: Additional categorization labels (optional)

**Coordinate System**

* **Origin**: Top-left corner of the image (0, 0)
* **X-axis**: Increases from left to right
* **Y-axis**: Increases from top to bottom
* **Units**: Pixels relative to the original image dimensions

**Label Best Practices**

* Use consistent naming conventions
* Be specific but concise (e.g., "red_car" vs "vehicle")
* Define a label taxonomy before starting
* Document edge cases and special situations

Managing Annotations
--------------------

**Editing Existing Annotations**

1. **Select an Annotation**

   * Use the select tool
   * Click the annotation on the canvas
   * Or click the annotation in the right panel

2. **Edit Properties**

   * **Change Label**: Click the text field and modify
   * **Update Tags**: Add or remove tags as needed
   * **Resize Box**: Drag the corners or edges (if supported)

3. **Save Changes**

   * Changes are automatically saved as you type
   * Visual feedback indicates save status

**Deleting Annotations**

1. Select the annotation to delete
2. Click the delete button (trash icon) in the annotation panel
3. Confirm deletion if prompted
4. The annotation is immediately removed

.. warning::
   Deleted annotations cannot be recovered. Export your work regularly to prevent data loss.

**Bulk Operations**

* **Select All**: Use keyboard shortcuts to select multiple annotations
* **Batch Delete**: Remove multiple annotations simultaneously
* **Batch Edit**: Apply labels or tags to multiple annotations

Advanced Annotation Techniques
-------------------------------

**Precision Annotation**

* **Zoom In**: Use browser zoom for detailed work on small objects
* **Grid Lines**: Enable grid overlay for alignment (if available)
* **Snap to Edges**: Use image features as guides for box alignment

**Quality Control**

* **Consistency Checks**: Regularly review your annotations for consistency
* **Cross-validation**: Have others review your work
* **Documentation**: Keep notes on difficult cases or edge cases

**Efficient Workflows**

* **Keyboard Shortcuts**: Learn shortcuts for faster annotation
* **Batch Processing**: Annotate similar objects in sequence
* **Progressive Refinement**: Do quick passes, then detail work

Working with Different Object Types
------------------------------------

**Small Objects**

* Zoom in for better precision
* Ensure minimum visibility requirements are met
* Consider whether very small objects should be annotated

**Overlapping Objects**

* Annotate the most prominent/complete object first
* Use separate boxes for each distinct object
* Be consistent with occlusion handling rules

**Complex Shapes**

* Bounding boxes capture the full extent of irregular objects
* Document any special handling rules
* Consider if the object fits your annotation requirements

**Multiple Object Classes**

* Use clear, distinct labels for different object types
* Maintain consistent labeling across the entire dataset
* Document your taxonomy and edge case decisions

Annotation Quality Guidelines
-----------------------------

**Accuracy Standards**

* **Boundary Precision**: Boxes should tightly bound objects
* **Label Accuracy**: Labels must correctly describe objects
* **Completeness**: All target objects should be annotated

**Consistency Requirements**

* **Same Objects, Same Labels**: Identical objects get identical labels
* **Boundary Consistency**: Similar annotation approaches for similar objects
* **Rule Application**: Consistent handling of edge cases

**Review Process**

1. **Self Review**: Check your own work before marking complete
2. **Peer Review**: Have colleagues review annotations
3. **Quality Metrics**: Track accuracy and consistency over time

Troubleshooting Annotation Issues
----------------------------------

**Canvas Problems**

* **Can't Draw**: Ensure bounding box tool is selected
* **Annotations Not Appearing**: Check if you're in the correct tool mode
* **Canvas Not Responsive**: Refresh the page or check browser compatibility

**Annotation Errors**

* **Box Too Small**: Increase the box size above minimum threshold
* **Can't Select**: Ensure you're using the select tool
* **Labels Not Saving**: Check network connection and try again

**Performance Issues**

* **Slow Response**: Large images may require patience during operations
* **Memory Problems**: Close other browser tabs to free memory
* **Loading Issues**: Refresh the page or clear browser cache

**Data Loss Prevention**

* **Auto-save**: Annotations save automatically, but verify save indicators
* **Regular Exports**: Export work frequently to prevent loss
* **Browser Crashes**: Modern browsers recover most work, but save often

Keyboard Shortcuts and Efficiency
----------------------------------

**Common Shortcuts** (if implemented)

* ``S``: Select tool
* ``B``: Bounding box tool
* ``Delete``: Remove selected annotation
* ``Escape``: Cancel current operation
* ``Ctrl+Z``: Undo last action
* ``Ctrl+S``: Force save

**Workflow Optimization**

* **Hot Keys**: Learn and use keyboard shortcuts
* **Mouse Efficiency**: Use right-click menus when available
* **Screen Layout**: Optimize browser window size for your workflow

Related Topics
--------------

* :doc:`projects` - Managing your annotation projects
* :doc:`tasks` - Organizing annotation work with tasks
* :doc:`keyboard_shortcuts` - Complete keyboard shortcut reference
* :doc:`export` - Exporting your annotation data
