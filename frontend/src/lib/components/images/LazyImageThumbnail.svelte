<!--
  Enhanced ImageThumbnail with Intersection Observer for lazy loading
  and performance optimization
-->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Button, Spinner } from '$lib/components/ui';
	import type { ImageSummary } from '$lib/features/images/types';

	interface LazyImageThumbnailProps {
		image: ImageSummary;
		size?: 'sm' | 'md' | 'lg';
		showActions?: boolean;
		showInfo?: boolean;
		selectable?: boolean;
		selected?: boolean;
		priority?: 'high' | 'normal' | 'low'; // Loading priority
		onClick?: (image: ImageSummary) => void;
		onView?: (image: ImageSummary) => void;
		onDelete?: (image: ImageSummary) => void;
		onAnnotate?: (image: ImageSummary) => void;
		onSelect?: (selected: boolean) => void;
	}

	let {
		image,
		size = 'md',
		showActions = true,
		showInfo = true,
		selectable = false,
		selected = false,
		priority = 'normal',
		onClick,
		onView,
		onDelete,
		onAnnotate,
		onSelect
	}: LazyImageThumbnailProps = $props();

	// Elements and loading states
	let containerElement = $state<HTMLDivElement>();
	let imageElement = $state<HTMLImageElement>();
	let shouldLoad = $state(priority === 'high'); // High priority loads immediately
	let imageLoading = $state(false);
	let imageError = $state(false);
	let retryCount = $state(0);
	let observer: IntersectionObserver | null = null;

	const MAX_RETRIES = 2;

	const sizeClasses = {
		sm: 'w-32 h-24',
		md: 'w-48 h-36',
		lg: 'w-64 h-48'
	};

	// Intersection Observer for lazy loading
	onMount(() => {
		if (!containerElement || shouldLoad) return;

		// Configure observer based on priority
		const observerOptions = {
			root: null,
			rootMargin: priority === 'low' ? '50px' : '150px', // Smaller margin for low priority
			threshold: 0.1
		};

		observer = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					shouldLoad = true;
					observer?.disconnect();
					observer = null;
				}
			});
		}, observerOptions);

		observer.observe(containerElement);
	});

	onDestroy(() => {
		observer?.disconnect();
	});

	// Image loading handlers
	function handleImageLoad() {
		imageLoading = false;
		imageError = false;
		retryCount = 0;
	}

	function handleImageError() {
		imageLoading = false;

		// For data URLs, don't retry as they're either valid or invalid immediately
		const imageUrl = image.thumbnailUrl || image.url;
		if (imageUrl?.startsWith('data:')) {
			imageError = true;
			return;
		}

		// Retry with exponential backoff
		if (retryCount < MAX_RETRIES && imageElement) {
			retryCount++;
			const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 5000); // Cap at 5s

			setTimeout(() => {
				if (imageElement) {
					imageLoading = true;
					const cacheBuster = `retry=${retryCount}&t=${Date.now()}`;
					const separator = imageElement.src.includes('?') ? '&' : '?';
					imageElement.src = imageElement.src.split('?')[0] + separator + cacheBuster;
				}
			}, delay);
		} else {
			imageError = true;
		}
	}

	function retryImageLoad() {
		if (imageElement) {
			imageError = false;
			imageLoading = true;
			retryCount = 0;
			const originalSrc = image.thumbnailUrl || image.url;
			const cacheBuster = `manual_retry=${Date.now()}`;
			const separator = originalSrc.includes('?') ? '&' : '?';
			imageElement.src = originalSrc + separator + cacheBuster;
		}
	}

	// Event handlers
	function handleClick() {
		onClick?.(image);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleClick();
		}
	}

	function getStatusColor(status: string) {
		const colors = {
			ready: 'bg-green-100 text-green-800',
			annotated: 'bg-blue-100 text-blue-800',
			processing: 'bg-yellow-100 text-yellow-800',
			pending: 'bg-gray-100 text-gray-800',
			error: 'bg-red-100 text-red-800'
		};
		return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
	}

	// Preload image when shouldLoad becomes true
	$effect(() => {
		if (shouldLoad && !imageLoading && !imageError) {
			imageLoading = true;
		}
	});
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	bind:this={containerElement}
	class="group relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md {sizeClasses[
		size
	]} {selectable && selected ? 'ring-2 ring-blue-500' : ''} {onClick ? 'cursor-pointer' : ''}"
	role={onClick ? 'button' : undefined}
	tabindex={onClick ? 0 : undefined}
	onclick={handleClick}
	onkeydown={handleKeydown}
	aria-label={onClick ? `View ${image.filename}` : undefined}
