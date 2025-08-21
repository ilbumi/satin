/**
 * Tasks route layout - preload task-specific dependencies
 */

export const prerender = false;

// Preload task-specific dependencies
export const load = async ({ fetch: _fetch, depends }) => {
	depends('tasks:layout');

	// Prefetch task components and dependencies
	const prefetchPromises = [
		// Task components
		import('$lib/components/tasks/TaskCard.svelte').catch(() => null),
		import('$lib/components/tasks/VirtualTaskList.svelte').catch(() => null),

		// Virtual components
		import('$lib/components/ui/VirtualList.svelte').catch(() => null),

		// Feature stores
		import('$lib/features/tasks/store.svelte').catch(() => null),
		import('$lib/features/projects/store.svelte').catch(() => null)
	];

	// Don't wait for prefetch, let them load in background
	Promise.all(prefetchPromises).then(() => {
		console.debug('Task dependencies prefetched');
	});

	return {
		title: 'Tasks',
		description: 'Manage your annotation tasks'
	};
};
