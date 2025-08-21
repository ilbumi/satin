import type {
	TaskStoreState,
	TaskSummary,
	TaskFilters,
	CreateTaskForm,
	UpdateTaskForm
} from './types';
import { TaskService } from './service';
import { errorStore } from '$lib/core/errors';
import { createPersistenceManager } from '$lib/core/persistence';
import { localStorageAdapter } from '$lib/core/persistence/adapters/localStorage';

const DEFAULT_PAGE_SIZE = 10;

/**
 * Task store for managing task-related state in Svelte 5
 */
class TaskStore {
	private taskService = new TaskService();

	// Persistence for settings (filters, pagination preferences)
	private settingsPersistence = createPersistenceManager<{
		filters: TaskFilters;
		pagination: { limit: number };
	}>('task-store-settings', localStorageAdapter, {
		version: 1,
		debounceMs: 1000,
		ttl: 7 * 24 * 60 * 60 * 1000 // 7 days
	});

	// Reactive state
	state = $state<TaskStoreState>({
		list: {
			tasks: [],
			loading: false,
			error: null,
			totalCount: 0,
			hasMore: false,
			limit: 12, // Default page size
			offset: 0
		},
		create: {
			creating: false,
			error: null
		},
		update: {
			updating: false,
			error: null
		},
		delete: {
			deleting: false,
			error: null
		},
		filters: {
			search: '',
			status: 'all',
			projectId: undefined,
			assignee: undefined,
			priority: 'all'
		}
	});

	// Race condition protection
	private currentLoadController: AbortController | null = null;

	// Search debouncing
	private searchTimeout: number | null = null;

	/**
	 * Load tasks with current filters and pagination
	 */
	async loadTasks(loadMore = false): Promise<void> {
		if (this.state.list.loading) return;

		// Cancel any existing load operation
		if (this.currentLoadController) {
			this.currentLoadController.abort();
		}

		// Create new abort controller for this load
		this.currentLoadController = new AbortController();
		const loadController = this.currentLoadController;

		try {
			this.state.list.loading = true;
			this.state.list.error = null;

			const offset = loadMore ? this.state.list.offset + this.state.list.limit : 0;

			const result = await this.taskService.getTasks(
				this.state.list.limit,
				offset,
				this.state.filters
			);

			// Check if operation was cancelled after the async call
			if (loadController.signal.aborted) return;

			// Map tasks to summaries
			const taskSummaries = result.objects.map((task) => this.taskService.mapTaskToSummary(task));

			if (loadMore) {
				this.state.list.tasks = [...this.state.list.tasks, ...taskSummaries];
			} else {
				this.state.list.tasks = taskSummaries;
			}

			this.state.list.totalCount = result.totalCount;
			this.state.list.hasMore = result.hasMore;
			this.state.list.offset = offset;
		} catch (error) {
			console.error('Failed to load tasks:', error);
			const errorMessage = error instanceof Error ? error.message : 'Failed to load tasks';
			this.state.list.error = errorMessage;

			// Add to global error store with retry capability
			errorStore.addNetworkError(errorMessage, 'Task Store', () => this.loadTasks(loadMore));
		} finally {
			// Only update loading state if this is still the current operation
			if (loadController === this.currentLoadController) {
				this.state.list.loading = false;
				this.currentLoadController = null;
			}
		}
	}

	/**
	 * Load more tasks (for pagination)
	 */
	async loadMoreTasks(): Promise<void> {
		if (this.state.list.hasMore && !this.state.list.loading) {
			await this.loadTasks(true);
		}
	}

	/**
	 * Refresh tasks (reload current page)
	 */
	async refreshTasks(): Promise<void> {
		await this.loadTasks(false);
	}

	/**
	 * Create a new task
	 */
	async createTask(data: CreateTaskForm): Promise<void> {
		if (this.state.create.creating) return;

		try {
			this.state.create.creating = true;
			this.state.create.error = null;

			await this.taskService.createTask(data);

			// Refresh tasks list to include the new task
			await this.refreshTasks();
		} catch (error) {
			console.error('Failed to create task:', error);
			const errorMessage = error instanceof Error ? error.message : 'Failed to create task';
			this.state.create.error = errorMessage;

			// Add to global error store
			errorStore.addGraphQLError(errorMessage, 'Task Creation');
			throw error;
		} finally {
			this.state.create.creating = false;
		}
	}

	/**
	 * Update an existing task
	 */
	async updateTask(data: UpdateTaskForm): Promise<void> {
		if (this.state.update.updating) return;

		try {
			this.state.update.updating = true;
			this.state.update.error = null;

			const updatedTask = await this.taskService.updateTask(data);

			if (updatedTask) {
				// Update the task in the local state
				const updatedSummary = this.taskService.mapTaskToSummary(updatedTask);
				const index = this.state.list.tasks.findIndex((task) => task.id === data.id);

				if (index !== -1) {
					this.state.list.tasks[index] = updatedSummary;
				}
			}
		} catch (error) {
			console.error('Failed to update task:', error);
			const errorMessage = error instanceof Error ? error.message : 'Failed to update task';
			this.state.update.error = errorMessage;

			// Add to global error store
			errorStore.addGraphQLError(errorMessage, 'Task Update');
			throw error;
		} finally {
			this.state.update.updating = false;
		}
	}

