#!/usr/bin/env python3
"""Script to create test images in the database with valid data URLs."""

import asyncio
import base64
from datetime import datetime, UTC

from satin.db import db
from satin.repositories.factory import RepositoryFactory

# SVG template for generating test images
SVG_TEMPLATES = {
    "medical": {
        "color": "#10b981",
        "icon": "🏥",
        "text": "Medical Image"
    },
    "vehicle": {
        "color": "#f59e0b", 
        "icon": "🚗",
        "text": "Vehicle Image"
    },
    "object": {
        "color": "#3b82f6",
        "icon": "📦", 
        "text": "Object Image"
    },
    "nature": {
        "color": "#059669",
        "icon": "🌲",
        "text": "Nature Image"  
    }
}

def generate_svg_image(width: int = 400, height: int = 300, image_type: str = "object", image_id: str = "001") -> str:
    """Generate an SVG image as a data URL."""
    template = SVG_TEMPLATES.get(image_type, SVG_TEMPLATES["object"])
    
    # Create gradient colors
    base_color = template["color"]
    # Simple color adjustment for gradient
    if base_color.startswith("#"):
        hex_color = base_color[1:]
        rgb = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
        darker_rgb = tuple(max(0, c - 30) for c in rgb)
        darker_color = f"#{''.join(f'{c:02x}' for c in darker_rgb)}"
    else:
        darker_color = "#1f2937"  # fallback
    
    svg_content = f'''
    <svg width="{width}" height="{height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="grad{image_id}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:{base_color};stop-opacity:1" />
                <stop offset="100%" style="stop-color:{darker_color};stop-opacity:1" />
            </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad{image_id})"/>
        <text x="50%" y="40%" text-anchor="middle" dominant-baseline="middle"
              font-family="Arial, sans-serif" font-size="48" 
              fill="white" stroke="black" stroke-width="1">
            {template["icon"]}
        </text>
        <text x="50%" y="60%" text-anchor="middle" dominant-baseline="middle"
              font-family="Arial, sans-serif" font-size="18" 
              fill="white" stroke="rgba(0,0,0,0.3)" stroke-width="1">
            {template["text"]} #{image_id}
        </text>
        <text x="50%" y="75%" text-anchor="middle" dominant-baseline="middle"
              font-family="Arial, sans-serif" font-size="14" 
              fill="rgba(255,255,255,0.8)">
            {width}×{height} px
        </text>
    </svg>
    '''.strip()
    
    # Convert to base64 data URL
    svg_base64 = base64.b64encode(svg_content.encode('utf-8')).decode('utf-8')
    return f"data:image/svg+xml;base64,{svg_base64}"

async def create_test_images(count: int = 12) -> None:
    """Create test images in the database."""
    repo_factory = RepositoryFactory(db)
    image_repo = repo_factory.image_repo
    
    print(f"Creating {count} test images...")
    
    # Clear existing test images (optional)
    # You might want to comment this out if you want to keep existing data
    try:
        existing_images = await image_repo.get_all_images(limit=1000)
        for img in existing_images:
            if img.url.startswith("data:image/"):
                await image_repo.delete_image(img.id)
                print(f"Removed existing test image: {img.id}")
    except Exception as e:
        print(f"Error cleaning up existing images: {e}")
    
    # Create new test images
    image_types = list(SVG_TEMPLATES.keys())
    created_images = []
    
    for i in range(count):
        image_type = image_types[i % len(image_types)]
        image_id = f"{i + 1:03d}"
        
        # Generate different sizes for variety
        sizes = [
            (400, 300),
            (600, 400), 
            (800, 600),
            (320, 240)
        ]
        width, height = sizes[i % len(sizes)]
        
        try:
            # Generate the data URL
            data_url = generate_svg_image(width, height, image_type, image_id)
            
            # Create metadata
            metadata = {
                "dimensions": {
                    "width": width,
                    "height": height
                },
                "metadata": {
                    "filename": f"{image_type}-sample-{image_id}.svg",
                    "size": len(data_url),
                    "mime_type": "image/svg+xml",
                    "format": "SVG",
                    "uploaded_at": datetime.now(UTC),
                    "is_uploaded": False
                }
            }
            
            # Create the image in the database
            image = await image_repo.create_image(url=data_url, metadata=metadata)
            created_images.append(image)
            
            print(f"✓ Created {image_type} image {image_id}: {image.id} ({width}×{height})")
            
        except Exception as e:
            print(f"✗ Failed to create image {image_id}: {e}")
    
    print(f"\nSuccessfully created {len(created_images)} test images!")
    return created_images

async def create_test_projects_and_tasks() -> None:
    """Create some test projects and tasks using the test images."""
    repo_factory = RepositoryFactory(db)
    project_repo = repo_factory.project_repo
    task_repo = repo_factory.task_repo
    image_repo = repo_factory.image_repo
    
    print("\nCreating test projects and tasks...")
    
    # Get all images
    images = await image_repo.get_all_images(limit=20)
    if not images:
        print("No images found. Please create images first.")
        return
    
    # Create test projects
    projects_data = [
        ("Medical Images Dataset", "Collection of medical imaging samples for annotation training"),
        ("Vehicle Detection Dataset", "Traffic and vehicle images for object detection"),
        ("General Objects Dataset", "Various objects for general annotation practice"),
        ("Nature Photography Dataset", "Natural scenes and landscapes for analysis")
    ]
    
    projects = []
    for name, description in projects_data:
        try:
            project = await project_repo.create_project(name, description)
            projects.append(project)
            print(f"✓ Created project: {name}")
        except Exception as e:
            print(f"✗ Failed to create project {name}: {e}")
    
    # Create tasks for each project
    task_count = 0
    for i, project in enumerate(projects):
        # Assign 3 images per project
        project_images = images[i*3:(i+1)*3]
        
        for image in project_images:
            try:
                task = await task_repo.create_task(
                    image_id=image.id,
                    project_id=project.id,
                    bboxes=[]  # Empty bboxes to start
                )
                task_count += 1
                print(f"✓ Created task for {project.name}: {task.id}")
            except Exception as e:
                print(f"✗ Failed to create task for {project.name}: {e}")
    
    print(f"\nSuccessfully created {len(projects)} projects and {task_count} tasks!")

async def main():
    """Main function to create all test data."""
    print("🎨 Creating test data for Satin application...")
    
    try:
        # Create test images
        await create_test_images(12)
        
        # Create projects and tasks
        await create_test_projects_and_tasks()
        
        print("\n🎉 Test data creation completed successfully!")
        print("\nYou can now:")
        print("1. View images at http://localhost:3000/images")
        print("2. View tasks at http://localhost:3000/tasks") 
        print("3. Try annotating by clicking on task cards")
        
    except Exception as e:
        print(f"\n❌ Error creating test data: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())