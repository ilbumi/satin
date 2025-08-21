/**
 * Offline queue for storing failed mutations until connectivity is restored
 */

import { createPersistenceManager } from '$lib/core/persistence';
import { indexedDBAdapter } from '$lib/core/persistence/adapters/indexedDB';

export interface QueuedMutation {
	id: string;
	operation: string;
	variables: Record<string, unknown>;
	timestamp: number;
	retryCount: number;
	maxRetries: number;
	priority: 'low' | 'normal' | 'high' | 'critical';
	context?: Record<string, unknown>;
}

export interface OfflineQueueOptions {
	maxRetries?: number;
	retryDelayMs?: number;
	maxQueueSize?: number;
}

/**
 * Offline mutation queue manager
 */
export class OfflineQueue {
	private persistenceManager = createPersistenceManager<QueuedMutation[]>(
		'offline-mutation-queue',
		indexedDBAdapter,
		{
			version: 1,
			debounceMs: 0, // Immediate persistence for queue operations
			ttl: 7 * 24 * 60 * 60 * 1000 // Keep for 7 days
		}
	);

	private queue: QueuedMutation[] = [];
	private processing = false;
	private options: Required<OfflineQueueOptions>;

	constructor(options: OfflineQueueOptions = {}) {
		this.options = {
			maxRetries: options.maxRetries ?? 3,
			retryDelayMs: options.retryDelayMs ?? 1000,
			maxQueueSize: options.maxQueueSize ?? 100
		};

		// Load persisted queue on initialization
		this.loadQueue();
	}

	/**
	 * Add a mutation to the offline queue
	 */
	async enqueue(
		operation: string,
		variables: Record<string, unknown>,
		options: {
			priority?: QueuedMutation['priority'];
			maxRetries?: number;
			context?: Record<string, unknown>;
		} = {}
	): Promise<string> {
		const mutation: QueuedMutation = {
			id: crypto.randomUUID(),
			operation,
			variables,
			timestamp: Date.now(),
			retryCount: 0,
			maxRetries: options.maxRetries ?? this.options.maxRetries,
			priority: options.priority ?? 'normal',
			context: options.context
		};

		// Check queue size limit
		if (this.queue.length >= this.options.maxQueueSize) {
			// Remove oldest low-priority items
			this.queue = this.queue
				.filter((item) => item.priority !== 'low')
				.slice(0, this.options.maxQueueSize - 1);
		}

		this.queue.push(mutation);
		this.sortQueue();
		await this.persistQueue();

		return mutation.id;
	}

	/**
	 * Process the queue when online
	 */
	async processQueue(
		executor: (operation: string, variables: Record<string, unknown>) => Promise<unknown>
	): Promise<void> {
		if (this.processing) return;

		this.processing = true;

		try {
			while (this.queue.length > 0) {
				const mutation = this.queue[0];

				try {
					await executor(mutation.operation, mutation.variables);

					// Success - remove from queue
					this.queue.shift();
					await this.persistQueue();
				} catch (error) {
					// Failure - increment retry count
					mutation.retryCount++;

					if (mutation.retryCount >= mutation.maxRetries) {
						// Max retries reached - remove from queue
						console.error(
							`Mutation ${mutation.id} failed after ${mutation.maxRetries} retries:`,
							error
						);
						this.queue.shift();
					} else {
						// Move to back of queue for retry
						this.queue.shift();
						this.queue.push(mutation);

						// Wait before next retry
						await this.delay(this.options.retryDelayMs * Math.pow(2, mutation.retryCount - 1));
					}

					await this.persistQueue();
				}
			}
		} finally {
			this.processing = false;
		}
	}

	/**
	 * Get current queue status
	 */
	getStatus(): {
		count: number;
		processing: boolean;
		byPriority: Record<QueuedMutation['priority'], number>;
		oldestTimestamp?: number;
	} {
		const byPriority = this.queue.reduce(
			(acc, item) => {
				acc[item.priority] = (acc[item.priority] || 0) + 1;
				return acc;
			},
			{} as Record<QueuedMutation['priority'], number>
		);

		return {
			count: this.queue.length,
			processing: this.processing,
			byPriority,
			oldestTimestamp:
				this.queue.length > 0 ? Math.min(...this.queue.map((item) => item.timestamp)) : undefined
		};
	}

	/**
	 * Clear the entire queue
	 */
	async clear(): Promise<void> {
		this.queue = [];
		await this.persistQueue();
	}

	/**
	 * Remove a specific mutation from the queue
	 */
	async remove(id: string): Promise<boolean> {
		const index = this.queue.findIndex((item) => item.id === id);
		if (index >= 0) {
			this.queue.splice(index, 1);
			await this.persistQueue();
			return true;
		}
		return false;
	}

	/**
	 * Get all queued mutations (for debugging/display)
	 */
	getAllMutations(): QueuedMutation[] {
		return [...this.queue];
	}

	/**
	 * Load queue from persistence
	 */
	private async loadQueue(): Promise<void> {
		try {
			const persisted = await this.persistenceManager.load();
			if (persisted) {
				this.queue = persisted;
				this.sortQueue();
			}
		} catch (error) {
			console.error('Failed to load offline queue:', error);
		}
	}

	/**
	 * Persist queue to storage
	 */
	private async persistQueue(): Promise<void> {
		try {
			await this.persistenceManager.save([...this.queue]);
		} catch (error) {
			console.error('Failed to persist offline queue:', error);
		}
	}

	/**
	 * Sort queue by priority and timestamp
	 */
	private sortQueue(): void {
		const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };

		this.queue.sort((a, b) => {
			// First sort by priority
			const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
			if (priorityDiff !== 0) return priorityDiff;

			// Then sort by timestamp (older first)
			return a.timestamp - b.timestamp;
		});
	}

	/**
	 * Helper delay function
	 */
	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}

/**
 * Network status monitor
 */
export class NetworkStatusMonitor {
	private callbacks: Array<(online: boolean) => void> = [];
	private _isOnline = true;

	constructor() {
		if (typeof window !== 'undefined') {
			this._isOnline = navigator.onLine;

			window.addEventListener('online', this.handleOnline);
			window.addEventListener('offline', this.handleOffline);
		}
	}

	get isOnline(): boolean {
		return this._isOnline;
	}

	/**
	 * Subscribe to network status changes
	 */
	onStatusChange(callback: (online: boolean) => void): () => void {
		this.callbacks.push(callback);

		// Return unsubscribe function
		return () => {
			const index = this.callbacks.indexOf(callback);
			if (index >= 0) {
				this.callbacks.splice(index, 1);
			}
		};
	}

	private handleOnline = () => {
		this._isOnline = true;
		this.callbacks.forEach((callback) => callback(true));
	};

	private handleOffline = () => {
		this._isOnline = false;
		this.callbacks.forEach((callback) => callback(false));
	};

	/**
	 * Cleanup event listeners
	 */
	cleanup(): void {
		if (typeof window !== 'undefined') {
			window.removeEventListener('online', this.handleOnline);
			window.removeEventListener('offline', this.handleOffline);
		}
		this.callbacks = [];
	}
}

// Export singleton instances
export const offlineQueue = new OfflineQueue();
export const networkMonitor = new NetworkStatusMonitor();
