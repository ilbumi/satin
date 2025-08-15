import { graphqlClient } from './client';
import type {
	Project,
	ProjectPage,
	Image,
	ImagePage,
	Task,
	TaskPage,
	TaskStatus,
	BBoxInput,
	QueryInput
} from '$lib/graphql/generated/graphql';
import {
	GET_PROJECT,
	GET_PROJECTS,
	GET_IMAGE,
	GET_IMAGES,
	GET_TASK,
	GET_TASKS,
	GET_TASK_BY_IMAGE_AND_PROJECT,
	CREATE_PROJECT,
	UPDATE_PROJECT,
	DELETE_PROJECT,
	CREATE_IMAGE,
	UPDATE_IMAGE,
	DELETE_IMAGE,
	CREATE_TASK,
	UPDATE_TASK,
	DELETE_TASK
} from './queries';

/**
 * Helper type for GraphQL operation results
 */
export type GraphQLResult<T> = {
	data?: T;
	error?: Error;
	loading?: boolean;
};

/**
 * Helper function to execute a GraphQL query
 */
async function executeQuery<T>(
	query: string,
	variables: Record<string, unknown> = {}
): Promise<GraphQLResult<T>> {
	try {
		const result = await graphqlClient.query(query, variables).toPromise();

		if (result.error) {
			return { error: new Error(result.error.message) };
		}

		return { data: result.data as T };
	} catch (error) {
		return { error: error instanceof Error ? error : new Error('Unknown error') };
	}
}

/**
 * Helper function to execute a GraphQL mutation
 */
async function executeMutation<T>(
	mutation: string,
	variables: Record<string, unknown> = {}
): Promise<GraphQLResult<T>> {
	try {
		const result = await graphqlClient.mutation(mutation, variables).toPromise();

		if (result.error) {
			return { error: new Error(result.error.message) };
		}

		return { data: result.data as T };
	} catch (error) {
		return { error: error instanceof Error ? error : new Error('Unknown error') };
	}
}

// Project API helpers
export const projectAPI = {
	async getProject(id: string): Promise<GraphQLResult<{ project: Project }>> {
		return executeQuery(GET_PROJECT, { id });
	},

	async getProjects(
		limit: number = 10,
		offset: number = 0,
		query?: QueryInput
	): Promise<GraphQLResult<{ projects: ProjectPage }>> {
		return executeQuery(GET_PROJECTS, { limit, offset, query });
	},

	async createProject(
		name: string,
		description: string
	): Promise<GraphQLResult<{ createProject: Project }>> {
		return executeMutation(CREATE_PROJECT, { name, description });
	},

	async updateProject(
		id: string,
		name?: string,
		description?: string
	): Promise<GraphQLResult<{ updateProject: Project }>> {
		return executeMutation(UPDATE_PROJECT, { id, name, description });
	},

	async deleteProject(id: string): Promise<GraphQLResult<{ deleteProject: boolean }>> {
		return executeMutation(DELETE_PROJECT, { id });
	}
};

// Image API helpers
export const imageAPI = {
	async getImage(id: string): Promise<GraphQLResult<{ image: Image }>> {
		return executeQuery(GET_IMAGE, { id });
	},

	async getImages(
		limit: number = 10,
		offset: number = 0,
		query?: QueryInput
	): Promise<GraphQLResult<{ images: ImagePage }>> {
		return executeQuery(GET_IMAGES, { limit, offset, query });
	},

	async createImage(url: string): Promise<GraphQLResult<{ createImage: Image }>> {
		return executeMutation(CREATE_IMAGE, { url });
	},

	async updateImage(id: string, url?: string): Promise<GraphQLResult<{ updateImage: Image }>> {
		return executeMutation(UPDATE_IMAGE, { id, url });
	},

	async deleteImage(id: string): Promise<GraphQLResult<{ deleteImage: boolean }>> {
		return executeMutation(DELETE_IMAGE, { id });
	}
};

// Task API helpers
export const taskAPI = {
	async getTask(id: string): Promise<GraphQLResult<{ task: Task }>> {
		return executeQuery(GET_TASK, { id });
	},

	async getTasks(
		limit: number = 10,
		offset: number = 0,
		query?: QueryInput
	): Promise<GraphQLResult<{ tasks: TaskPage }>> {
		return executeQuery(GET_TASKS, { limit, offset, query });
	},

	async getTaskByImageAndProject(
		imageId: string,
		projectId: string
	): Promise<GraphQLResult<{ taskByImageAndProject: Task }>> {
		return executeQuery(GET_TASK_BY_IMAGE_AND_PROJECT, { imageId, projectId });
	},

	async createTask(
		imageId: string,
		projectId: string,
		bboxes?: BBoxInput[],
		status: TaskStatus = 'DRAFT'
	): Promise<GraphQLResult<{ createTask: Task }>> {
		return executeMutation(CREATE_TASK, { imageId, projectId, bboxes, status });
	},

	async updateTask(
		id: string,
		imageId?: string,
		projectId?: string,
		bboxes?: BBoxInput[],
		status?: TaskStatus
	): Promise<GraphQLResult<{ updateTask: Task }>> {
		return executeMutation(UPDATE_TASK, { id, imageId, projectId, bboxes, status });
	},

	async deleteTask(id: string): Promise<GraphQLResult<{ deleteTask: boolean }>> {
		return executeMutation(DELETE_TASK, { id });
	}
};

/**
 * Combined API object for easy imports
 */
export const api = {
	projects: projectAPI,
	images: imageAPI,
	tasks: taskAPI
};
