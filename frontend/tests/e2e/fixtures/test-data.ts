/**
 * Test data fixtures for E2E tests
 */

export const mockProjects = [
	{
		id: 'project-1',
		name: 'Wildlife Classification',
		description: 'Annotate images of various wildlife species for machine learning training',
		createdAt: new Date('2024-01-15'),
		taskCount: 150
	},
	{
		id: 'project-2',
		name: 'Medical Imaging',
		description: 'Label medical scans for diagnostic AI development',
		createdAt: new Date('2024-02-01'),
		taskCount: 75
	},
	{
		id: 'project-3',
		name: 'Document Analysis',
		description: 'OCR training data with bounding boxes around text regions',
		createdAt: new Date('2024-02-15'),
		taskCount: 200
	}
];

export const mockTasks = [
	{
		id: 'task-1',
		projectId: 'project-1',
		name: 'Elephant Classification',
		description: 'Identify and classify elephant species in African savanna images',
		status: 'pending',
		assignedTo: null
	},
	{
		id: 'task-2',
		projectId: 'project-1',
		name: 'Lion Pride Detection',
		description: 'Draw bounding boxes around lions in group photos',
		status: 'in_progress',
		assignedTo: 'annotator-1'
	},
	{
		id: 'task-3',
		projectId: 'project-2',
		name: 'Brain MRI Segmentation',
		description: 'Segment different brain regions in MRI scans',
		status: 'completed',
		assignedTo: 'annotator-2'
	}
];

export const mockImages = [
	{
		id: 'image-1',
		taskId: 'task-1',
		filename: 'elephant_001.jpg',
		url: '/api/images/elephant_001.jpg',
		width: 1920,
		height: 1080,
		annotations: []
	},
	{
		id: 'image-2',
		taskId: 'task-2',
		filename: 'lion_pride_001.jpg',
		url: '/api/images/lion_pride_001.jpg',
		width: 1600,
		height: 900,
		annotations: [
			{
				id: 'annotation-1',
				type: 'bounding_box',
				label: 'lion',
				coordinates: { x: 100, y: 150, width: 300, height: 200 }
			}
		]
	}
];

export const mockAnnotations = [
	{
		id: 'annotation-1',
		imageId: 'image-2',
		type: 'bounding_box',
		label: 'lion',
		coordinates: { x: 100, y: 150, width: 300, height: 200 },
		confidence: 0.95,
		createdBy: 'annotator-1',
		createdAt: new Date('2024-02-20')
	},
	{
		id: 'annotation-2',
		imageId: 'image-2',
		type: 'bounding_box',
		label: 'lion',
		coordinates: { x: 500, y: 300, width: 250, height: 180 },
		confidence: 0.87,
		createdBy: 'annotator-1',
		createdAt: new Date('2024-02-20')
	}
];

// GraphQL mutation templates
export const CREATE_PROJECT_MUTATION = `
  mutation CreateProject($name: String!, $description: String!) {
    createProject(name: $name, description: $description) {
      id
      name
      description
    }
  }
`;

export const CREATE_TASK_MUTATION = `
  mutation CreateTask($imageId: ID!, $projectId: ID!, $bboxes: [BBoxInput!], $status: TaskStatus) {
    createTask(imageId: $imageId, projectId: $projectId, bboxes: $bboxes, status: $status) {
      id
      project {
        id
        name
        description
      }
      status
    }
  }
`;

export const CREATE_ANNOTATION_MUTATION = `
  mutation CreateTask($imageId: ID!, $projectId: ID!, $bboxes: [BBoxInput!]) {
    createTask(imageId: $imageId, projectId: $projectId, bboxes: $bboxes) {
      id
      bboxes {
        x
        y
        width
        height
        annotation {
          text
          tags
        }
      }
    }
  }
`;

// API endpoints for testing
export const API_ENDPOINTS = {
	GRAPHQL: '/graphql',
	HEALTH: '/health',
	PROJECTS: '/api/projects',
	TASKS: '/api/tasks',
	IMAGES: '/api/images'
};

// Test user credentials (for authenticated tests)
export const TEST_USERS = {
	ADMIN: {
		username: 'admin@test.com',
		password: 'testpass123',
		role: 'admin'
	},
	ANNOTATOR: {
		username: 'annotator@test.com',
		password: 'testpass123',
		role: 'annotator'
	}
};

// Expected page titles and text content
export const PAGE_CONTENT = {
	HOME: {
		title: 'Satin - Image Annotation Platform',
		heading: 'Welcome to Satin',
		description: 'Professional image annotation platform'
	},
	PROJECTS: {
		title: 'Projects',
		heading: 'Project Management',
		createButton: 'Create New Project'
	},
	ANNOTATION: {
		title: 'Annotation Workspace',
		toolbar: 'Annotation Toolbar',
		canvas: 'Image Canvas'
	}
};
