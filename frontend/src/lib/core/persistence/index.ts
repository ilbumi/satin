/**
 * State persistence layer for Satin frontend
 * Provides configurable persistence with versioning and migration support
 */

export interface PersistenceAdapter {
	get<T>(key: string): Promise<T | null>;
	set<T>(key: string, value: T): Promise<void>;
	remove(key: string): Promise<void>;
	clear(): Promise<void>;
	keys(): Promise<string[]>;
}

export interface PersistenceConfig {
	key: string;
	version: number;
	adapter: PersistenceAdapter;
	migrations?: Record<number, (data: unknown) => unknown>;
	ttl?: number; // Time to live in milliseconds
	debounceMs?: number; // Debounce saves
}

export interface PersistedState<T> {
	version: number;
	data: T;
	timestamp: number;
	ttl?: number;
}

export class PersistenceManager<T> {
	private config: PersistenceConfig;
	private saveTimeout: number | null = null;

	constructor(config: PersistenceConfig) {
		this.config = config;
	}

	/**
	 * Load persisted state with version migration
	 */
	async load(): Promise<T | null> {
		try {
			const stored = await this.config.adapter.get<PersistedState<T>>(this.config.key);
			if (!stored) return null;

			// Check if data has expired
			if (stored.ttl && Date.now() - stored.timestamp > stored.ttl) {
				await this.clear();
				return null;
			}

			// Check if migration is needed
			if (stored.version < this.config.version) {
				return this.migrate(stored);
			}

			return stored.data;
		} catch (error) {
			console.error(`Failed to load persisted state for ${this.config.key}:`, error);
			return null;
		}
	}

	/**
	 * Save state with optional debouncing
	 */
	async save(data: T): Promise<void> {
		if (this.config.debounceMs) {
			if (this.saveTimeout) {
				(typeof window !== 'undefined' ? window.clearTimeout : clearTimeout)(this.saveTimeout);
			}

			// Safe timeout that works in both browser and Node environments
			this.saveTimeout = (typeof window !== 'undefined' ? window.setTimeout : setTimeout)(() => {
				this.performSave(data);
			}, this.config.debounceMs) as unknown as number;
		} else {
			await this.performSave(data);
		}
	}

	private async performSave(data: T): Promise<void> {
		try {
			const persistedState: PersistedState<T> = {
				version: this.config.version,
				data,
				timestamp: Date.now(),
				ttl: this.config.ttl
			};

			await this.config.adapter.set(this.config.key, persistedState);
		} catch (error) {
			console.error(`Failed to save persisted state for ${this.config.key}:`, error);
		}
	}

	/**
	 * Clear persisted state
	 */
	async clear(): Promise<void> {
		try {
			await this.config.adapter.remove(this.config.key);
		} catch (error) {
			console.error(`Failed to clear persisted state for ${this.config.key}:`, error);
		}
	}

	/**
	 * Migrate data from old version to current version
	 */
	private async migrate(stored: PersistedState<T>): Promise<T | null> {
		if (!this.config.migrations) {
			console.warn(`No migrations defined for ${this.config.key}, clearing old data`);
			await this.clear();
			return null;
		}

		try {
			let data = stored.data;
			let currentVersion = stored.version;

			// Apply migrations sequentially
			while (currentVersion < this.config.version) {
				const nextVersion = currentVersion + 1;
				const migration = this.config.migrations[nextVersion];

				if (!migration) {
					console.warn(`Missing migration for version ${nextVersion} in ${this.config.key}`);
					await this.clear();
					return null;
				}

				data = migration(data) as T;
				currentVersion = nextVersion;
			}

			// Save migrated data
			await this.save(data);
			return data;
		} catch (error) {
			console.error(`Migration failed for ${this.config.key}:`, error);
			await this.clear();
			return null;
		}
	}

	/**
	 * Get storage info
	 */
	async getInfo(): Promise<{
		exists: boolean;
		version?: number;
		timestamp?: number;
		size?: number;
	}> {
		try {
			const stored = await this.config.adapter.get<PersistedState<T>>(this.config.key);
			if (!stored) return { exists: false };

			return {
				exists: true,
				version: stored.version,
				timestamp: stored.timestamp,
				size: JSON.stringify(stored).length
			};
		} catch {
			return { exists: false };
		}
	}
}

/**
 * Create a persistence manager with default configuration
 */
export function createPersistenceManager<T>(
	key: string,
	adapter: PersistenceAdapter,
	options: {
		version?: number;
		migrations?: Record<number, (data: unknown) => unknown>;
		ttl?: number;
		debounceMs?: number;
	} = {}
): PersistenceManager<T> {
	return new PersistenceManager<T>({
		key,
		adapter,
		version: options.version || 1,
		migrations: options.migrations,
		ttl: options.ttl,
		debounceMs: options.debounceMs || 300
	});
}

/**
 * Persistence utility for Svelte stores
 */
export function withPersistence<T>(
	initialState: T,
	persistenceManager: PersistenceManager<T>,
	onChange?: (state: T) => void
): {
	state: T;
	load: () => Promise<void>;
	save: (state: T) => Promise<void>;
	clear: () => Promise<void>;
} {
	let state = initialState;

	const load = async () => {
		const loaded = await persistenceManager.load();
		if (loaded !== null) {
			state = loaded;
			onChange?.(state);
		}
	};

	const save = async (newState: T) => {
		state = newState;
		await persistenceManager.save(state);
	};

	const clear = async () => {
		await persistenceManager.clear();
		state = initialState;
		onChange?.(state);
	};

	return { state, load, save, clear };
}
