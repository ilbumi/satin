/**
 * Optimistic update utilities for better UX during API calls
 * Provides rollback mechanisms and loading states
 */

import { writable, derived, type Writable } from 'svelte/store';

export type OptimisticUpdateStatus = 'pending' | 'success' | 'error' | 'rollback';

export interface OptimisticUpdate<T> {
	id: string;
	status: OptimisticUpdateStatus;
	operation: 'create' | 'update' | 'delete';
	data: T;
	originalData?: T; // For rollback
	error?: Error;
	timestamp: number;
	rollback: () => void;
}

export interface OptimisticUpdateConfig<T> {
	// Generate unique ID for the update
	getId: (data: T) => string;

	// Apply optimistic change to state
	apply: (data: T) => void;

	// Rollback optimistic change
	rollback: (originalData?: T) => void;

	// Optional: transform data before applying
	transform?: (data: T) => T;
}

/**
 * Manager for optimistic updates with rollback support
 */
export class OptimisticUpdateManager<T> {
	private updates = new Map<string, OptimisticUpdate<T>>();
	private config: OptimisticUpdateConfig<T>;

	constructor(config: OptimisticUpdateConfig<T>) {
		this.config = config;
	}

	/**
	 * Apply an optimistic update
	 */
	applyUpdate(operation: OptimisticUpdate<T>['operation'], data: T, originalData?: T): string {
		const id = this.config.getId(data);
		const transformedData = this.config.transform?.(data) ?? data;

		const update: OptimisticUpdate<T> = {
			id,
			status: 'pending',
			operation,
			data: transformedData,
			originalData,
			timestamp: Date.now(),
			rollback: () => {
				this.rollbackUpdate(id);
			}
		};

		// Store the update
		this.updates.set(id, update);

		// Apply optimistic change
		this.config.apply(transformedData);

		return id;
	}

	/**
	 * Confirm an optimistic update as successful
	 */
	confirmUpdate(id: string): void {
		const update = this.updates.get(id);
		if (update) {
			update.status = 'success';
			// Keep successful updates for a short time for debugging
			setTimeout(() => {
				this.updates.delete(id);
			}, 5000);
		}
	}

	/**
	 * Mark an optimistic update as failed and rollback
	 */
	failUpdate(id: string, error: Error): void {
		const update = this.updates.get(id);
		if (update) {
			update.status = 'error';
			update.error = error;
			this.rollbackUpdate(id);
		}
	}

	/**
	 * Rollback an optimistic update
	 */
	rollbackUpdate(id: string): void {
		const update = this.updates.get(id);
		if (update) {
			update.status = 'rollback';
			this.config.rollback(update.originalData);

			// Clean up after rollback
			setTimeout(() => {
				this.updates.delete(id);
			}, 1000);
		}
	}

	/**
	 * Get current pending updates
	 */
	getPendingUpdates(): OptimisticUpdate<T>[] {
		return Array.from(this.updates.values()).filter((update) => update.status === 'pending');
	}

	/**
	 * Get all updates (for debugging)
	 */
	getAllUpdates(): OptimisticUpdate<T>[] {
		return Array.from(this.updates.values());
	}

	/**
	 * Check if there are any pending updates
	 */
	hasPendingUpdates(): boolean {
		return this.getPendingUpdates().length > 0;
	}

	/**
	 * Clear all updates (use with caution)
	 */
	clear(): void {
		this.updates.clear();
	}

	/**
	 * Clean up old updates
	 */
	cleanup(maxAge: number = 60000): void {
		// 1 minute default
		const cutoff = Date.now() - maxAge;

		for (const [id, update] of this.updates.entries()) {
			if (update.timestamp < cutoff && update.status !== 'pending') {
				this.updates.delete(id);
			}
		}
	}
}

/**
 * Utility function to execute an operation with optimistic updates
 */
export async function withOptimisticUpdate<T, R>(
	manager: OptimisticUpdateManager<T>,
	operation: OptimisticUpdate<T>['operation'],
	data: T,
	apiCall: () => Promise<R>,
	originalData?: T
): Promise<R> {
	const updateId = manager.applyUpdate(operation, data, originalData);

	try {
		const result = await apiCall();
		manager.confirmUpdate(updateId);
		return result;
	} catch (error) {
		manager.failUpdate(updateId, error as Error);
		throw error;
	}
}

/**
 * Create a simple optimistic update manager for common use cases
 */
export function createSimpleOptimisticManager<T>(config: {
	items: T[];
	setItems: (items: T[]) => void;
	getId: (item: T) => string;
	transform?: (item: T) => T;
}): OptimisticUpdateManager<T> {
	return new OptimisticUpdateManager<T>({
		getId: config.getId,

		apply: (data: T) => {
			const id = config.getId(data);
			const items = [...config.items];
			const existingIndex = items.findIndex((item) => config.getId(item) === id);

			if (existingIndex >= 0) {
				// Update existing item
				items[existingIndex] = data;
			} else {
				// Add new item
				items.unshift(data);
			}

			config.setItems(items);
		},

		rollback: (originalData?: T) => {
			if (originalData) {
				const id = config.getId(originalData);
				const items = [...config.items];
				const existingIndex = items.findIndex((item) => config.getId(item) === id);

				if (existingIndex >= 0) {
					// Restore original item
					items[existingIndex] = originalData;
					config.setItems(items);
				}
			}
		},

		transform: config.transform
	});
}

/**
 * Optimistic update hook for Svelte stores (test-compatible version)
 */
export function createOptimisticStore<T>(initialItems: T[], getId: (item: T) => string) {
	const itemsStore = writable<T[]>(initialItems);
	let items = initialItems;

	// Subscribe to store changes to keep local items in sync
	const unsubscribe = itemsStore.subscribe(($items) => {
		items = $items;
	});

	const manager = createSimpleOptimisticManager<T>({
		items,
		setItems: (newItems) => {
			items = newItems;
			itemsStore.set(newItems);
		},
		getId
	});

	// Use get() from store for synchronous access
	let hasPendingValue = false;
	let pendingIdsValue: string[] = [];

	// Update derived values when manager state changes
	const updateDerivedValues = () => {
		hasPendingValue = manager.hasPendingUpdates();
		pendingIdsValue = manager.getPendingUpdates().map((update) => update.id);
	};

	return {
		get items() {
			return items;
		},
		get hasPending() {
			updateDerivedValues();
			return hasPendingValue;
		},
		get pendingIds() {
			updateDerivedValues();
			return pendingIdsValue;
		},

		async optimisticCreate(item: T, apiCall: () => Promise<T>): Promise<T> {
			const result = await withOptimisticUpdate(manager, 'create', item, apiCall);
			updateDerivedValues();
			return result;
		},

		async optimisticUpdate(item: T, apiCall: () => Promise<T>, originalItem?: T): Promise<T> {
			const result = await withOptimisticUpdate(manager, 'update', item, apiCall, originalItem);
			updateDerivedValues();
			return result;
		},

		async optimisticDelete(item: T, apiCall: () => Promise<void>): Promise<void> {
			await withOptimisticUpdate(manager, 'delete', item, apiCall, item);
			updateDerivedValues();
		},

		setItems: (newItems: T[]) => {
			items = newItems;
			itemsStore.set(newItems);
		},

		cleanup: () => {
			manager.cleanup();
			unsubscribe();
		}
	};
}