>
	<!-- Selection checkbox -->
	{#if selectable}
		<div class="absolute top-2 left-2 z-10">
			<input
				type="checkbox"
				checked={selected}
				onchange={(e) => onSelect?.((e.target as HTMLInputElement).checked)}
				onclick={(e) => e.stopPropagation()}
				class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
				aria-label="Select image"
			/>
		</div>
	{/if}

	<!-- Image container -->
	<div class="relative h-full w-full">
		{#if !shouldLoad}
			<!-- Placeholder while waiting for intersection -->
			<div class="flex h-full w-full items-center justify-center bg-gray-100">
				<div class="text-gray-400">
					<svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
						<path
							d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
						/>
					</svg>
				</div>
			</div>
		{:else if imageError}
			<!-- Error state with retry -->
			<div class="flex h-full w-full flex-col items-center justify-center bg-gray-100 p-2">
				<div class="mb-2 text-red-400">
					<svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
						<path
							d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
						/>
					</svg>
				</div>
				<button
					class="text-xs text-blue-600 hover:text-blue-800"
					onclick={(e) => {
						e.stopPropagation();
						retryImageLoad();
					}}
				>
					Retry
				</button>
			</div>
		{:else if imageLoading}
			<!-- Loading state -->
			<div class="flex h-full w-full items-center justify-center bg-gray-100">
				<Spinner size="sm" />
			</div>
		{/if}

		<!-- Actual image (only rendered when shouldLoad is true) -->
		{#if shouldLoad}
			<img
				bind:this={imageElement}
				src={image.thumbnailUrl || image.url}
				alt={image.filename}
				class="h-full w-full object-cover transition-opacity duration-200 {imageLoading ||
				imageError
					? 'opacity-0'
					: 'opacity-100'}"
				loading={priority === 'high' ? 'eager' : 'lazy'}
				decoding="async"
				onload={handleImageLoad}
				onerror={handleImageError}
			/>
		{/if}

		<!-- Actions overlay -->
		{#if showActions}
			<div
				class="bg-opacity-50 absolute inset-0 flex items-center justify-center gap-2 bg-black opacity-0 transition-opacity group-hover:opacity-100"
			>
				{#if onView}
					<Button
						variant="ghost"
						size="sm"
						onclick={(e) => {
							e.stopPropagation();
							onView(image);
						}}
						class="hover:bg-opacity-20 text-white hover:bg-white"
						aria-label="View image"
					>
						👁️
					</Button>
				{/if}
				{#if onAnnotate}
					<Button
						variant="ghost"
						size="sm"
						onclick={(e) => {
							e.stopPropagation();
							onAnnotate(image);
						}}
						class="hover:bg-opacity-20 text-white hover:bg-white"
						aria-label="Annotate image"
					>
						✏️
					</Button>
				{/if}
				{#if onDelete}
					<Button
						variant="ghost"
						size="sm"
						onclick={(e) => {
							e.stopPropagation();
							onDelete(image);
						}}
						class="hover:bg-opacity-20 text-white hover:bg-white"
						aria-label="Delete image"
					>
						🗑️
					</Button>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Image info -->
	{#if showInfo}
		<div class="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black to-transparent p-2">
			<div class="text-white">
				<div class="truncate text-sm font-medium">{image.filename}</div>
				<div class="flex items-center justify-between">
					<span class="text-xs opacity-75">
						{new Date(image.uploadedAt).toLocaleDateString()}
					</span>
					<span class="rounded px-1 py-0.5 text-xs font-medium {getStatusColor(image.status)}">
						{image.status}
					</span>
				</div>
			</div>
		</div>
	{/if}
</div>
