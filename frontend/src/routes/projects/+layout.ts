/**
 * Projects route layout - preload project-specific dependencies
 */

export const prerender = false;

// Preload project-specific dependencies
export const load = async ({ fetch: _fetch, depends }) => {
	depends('projects:layout');

	// Prefetch project components and dependencies
	const prefetchPromises = [
		// Project components
		import('$lib/components/projects/ProjectCard.svelte').catch(() => null),
		import('$lib/components/projects/VirtualProjectList.svelte').catch(() => null),

		// Virtual components
		import('$lib/components/ui/VirtualList.svelte').catch(() => null),

		// Feature stores
		import('$lib/features/projects/store.svelte').catch(() => null)
	];

	// Don't wait for prefetch, let them load in background
	Promise.all(prefetchPromises).then(() => {
		console.debug('Project dependencies prefetched');
	});

	return {
		title: 'Projects',
		description: 'Organize your annotation projects'
	};
};
