import { testGraphQLClient } from './graphql-client.js';

/**
 * Test data types
 */
export interface TestProject {
	id: string;
	name: string;
	description?: string;
}

export interface TestImage {
	id: string;
	filename: string;
	url: string;
	thumbnailUrl?: string;
}

export interface TestTask {
	id: string;
	status: 'DRAFT' | 'COMPLETED' | 'IN_PROGRESS';
	imageId: string;
	projectId: string;
	bboxes?: TestBBox[];
}

export interface TestBBox {
	x: number;
	y: number;
	width: number;
	height: number;
	annotation?: {
		text?: string;
		tags?: string[];
	};
}

/**
 * GraphQL mutations for test data setup
 */
const CREATE_PROJECT_MUTATION = `
	mutation CreateProject($name: String!, $description: String!) {
		createProject(name: $name, description: $description) {
			id
			name
			description
		}
	}
`;

const CREATE_IMAGE_MUTATION = `
	mutation CreateImage($url: String!) {
		createImage(url: $url) {
			id
			url
		}
	}
`;

const CREATE_TASK_MUTATION = `
	mutation CreateTask($imageId: ID!, $projectId: ID!, $status: TaskStatus = DRAFT) {
		createTask(imageId: $imageId, projectId: $projectId, status: $status) {
			id
			status
			createdAt
			image {
				id
				url
			}
			project {
				id
				name
				description
			}
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

const DELETE_PROJECT_MUTATION = `
	mutation DeleteProject($id: ID!) {
		deleteProject(id: $id)
	}
`;

const DELETE_IMAGE_MUTATION = `
	mutation DeleteImage($id: ID!) {
		deleteImage(id: $id)
	}
`;

const DELETE_TASK_MUTATION = `
	mutation DeleteTask($id: ID!) {
		deleteTask(id: $id)
	}
`;

/**
 * Test data factory functions
 */
export class TestDataFactory {
	private createdProjects: string[] = [];
	private createdImages: string[] = [];
	private createdTasks: string[] = [];

	/**
	 * Create a test project
	 */
	async createProject(name: string, description?: string): Promise<TestProject> {
		// Generate a unique project name to avoid duplicate key errors
		const timestamp = Date.now();
		const randomId = Math.random().toString(36).substring(7);
		const uniqueName = `${name}-${timestamp}-${randomId}`;

		const result = await testGraphQLClient
			.mutation(CREATE_PROJECT_MUTATION, {
				name: uniqueName,
				description: description || `Test project: ${name}`
			})
			.toPromise();

		if (result.error) {
			throw new Error(`Failed to create project: ${result.error.message}`);
		}

		const project = result.data.createProject;
		this.createdProjects.push(project.id);
		return project;
	}

	/**
	 * Create a test image
	 */
	async createImage(filename: string): Promise<TestImage> {
		// Generate a unique URL for each image to avoid duplicate key errors
		// Use a real image URL with query parameters to make it unique
		const timestamp = Date.now();
		const randomId = Math.random().toString(36).substring(7);
		// Use picsum.photos which provides random placeholder images
		const testImageUrl = `https://picsum.photos/400/300?random=${timestamp}_${randomId}`;

		const result = await testGraphQLClient
			.mutation(CREATE_IMAGE_MUTATION, {
				url: testImageUrl
			})
			.toPromise();

		if (result.error) {
			throw new Error(`Failed to create image: ${result.error.message}`);
		}

		const image = result.data.createImage;
		this.createdImages.push(image.id);
		return {
			id: image.id,
			filename,
			url: image.url,
			thumbnailUrl: image.url
		};
	}

	/**
	 * Create a test task
	 */
	async createTask(
		imageId: string,
		projectId: string,
		status: TestTask['status'] = 'DRAFT'
	): Promise<TestTask> {
		const result = await testGraphQLClient
			.mutation(CREATE_TASK_MUTATION, {
				imageId,
				projectId,
				status
			})
			.toPromise();

		if (result.error) {
			throw new Error(`Failed to create task: ${result.error.message}`);
		}

		const task = result.data.createTask;
		this.createdTasks.push(task.id);
		return {
			id: task.id,
			status: task.status,
			imageId,
			projectId,
			bboxes: task.bboxes || []
		};
	}

	/**
	 * Clean up all created test data
	 */
	async cleanup(): Promise<void> {
		const errors: string[] = [];

		// Delete tasks first (they depend on projects and images)
		for (const taskId of this.createdTasks) {
			try {
				await testGraphQLClient.mutation(DELETE_TASK_MUTATION, { id: taskId }).toPromise();
			} catch (error) {
				errors.push(`Failed to delete task ${taskId}: ${error}`);
			}
		}

		// Delete images
		for (const imageId of this.createdImages) {
			try {
				await testGraphQLClient.mutation(DELETE_IMAGE_MUTATION, { id: imageId }).toPromise();
			} catch (error) {
				errors.push(`Failed to delete image ${imageId}: ${error}`);
			}
		}

		// Delete projects last
		for (const projectId of this.createdProjects) {
			try {
				await testGraphQLClient.mutation(DELETE_PROJECT_MUTATION, { id: projectId }).toPromise();
			} catch (error) {
				errors.push(`Failed to delete project ${projectId}: ${error}`);
			}
		}

		// Clear the arrays
		this.createdTasks = [];
		this.createdImages = [];
		this.createdProjects = [];

		if (errors.length > 0) {
			console.warn('Some cleanup operations failed:', errors);
		}
	}

	/**
	 * Create a full test scenario with project, image, and task
	 */
	async createTestScenario(scenarioName: string): Promise<{
		project: TestProject;
		image: TestImage;
		task: TestTask;
	}> {
		const project = await this.createProject(`${scenarioName} Project`);
		const image = await this.createImage(`${scenarioName.toLowerCase()}-test.jpg`);
		const task = await this.createTask(image.id, project.id);

		return { project, image, task };
	}
}

/**
 * Helper function to wait for backend to be ready
 */
export async function waitForBackend(maxAttempts = 30, intervalMs = 1000): Promise<void> {
	for (let i = 0; i < maxAttempts; i++) {
		try {
			const result = await testGraphQLClient.query('{ __typename }', {}).toPromise();
			if (!result.error && result.data?.__typename === 'Query') {
				return; // Backend is ready
			}
		} catch {
			// Continue trying
		}

		await new Promise((resolve) => setTimeout(resolve, intervalMs));
	}

	throw new Error('Backend did not become ready within the expected time');
}
