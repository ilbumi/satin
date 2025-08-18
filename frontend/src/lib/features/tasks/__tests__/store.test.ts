import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskService } from '../service';
import { taskStore } from '../store.svelte';
import {
	mockTask,
	mockTaskSummary,
	mockTaskPage,
	mockCreateTaskForm,
	mockUpdateTaskForm,
	resetMockCounter
} from './mocks';
import type { Task, TaskPage } from '$lib/graphql/generated/graphql';

// Mock the TaskService
vi.mock('../service');
const MockedTaskService = vi.mocked(TaskService);

describe('TaskStore', () => {
	let mockTaskService: ReturnType<typeof vi.mocked<TaskService>>;

	beforeEach(() => {
		// Reset mock counter
		resetMockCounter();

		// Clear all mocks
		vi.clearAllMocks();

		// Create a fresh mock service instance
		mockTaskService = new MockedTaskService() as ReturnType<typeof vi.mocked<TaskService>>;

		// Replace the service instance in the store
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(taskStore as any).taskService = mockTaskService;

		// Reset store state
		taskStore.state.list = {
			tasks: [],
			loading: false,
			error: null,
			totalCount: 0,
			hasMore: false,
			limit: 12,
			offset: 0
		};
		taskStore.state.create = {
			creating: false,
			error: null
		};
		taskStore.state.update = {
			updating: false,
			error: null
		};
		taskStore.state.delete = {
			deleting: false,
			error: null
		};
		taskStore.state.filters = {
			search: '',
			status: 'all',
			projectId: undefined,
			assignee: undefined,
			priority: 'all'
		};
	});

	describe('loadTasks', () => {
		it('should load tasks successfully', async () => {
			const mockTasks = [mockTask(), mockTask(), mockTask()];
			const mockPage = mockTaskPage(mockTasks, { totalCount: 3, hasMore: false });

			mockTaskService.getTasks.mockResolvedValue(mockPage);
			mockTaskService.mapTaskToSummary.mockImplementation((task: Task) =>
				mockTaskSummary({ id: task.id })
			);

			await taskStore.loadTasks();

			expect(taskStore.state.list.loading).toBe(false);
			expect(taskStore.state.list.error).toBeNull();
			expect(taskStore.state.list.tasks).toHaveLength(3);
			expect(taskStore.state.list.totalCount).toBe(3);
			expect(taskStore.state.list.hasMore).toBe(false);
			expect(mockTaskService.getTasks).toHaveBeenCalledWith(12, 0, taskStore.state.filters);
		});

		it('should handle loading state correctly', async () => {
			const mockTasks = [mockTask()];
			const mockPage = mockTaskPage(mockTasks);

			// Make the service call hang
			const taskPromise = new Promise((resolve) => {
				setTimeout(() => resolve(mockPage), 100);
			});
			mockTaskService.getTasks.mockReturnValue(taskPromise as Promise<TaskPage>);
			mockTaskService.mapTaskToSummary.mockImplementation((task: Task) =>
				mockTaskSummary({ id: task.id })
			);

			const loadPromise = taskStore.loadTasks();

			// Check loading state is true
			expect(taskStore.state.list.loading).toBe(true);

			await loadPromise;

			// Check loading state is false after completion
			expect(taskStore.state.list.loading).toBe(false);
		});

		it('should handle errors gracefully', async () => {
			mockTaskService.getTasks.mockRejectedValue(new Error('Test error'));

			await taskStore.loadTasks();

			expect(taskStore.state.list.loading).toBe(false);
			expect(taskStore.state.list.error).toBe('Test error');
			expect(taskStore.state.list.tasks).toHaveLength(0);
		});

		it('should support load more functionality', async () => {
			// First load
			const firstTasks = [mockTask(), mockTask()];
			const firstPage = mockTaskPage(firstTasks, {
				limit: 2,
				offset: 0,
				totalCount: 4,
				hasMore: true
			});
			mockTaskService.getTasks.mockResolvedValueOnce(firstPage);
			mockTaskService.mapTaskToSummary.mockImplementation((task: Task) =>
				mockTaskSummary({ id: task.id })
			);

			await taskStore.loadTasks();
			expect(taskStore.state.list.tasks).toHaveLength(2);

			// Load more
			const moreTasks = [mockTask(), mockTask()];
			const morePage = mockTaskPage(moreTasks, {
				limit: 2,
				offset: 2,
				totalCount: 4,
				hasMore: false
			});
			mockTaskService.getTasks.mockResolvedValueOnce(morePage);

			await taskStore.loadTasks(true); // loadMore = true

			expect(taskStore.state.list.tasks).toHaveLength(4);
			expect(taskStore.state.list.hasMore).toBe(false);
			expect(mockTaskService.getTasks).toHaveBeenCalledWith(12, 12, taskStore.state.filters);
		});
	});

	describe('createTask', () => {
		it('should create task successfully', async () => {
			const createForm = mockCreateTaskForm();
			const createdTask = mockTask();
			const mockPage = mockTaskPage([createdTask]);

			mockTaskService.createTask.mockResolvedValue(createdTask);
			mockTaskService.getTasks.mockResolvedValue(mockPage);
			mockTaskService.mapTaskToSummary.mockImplementation((task: Task) =>
				mockTaskSummary({ id: task.id })
			);

			await taskStore.createTask(createForm);

			expect(taskStore.state.create.creating).toBe(false);
			expect(taskStore.state.create.error).toBeNull();
			expect(mockTaskService.createTask).toHaveBeenCalledWith(createForm);
			// Should refresh the list
			expect(mockTaskService.getTasks).toHaveBeenCalled();
		});

		it('should handle creation errors', async () => {
			const createForm = mockCreateTaskForm();
			const error = new Error('Creation failed');

			mockTaskService.createTask.mockRejectedValue(error);

			await expect(taskStore.createTask(createForm)).rejects.toThrow('Creation failed');
			expect(taskStore.state.create.creating).toBe(false);
			expect(taskStore.state.create.error).toBe('Creation failed');
		});

		it('should prevent multiple concurrent creations', async () => {
			const createForm = mockCreateTaskForm();

			// Mock a slow creation
			mockTaskService.createTask.mockReturnValue(
				new Promise((resolve) => setTimeout(() => resolve(mockTask()), 100)) as Promise<Task>
			);

			// Start first creation
			const firstCreation = taskStore.createTask(createForm);
			expect(taskStore.state.create.creating).toBe(true);

			// Try second creation while first is in progress
			await taskStore.createTask(createForm);

			// Second call should return immediately without calling service again
			expect(mockTaskService.createTask).toHaveBeenCalledTimes(1);

			// Wait for first creation to complete
			await firstCreation;
		});
	});

	describe('updateTask', () => {
		it('should update task successfully', async () => {
			const updateForm = mockUpdateTaskForm();
			const updatedTask = mockTask({ id: updateForm.id });

			// Set up initial state with the task
			const initialTask = mockTaskSummary({ id: updateForm.id });
			taskStore.state.list.tasks = [initialTask];

			mockTaskService.updateTask.mockResolvedValue(updatedTask);
			mockTaskService.mapTaskToSummary.mockReturnValue(
				mockTaskSummary({ id: updatedTask.id, status: updatedTask.status })
			);

			await taskStore.updateTask(updateForm);

			expect(taskStore.state.update.updating).toBe(false);
			expect(taskStore.state.update.error).toBeNull();
			expect(mockTaskService.updateTask).toHaveBeenCalledWith(updateForm);

			// Check that the task was updated in the list
			const updatedTaskInList = taskStore.state.list.tasks.find((t) => t.id === updateForm.id);
			expect(updatedTaskInList?.status).toBe(updatedTask.status);
		});

		it('should handle update errors', async () => {
			const updateForm = mockUpdateTaskForm();
			const error = new Error('Update failed');

			mockTaskService.updateTask.mockRejectedValue(error);

			await expect(taskStore.updateTask(updateForm)).rejects.toThrow('Update failed');
			expect(taskStore.state.update.updating).toBe(false);
			expect(taskStore.state.update.error).toBe('Update failed');
		});
	});

	describe('deleteTask', () => {
		it('should delete task successfully', async () => {
			const taskId = 'test-task-1';
			const initialTask = mockTaskSummary({ id: taskId });

			// Set up initial state
			taskStore.state.list.tasks = [initialTask];
			taskStore.state.list.totalCount = 1;

			mockTaskService.deleteTask.mockResolvedValue(true);

			await taskStore.deleteTask(taskId);

			expect(taskStore.state.delete.deleting).toBe(false);
			expect(taskStore.state.delete.error).toBeNull();
			expect(mockTaskService.deleteTask).toHaveBeenCalledWith(taskId);
			expect(taskStore.state.list.tasks).toHaveLength(0);
			expect(taskStore.state.list.totalCount).toBe(0);
		});

		it('should handle deletion errors', async () => {
			const taskId = 'test-task-1';
			const error = new Error('Deletion failed');

			mockTaskService.deleteTask.mockRejectedValue(error);

			await expect(taskStore.deleteTask(taskId)).rejects.toThrow('Deletion failed');
			expect(taskStore.state.delete.deleting).toBe(false);
			expect(taskStore.state.delete.error).toBe('Deletion failed');
		});
	});

	describe('updateFilters', () => {
		it('should update filters and reload tasks', async () => {
			const mockTasks = [mockTask()];
			const mockPage = mockTaskPage(mockTasks);

			mockTaskService.getTasks.mockResolvedValue(mockPage);
			mockTaskService.mapTaskToSummary.mockImplementation((task: Task) =>
				mockTaskSummary({ id: task.id })
			);

			const newFilters = { search: 'test', status: 'DRAFT' as const };
			await taskStore.updateFilters(newFilters);

			expect(taskStore.state.filters.search).toBe('test');
			expect(taskStore.state.filters.status).toBe('DRAFT');
			expect(taskStore.state.list.offset).toBe(0); // Should reset pagination
			expect(mockTaskService.getTasks).toHaveBeenCalledWith(12, 0, {
				...taskStore.state.filters,
				...newFilters
			});
		});
	});

	describe('clearFilters', () => {
		it('should clear all filters and reload tasks', async () => {
			const mockTasks = [mockTask()];
			const mockPage = mockTaskPage(mockTasks);

			// Set some initial filters
			taskStore.state.filters = {
				search: 'test',
				status: 'DRAFT',
				projectId: 'project-1',
				assignee: 'user-1',
				priority: 'high'
			};

			mockTaskService.getTasks.mockResolvedValue(mockPage);
			mockTaskService.mapTaskToSummary.mockImplementation((task: Task) =>
				mockTaskSummary({ id: task.id })
			);

			await taskStore.clearFilters();

			expect(taskStore.state.filters).toEqual({
				search: '',
				status: 'all',
				projectId: undefined,
				assignee: undefined,
				priority: 'all'
			});
			expect(taskStore.state.list.offset).toBe(0);
		});
	});

	describe('getters', () => {
		it('should calculate statistics correctly', () => {
			taskStore.state.list.tasks = [
				mockTaskSummary({ status: 'DRAFT' }),
				mockTaskSummary({ status: 'DRAFT' }),
				mockTaskSummary({ status: 'FINISHED' }),
				mockTaskSummary({ status: 'REVIEWED' })
			];

			const stats = taskStore.statistics;

			expect(stats.total).toBe(4);
			expect(stats.draft).toBe(2);
			expect(stats.finished).toBe(1);
			expect(stats.reviewed).toBe(1);
		});

		it('should detect loading state correctly', () => {
			expect(taskStore.isLoading).toBe(false);

			taskStore.state.list.loading = true;
			expect(taskStore.isLoading).toBe(true);

			taskStore.state.list.loading = false;
			taskStore.state.create.creating = true;
			expect(taskStore.isLoading).toBe(true);

			taskStore.state.create.creating = false;
			taskStore.state.update.updating = true;
			expect(taskStore.isLoading).toBe(true);

			taskStore.state.update.updating = false;
			taskStore.state.delete.deleting = true;
			expect(taskStore.isLoading).toBe(true);
		});

		it('should collect all errors', () => {
			taskStore.state.list.error = 'List error';
			taskStore.state.create.error = 'Create error';
			taskStore.state.update.error = null;
			taskStore.state.delete.error = 'Delete error';

			const errors = taskStore.errors;

			expect(errors).toEqual(['List error', 'Create error', 'Delete error']);
		});
	});

	describe('utility methods', () => {
		it('should get task by ID', () => {
			const task1 = mockTaskSummary({ id: 'task-1' });
			const task2 = mockTaskSummary({ id: 'task-2' });

			taskStore.state.list.tasks = [task1, task2];

			expect(taskStore.getTaskById('task-1')).toEqual(task1);
			expect(taskStore.getTaskById('non-existent')).toBeUndefined();
		});

		it('should get tasks by status', () => {
			const draftTask = mockTaskSummary({ status: 'DRAFT' });
			const finishedTask = mockTaskSummary({ status: 'FINISHED' });

			taskStore.state.list.tasks = [draftTask, finishedTask];

			expect(taskStore.getTasksByStatus('DRAFT')).toEqual([draftTask]);
			expect(taskStore.getTasksByStatus('FINISHED')).toEqual([finishedTask]);
			expect(taskStore.getTasksByStatus('all')).toEqual([draftTask, finishedTask]);
		});

		it('should clear errors', () => {
			taskStore.state.list.error = 'List error';
			taskStore.state.create.error = 'Create error';
			taskStore.state.update.error = 'Update error';
			taskStore.state.delete.error = 'Delete error';

			taskStore.clearErrors();

			expect(taskStore.state.list.error).toBeNull();
			expect(taskStore.state.create.error).toBeNull();
			expect(taskStore.state.update.error).toBeNull();
			expect(taskStore.state.delete.error).toBeNull();
		});
	});
});
