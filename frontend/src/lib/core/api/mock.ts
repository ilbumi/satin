import {
	Client,
	cacheExchange,
	type Operation,
	type Exchange,
	type OperationResult
} from '@urql/core';
import { print } from 'graphql';
import { map } from 'wonka';
import type {
	Project,
	Image,
	Task,
	ProjectPage,
	ImagePage,
	TaskPage,
	TaskStatus
} from '$lib/graphql/generated/graphql';

/**
 * Mock data generators
 */
export const mockData = {
	project: (id: string, overrides?: Partial<Project>): Project => ({
		id,
		name: `Project ${id}`,
		description: `Description for project ${id}`,
		...overrides
	}),

	image: (id: string, overrides?: Partial<Image>): Image => ({
		id,
		url: `https://picsum.photos/seed/${id}/800/600`,
		...overrides
	}),

	task: (id: string, overrides?: Partial<Task>): Task => ({
		id,
		status: 'DRAFT' as TaskStatus,
		createdAt: new Date().toISOString(),
		image: mockData.image('img1'),
		project: mockData.project('proj1'),
		bboxes: [
			{
				x: 100,
				y: 100,
				width: 200,
				height: 150,
				annotation: {
					text: 'Sample annotation',
					tags: ['tag1', 'tag2']
				}
			}
		],
		...overrides
	}),

	projectPage: (count: number = 3): ProjectPage => ({
		objects: Array.from({ length: count }, (_, i) => mockData.project(`proj${i + 1}`)),
		totalCount: count,
		count,
		limit: 10,
		offset: 0,
		hasMore: false
	}),

	imagePage: (count: number = 3): ImagePage => ({
		objects: Array.from({ length: count }, (_, i) => mockData.image(`img${i + 1}`)),
		totalCount: count,
		count,
		limit: 10,
		offset: 0,
		hasMore: false
	}),

	taskPage: (count: number = 3): TaskPage => ({
		objects: Array.from({ length: count }, (_, i) => mockData.task(`task${i + 1}`)),
		totalCount: count,
		count,
		limit: 10,
		offset: 0,
		hasMore: false
	})
};

/**
 * Mock GraphQL responses based on query/mutation operation
 */
function getMockResponse(operation: Operation): unknown {
	const { query, variables } = operation;

	// Convert GraphQL DocumentNode to string for parsing
	const queryString = typeof query === 'string' ? query : print(query);

	// Project queries
	if (queryString.includes('GetProject') && !queryString.includes('GetProjects')) {
		return { project: mockData.project(variables?.id || '1') };
	}

	if (queryString.includes('GetProjects')) {
		return { projects: mockData.projectPage(variables?.limit || 3) };
	}

	// Image queries
	if (queryString.includes('GetImage') && !queryString.includes('GetImages')) {
		return { image: mockData.image(variables?.id || '1') };
	}

	if (queryString.includes('GetImages')) {
		return { images: mockData.imagePage(variables?.limit || 3) };
	}

	// Task queries
	if (
		queryString.includes('GetTask') &&
		!queryString.includes('GetTasks') &&
		!queryString.includes('ByImageAndProject')
	) {
		return { task: mockData.task(variables?.id || '1') };
	}

	if (queryString.includes('GetTasks')) {
		return { tasks: mockData.taskPage(variables?.limit || 3) };
	}

	if (queryString.includes('GetTaskByImageAndProject')) {
		return {
			taskByImageAndProject: mockData.task('1', {
				image: mockData.image(variables?.imageId || 'img1'),
				project: mockData.project(variables?.projectId || 'proj1')
			})
		};
	}

	// Project mutations
	if (queryString.includes('CreateProject')) {
		return {
			createProject: mockData.project('new-id', {
				name: variables?.name,
				description: variables?.description
			})
		};
	}

	if (queryString.includes('UpdateProject')) {
		return {
			updateProject: mockData.project(variables?.id, {
				name: variables?.name,
				description: variables?.description
			})
		};
	}

	if (queryString.includes('DeleteProject')) {
		return { deleteProject: true };
	}

	// Image mutations
	if (queryString.includes('CreateImage')) {
		return {
			createImage: mockData.image('new-id', {
				url: variables?.url
			})
		};
	}

	if (queryString.includes('UpdateImage')) {
		return {
			updateImage: mockData.image(variables?.id, {
				url: variables?.url
			})
		};
	}

	if (queryString.includes('DeleteImage')) {
		return { deleteImage: true };
	}

	// Task mutations
	if (queryString.includes('CreateTask')) {
		return {
			createTask: mockData.task('new-id', {
				image: mockData.image(variables?.imageId),
				project: mockData.project(variables?.projectId),
				status: variables?.status || 'DRAFT',
				bboxes: variables?.bboxes || []
			})
		};
	}

	if (queryString.includes('UpdateTask')) {
		return {
			updateTask: mockData.task(variables?.id, {
				status: variables?.status,
				bboxes: variables?.bboxes
			})
		};
	}

	if (queryString.includes('DeleteTask')) {
		return { deleteTask: true };
	}

	// Schema introspection
	if (queryString.includes('__typename')) {
		return { __typename: 'Query' };
	}

	// Default fallback
	console.warn('Unhandled mock query:', queryString);
	return null;
}

/**
 * Mock exchange for URQL that returns mock data
 */
const mockExchange = (): Exchange => {
	return () => {
		return (operations$) => {
			return map((operation: Operation): OperationResult => {
				const mockResponse = getMockResponse(operation);

				return {
					operation,
					data: mockResponse,
					error: undefined,
					extensions: undefined,
					stale: false,
					hasNext: false
				};
			})(operations$);
		};
	};
};

/**
 * Create a mock GraphQL client for testing
 */
export function createMockGraphQLClient(): Client {
	return new Client({
		url: 'mock://graphql',
		exchanges: [cacheExchange, mockExchange()],
		requestPolicy: 'cache-and-network'
	});
}

/**
 * Mock client instance
 */
export const mockGraphQLClient = createMockGraphQLClient();

/**
 * Utility to add custom mock responses
 */
export class MockResponseStore {
	private responses = new Map<string, unknown>();

	addResponse(operationName: string, response: unknown): void {
		this.responses.set(operationName, response);
	}

	getResponse(operationName: string): unknown {
		return this.responses.get(operationName);
	}

	clear(): void {
		this.responses.clear();
	}
}

export const mockResponseStore = new MockResponseStore();
