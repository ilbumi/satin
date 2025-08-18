import type {
	TaskStoreState,
	TaskSummary,
	TaskFilters,
	CreateTaskForm,
	UpdateTaskForm
} from './types';
import { TaskService } from './service';

/**
 * Task store for managing task-related state in Svelte 5
 */
class TaskStore {
	private taskService = new TaskService();

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

	/**
	 * Load tasks with current filters and pagination
	 */
	async loadTasks(loadMore = false): Promise<void> {
		if (this.state.list.loading) return;

		try {
			this.state.list.loading = true;
			this.state.list.error = null;

			const offset = loadMore ? this.state.list.offset + this.state.list.limit : 0;

			const result = await this.taskService.getTasks(
				this.state.list.limit,
				offset,
				this.state.filters
			);

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
			this.state.list.error = error instanceof Error ? error.message : 'Failed to load tasks';
		} finally {
			this.state.list.loading = false;
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
			this.state.create.error = error instanceof Error ? error.message : 'Failed to create task';
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
			this.state.update.error = error instanceof Error ? error.message : 'Failed to update task';
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
			this.state.delete.error = error instanceof Error ? error.message : 'Failed to delete task';
			throw error;
		} finally {
			this.state.delete.deleting = false;
		}
	}

	/**
	 * Update filters and reload tasks
	 */
	async updateFilters(newFilters: Partial<TaskFilters>): Promise<void> {
		this.state.filters = { ...this.state.filters, ...newFilters };
		this.state.list.offset = 0; // Reset pagination
		await this.loadTasks(false);
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
}

// Export singleton instance
export const taskStore = new TaskStore();
