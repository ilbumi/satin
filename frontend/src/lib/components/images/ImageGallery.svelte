<script lang="ts">
	import { Button, Card, Input, Select, Spinner } from '$lib/components/ui';
	import ImageThumbnail from './ImageThumbnail.svelte';
	import type { ImageSummary, ImageFilters } from '$lib/features/images/types';
	import type { SelectOption } from '$lib/components/ui';
	import { SvelteSet } from 'svelte/reactivity';

	interface ImageGalleryProps {
		images: ImageSummary[];
		loading?: boolean;
		error?: string | null;
		filters?: ImageFilters;
		pagination?: {
			limit: number;
			offset: number;
			totalCount: number;
			hasMore: boolean;
		};
		selectable?: boolean;
		showSearch?: boolean;
		showFilters?: boolean;
		onImageClick?: (image: ImageSummary) => void;
		onImageView?: (image: ImageSummary) => void;
		onImageDelete?: (image: ImageSummary) => void;
		onImageAnnotate?: (image: ImageSummary) => void;
		onFiltersChange?: (filters: Partial<ImageFilters>) => void;
		onLoadMore?: () => void;
		onSelectionChange?: (selectedImages: ImageSummary[]) => void;
	}

	let {
		images,
		loading = false,
		error = null,
		filters,
		pagination,
		selectable = false,
		showSearch = true,
		showFilters = true,
		onImageClick,
		onImageView,
		onImageDelete,
		onImageAnnotate,
		onFiltersChange,
		onLoadMore,
		onSelectionChange
	}: ImageGalleryProps = $props();

	// SvelteSet is inherently reactive, no $state() wrapper needed
	// svelte-ignore non_reactive_update
	let selectedImages = new SvelteSet<string>();
	let searchQuery = $state(filters?.search || '');

	// Filter options
	const statusOptions: SelectOption[] = [
		{ value: 'all', label: 'All Status' },
		{ value: 'ready', label: 'Ready' },
		{ value: 'annotated', label: 'Annotated' },
		{ value: 'processing', label: 'Processing' },
		{ value: 'pending', label: 'Pending' },
		{ value: 'error', label: 'Error' }
	];

	// Debounced search handler
	let searchTimeout: number | null = null;
	function handleSearchChange(value: string) {
		searchQuery = value;

		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}

		searchTimeout = window.setTimeout(() => {
			onFiltersChange?.({ search: value });
		}, 300);
	}

	function handleStatusFilter(status: string) {
		onFiltersChange?.({ status: status as ImageFilters['status'] });
	}

	function handleImageSelect(image: ImageSummary, selected: boolean) {
		if (selected) {
			selectedImages.add(image.id);
		} else {
			selectedImages.delete(image.id);
		}
		selectedImages = new SvelteSet(selectedImages);

		// Notify parent of selection change
		const selectedImageObjects = images.filter((img) => selectedImages.has(img.id));
		onSelectionChange?.(selectedImageObjects);
	}

	function selectAll() {
		images.forEach((img) => selectedImages.add(img.id));
		selectedImages = new SvelteSet(selectedImages);
		onSelectionChange?.(images);
	}

	function clearSelection() {
		selectedImages.clear();
		selectedImages = new SvelteSet(selectedImages);
		onSelectionChange?.([]);
	}

	function handleBulkDelete() {
		const selectedImageObjects = images.filter((img) => selectedImages.has(img.id));
		if (selectedImageObjects.length === 0) return;

		const message = `Delete ${selectedImageObjects.length} selected image${selectedImageObjects.length > 1 ? 's' : ''}?`;
		if (confirm(message)) {
			selectedImageObjects.forEach((image) => {
				onImageDelete?.(image);
			});
			clearSelection();
		}
	}

	// Grid layout options
	const gridSizeOptions: SelectOption[] = [
		{ value: 'sm', label: 'Small' },
		{ value: 'md', label: 'Medium' },
		{ value: 'lg', label: 'Large' }
	];

	let gridSize = $state<'sm' | 'md' | 'lg'>('md');

	const gridClasses = {
		sm: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8',
		md: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
		lg: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
	};
</script>

