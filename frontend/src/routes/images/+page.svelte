<script lang="ts">
	import { queryStore, getContextClient } from '@urql/svelte';
	import ImageGrid from '$lib/components/ImageGrid.svelte';
	import ImageFilter from '$lib/components/ImageFilter.svelte';
	import AddImageDialog from '$lib/components/AddImageDialog.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import { showSuccess, showError } from '$lib/stores/toast.svelte';
	import {
		GET_IMAGES,
		UPDATE_IMAGE,
		DELETE_IMAGE,
		type GetImagesQuery,
		type ImageUpdateInput
	} from '$lib/graphql/operations/images';
	import { handleDeleteResult, handleMutationResult } from '$lib/utils/graphql-errors';

	let searchQuery = $state('');
	let selectedStatuses = $state<string[]>(['NEW', 'ANNOTATED', 'NEEDS_REANNOTATION']);
	let sortBy = $state('createdAt');
	let sortOrder = $state<'asc' | 'desc'>('desc');
	let currentPage = $state(1);
	let itemsPerPage = $state(12);
	let showAddImageDialog = $state(false);

	// GraphQL stores and client
	const client = getContextClient();
	const imagesQuery = queryStore<GetImagesQuery>({
		query: GET_IMAGES,
		client
	});

	// Reactive data from GraphQL
	let images = $derived($imagesQuery.data?.images?.items || []);
	let loading = $derived($imagesQuery.fetching);
	let error = $derived($imagesQuery.error);
	let totalImages = $derived($imagesQuery.data?.images?.totalCount || 0);

	// Handle GraphQL errors
	$effect(() => {
		if (error) {
			showError(`Failed to load images: ${error.message}`);
		}
	});

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

	let paginatedImages = $derived(() => {
		const startIndex = (currentPage - 1) * itemsPerPage;
		return filteredImages()
			.slice(startIndex, startIndex + itemsPerPage)
			.map((img) => ({
				id: img.id,
				url: img.url,
				width: img.width ?? undefined,
				height: img.height ?? undefined,
				status: img.status,
				createdAt: img.createdAt,
				updatedAt: img.updatedAt,
				ext: img.ext ?? undefined
			}));
	});

	function handleAddImage() {
		showAddImageDialog = true;
	}

	function handleSearchChange(query: string) {
		searchQuery = query;
		currentPage = 1; // Reset to first page when searching
	}

	function handleStatusFilterChange(statuses: string[]) {
		selectedStatuses = statuses as Array<'NEW' | 'ANNOTATED' | 'NEEDS_REANNOTATION'>;
		currentPage = 1; // Reset to first page when filtering
	}

	function handleSortChange(newSortBy: string, newSortOrder: 'asc' | 'desc') {
		// Map frontend field names to backend field names
		const fieldMap: Record<string, string> = {
			createdAt: 'created_at',
			updatedAt: 'updated_at',
			url: 'url',
			status: 'status'
		};
		sortBy = fieldMap[newSortBy] || newSortBy;
		sortOrder = newSortOrder === 'asc' ? 'asc' : 'desc';
		currentPage = 1; // Reset to first page when sorting
	}

	function handleClearFilters() {
		searchQuery = '';
		selectedStatuses = ['NEW', 'ANNOTATED', 'NEEDS_REANNOTATION'];
		sortBy = 'created_at';
		sortOrder = 'desc';
		currentPage = 1;
	}

	async function handleImageStatusChange(
		imageId: string,
		newStatus: 'NEW' | 'ANNOTATED' | 'NEEDS_REANNOTATION'
	) {
		try {
			const input: ImageUpdateInput = { status: newStatus };
			const result = await client
				.mutation(UPDATE_IMAGE, {
					id: imageId,
					input
				})
				.toPromise();

			const mutationResult = handleMutationResult<ImageData>(result, 'updateImage');

			if (mutationResult.success) {
				// Cache will automatically update due to normalized caching
				showSuccess(`Image status updated to ${newStatus.replace('_', ' ')}`);
			} else {
				showError(mutationResult.error || 'Failed to update image status');
			}
		} catch (err) {
			showError(
				`Failed to update image status: ${err instanceof Error ? err.message : 'Unknown error'}`
			);
		}
	}

	async function handleDeleteImage(imageId: string) {
		if (!confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
			return;
		}

		try {
			const result = await client.mutation(DELETE_IMAGE, { id: imageId }).toPromise();
			const deleteResult = handleDeleteResult(result, 'deleteImage');

			if (deleteResult.success) {
				// Cache will automatically update due to cache configuration
				showSuccess(deleteResult.message);
			} else {
				showError(deleteResult.message);
			}
		} catch (err) {
			showError(`Failed to delete image: ${err instanceof Error ? err.message : 'Unknown error'}`);
		}
	}

	function handleAddImageSubmit() {
		// This will be called by AddImageDialog after successful image creation
		// Cache will automatically update due to cache configuration
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
			<div class="flex items-center">
				<div
					class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"
				></div>
				Loading images...
			</div>
		{:else if error}
			<div class="flex items-center text-red-600">
				<svg class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
					/>
				</svg>
				Failed to load images
			</div>
		{:else if totalImages > 0}
			Showing {Math.min(paginatedImages().length, itemsPerPage)} of {totalImages} images
			{#if searchQuery || selectedStatuses.length < 3}
				(filtered)
			{/if}
		{:else}
			No images found
		{/if}
	</div>

	<!-- Images Grid -->
	<div class="mb-6">
		{#if error}
			<!-- Error State -->
			<div class="rounded-lg bg-red-50 p-8 text-center">
				<svg
					class="mx-auto mb-4 h-16 w-16 text-red-400"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
					/>
				</svg>
				<h3 class="mb-2 text-lg font-semibold text-red-800">Unable to load images</h3>
				<p class="mb-4 text-red-600">{error.message}</p>
				<button
					onclick={() => imagesQuery.reexecute({ requestPolicy: 'network-only' })}
					class="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:outline-none"
				>
					Try Again
				</button>
			</div>
		{:else}
			<ImageGrid
				images={paginatedImages()}
				{loading}
				onStatusChange={handleImageStatusChange}
				onDelete={handleDeleteImage}
				onAddImage={handleAddImage}
			/>
		{/if}
	</div>

	<!-- Pagination -->
	{#if !loading && totalImages > 0}
		<Pagination
			{currentPage}
			totalItems={totalImages}
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
