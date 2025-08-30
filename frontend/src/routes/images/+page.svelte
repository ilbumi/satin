<script lang="ts">
	import { onMount } from 'svelte';
	import { getContextClient } from '@urql/svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import { showSuccess, showError } from '$lib/stores/toast.svelte';
	import {
		GET_IMAGES,
		UPDATE_IMAGE,
		DELETE_IMAGE,
		type ImageUpdateInput,
		type ImageFilterInput
	} from '$lib/graphql/operations/images';
	import type { ImageStatus, Image } from '$lib/graphql/generated';
	import { handleDeleteResult, handleMutationResult } from '$lib/utils/graphql-errors';
	import ImageGrid from '$lib/components/ImageGrid.svelte';
	import ImageFilter from '$lib/components/ImageFilter.svelte';
	import AddImageDialog from '$lib/components/AddImageDialog.svelte';

	let componentsLoading = $state(false);

	let searchQuery = $state('');
	let selectedStatuses = $state<ImageStatus[]>(['NEW', 'ANNOTATED', 'NEEDS_REANNOTATION']);
	let sortBy = $state('createdAt');
	let sortOrder = $state<'asc' | 'desc'>('desc');
	let currentPage = $state(1);
	let itemsPerPage = $state(12);
	let showAddImageDialog = $state(false);

	// GraphQL stores and client
	const client = getContextClient();

	// GraphQL query state
	let queryResult = $state<{
		data?: { images?: { items?: Image[]; totalCount?: number } };
	} | null>(null);
	let loading = $state(true);
	let error = $state<Error | null>(null);

	// Build query variables reactively
	const buildVariables = () => {
		const filter: ImageFilterInput = {};

		// Only add status filter if not all statuses are selected
		if (selectedStatuses.length < 3) {
			filter.statuses = selectedStatuses;
		}

		// Add search filter
		if (searchQuery.trim()) {
			filter.urlContains = searchQuery.trim();
		}

		// Build sort
		const sort = {
			field: sortBy,
			order: sortOrder.toUpperCase() as 'ASC' | 'DESC'
		};

		// Build pagination
		const pagination = {
			limit: itemsPerPage,
			offset: (currentPage - 1) * itemsPerPage
		};

		return {
			filter: Object.keys(filter).length > 0 ? filter : undefined,
			sort,
			pagination
		};
	};

	// Execute query function
	const executeQuery = async () => {
		try {
			loading = true;
			const variables = buildVariables();
			const result = await client.query(GET_IMAGES, variables).toPromise();
			queryResult = result;
			error = null;
		} catch (err) {
			error = err instanceof Error ? err : new Error(String(err));
			queryResult = null;
		} finally {
			loading = false;
			initialLoadComplete = true;
		}
	};

	// Load data on mount
	onMount(() => {
		executeQuery();
	});

	// Track if initial load is complete
	let initialLoadComplete = $state(false);

	// Re-execute query when filters change
	$effect(() => {
		// Watch for changes in filter/sort parameters
		// These dependencies are tracked by the reactive system
		void [searchQuery, selectedStatuses, sortBy, sortOrder, currentPage, itemsPerPage];

		// Re-execute query (skip initial run on mount)
		if (initialLoadComplete) {
			executeQuery();
		}
	});

	// Reactive data
	let images = $derived(queryResult?.data?.images?.items || []);
	let totalImages = $derived(queryResult?.data?.images?.totalCount || 0);

	// Handle GraphQL errors
	let lastErrorMessage = $state<string | null>(null);

	$effect(() => {
		if (error && error.message !== lastErrorMessage) {
			lastErrorMessage = error.message;
			showError(`Failed to load images: ${error.message}`);
		}
	});

	// No need for displayImages transformation - use images directly

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

			const mutationResult = handleMutationResult<Image>(result, 'updateImage');

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
		{#if componentsLoading}
			<div class="rounded-lg bg-white p-6 shadow">
				<div class="flex items-center justify-center">
					<LoadingSpinner size="sm" />
					<span class="ml-3 text-gray-600">Loading filters...</span>
				</div>
			</div>
		{:else if ImageFilter}
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
		{/if}
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
			Showing {images.length} of {totalImages} images
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
					onclick={() => executeQuery()}
					class="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:outline-none"
				>
					Try Again
				</button>
			</div>
		{:else if componentsLoading}
			<div class="flex items-center justify-center py-12">
				<LoadingSpinner size="lg" />
				<span class="ml-3 text-gray-600">Loading image grid...</span>
			</div>
		{:else if ImageGrid}
			<ImageGrid
				{images}
				{loading}
				onStatusChange={handleImageStatusChange}
				onDelete={handleDeleteImage}
				onAddImage={handleAddImage}
			/>
		{/if}
	</div>

	<!-- Pagination -->
	{#if !loading && totalImages > itemsPerPage}
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
{#if AddImageDialog}
	<AddImageDialog
		open={showAddImageDialog}
		onClose={() => (showAddImageDialog = false)}
		onSubmit={handleAddImageSubmit}
	/>
{/if}
