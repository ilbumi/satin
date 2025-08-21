/**
 * Enhanced URQL cache configuration with graphcache
 * Provides normalized caching and proper cache invalidation
 */

import { cacheExchange, type CacheExchangeOpts } from '@urql/exchange-graphcache';
import type { UpdatesConfig, ResolverConfig, KeyingConfig, Cache } from '@urql/exchange-graphcache';

/**
 * Cache key generation for entities
 */
const keys: KeyingConfig = {
	Project: (data: unknown) => (data as { id: string }).id,
	Image: (data: unknown) => (data as { id: string }).id,
	Task: (data: unknown) => (data as { id: string }).id,
	Annotation: (data: unknown) => (data as { id: string }).id
};

/**
 * Cache resolvers for client-side field resolution
 */
const resolvers: ResolverConfig = {
	Query: {
		// Resolve paginated queries from cached entities
		projects: (_parent: unknown, _args: unknown, _cache: unknown, _info: unknown) => {
			// For simple cases, let the default behavior handle it
			return undefined;
		},

		images: (_parent: unknown, _args: unknown, _cache: unknown, _info: unknown) => {
			// For simple cases, let the default behavior handle it
			return undefined;
		}
	}
};

/**
 * Cache update handlers for mutations
 */
const updates: UpdatesConfig = {
	Mutation: {
		// Project mutations
		createProject: (result: unknown, _args: unknown, cache: Cache, _info: unknown) => {
			// Add new project to the projects list
			cache.updateQuery({ query: 'projects' }, (data: unknown) => {
				const typedData = data as {
					projects?: { objects: unknown[]; totalCount: number; count: number; hasMore: boolean };
				};
				const typedResult = result as { createProject?: unknown };
				if (typedData?.projects?.objects && typedResult.createProject) {
					return {
						...typedData,
						projects: {
							...typedData.projects,
							objects: [typedResult.createProject, ...typedData.projects.objects],
							totalCount: typedData.projects.totalCount + 1,
							count: typedData.projects.count + 1,
							hasMore: typedData.projects.hasMore
						}
					};
				}
				return data;
			});
		},

		updateProject: (result: unknown, _args: unknown, _cache: unknown, _info: unknown) => {
			const typedResult = result as { updateProject?: unknown };
			if (typedResult.updateProject) {
				// The cache will automatically update the entity due to normalization
				// No additional work needed
			}
		},

		deleteProject: (result: unknown, args: unknown, cache: Cache, _info: unknown) => {
			const typedResult = result as { deleteProject?: boolean };
			const typedArgs = args as { id: string };
			if (typedResult.deleteProject && typedArgs.id) {
				// Remove from projects list
				cache.updateQuery({ query: 'projects' }, (data: unknown) => {
					const typedData = data as {
						projects?: { objects: { id: string }[]; totalCount: number; count: number };
					};
					if (typedData?.projects?.objects) {
						return {
							...typedData,
							projects: {
								...typedData.projects,
								objects: typedData.projects.objects.filter((p) => p.id !== typedArgs.id),
								totalCount: Math.max(0, typedData.projects.totalCount - 1),
								count: Math.max(0, typedData.projects.count - 1)
							}
						};
					}
					return data;
				});

				// Invalidate the individual project query
				cache.invalidate('Query', 'project', { id: typedArgs.id });
			}
		},

		// Image mutations
		createImage: (result: unknown, _args: unknown, cache: Cache, _info: unknown) => {
			const typedResult = result as { createImage?: unknown };
			if (typedResult.createImage) {
				// Add new image to the images list
				cache.updateQuery({ query: 'images' }, (data: unknown) => {
					const typedData = data as {
						images?: { objects: unknown[]; totalCount: number; count: number; hasMore: boolean };
					};
					if (typedData?.images?.objects) {
						return {
							...typedData,
							images: {
								...typedData.images,
								objects: [typedResult.createImage, ...typedData.images.objects],
								totalCount: typedData.images.totalCount + 1,
								count: typedData.images.count + 1,
								hasMore: typedData.images.hasMore
							}
						};
					}
					return data;
				});
			}
		},

		deleteImage: (result: unknown, args: unknown, cache: Cache, _info: unknown) => {
			const typedResult = result as { deleteImage?: boolean };
			const typedArgs = args as { id: string };
			if (typedResult.deleteImage && typedArgs.id) {
				// Remove from images list
				cache.updateQuery({ query: 'images' }, (data: unknown) => {
					const typedData = data as {
						images?: { objects: { id: string }[]; totalCount: number; count: number };
					};
					if (typedData?.images?.objects) {
						return {
							...typedData,
							images: {
								...typedData.images,
								objects: typedData.images.objects.filter((img) => img.id !== typedArgs.id),
								totalCount: Math.max(0, typedData.images.totalCount - 1),
								count: Math.max(0, typedData.images.count - 1)
							}
						};
					}
					return data;
				});

				// Invalidate related queries
				cache.invalidate('Query', 'image', { id: typedArgs.id });
			}
		},

		// Task mutations
		createTask: (result: unknown, _args: unknown, cache: Cache, _info: unknown) => {
			const typedResult = result as { createTask?: unknown };
			if (typedResult.createTask) {
				// Add new task to tasks list
				cache.updateQuery({ query: 'tasks' }, (data: unknown) => {
					const typedData = data as {
						tasks?: { objects: unknown[]; totalCount: number; count: number; hasMore: boolean };
					};
					if (typedData?.tasks?.objects) {
						return {
							...typedData,
							tasks: {
								...typedData.tasks,
								objects: [typedResult.createTask, ...typedData.tasks.objects],
								totalCount: typedData.tasks.totalCount + 1,
								count: typedData.tasks.count + 1,
								hasMore: typedData.tasks.hasMore
							}
						};
					}
					return data;
				});
			}
		},

		updateTask: (result: unknown, _args: unknown, cache: Cache, _info: unknown) => {
			// Task updates are handled automatically by normalization
			const typedResult = result as { updateTask?: unknown };
			if (typedResult.updateTask) {
				// Optionally invalidate related queries if needed
				cache.invalidate('Query', 'tasks');
			}
		},

		deleteTask: (result: unknown, args: unknown, cache: Cache, _info: unknown) => {
			const typedResult = result as { deleteTask?: boolean };
			const typedArgs = args as { id: string };
			if (typedResult.deleteTask && typedArgs.id) {
				// Remove from tasks list
				cache.updateQuery({ query: 'tasks' }, (data: unknown) => {
					const typedData = data as {
						tasks?: { objects: { id: string }[]; totalCount: number; count: number };
					};
					if (typedData?.tasks?.objects) {
						return {
							...typedData,
							tasks: {
								...typedData.tasks,
								objects: typedData.tasks.objects.filter((task) => task.id !== typedArgs.id),
								totalCount: Math.max(0, typedData.tasks.totalCount - 1),
								count: Math.max(0, typedData.tasks.count - 1)
							}
						};
					}
					return data;
				});

				// Invalidate the individual task query
				cache.invalidate('Query', 'task', { id: typedArgs.id });
			}
		},

		// Annotation mutations (task updates that affect annotations)
		saveTaskAnnotations: (result: unknown, args: unknown, cache: Cache, _info: unknown) => {
			const typedResult = result as { saveTaskAnnotations?: boolean };
			const typedArgs = args as { taskId: string };
			if (typedResult.saveTaskAnnotations) {
				// Invalidate task queries to reflect updated annotation counts
				cache.invalidate('Query', 'task', { id: typedArgs.taskId });
				cache.invalidate('Query', 'tasks');
			}
		}
	}
};

