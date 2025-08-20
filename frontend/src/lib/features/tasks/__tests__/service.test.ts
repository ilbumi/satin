import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TaskService } from '../service';
import { graphqlClient } from '$lib/core/api/client';
import type {
	OperationResultSource,
	OperationResult,
	AnyVariables,
	CombinedError,
	Operation,
	OperationContext
} from '@urql/core';
import { Kind } from 'graphql';
import {
	mockTask,
	mockTaskPage,
	mockCreateTaskForm,
	mockUpdateTaskForm,
	mockCreateTaskResponse,
	mockUpdateTaskResponse,
	mockDeleteTaskResponse,
	mockGetTaskResponse,
	mockGetTasksResponse,
	mockGetTaskByImageAndProjectResponse,
	mockGraphQLError,
	resetMockCounter
} from './mocks';

// Helper function to create properly typed URQL operation results
function createMockOperationResult<T = unknown>(result: {
	data?: T;
	error?: unknown;
}): OperationResultSource<OperationResult<T, AnyVariables>> {
	const mockOperation: Operation = {
		kind: 'query',
		query: { kind: Kind.DOCUMENT, definitions: [] },
		variables: {},
		key: Math.random(),
		context: {
			url: 'http://localhost:8000/graphql',
			requestPolicy: 'cache-first'
		} as OperationContext
	};

	const mockResult: OperationResult<T, AnyVariables> = {
		data: result.data,
		error: result.error as CombinedError | undefined,
		operation: mockOperation,
		stale: false,
		hasNext: false
	};

	return {
		toPromise: () => Promise.resolve(mockResult)
	} as unknown as OperationResultSource<OperationResult<T, AnyVariables>>;
}

// Mock the GraphQL client
vi.mock('$lib/core/api/client', () => ({
	graphqlClient: {
		query: vi.fn(),
		mutation: vi.fn()
	}
}));

const mockGraphQLClient = vi.mocked(graphqlClient);

