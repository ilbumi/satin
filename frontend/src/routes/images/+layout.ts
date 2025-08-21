/**
 * Images route layout - preload image-specific dependencies
 */

export const prerender = false;

// Preload image-specific dependencies
export const load = async ({ fetch: _fetch, depends }) => {
	depends('images:layout');

	// Prefetch image components and dependencies
	const prefetchPromises = [
		// Image components
		import('$lib/components/images/ImageGallery.svelte').catch(() => null),
		import('$lib/components/images/VirtualImageGallery.svelte').catch(() => null),
		import('$lib/components/images/ImageThumbnail.svelte').catch(() => null),
		import('$lib/components/images/ImageViewer.svelte').catch(() => null),
		import('$lib/components/images/AddImageByUrl.svelte').catch(() => null),

		// Virtual components
		import('$lib/components/ui/VirtualGrid.svelte').catch(() => null),

		// Feature stores
		import('$lib/features/images/store.svelte').catch(() => null),
		import('$lib/features/tasks/store.svelte').catch(() => null)
	];

	// Don't wait for prefetch, let them load in background
	Promise.all(prefetchPromises).then(() => {
		console.debug('Image dependencies prefetched');
	});

	return {
		title: 'Images',
		description: 'Browse and manage your image collection'
	};
};