	/**
	 * Delete a task
	 */
	async deleteTask(id: string): Promise<void> {
		if (this.state.delete.deleting) return;

		try {
			this.state.delete.deleting = true;
			this.state.delete.error = null;

			const success = await this.taskService.deleteTask(id);

			if (success) {
				// Remove the task from the local state
				this.state.list.tasks = this.state.list.tasks.filter((task) => task.id !== id);
				this.state.list.totalCount = Math.max(0, this.state.list.totalCount - 1);
			}
		} catch (error) {
			console.error('Failed to delete task:', error);
			const errorMessage = error instanceof Error ? error.message : 'Failed to delete task';
			this.state.delete.error = errorMessage;

			// Add to global error store
			errorStore.addGraphQLError(errorMessage, 'Task Deletion');
			throw error;
		} finally {
			this.state.delete.deleting = false;
		}
	}

	/**
	 * Update filters and reload tasks
	 */
	async updateFilters(newFilters: Partial<TaskFilters>): Promise<void> {
		// Update filters immediately for reactive UI updates
		this.state.filters = { ...this.state.filters, ...newFilters };
		this.state.list.offset = 0; // Reset pagination

		// Try to reload tasks, but don't fail if it errors (for rate limiting)
		try {
			await this.loadTasks(false);
		} catch (error) {
			console.warn('Filter update succeeded but task reload failed:', error);
		}
	}

	/**
	 * Clear all filters and reload tasks
	 */
	async clearFilters(): Promise<void> {
		this.state.filters = {
			search: '',
			status: 'all',
			projectId: undefined,
			assignee: undefined,
			priority: 'all'
		};
		this.state.list.offset = 0;
		await this.loadTasks(false);
	}

	/**
	 * Clear error states
	 */
	clearErrors(): void {
		this.state.list.error = null;
		this.state.create.error = null;
		this.state.update.error = null;
		this.state.delete.error = null;
	}

	/**
	 * Search tasks with debouncing to improve performance
	 */
	searchTasks(query: string): void {
		// Clear any existing timeout
		if (this.searchTimeout) {
			clearTimeout(this.searchTimeout);
		}

		// Set new timeout for debounced search
		this.searchTimeout = window.setTimeout(async () => {
			await this.updateFilters({ search: query });
		}, 300);
	}

	/**
	 * Get a specific task by ID (from loaded tasks)
	 */
	getTaskById(id: string): TaskSummary | undefined {
		return this.state.list.tasks.find((task) => task.id === id);
	}

	/**
	 * Get tasks filtered by status (from loaded tasks)
	 */
	getTasksByStatus(status: string): TaskSummary[] {
		if (status === 'all') return this.state.list.tasks;
		return this.state.list.tasks.filter((task) => task.status === status);
	}

	/**
	 * Get computed statistics
	 */
	get statistics() {
		const tasks = this.state.list.tasks;
		return {
			total: tasks.length,
			draft: tasks.filter((task) => task.status === 'DRAFT').length,
			finished: tasks.filter((task) => task.status === 'FINISHED').length,
			reviewed: tasks.filter((task) => task.status === 'REVIEWED').length
		};
	}

	/**
	 * Check if any operation is in progress
	 */
	get isLoading(): boolean {
		return (
			this.state.list.loading ||
			this.state.create.creating ||
			this.state.update.updating ||
			this.state.delete.deleting
		);
	}

	/**
	 * Get all current errors
	 */
	get errors(): string[] {
		const errors: string[] = [];
		if (this.state.list.error) errors.push(this.state.list.error);
		if (this.state.create.error) errors.push(this.state.create.error);
		if (this.state.update.error) errors.push(this.state.update.error);
		if (this.state.delete.error) errors.push(this.state.delete.error);
		return errors;
	}

	/**
	 * Cleanup method for store - can be called when component unmounts
	 * Clears all state and cancels any pending operations
	 */
	cleanup(): void {
		// Cancel any pending load operations
		if (this.currentLoadController) {
			this.currentLoadController.abort();
			this.currentLoadController = null;
		}

		// Clear any pending search timeout
		if (this.searchTimeout) {
			clearTimeout(this.searchTimeout);
			this.searchTimeout = null;
		}

		// Reset all state to initial values
		this.state = {
			list: {
				tasks: [],
				loading: false,
				error: null,
				hasMore: false,
				totalCount: 0,
				offset: 0,
				limit: DEFAULT_PAGE_SIZE
			},
			filters: {
				search: '',
				status: 'all',
				projectId: undefined,
				assignee: undefined,
				priority: 'all'
			},
			create: {
				creating: false,
				error: null
			},
			update: {
				updating: false,
				error: null
			},
			delete: {
				deleting: false,
				error: null
			}
		};
	}
}

// Export singleton instance
export const taskStore = new TaskStore();
