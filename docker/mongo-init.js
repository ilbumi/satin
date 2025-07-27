// MongoDB initialization script
// This script runs when the MongoDB container is first created

// Switch to the application database
db = db.getSiblingDB(process.env.MONGO_INITDB_DATABASE || 'satin');

// Create collections with initial indexes for better performance
db.createCollection('projects');
db.createCollection('images');
db.createCollection('tasks');
db.createCollection('annotations');

// Create indexes for better query performance
db.projects.createIndex({ "name": 1 }, { unique: true });
db.projects.createIndex({ "created_at": -1 });

db.images.createIndex({ "url": 1 }, { unique: true });
db.images.createIndex({ "created_at": -1 });

db.tasks.createIndex({ "project_id": 1 });
db.tasks.createIndex({ "image_id": 1 });
db.tasks.createIndex({ "status": 1 });
db.tasks.createIndex({ "created_at": -1 });

// Create a compound index for efficient task queries
db.tasks.createIndex({ "project_id": 1, "status": 1, "created_at": -1 });

print('MongoDB initialization completed successfully');