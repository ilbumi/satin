Data Export
===========

SATIn provides comprehensive export functionality to get your annotated data out of the system for use in machine learning pipelines, data analysis, or archival purposes.

Export Overview
---------------

**What Can Be Exported**

* **Annotations**: Bounding box coordinates and labels
* **Project Metadata**: Project information and settings
* **Image Lists**: References to annotated images
* **Task Data**: Task status and completion information
* **Quality Metrics**: Annotation statistics and review data

**Export Formats**

SATIn supports multiple industry-standard formats:

* **COCO JSON**: Common Objects in Context format
* **YOLO**: YOLO training format with text files
* **Pascal VOC**: XML format popular in computer vision
* **CSV**: Comma-separated values for data analysis
* **JSON**: Raw JSON data for custom processing

Quick Export Guide
------------------

**Exporting from a Project**

1. Navigate to your project
2. Click "Export" or "Download Data" button
3. Select your desired format
4. Choose what to include (annotations, images, metadata)
5. Click "Generate Export" and wait for processing
6. Download the generated file

**Exporting Individual Tasks**

1. Open the task list view
2. Select specific tasks using checkboxes
3. Click "Export Selected" from batch actions
4. Choose format and options
5. Download the export file

COCO Format Export
------------------

**About COCO Format**

The COCO (Common Objects in Context) format is widely used for object detection and instance segmentation tasks.

**COCO Export Structure**

.. code-block:: json

   {
     "images": [
       {
         "id": 1,
         "file_name": "image001.jpg",
         "height": 480,
         "width": 640
       }
     ],
     "annotations": [
       {
         "id": 1,
         "image_id": 1,
         "category_id": 1,
         "bbox": [100, 200, 150, 100],
         "area": 15000,
         "iscrowd": 0
       }
     ],
     "categories": [
       {
         "id": 1,
         "name": "car",
         "supercategory": "vehicle"
       }
     ]
   }

**COCO Export Options**

* **Include Images**: Copy image files to export package
* **Relative Paths**: Use relative vs absolute image paths
* **Category Mapping**: How labels map to COCO categories
* **Validation Split**: Automatically split data for training/validation

YOLO Format Export
------------------

**About YOLO Format**

YOLO uses text files with normalized coordinates, popular for real-time object detection.

**YOLO File Structure**

For each image, creates a text file with:

.. code-block:: text

   # Format: class_id center_x center_y width height (normalized 0-1)
   0 0.5 0.6 0.2 0.3
   1 0.3 0.4 0.15 0.25

**YOLO Export Includes**

* **Images**: Original image files
* **Labels**: Text files with normalized coordinates
* **Classes.txt**: List of class names
* **Train/Val Split**: Automatic dataset splitting
* **Data.yaml**: YOLO configuration file

Pascal VOC Format Export
------------------------

**About Pascal VOC**

XML-based format used in the Pascal Visual Object Classes challenge.

**VOC Export Structure**

.. code-block:: xml

   <annotation>
     <filename>image001.jpg</filename>
     <size>
       <width>640</width>
       <height>480</height>
     </size>
     <object>
       <name>car</name>
       <bndbox>
         <xmin>100</xmin>
         <ymin>200</ymin>
         <xmax>250</xmax>
         <ymax>300</ymax>
       </bndbox>
     </object>
   </annotation>

**VOC Export Features**

* **XML Annotations**: One XML file per image
* **Image Directory**: Organized image folder structure
* **Label Classes**: Automatic class list generation
* **Validation**: XML schema validation

CSV Export Format
-----------------

**About CSV Export**

Simple comma-separated format ideal for data analysis and custom processing.

**CSV Structure**

.. code-block:: csv

   image_id,image_name,object_id,label,x_min,y_min,x_max,y_max,width,height
   1,image001.jpg,1,car,100,200,250,300,150,100
   1,image001.jpg,2,person,300,150,350,250,50,100

**CSV Export Options**

* **Coordinate Format**: Absolute pixels vs normalized coordinates
* **Include Metadata**: Add project and task information
* **Custom Fields**: Select which data columns to include
* **Aggregation**: Summary statistics per image or project

JSON Export Format
------------------

**About JSON Export**

Raw JSON format providing complete access to all annotation data.

**JSON Export Benefits**

