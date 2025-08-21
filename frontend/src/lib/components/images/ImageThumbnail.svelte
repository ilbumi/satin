<script lang="ts">
	import { Button, Spinner } from '$lib/components/ui';
	import type { ImageSummary } from '$lib/features/images/types';

	interface ImageThumbnailProps {
		image: ImageSummary;
		size?: 'sm' | 'md' | 'lg';
		showActions?: boolean;
		showInfo?: boolean;
		selectable?: boolean;
		selected?: boolean;
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
		onClick,
		onView,
		onDelete,
		onAnnotate,
		onSelect
	}: ImageThumbnailProps = $props();

	let imageElement = $state<HTMLImageElement>();
	let imageLoading = $state(true);
	let imageError = $state(false);
	let retryCount = $state(0);
	const MAX_RETRIES = 2;

	const sizeClasses = {
		sm: 'w-32 h-24',
		md: 'w-48 h-36',
		lg: 'w-64 h-48'
	};

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

		// Try to retry loading the image up to MAX_RETRIES times
		if (retryCount < MAX_RETRIES && imageElement) {
			retryCount++;

			// Add a small delay before retrying
			setTimeout(() => {
				imageLoading = true;
				imageElement!.src =
					imageElement!.src + (imageElement!.src.includes('?') ? '&' : '?') + `retry=${retryCount}`;
			}, 1000 * retryCount); // Progressive delay
		} else {
			imageError = true;
		}
	}

	function retryImageLoad() {
		if (imageElement) {
			imageError = false;
			imageLoading = true;
			retryCount = 0;
			// Force reload by changing src
			const originalSrc = image.thumbnailUrl || image.url;
			imageElement.src = originalSrc + (originalSrc.includes('?') ? '&' : '?') + `t=${Date.now()}`;
		}
	}

	function handleClick() {
		if (onClick) {
			onClick(image);
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleClick();
		}
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'annotated':
				return 'bg-green-100 text-green-800';
			case 'ready':
				return 'bg-blue-100 text-blue-800';
			case 'processing':
				return 'bg-yellow-100 text-yellow-800';
			case 'pending':
				return 'bg-gray-100 text-gray-800';
			case 'error':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	class="group relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md {selected
		? 'ring-2 ring-blue-500'
		: ''} {onClick ? 'cursor-pointer' : ''}"
	onclick={onClick ? handleClick : undefined}
	onkeydown={onClick ? handleKeydown : undefined}
	role={onClick ? 'button' : undefined}
	tabindex={onClick ? 0 : undefined}
	aria-label={onClick ? `View image ${image.filename}` : undefined}
	data-testid="image-thumbnail"
>
	<!-- Selection checkbox -->
	{#if selectable}
		<div class="absolute top-2 left-2 z-10">
			<input
				type="checkbox"
				checked={selected}
				class="h-4 w-4 rounded border-gray-300 bg-white text-blue-600 focus:ring-2 focus:ring-blue-500"
				aria-label={`Select ${image.filename}`}
				onclick={(e) => e.stopPropagation()}
				onchange={(e: Event) => onSelect?.((e.target as HTMLInputElement).checked)}
			/>
		</div>
	{/if}

	<!-- Image container -->
	<div
		class="relative {sizeClasses[
			size
		]} flex items-center justify-center overflow-hidden bg-gray-100"
	>
		{#if imageLoading}
			<div class="flex h-full items-center justify-center">
				<Spinner size="sm" />
			</div>
		{/if}

		{#if imageError}
			<div class="flex h-full flex-col items-center justify-center p-2 text-gray-400">
				<div class="mb-2 text-xl">⚠️</div>
				<span class="mb-2 text-center text-xs">Failed to load</span>
				<Button
					variant="ghost"
					size="sm"
					onclick={retryImageLoad}
					class="h-auto min-h-0 px-2 py-1 text-xs"
				>
					🔄 Retry
				</Button>
			</div>
		{:else if image.thumbnailUrl}
			<img
				bind:this={imageElement}
				src={image.thumbnailUrl}
				alt={image.filename}
				class="h-full w-full object-cover transition-opacity duration-200 {imageLoading
					? 'opacity-0'
					: 'opacity-100'}"
				loading="lazy"
				onload={handleImageLoad}
				onerror={handleImageError}
			/>
		{:else}
			<!-- Fallback placeholder -->
			<div class="flex h-full items-center justify-center text-gray-400">
				<div class="text-4xl">🖼️</div>
			</div>
		{/if}

		<!-- Status indicator -->
		<div class="absolute top-2 right-2">
			<span class="rounded-full px-2 py-1 text-xs font-medium {getStatusColor(image.status)}">
				{image.status}
			</span>
		</div>

		<!-- Hover overlay with quick actions -->
		{#if showActions}
			<div
				class="bg-opacity-0 group-hover:bg-opacity-50 absolute inset-0 flex items-center justify-center bg-black opacity-0 transition-all duration-200 group-hover:opacity-100"
			>
				<div class="flex space-x-2">
					{#if onView}
						<Button
							variant="secondary"
							size="sm"
							onclick={(e) => {
								e.stopPropagation();
								onView?.(image);
							}}
							class="bg-white text-gray-900 hover:bg-gray-100"
							aria-label={`View ${image.filename}`}
						>
							👁️ View
						</Button>
					{/if}

					{#if onAnnotate}
						<Button
							variant="secondary"
							size="sm"
							onclick={(e) => {
								e.stopPropagation();
								onAnnotate?.(image);
							}}
							class="bg-white text-gray-900 hover:bg-gray-100"
							aria-label={`Annotate ${image.filename}`}
						>
							✏️ Annotate
						</Button>
					{/if}
				</div>
			</div>
		{/if}
	</div>

	<!-- Image info -->
	{#if showInfo}
		<div class="p-3">
			<div class="space-y-1">
				<h3 class="truncate text-sm font-medium text-gray-900" title={image.filename}>
					{image.filename}
				</h3>

				{#if image.projectName}
					<p class="truncate text-xs text-gray-600" title={image.projectName}>
						📁 {image.projectName}
					</p>
				{/if}

				<div class="flex items-center justify-between text-xs text-gray-500">
					<span>{formatFileSize(image.fileSize)}</span>
					{#if image.dimensions}
						<span>{image.dimensions}</span>
					{/if}
				</div>

				<div class="flex items-center justify-between text-xs text-gray-500">
					<span>{new Date(image.uploadedAt).toLocaleDateString()}</span>
				</div>
			</div>

			{#if showActions}
				<div class="mt-3 flex space-x-2">
					{#if onView}
						<Button
							variant="ghost"
							size="sm"
							class="flex-1"
							onclick={(e) => {
								e.stopPropagation();
								onView?.(image);
							}}
						>
							View
						</Button>
					{/if}

					{#if onAnnotate}
						<Button
							variant="ghost"
							size="sm"
							class="flex-1"
							onclick={(e) => {
								e.stopPropagation();
								onAnnotate?.(image);
							}}
						>
							Annotate
						</Button>
					{/if}

					{#if onDelete}
						<Button
							variant="ghost"
							size="sm"
							onclick={(e) => {
								e.stopPropagation();
								if (confirm(`Delete ${image.filename}?`)) {
									onDelete?.(image);
								}
							}}
							class="text-red-600 hover:bg-red-50 hover:text-red-700"
							aria-label={`Delete ${image.filename}`}
						>
							🗑️
						</Button>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>
