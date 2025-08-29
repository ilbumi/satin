// MongoDB initialization script for Satin image annotation tool
// This script creates collections, indexes, and validates the database structure

print('Initializing Satin database...');

// Create database user for the application
db = db.getSiblingDB(process.env.MONGO_INITDB_DATABASE);
db.createUser({
  user: process.env.MONGO_USER,
  pwd: process.env.MONGO_PASSWORD,
  roles: [
    {
      role: 'readWrite',
      db: process.env.MONGO_INITDB_DATABASE
    }
  ]
});

print('Database user created successfully.');

// Drop existing collections if they exist (for clean setup)
print('Dropping existing collections...');
db.images.drop();
db.annotations.drop();
db.tags.drop();
db.export_jobs.drop();
db.ml_jobs.drop();

// Create collections with validation
print('Creating collections...');

// Images collection - stores image URLs and metadata
db.createCollection('images', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['url', 'status', 'created_at'],
      properties: {
        url: {
          bsonType: 'string',
          description: 'Image URL - required'
        },
        width: {
          bsonType: ['int', 'null'],
          minimum: 1,
          description: 'Image width in pixels'
        },
        height: {
          bsonType: ['int', 'null'],
          minimum: 1,
          description: 'Image height in pixels'
        },
        ext: {
          bsonType: 'string',
          enum: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
          description: 'Image file extension'
        },
        status: {
          bsonType: 'string',
          enum: ['new', 'annotated', 'needs_reannotation'],
          description: 'Image annotation status - required'
        },
        created_at: {
          bsonType: 'date',
          description: 'Creation timestamp - required'
        },
        updated_at: {
          bsonType: 'date',
          description: 'Last update timestamp'
        }
      }
    }
  }
});

// Annotations collection - stores annotation data
db.createCollection('annotations', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['image_id', 'bounding_box', 'created_at'],
      properties: {
        image_id: {
          bsonType: 'objectId',
          description: 'Reference to image - required'
        },
        bounding_box: {
          bsonType: 'object',
          required: ['x', 'y', 'width', 'height'],
          properties: {
            x: { bsonType: 'number', description: 'Bounding box x coordinate' },
            y: { bsonType: 'number', description: 'Bounding box y coordinate' },
            width: { bsonType: 'number', minimum: 1, description: 'Bounding box width' },
            height: { bsonType: 'number', minimum: 1, description: 'Bounding box height' }
          },
          description: 'Bounding box coordinates - required'
        },
        tags: {
          bsonType: 'array',
          items: { bsonType: 'string' },
          description: 'Array of tag strings'
        },
        description: {
          bsonType: 'string',
          description: 'Free-text annotation description'
        },
        confidence: {
          bsonType: 'number',
          minimum: 0,
          maximum: 1,
          description: 'ML confidence score'
        },
        source: {
          bsonType: 'string',
          enum: ['manual', 'ml'],
          description: 'Annotation source'
        },
        created_at: {
          bsonType: 'date',
          description: 'Creation timestamp - required'
        },
        updated_at: {
          bsonType: 'date',
          description: 'Last update timestamp'
        }
      }
    }
  }
});

// Tags collection - hierarchical tag structure
db.createCollection('tags', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'path', 'created_at'],
      properties: {
        name: {
          bsonType: 'string',
          description: 'Tag name - required'
        },
        parent_id: {
          bsonType: 'objectId',
          description: 'Parent tag reference for hierarchy'
        },
        path: {
          bsonType: 'string',
          description: 'Full hierarchical path - required'
        },
        usage_count: {
          bsonType: 'int',
          minimum: 0,
          description: 'Number of times this tag is used'
        },
        created_at: {
          bsonType: 'date',
          description: 'Creation timestamp - required'
        }
      }
    }
  }
});