/**
 * Cache configuration optimizations
 */
const optimizations: Partial<CacheExchangeOpts> = {
	// Schema awareness for better optimization
	schema: undefined, // Can be populated with introspection results

	// Storage for persistence (can be extended)
	storage: undefined
};

/**
 * Create enhanced cache exchange configuration
 */
export function createEnhancedCacheExchange() {
	return cacheExchange({
		keys,
		resolvers,
		updates,
		...optimizations
	});
}

/**
 * Cache utility functions for manual cache operations
 */
export const cacheUtils = {
	/**
	 * Invalidate all queries for a specific entity type
	 */
	invalidateEntityQueries: (cache: Cache, entityType: string) => {
		cache.invalidate('Query', entityType);
		cache.invalidate('Query', `${entityType}s`); // plural form
	},

	/**
	 * Invalidate queries by pattern
	 */
	invalidatePattern: (cache: Cache, pattern: string) => {
		// This would need to be implemented based on specific needs
		// For now, we'll invalidate common queries
		['projects', 'images', 'tasks'].forEach((queryName) => {
			if (queryName.includes(pattern.toLowerCase())) {
				cache.invalidate('Query', queryName);
			}
		});
	},

	/**
	 * Clear all cache entries
	 */
	clearCache: (cache: Cache) => {
		// This is a destructive operation - use with caution
		cache.invalidate('Query');
	}
};
