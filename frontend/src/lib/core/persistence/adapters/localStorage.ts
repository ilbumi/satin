/**
 * LocalStorage persistence adapter
 * Provides simple key-value persistence using browser localStorage
 */

import type { PersistenceAdapter } from '../index';

export class LocalStorageAdapter implements PersistenceAdapter {
	private keyPrefix: string;

	constructor(keyPrefix = 'satin:') {
		this.keyPrefix = keyPrefix;
	}

	private getFullKey(key: string): string {
		return `${this.keyPrefix}${key}`;
	}

	async get<T>(key: string): Promise<T | null> {
		if (typeof window === 'undefined') return null;

		try {
			const fullKey = this.getFullKey(key);
			const item = localStorage.getItem(fullKey);

			if (item === null) return null;

			return JSON.parse(item) as T;
		} catch (error) {
			console.error(`LocalStorage get error for key "${key}":`, error);
			return null;
		}
	}

	async set<T>(key: string, value: T): Promise<void> {
		if (typeof window === 'undefined') return;

		const fullKey = this.getFullKey(key);

		try {
			const serialized = JSON.stringify(value);
			localStorage.setItem(fullKey, serialized);
		} catch (error) {
			console.error(`LocalStorage set error for key "${key}":`, error);

			// Handle quota exceeded error
			if (error instanceof DOMException && error.name === 'QuotaExceededError') {
				console.warn('LocalStorage quota exceeded, attempting cleanup...');
				await this.cleanup();

				// Try again after cleanup
				try {
					localStorage.setItem(fullKey, JSON.stringify(value));
				} catch (retryError) {
					console.error('LocalStorage set failed even after cleanup:', retryError);
					throw retryError;
				}
			} else {
				throw error;
			}
		}
	}

	async remove(key: string): Promise<void> {
		if (typeof window === 'undefined') return;

		try {
			const fullKey = this.getFullKey(key);
			localStorage.removeItem(fullKey);
		} catch (error) {
			console.error(`LocalStorage remove error for key "${key}":`, error);
		}
	}

	async clear(): Promise<void> {
		if (typeof window === 'undefined') return;

		try {
			const keysToRemove: string[] = [];

			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i);
				if (key && key.startsWith(this.keyPrefix)) {
					keysToRemove.push(key);
				}
			}

			keysToRemove.forEach((key) => localStorage.removeItem(key));
		} catch (error) {
			console.error('LocalStorage clear error:', error);
		}
	}

	async keys(): Promise<string[]> {
		if (typeof window === 'undefined') return [];

		try {
			const keys: string[] = [];

			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i);
				if (key && key.startsWith(this.keyPrefix)) {
					keys.push(key.substring(this.keyPrefix.length));
				}
			}

			return keys;
		} catch (error) {
			console.error('LocalStorage keys error:', error);
			return [];
		}
	}

	/**
	 * Get storage usage information
	 */
	async getUsageInfo(): Promise<{
		used: number;
		available: number;
		keys: number;
	}> {
		if (typeof window === 'undefined') {
			return { used: 0, available: 0, keys: 0 };
		}

		try {
			let used = 0;
			let keys = 0;

			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i);
				if (key && key.startsWith(this.keyPrefix)) {
					const item = localStorage.getItem(key);
					if (item) {
						used += key.length + item.length;
						keys++;
					}
				}
			}

			// Estimate available space (localStorage typically has 5-10MB limit)
			const estimated = 5 * 1024 * 1024; // 5MB estimate
			const available = Math.max(0, estimated - used);

			return { used, available, keys };
		} catch (error) {
			console.error('LocalStorage usage info error:', error);
			return { used: 0, available: 0, keys: 0 };
		}
	}

	/**
	 * Clean up old or expired items
	 */
	private async cleanup(): Promise<void> {
		if (typeof window === 'undefined') return;

		try {
			const keys = await this.keys();
			const now = Date.now();
			const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

			for (const key of keys) {
				try {
					const data = await this.get<{ timestamp?: number }>(key);
					if (data && typeof data === 'object' && data.timestamp) {
						// Remove items older than one week
						if (now - data.timestamp > oneWeekMs) {
							await this.remove(key);
							console.log(`Cleaned up old localStorage item: ${key}`);
						}
					}
				} catch {
					// If we can't parse the data, remove it
					await this.remove(key);
					console.log(`Cleaned up corrupted localStorage item: ${key}`);
				}
			}
		} catch (error) {
			console.error('LocalStorage cleanup error:', error);
		}
	}
}

// Export a default instance
export const localStorageAdapter = new LocalStorageAdapter();
