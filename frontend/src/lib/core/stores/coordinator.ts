/**
 * Store Coordinator for managing concurrent data loads and preventing race conditions
 * Ensures proper sequencing of store operations and error handling
 */

import { taskStore } from '$lib/features/tasks/store.svelte';
import { imageStore } from '$lib/features/images/store.svelte';
import { projectStore } from '$lib/features/projects/store.svelte';
import { errorStore } from '$lib/core/errors';
import { retryStoreOperation } from '$lib/core/utils/retry';

export interface LoadResult {
	success: boolean;
	errors: string[];
	operations: string[];
}

/**
 * Loading coordinator that manages concurrent store operations
 */
class StoreCoordinator {
	// Track active operations to prevent duplicate loads
	private activeLoads = new Set<string>();

	// Global loading state
	isLoading = $state(false);

	/**
	 * Load initial data for the application in sequence
	 * This prevents race conditions and provides better error handling
	 */
	async loadInitialData(): Promise<LoadResult> {
		if (this.activeLoads.has('initial')) {
			return { success: false, errors: ['Initial load already in progress'], operations: [] };
		}

		this.activeLoads.add('initial');
		this.isLoading = true;

		const errors: string[] = [];
		const operations: string[] = [];

		try {
			// Load projects first (they're needed for other operations)
			operations.push('projects');
			try {
				await retryStoreOperation(() => projectStore.fetchProjects(), 'Projects');
			} catch (error) {
				const msg = error instanceof Error ? error.message : 'Failed to load projects';
				errors.push(msg);
			}

			// Load images and tasks in parallel (they don't depend on each other)
			operations.push('images', 'tasks');
			const parallelResults = await Promise.allSettled([
				retryStoreOperation(() => imageStore.fetchImages(), 'Images'),
				retryStoreOperation(() => taskStore.loadTasks(), 'Tasks')
			]);

			// Handle parallel load results
			parallelResults.forEach((result, index) => {
				if (result.status === 'rejected') {
					const operation = index === 0 ? 'images' : 'tasks';
					const msg =
						result.reason instanceof Error ? result.reason.message : `Failed to load ${operation}`;
					errors.push(msg);
				}
			});

			return {
				success: errors.length === 0,
				errors,
				operations
			};
		} catch (error) {
			const msg = error instanceof Error ? error.message : 'Failed to load initial data';
			errors.push(msg);

			// Add to global error store with retry
			errorStore.addSystemError(msg, 'Store Coordinator');

			return {
				success: false,
				errors,
				operations
			};
		} finally {
			this.activeLoads.delete('initial');
			this.isLoading = false;
		}
	}

	/**
	 * Refresh all data stores
	 */
	async refreshAllData(): Promise<LoadResult> {
		if (this.activeLoads.has('refresh')) {
			return { success: false, errors: ['Refresh already in progress'], operations: [] };
		}

		this.activeLoads.add('refresh');
		this.isLoading = true;

		const errors: string[] = [];
		const operations = ['projects', 'images', 'tasks'];

		try {
			// Refresh all stores in parallel with retry logic
			const results = await Promise.allSettled([
				retryStoreOperation(() => projectStore.fetchProjects(), 'Projects'),
				retryStoreOperation(() => imageStore.fetchImages(), 'Images'),
				retryStoreOperation(() => taskStore.refreshTasks(), 'Tasks')
			]);

			results.forEach((result, index) => {
				if (result.status === 'rejected') {
					const operation = operations[index];
					const msg =
						result.reason instanceof Error
							? result.reason.message
							: `Failed to refresh ${operation}`;
					errors.push(msg);
				}
			});

			return {
				success: errors.length === 0,
				errors,
				operations
			};
		} catch (error) {
			const msg = error instanceof Error ? error.message : 'Failed to refresh data';
			errors.push(msg);

			errorStore.addSystemError(msg, 'Store Coordinator');

			return {
				success: false,
				errors,
				operations
			};
		} finally {
			this.activeLoads.delete('refresh');
			this.isLoading = false;
		}
	}

	/**
	 * Clean up all stores (typically called on app unmount)
	 */
	cleanup(): void {
		// Cancel any active operations
		this.activeLoads.clear();
		this.isLoading = false;

		// Clean up individual stores
		taskStore.cleanup();
		imageStore.cleanup();
		projectStore.cleanup();

		// Clear global errors related to store operations
		errorStore.clearErrors();
	}

	/**
	 * Check if a specific operation is currently active
	 */
	isOperationActive(operation: string): boolean {
		return this.activeLoads.has(operation);
	}

	/**
	 * Get current loading state for all stores
	 */
	get loadingStates() {
		return {
			coordinator: this.isLoading,
			tasks: taskStore.state.list.loading,
			images: imageStore.loading,
			projects: projectStore.loading
		};
	}

	/**
	 * Get all current errors from stores
	 */
	get allErrors(): string[] {
		const errors: string[] = [];

		if (taskStore.state.list.error) errors.push(taskStore.state.list.error);
		if (imageStore.error) errors.push(imageStore.error);
		if (projectStore.error) errors.push(projectStore.error);

		return errors;
	}
}

// Export singleton instance
export const storeCoordinator = new StoreCoordinator();
