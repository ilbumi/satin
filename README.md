# SATIn - Simple Annotation Tool for Images

SATIn is a comprehensive image annotation tool designed for creating high-quality datasets for computer vision tasks. It provides an interface for annotating bounding boxes, adding labels, defining relationships, and exporting data in common dataset formats.

## Features

### Core Annotation Capabilities
- **Bounding Box Annotation**: Draw and adjust bounding boxes on images
- **Flexible Labeling**: Add free-text labels or select from predefined label sets
- **Relationship Mapping**: Define relationships between different bounding boxes

### Data Management
- **Database Storage**: Persistent storage of annotations and metadata
- **Export Formats**: Export to popular dataset formats (COCO, YOLO, Pascal VOC, etc.)
- **Project Organization**: Manage multiple annotation projects
- **Version Control**: Track annotation changes and revisions

### ML Integration
- **Custom Model Support**: Connect and integrate custom ML models
- **Assisted Annotation**: Use ML models to pre-annotate images
- **Active Learning**: Identify images that need manual review

## Quick Start

### Frontend Development
```bash
cd frontend
pnpm install
pnpm run dev
```

### Backend Setup
```bash
pip install -e .
satin
```

## Project Status

This project is in early development. Current implementation includes basic frontend structure and counter component as a foundation for the annotation interface.

## Contributing

This is a developing project focused on creating an efficient, user-friendly annotation tool for computer vision datasets.