* **Complete Data**: All annotation properties included
* **Flexible Structure**: Easy to parse with any programming language
* **Custom Processing**: Build your own data pipelines
* **API Compatibility**: Same format as the GraphQL API

**JSON Export Structure**

.. code-block:: json

   {
     "project": {
       "id": "proj_123",
       "name": "Traffic Detection",
       "description": "Urban traffic analysis"
     },
     "tasks": [
       {
         "id": "task_456",
         "status": "reviewed",
         "image": {
           "filename": "traffic001.jpg",
           "dimensions": {"width": 1920, "height": 1080}
         },
         "annotations": [
           {
             "bbox": {"x": 100, "y": 200, "width": 150, "height": 100},
             "label": "car",
             "tags": ["sedan", "blue"]
           }
         ]
       }
     ]
   }

Advanced Export Options
-----------------------

**Data Filtering**

Export only specific data subsets:

* **Date Range**: Tasks created or modified within a timeframe
* **Status Filter**: Only reviewed/finished tasks
* **Label Filter**: Specific object classes only
* **Image Criteria**: Size, format, or metadata filters

**Quality Control**

* **Review Status**: Only export reviewed annotations
* **Confidence Threshold**: Filter by annotation confidence
* **Validation Rules**: Apply consistency checks before export

**Dataset Splitting**

Automatically split data for machine learning:

* **Train/Validation/Test**: Standard 70/20/10 or custom ratios
* **Random Split**: Randomized distribution
* **Stratified Split**: Maintain class balance across splits
* **Custom Logic**: User-defined splitting criteria

Export Best Practices
----------------------

**Before Exporting**

1. **Complete Review Process**: Ensure all tasks are properly reviewed
2. **Quality Check**: Verify annotation consistency and accuracy
3. **Label Standardization**: Consistent naming and tagging
4. **Backup Planning**: Plan for data backup and versioning

**Export Planning**

* **Format Selection**: Choose format based on your ML framework
* **Data Organization**: Plan directory structure for your workflow
* **Version Control**: Track export versions and changes
* **Documentation**: Document export settings and any processing

**Quality Assurance**

* **Validation**: Test exported data with your training pipeline
* **Sample Verification**: Manually check a sample of exported annotations
* **Format Compliance**: Verify format compatibility with target tools
* **Completeness Check**: Ensure all expected data is included

Working with Exported Data
---------------------------

**Machine Learning Workflows**

* **Training Data**: Use exports to train object detection models
* **Validation Sets**: Create held-out datasets for model evaluation
* **Benchmarking**: Compare model performance across datasets

**Data Analysis**

* **Statistics**: Analyze annotation patterns and distributions
* **Quality Metrics**: Assess annotator consistency and accuracy
* **Dataset Insights**: Understand your data characteristics

**Integration Examples**

* **TensorFlow**: Load COCO format for tf.data pipelines
* **PyTorch**: Use YOLO format with torchvision datasets
* **Custom Models**: Process JSON exports with your own code

Troubleshooting Export Issues
-----------------------------

**Common Export Problems**

* **Large File Sizes**: Break exports into smaller batches
* **Memory Issues**: Export subsets of data rather than entire projects
* **Format Errors**: Verify annotation completeness before export
* **Missing Images**: Ensure image files are accessible during export

**Performance Optimization**

* **Batch Processing**: Export large projects in smaller chunks
* **Off-Peak Times**: Schedule large exports during low-usage periods
* **Network Considerations**: Stable connection for large downloads

**Data Validation**

* **Format Checking**: Validate exported files with format-specific tools
* **Completeness Verification**: Compare export counts with project statistics
* **Quality Sampling**: Test random samples of exported annotations

Automated Export Workflows
---------------------------

**Scheduled Exports**

Set up automatic exports:

* **Regular Backups**: Daily or weekly project exports
* **Incremental Updates**: Export only new/changed annotations
* **Pipeline Integration**: Automatic export to ML training systems

**API-Based Export**

Programmatic export using the GraphQL API:

* **Custom Scripts**: Build automated export workflows
* **Integration**: Connect with external data processing systems
* **Monitoring**: Track export success and handle failures

Related Topics
--------------

* :doc:`../api_reference/index` - API documentation for programmatic export
* :doc:`projects` - Project management for organizing exports
* :doc:`tasks` - Task status affects what gets exported
* :doc:`annotations` - Annotation quality impacts export value