<div class="space-y-6">
	<!-- Header with search, filters, and actions -->
	<div class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
		<div class="flex-1 space-y-4 sm:flex sm:space-y-0 sm:space-x-4">
			<!-- Search -->
			{#if showSearch}
				<div class="max-w-md flex-1">
					<Input
						type="search"
						placeholder="Search images..."
						value={searchQuery}
						oninput={(e: Event) => handleSearchChange((e.target as HTMLInputElement).value)}
						class="w-full"
					/>
				</div>
			{/if}

			<!-- Filters -->
			{#if showFilters}
				<div class="flex space-x-2">
					<Select
						options={statusOptions}
						value={filters?.status || 'all'}
						onchange={(e: Event) => handleStatusFilter((e.target as HTMLSelectElement).value)}
						placeholder="Filter by status"
						class="w-40"
					/>

					<Select
						options={gridSizeOptions}
						bind:value={gridSize}
						placeholder="Grid size"
						class="w-32"
					/>
				</div>
			{/if}
		</div>

		<!-- Actions -->
		<div class="flex items-center space-x-3">
			{#if selectable && selectedImages.size > 0}
				<div class="flex items-center space-x-2">
					<span class="text-sm text-gray-600">
						{selectedImages.size} selected
					</span>
					<Button variant="secondary" size="sm" onclick={handleBulkDelete}>
						🗑️ Delete Selected
					</Button>
					<Button variant="ghost" size="sm" onclick={clearSelection}>Clear</Button>
				</div>
			{:else if selectable}
				<Button variant="ghost" size="sm" onclick={selectAll}>Select All</Button>
			{/if}
		</div>
	</div>

	<!-- Stats -->
	{#if pagination}
		<div class="flex items-center justify-between text-sm text-gray-600">
			<div>
				Showing {Math.min(pagination.offset + 1, pagination.totalCount)}–{Math.min(
					pagination.offset + pagination.limit,
					pagination.totalCount
				)} of {pagination.totalCount} images
			</div>
			{#if selectable}
				<div>
					{selectedImages.size} selected
				</div>
			{/if}
		</div>
	{/if}

	<!-- Error state -->
	{#if error}
		<Card class="p-6">
			<div class="text-center">
				<div class="mb-4 text-4xl text-red-500">⚠️</div>
				<h3 class="mb-2 text-lg font-medium text-gray-900">Error Loading Images</h3>
				<p class="mb-4 text-gray-600">{error}</p>
				<Button variant="secondary" onclick={() => window.location.reload()}>Try Again</Button>
			</div>
		</Card>
	{:else if loading && images.length === 0}
		<!-- Loading state -->
		<div class="grid {gridClasses[gridSize]} gap-4">
			{#each Array.from({ length: 8 }, (_, i) => i) as index (index)}
				<div
					class="aspect-[4/3] animate-pulse rounded-lg bg-gray-200"
					class:opacity-75={index % 2 === 0}
				></div>
			{/each}
		</div>
	{:else if images.length === 0}
		<!-- Empty state -->
		<Card class="p-12">
			<div class="text-center">
				<div class="mb-4 text-6xl text-gray-300">🖼️</div>
				<h3 class="mb-2 text-lg font-medium text-gray-900">No Images Found</h3>
				<p class="mb-6 text-gray-600">
					{filters?.search
						? `No images match "${filters.search}"`
						: 'Add your first images to get started'}
				</p>
			</div>
		</Card>
	{:else}
		<!-- Image Grid -->
		<div class="grid {gridClasses[gridSize]} gap-4">
			{#each images as image (image.id)}
				<ImageThumbnail
					{image}
					size={gridSize}
					{selectable}
					selected={selectedImages.has(image.id)}
					onClick={onImageClick}
					onView={onImageView}
					onDelete={onImageDelete}
					onAnnotate={onImageAnnotate}
					onSelect={(selected: boolean) => handleImageSelect(image, selected)}
				/>
			{/each}
		</div>

		<!-- Load more button -->
		{#if pagination?.hasMore}
			<div class="text-center">
				<Button variant="secondary" onclick={onLoadMore} disabled={loading}>
					{#if loading}
						<Spinner size="sm" class="mr-2" />
						Loading...
					{:else}
						Load More Images
					{/if}
				</Button>
			</div>
		{/if}
	{/if}

	<!-- Loading overlay for additional loads -->
	{#if loading && images.length > 0}
		<div class="py-8 text-center">
			<Spinner size="md" />
		</div>
	{/if}
</div>
