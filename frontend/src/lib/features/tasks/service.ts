import { graphqlClient } from '$lib/core/api/client';
import {
	GET_TASK,
	GET_TASKS,
	GET_TASK_BY_IMAGE_AND_PROJECT,
	CREATE_TASK,
	UPDATE_TASK,
	DELETE_TASK
} from '$lib/core/api/queries';
import type {
	Task,
	TaskPage,
	GetTaskQuery,
	GetTasksQuery,
	GetTaskByImageAndProjectQuery,
	CreateTaskMutation,
	UpdateTaskMutation,
	DeleteTaskMutation,
	QueryInput
} from '$lib/graphql/generated/graphql';
import type { CreateTaskForm, UpdateTaskForm, TaskFilters, TaskSummary } from './types';

export class TaskService {
	/**
	 * Fetch a single task by ID
	 */
	async getTask(id: string): Promise<Task | null> {
		try {
			const result = await graphqlClient.query<GetTaskQuery>(GET_TASK, { id }).toPromise();

			if (result.error) {
				console.error('Failed to fetch task:', result.error);
				throw new Error(result.error.message);
			}

			return result.data?.task || null;
		} catch (error) {
			console.error('TaskService.getTask error:', error);
			throw error;
		}
	}

	/**
	 * Fetch paginated tasks with optional filters
	 */
	async getTasks(limit = 10, offset = 0, filters?: TaskFilters): Promise<TaskPage> {
		try {
			let query: QueryInput | undefined;

			// Build query filters
			if (filters && (filters.search || filters.status !== 'all')) {
				query = {
					stringFilters: [],
					numberFilters: []
				};

				// Add search filter (search in project name for now)
				if (filters.search) {
					query.stringFilters!.push({
						field: 'project.name',
						operator: 'CONTAINS',
						value: filters.search
					});
				}

				// Add status filter
				if (filters.status && filters.status !== 'all') {
					query.stringFilters!.push({
						field: 'status',
						operator: 'EQ',
						value: filters.status
					});
				}

				// Add project filter
				if (filters.projectId) {
					query.stringFilters!.push({
						field: 'project_id',
						operator: 'EQ',
						value: filters.projectId
					});
				}
			}

			const result = await graphqlClient
				.query<GetTasksQuery>(GET_TASKS, {
					limit,
					offset,
					query
				})
				.toPromise();

			if (result.error) {
				console.error('Failed to fetch tasks:', result.error);
				throw new Error(result.error.message);
			}

			return (
				result.data?.tasks || {
					objects: [],
					totalCount: 0,
					count: 0,
					limit,
					offset,
					hasMore: false
				}
			);
		} catch (error) {
			console.error('TaskService.getTasks error:', error);
			throw error;
		}
	}

	/**
	 * Fetch task by image and project IDs
	 */
	async getTaskByImageAndProject(imageId: string, projectId: string): Promise<Task | null> {
		try {
			const result = await graphqlClient
				.query<GetTaskByImageAndProjectQuery>(GET_TASK_BY_IMAGE_AND_PROJECT, {
					imageId,
					projectId
				})
				.toPromise();

			if (result.error) {
				console.error('Failed to fetch task by image and project:', result.error);
				throw new Error(result.error.message);
			}

			return result.data?.taskByImageAndProject || null;
		} catch (error) {
			console.error('TaskService.getTaskByImageAndProject error:', error);
			throw error;
		}
	}

	/**
	 * Create a new task
	 */
	async createTask(data: CreateTaskForm): Promise<Task> {
		try {
			const result = await graphqlClient
				.mutation<CreateTaskMutation>(CREATE_TASK, data)
				.toPromise();

			if (result.error) {
				console.error('Failed to create task:', result.error);
				throw new Error(result.error.message);
			}

			if (!result.data?.createTask) {
				throw new Error('Failed to create task: No data returned');
			}

			return result.data.createTask;
		} catch (error) {
			console.error('TaskService.createTask error:', error);
			throw error;
		}
	}

	/**
	 * Update an existing task
	 */
	async updateTask(data: UpdateTaskForm): Promise<Task | null> {
		try {
			const result = await graphqlClient
				.mutation<UpdateTaskMutation>(UPDATE_TASK, data)
				.toPromise();

			if (result.error) {
				console.error('Failed to update task:', result.error);
				throw new Error(result.error.message);
			}

			return result.data?.updateTask || null;
		} catch (error) {
			console.error('TaskService.updateTask error:', error);
			throw error;
		}
	}

	/**
	 * Delete a task
	 */
	async deleteTask(id: string): Promise<boolean> {
		try {
			const result = await graphqlClient
				.mutation<DeleteTaskMutation>(DELETE_TASK, { id })
				.toPromise();

			if (result.error) {
				console.error('Failed to delete task:', result.error);
				throw new Error(result.error.message);
			}

			return result.data?.deleteTask || false;
		} catch (error) {
			console.error('TaskService.deleteTask error:', error);
			throw error;
		}
	}

	/**
	 * Map a full Task object to a TaskSummary for list display
	 */
	mapTaskToSummary(task: Task): TaskSummary {
		return {
			id: task.id,
			title: this.generateTaskTitle(task),
			status: task.status,
			createdAt: task.createdAt,
			projectName: task.project.name,
			projectId: task.project.id,
			imageUrl: task.image.url,
			imageId: task.image.id,
			bboxCount: task.bboxes.length,
			// Future enhancement fields
			assignee: undefined,
			priority: undefined,
			dueDate: undefined,
			progress: this.calculateProgress(task)
		};
	}

	/**
	 * Generate a readable title for a task based on its project and image
	 */
	private generateTaskTitle(task: Task): string {
		// Extract meaningful info from image URL if possible
		const imageName = task.image.url.split('/').pop() || 'Image';
		const cleanImageName = imageName.replace(/\.[^/.]+$/, ''); // Remove extension

		return `Annotate ${cleanImageName} in ${task.project.name}`;
	}

	/**
	 * Calculate task progress based on status and bboxes
	 */
	private calculateProgress(task: Task): number {
		switch (task.status) {
			case 'DRAFT':
				return task.bboxes.length > 0 ? 25 : 0;
			case 'FINISHED':
				return 100;
			case 'REVIEWED':
				return 100;
			default:
				return 0;
		}
	}
}
