/**
 * Annotation route layout - preload heavy dependencies
 */

export const prerender = false;

// Preload annotation-specific dependencies
export const load = async ({ fetch: _fetch, depends }) => {
	depends('annotations:layout');

	// Prefetch critical components in parallel but don't wait for them
	// This allows the route to render while components load in background
	const prefetchPromises = [
		// Annotation canvas and tools
		import('$lib/components/annotations/AnnotationCanvas.svelte').catch(() => null),
		import('$lib/components/annotations/ToolPanel.svelte').catch(() => null),
		import('$lib/components/annotations/ImageAnnotator.svelte').catch(() => null),

		// Konva library (heavy)
		typeof window !== 'undefined' ? import('konva').catch(() => null) : Promise.resolve(null),

		// Feature stores
		import('$lib/features/annotations/store.svelte').catch(() => null),
		import('$lib/features/tasks/store.svelte').catch(() => null)
	];

	// Don't wait for prefetch, let them load in background
	Promise.all(prefetchPromises).then(() => {
		console.debug('Annotation dependencies prefetched');
	});

	return {
		title: 'Annotations',
		description: 'Create and manage image annotations'
	};
};