describe('TaskService', () => {
	let service: TaskService;
	let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		// Mock console.error to suppress error logs during tests
		consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		service = new TaskService();
		resetMockCounter();
		vi.clearAllMocks();
	});

	afterEach(() => {
		// Restore console.error
		consoleErrorSpy.mockRestore();
	});

	describe('getTask', () => {
		it('should return task when found', async () => {
			const mockTaskData = mockTask({ id: 'test-1' });
			mockGraphQLClient.query.mockReturnValue(
				createMockOperationResult(mockGetTaskResponse(mockTaskData))
			);

			const result = await service.getTask('test-1');

			expect(result).toEqual(mockTaskData);
			expect(mockGraphQLClient.query).toHaveBeenCalledWith(expect.stringContaining('GetTask'), {
				id: 'test-1'
			});
		});

		it('should return null when task not found', async () => {
			mockGraphQLClient.query.mockReturnValue(createMockOperationResult(mockGetTaskResponse(null)));

			const result = await service.getTask('non-existent');

			expect(result).toBeNull();
		});

		it('should throw error when GraphQL query fails', async () => {
			mockGraphQLClient.query.mockReturnValue(
				createMockOperationResult(mockGraphQLError('Failed to fetch task'))
			);

			await expect(service.getTask('test-1')).rejects.toThrow('Failed to fetch task');
		});
	});

	describe('getTasks', () => {
		it('should return paginated tasks', async () => {
			const mockTasks = [mockTask(), mockTask(), mockTask()];
			const mockTasksPage = mockTaskPage(mockTasks);
			mockGraphQLClient.query.mockReturnValue(
				createMockOperationResult(mockGetTasksResponse(mockTasks))
			);

			const result = await service.getTasks(10, 0);

			expect(result).toEqual(mockTasksPage);
			expect(mockGraphQLClient.query).toHaveBeenCalledWith(expect.stringContaining('GetTasks'), {
				limit: 10,
				offset: 0,
				query: undefined
			});
		});

		it('should apply search filters', async () => {
			const mockTasks = [mockTask()];
			mockGraphQLClient.query.mockReturnValue(
				createMockOperationResult(mockGetTasksResponse(mockTasks))
			);

			const filters = { search: 'test', status: 'DRAFT' as const };
			await service.getTasks(10, 0, filters);

			expect(mockGraphQLClient.query).toHaveBeenCalledWith(expect.stringContaining('GetTasks'), {
				limit: 10,
				offset: 0,
				query: {
					stringFilters: [
						{
							field: 'project.name',
							operator: 'CONTAINS',
							value: 'test'
						},
						{
							field: 'status',
							operator: 'EQ',
							value: 'DRAFT'
						}
					],
					numberFilters: []
				}
			});
		});

		it('should handle empty results', async () => {
			mockGraphQLClient.query.mockReturnValue(createMockOperationResult(mockGetTasksResponse([])));

			const result = await service.getTasks(10, 0);

			expect(result.objects).toHaveLength(0);
			expect(result.totalCount).toBe(0);
		});

		it('should throw error when GraphQL query fails', async () => {
			mockGraphQLClient.query.mockReturnValue(
				createMockOperationResult(mockGraphQLError('Failed to fetch tasks'))
			);

			await expect(service.getTasks(10, 0)).rejects.toThrow('Failed to fetch tasks');
		});
	});

	describe('getTaskByImageAndProject', () => {
		it('should return task for image and project', async () => {
			const mockTaskData = mockTask();
			mockGraphQLClient.query.mockReturnValue(
				createMockOperationResult(mockGetTaskByImageAndProjectResponse(mockTaskData))
			);

			const result = await service.getTaskByImageAndProject('image-1', 'project-1');

			expect(result).toEqual(mockTaskData);
			expect(mockGraphQLClient.query).toHaveBeenCalledWith(
				expect.stringContaining('GetTaskByImageAndProject'),
				{
					imageId: 'image-1',
					projectId: 'project-1'
				}
			);
		});

		it('should return null when no task found', async () => {
			mockGraphQLClient.query.mockReturnValue(
				createMockOperationResult(mockGetTaskByImageAndProjectResponse(null))
			);

			const result = await service.getTaskByImageAndProject('image-1', 'project-1');

			expect(result).toBeNull();
		});
	});

	describe('createTask', () => {
		it('should create a new task', async () => {
			const createForm = mockCreateTaskForm();
			const createdTask = mockTask();
			mockGraphQLClient.mutation.mockReturnValue(
				createMockOperationResult(mockCreateTaskResponse(createdTask))
			);

			const result = await service.createTask(createForm);

			expect(result).toEqual(createdTask);
			expect(mockGraphQLClient.mutation).toHaveBeenCalledWith(
				expect.stringContaining('CreateTask'),
				createForm
			);
		});

		it('should throw error when creation fails', async () => {
			const createForm = mockCreateTaskForm();
			mockGraphQLClient.mutation.mockReturnValue(
				createMockOperationResult(mockGraphQLError('Failed to create task'))
			);

			await expect(service.createTask(createForm)).rejects.toThrow('Failed to create task');
		});

		it('should throw error when no data returned', async () => {
			const createForm = mockCreateTaskForm();
			mockGraphQLClient.mutation.mockReturnValue(
				createMockOperationResult({ data: { createTask: null } })
			);

			await expect(service.createTask(createForm)).rejects.toThrow(
				'Failed to create task: No data returned'
			);
		});
	});

	describe('updateTask', () => {
		it('should update an existing task', async () => {
			const updateForm = mockUpdateTaskForm();
			const updatedTask = mockTask({ id: updateForm.id });
			mockGraphQLClient.mutation.mockReturnValue(
				createMockOperationResult(mockUpdateTaskResponse(updatedTask))
			);

			const result = await service.updateTask(updateForm);

			expect(result).toEqual(updatedTask);
			expect(mockGraphQLClient.mutation).toHaveBeenCalledWith(
				expect.stringContaining('UpdateTask'),
				updateForm
			);
		});

		it('should return null when update fails', async () => {
			const updateForm = mockUpdateTaskForm();
			mockGraphQLClient.mutation.mockReturnValue(
				createMockOperationResult({ data: { updateTask: null } })
			);

			const result = await service.updateTask(updateForm);

			expect(result).toBeNull();
		});

		it('should throw error when mutation fails', async () => {
			const updateForm = mockUpdateTaskForm();
			mockGraphQLClient.mutation.mockReturnValue(
				createMockOperationResult(mockGraphQLError('Failed to update task'))
			);

			await expect(service.updateTask(updateForm)).rejects.toThrow('Failed to update task');
		});
	});

	describe('deleteTask', () => {
		it('should delete a task successfully', async () => {
			mockGraphQLClient.mutation.mockReturnValue(
				createMockOperationResult(mockDeleteTaskResponse(true))
			);

			const result = await service.deleteTask('test-1');

			expect(result).toBe(true);
			expect(mockGraphQLClient.mutation).toHaveBeenCalledWith(
				expect.stringContaining('DeleteTask'),
				{ id: 'test-1' }
			);
		});

		it('should return false when deletion fails', async () => {
			mockGraphQLClient.mutation.mockReturnValue(
				createMockOperationResult(mockDeleteTaskResponse(false))
			);

			const result = await service.deleteTask('test-1');

			expect(result).toBe(false);
		});

		it('should throw error when mutation fails', async () => {
			mockGraphQLClient.mutation.mockReturnValue(
				createMockOperationResult(mockGraphQLError('Failed to delete task'))
			);

			await expect(service.deleteTask('test-1')).rejects.toThrow('Failed to delete task');
		});
	});

	describe('mapTaskToSummary', () => {
		it('should map task to summary correctly', () => {
			const task = mockTask({
				id: 'test-1',
				status: 'FINISHED',
				bboxes: [
					{
						x: 10,
						y: 20,
						width: 100,
						height: 80,
						annotation: { text: 'Test', tags: [] }
					},
					{
						x: 50,
						y: 60,
						width: 150,
						height: 120,
						annotation: { text: 'Test 2', tags: [] }
					}
				]
			});

			const summary = service.mapTaskToSummary(task);

			expect(summary).toEqual({
				id: 'test-1',
				title: expect.stringContaining('Annotate'),
				status: 'FINISHED',
				createdAt: task.createdAt,
				projectName: task.project.name,
				projectId: task.project.id,
				imageUrl: task.image.url,
				imageId: task.image.id,
				bboxCount: 2,
				assignee: undefined,
				priority: undefined,
				dueDate: undefined,
				progress: 100
			});
		});

		it('should calculate progress correctly for DRAFT status', () => {
			const task = mockTask({
				status: 'DRAFT',
				bboxes: [
					{
						x: 10,
						y: 20,
						width: 100,
						height: 80,
						annotation: { text: 'Test', tags: [] }
					}
				]
			});

			const summary = service.mapTaskToSummary(task);

			expect(summary.progress).toBe(25);
		});

		it('should calculate progress correctly for empty DRAFT', () => {
			const task = mockTask({
				status: 'DRAFT',
				bboxes: []
			});

			const summary = service.mapTaskToSummary(task);

			expect(summary.progress).toBe(0);
		});
	});
});
