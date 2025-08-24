<script lang="ts">
	import { onMount } from 'svelte';
	import ImageGrid from '$lib/components/ImageGrid.svelte';
	import ImageFilter from '$lib/components/ImageFilter.svelte';
	import AddImageDialog from '$lib/components/AddImageDialog.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import { showSuccess } from '$lib/stores/toast';

	let searchQuery = $state('');
	let selectedStatuses = $state<string[]>(['new', 'annotated', 'needs_reannotation']);
	let sortBy = $state('created_at');
	let sortOrder = $state<'asc' | 'desc'>('desc');
	let currentPage = $state(1);
	let itemsPerPage = $state(12);
	let showAddImageDialog = $state(false);

	// Mock data for now - will be replaced with GraphQL
	interface ImageData {
		id: string;
		url: string;
		width?: number;
		height?: number;
		status: 'new' | 'annotated' | 'needs_reannotation';
		created_at: string;
	}

	let images = $state<ImageData[]>([]);
	let totalImages = $state(0);
	let loading = $state(true);

	// Mock image data for demonstration
	const mockImages = [
		{
			id: '1',
			url: 'https://picsum.photos/400/300?random=1',
			width: 400,
			height: 300,
			status: 'new' as const,
			created_at: '2025-01-15T10:00:00Z'
		},
		{
			id: '2',
			url: 'https://picsum.photos/500/400?random=2',
			width: 500,
			height: 400,
			status: 'annotated' as const,
			created_at: '2025-01-14T15:30:00Z'
		},
		{
			id: '3',
			url: 'https://picsum.photos/600/350?random=3',
			width: 600,
			height: 350,
			status: 'needs_reannotation' as const,
			created_at: '2025-01-13T08:45:00Z'
		},
		{
			id: '4',
			url: 'https://picsum.photos/450/320?random=4',
			width: 450,
			height: 320,
			status: 'new' as const,
			created_at: '2025-01-12T14:20:00Z'
		},
		{
			id: '5',
			url: 'https://picsum.photos/380/280?random=5',
			width: 380,
			height: 280,
			status: 'annotated' as const,
			created_at: '2025-01-11T09:15:00Z'
		},
		{
			id: '6',
			url: 'https://picsum.photos/520/390?random=6',
			width: 520,
			height: 390,
			status: 'new' as const,
			created_at: '2025-01-10T16:45:00Z'
		}
	];

	let filteredImages = $derived(() => {
		let filtered = [...images];

		// Apply search filter
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase().trim();
			filtered = filtered.filter(
				(img) =>
					img.url.toLowerCase().includes(query) ||
					new URL(img.url).pathname.toLowerCase().includes(query)
			);
		}

		// Apply status filter
		if (selectedStatuses.length < 3) {
			filtered = filtered.filter((img) => selectedStatuses.includes(img.status));
		}

		// Apply sorting
		filtered.sort((a, b) => {
			let aValue: string | number = a[sortBy as keyof typeof a] as string | number;
			let bValue: string | number = b[sortBy as keyof typeof b] as string | number;

			if (typeof aValue === 'string') aValue = aValue.toLowerCase();
			if (typeof bValue === 'string') bValue = bValue.toLowerCase();

			if (sortOrder === 'asc') {
				return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
			} else {
				return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
			}
		});

		return filtered;
	});

	let paginatedImages = $derived((): ImageData[] => {
		const startIndex = (currentPage - 1) * itemsPerPage;
		return filteredImages().slice(startIndex, startIndex + itemsPerPage);
	});

	onMount(() => {
		// Simulate loading with mock data
		setTimeout(() => {
			images = mockImages;
			totalImages = mockImages.length;
			loading = false;
		}, 1000);
	});

	function handleAddImage() {
		showAddImageDialog = true;
	}

	function handleSearchChange(query: string) {
		searchQuery = query;
		currentPage = 1; // Reset to first page when searching
	}

	function handleStatusFilterChange(statuses: string[]) {
		selectedStatuses = statuses;
		currentPage = 1; // Reset to first page when filtering
	}

	function handleSortChange(newSortBy: string, newSortOrder: 'asc' | 'desc') {
		sortBy = newSortBy;
		sortOrder = newSortOrder;
		currentPage = 1; // Reset to first page when sorting
	}

	function handleClearFilters() {
		searchQuery = '';
		selectedStatuses = ['new', 'annotated', 'needs_reannotation'];
		sortBy = 'created_at';
		sortOrder = 'desc';
		currentPage = 1;
	}

	function handleImageStatusChange(
		imageId: string,
		newStatus: 'new' | 'annotated' | 'needs_reannotation'
	) {
		images = images.map((img) => (img.id === imageId ? { ...img, status: newStatus } : img));
		showSuccess(`Image status updated to ${newStatus.replace('_', ' ')}`);
	}

	function handleDeleteImage(imageId: string) {
		images = images.filter((img) => img.id !== imageId);
		totalImages = images.length;
		showSuccess('Image deleted successfully');
	}

	async function handleAddImageSubmit(imageUrl: string) {
		const newImage = {
			id: Date.now().toString(),
			url: imageUrl,
			width: undefined,
			height: undefined,
			status: 'new' as const,
			created_at: new Date().toISOString()
		};

		images = [newImage, ...images];
		totalImages = images.length;
	}
</script>

<svelte:head>
	<title>Images - Satin</title>
</svelte:head>

<div class="mx-auto max-w-7xl">
	<!-- Header -->
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-800">Images</h1>
			<p class="mt-2 text-gray-600">Manage your image dataset for annotation</p>
		</div>

		<button
			onclick={handleAddImage}
			class="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
		>
			<svg class="mr-2 inline h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			Add Image
		</button>
	</div>

	<!-- Filters Section -->
	<div class="mb-6">
		<ImageFilter
			{searchQuery}
			{selectedStatuses}
			{sortBy}
			{sortOrder}
			onSearchChange={handleSearchChange}
			onStatusChange={handleStatusFilterChange}
			onSortChange={handleSortChange}
			onClearFilters={handleClearFilters}
		/>
	</div>

	<!-- Results Summary -->
	<div class="mb-4 text-sm text-gray-600">
		{#if loading}
			Loading images...
		{:else}
			Showing {paginatedImages().length} of {filteredImages().length} images
			{#if filteredImages().length !== totalImages}
				(filtered from {totalImages} total)
			{/if}
		{/if}
	</div>

	<!-- Images Grid -->
	<div class="mb-6">
		<ImageGrid
			images={paginatedImages()}
			{loading}
			onStatusChange={handleImageStatusChange}
			onDelete={handleDeleteImage}
			onAddImage={handleAddImage}
		/>
	</div>

	<!-- Pagination -->
	{#if !loading && filteredImages().length > 0}
		<Pagination
			{currentPage}
			totalItems={filteredImages().length}
			{itemsPerPage}
			onPageChange={(page) => (currentPage = page)}
			onItemsPerPageChange={(newItemsPerPage) => {
				itemsPerPage = newItemsPerPage;
				currentPage = 1;
			}}
		/>
	{/if}
</div>

<!-- Add Image Dialog -->
<AddImageDialog
	open={showAddImageDialog}
	onClose={() => (showAddImageDialog = false)}
	onSubmit={handleAddImageSubmit}
/>