// Export jobs collection - temporary export files with TTL
db.createCollection('export_jobs', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['filename', 'status', 'created_at'],
      properties: {
        filename: {
          bsonType: 'string',
          description: 'Generated filename - required'
        },
        status: {
          bsonType: 'string',
          enum: ['pending', 'completed', 'failed'],
          description: 'Export job status - required'
        },
        file_path: {
          bsonType: 'string',
          description: 'Path to exported file'
        },
        download_url: {
          bsonType: 'string',
          description: 'Temporary download URL'
        },
        created_at: {
          bsonType: 'date',
          description: 'Creation timestamp - required'
        },
        expires_at: {
          bsonType: 'date',
          description: 'Expiration timestamp for TTL'
        }
      }
    }
  }
});

// ML jobs collection - ML pipeline job tracking
db.createCollection('ml_jobs', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['image_url', 'endpoint', 'status', 'created_at'],
      properties: {
        image_url: {
          bsonType: 'string',
          description: 'URL of the image to process - required'
        },
        endpoint: {
          bsonType: 'string',
          description: 'ML service endpoint used - required'
        },
        status: {
          bsonType: 'string',
          enum: ['pending', 'running', 'completed', 'failed', 'cancelled'],
          description: 'ML job status - required'
        },
        predictions: {
          bsonType: 'array',
          description: 'ML predictions returned'
        },
        error_message: {
          bsonType: 'string',
          description: 'Error message if failed'
        },
        created_at: {
          bsonType: 'date',
          description: 'Creation timestamp - required'
        },
        updated_at: {
          bsonType: 'date',
          description: 'Last update timestamp'
        }
      }
    }
  }
});

// Create indexes for performance
print('Creating indexes...');

// Images collection indexes
db.images.createIndex({ "url": 1 }, { unique: true });
db.images.createIndex({ "status": 1 });
db.images.createIndex({ "created_at": -1 });
db.images.createIndex({ "updated_at": -1 });
// Compound index for status filtering with sorting
db.images.createIndex({ "status": 1, "created_at": -1 });

// Annotations collection indexes
db.annotations.createIndex({ "image_id": 1 });
db.annotations.createIndex({ "tags": 1 });
db.annotations.createIndex({ "source": 1 });
db.annotations.createIndex({ "confidence": 1 });
db.annotations.createIndex({ "created_at": -1 });
db.annotations.createIndex({ "updated_at": -1 });
// Compound index for image_id with sorting
db.annotations.createIndex({ "image_id": 1, "created_at": -1 });

// Tags collection indexes
db.tags.createIndex({ "name": 1 }, { unique: true });
db.tags.createIndex({ "parent_id": 1 });
db.tags.createIndex({ "path": 1 });
db.tags.createIndex({ "usage_count": -1 });

// Export jobs collection indexes
db.export_jobs.createIndex({ "status": 1 });
db.export_jobs.createIndex({ "created_at": -1 });
// TTL index for automatic cleanup after 24 hours
db.export_jobs.createIndex({ "expires_at": 1 }, { expireAfterSeconds: 0 });

// ML jobs collection indexes
db.ml_jobs.createIndex({ "image_url": 1 });
db.ml_jobs.createIndex({ "endpoint": 1 });
db.ml_jobs.createIndex({ "status": 1 });
db.ml_jobs.createIndex({ "created_at": -1 });
db.ml_jobs.createIndex({ "updated_at": -1 });
// Compound index for status filtering with sorting
db.ml_jobs.createIndex({ "status": 1, "created_at": -1 });

// Verify collections and indexes
print('\nVerifying database setup...');
print('Collections created:');
db.listCollectionNames().forEach(name => print(`  - ${name}`));

print('\nIndexes created:');
['images', 'annotations', 'tags', 'export_jobs', 'ml_jobs'].forEach(collection => {
  print(`  ${collection}:`);
  db[collection].getIndexes().forEach(index => {
    print(`    - ${index.name}: ${JSON.stringify(index.key)}`);
  });
});

print('\nDatabase initialization completed successfully!');
print('Database is ready for the Satin image annotation tool.');
