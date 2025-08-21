/**
 * IndexedDB persistence adapter
 * Provides robust persistence using browser IndexedDB for larger data storage
 */

import type { PersistenceAdapter } from '../index';

export class IndexedDBAdapter implements PersistenceAdapter {
	private dbName: string;
	private dbVersion: number;
	private storeName: string;
	private db: IDBDatabase | null = null;
	private initPromise: Promise<void> | null = null;

	constructor(dbName = 'SatinDB', storeName = 'persistence', dbVersion = 1) {
		this.dbName = dbName;
		this.storeName = storeName;
		this.dbVersion = dbVersion;
	}

	private async init(): Promise<void> {
		if (this.db) return;

		if (this.initPromise) {
			await this.initPromise;
			return;
		}

		this.initPromise = this.openDatabase();
		await this.initPromise;
	}

	private openDatabase(): Promise<void> {
		return new Promise((resolve, reject) => {
			if (typeof window === 'undefined' || !window.indexedDB) {
				reject(new Error('IndexedDB not available'));
				return;
			}

			const request = indexedDB.open(this.dbName, this.dbVersion);

			request.onerror = () => {
				reject(new Error(`Failed to open IndexedDB: ${request.error?.message}`));
			};

			request.onsuccess = () => {
				this.db = request.result;
				resolve();
			};

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;

				// Create object store if it doesn't exist
				if (!db.objectStoreNames.contains(this.storeName)) {
					const store = db.createObjectStore(this.storeName, { keyPath: 'key' });

					// Create indexes for better querying
					store.createIndex('timestamp', 'timestamp');
					store.createIndex('version', 'version');
				}
			};
		});
	}

	private async getTransaction(mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
		await this.init();

		if (!this.db) {
			throw new Error('Database not initialized');
		}

		const transaction = this.db.transaction([this.storeName], mode);
		return transaction.objectStore(this.storeName);
	}

	async get<T>(key: string): Promise<T | null> {
		try {
			const store = await this.getTransaction('readonly');

			return new Promise((resolve, reject) => {
				const request = store.get(key);

				request.onsuccess = () => {
					const result = request.result;
					resolve(result ? result.value : null);
				};

				request.onerror = () => {
					reject(new Error(`IndexedDB get error: ${request.error?.message}`));
				};
			});
		} catch (error) {
			console.error(`IndexedDB get error for key "${key}":`, error);
			return null;
		}
	}

	async set<T>(key: string, value: T): Promise<void> {
		try {
			const store = await this.getTransaction('readwrite');

			const record = {
				key,
				value,
				timestamp: Date.now(),
				version: this.dbVersion
			};

			return new Promise((resolve, reject) => {
				const request = store.put(record);

				request.onsuccess = () => resolve();
				request.onerror = () => {
					reject(new Error(`IndexedDB set error: ${request.error?.message}`));
				};
			});
		} catch (error) {
			console.error(`IndexedDB set error for key "${key}":`, error);
			throw error;
		}
	}

	async remove(key: string): Promise<void> {
		try {
			const store = await this.getTransaction('readwrite');

			return new Promise((resolve, reject) => {
				const request = store.delete(key);

				request.onsuccess = () => resolve();
				request.onerror = () => {
					reject(new Error(`IndexedDB remove error: ${request.error?.message}`));
				};
			});
		} catch (error) {
			console.error(`IndexedDB remove error for key "${key}":`, error);
		}
	}

	async clear(): Promise<void> {
		try {
			const store = await this.getTransaction('readwrite');

			return new Promise((resolve, reject) => {
				const request = store.clear();

				request.onsuccess = () => resolve();
				request.onerror = () => {
					reject(new Error(`IndexedDB clear error: ${request.error?.message}`));
				};
			});
		} catch (error) {
			console.error('IndexedDB clear error:', error);
		}
	}

	async keys(): Promise<string[]> {
		try {
			const store = await this.getTransaction('readonly');

			return new Promise((resolve, reject) => {
				const request = store.getAllKeys();

				request.onsuccess = () => {
					const keys = request.result as string[];
					resolve(keys);
				};

				request.onerror = () => {
					reject(new Error(`IndexedDB keys error: ${request.error?.message}`));
				};
			});
		} catch (error) {
			console.error('IndexedDB keys error:', error);
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
		try {
			const store = await this.getTransaction('readonly');

			return new Promise((resolve, reject) => {
				const request = store.getAll();

				request.onsuccess = () => {
					const records = request.result;
					const used = JSON.stringify(records).length;
					const keys = records.length;

					// IndexedDB typically has much larger limits than localStorage
					const estimated = 50 * 1024 * 1024; // 50MB estimate
					const available = Math.max(0, estimated - used);

					resolve({ used, available, keys });
				};

				request.onerror = () => {
					reject(new Error(`IndexedDB usage info error: ${request.error?.message}`));
				};
			});
		} catch (error) {
			console.error('IndexedDB usage info error:', error);
			return { used: 0, available: 0, keys: 0 };
		}
	}

	/**
	 * Clean up old records
	 */
	async cleanup(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
		try {
			const store = await this.getTransaction('readwrite');
			const cutoffTime = Date.now() - maxAge;

			return new Promise((resolve, reject) => {
				const index = store.index('timestamp');
				const range = IDBKeyRange.upperBound(cutoffTime);
				const request = index.openCursor(range);

				request.onsuccess = (event) => {
					const cursor = (event.target as IDBRequest).result;

					if (cursor) {
						cursor.delete();
						cursor.continue();
					} else {
						resolve();
					}
				};

				request.onerror = () => {
					reject(new Error(`IndexedDB cleanup error: ${request.error?.message}`));
				};
			});
		} catch (error) {
			console.error('IndexedDB cleanup error:', error);
		}
	}

	/**
	 * Close the database connection
	 */
	close(): void {
		if (this.db) {
			this.db.close();
			this.db = null;
		}
		this.initPromise = null;
	}
}

// Export a default instance
export const indexedDBAdapter = new IndexedDBAdapter();
