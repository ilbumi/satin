<script lang="ts">
	import StatusBadge from './StatusBadge.svelte';
	import { goto } from '$app/navigation';
	import { showSuccess } from '$lib/stores/toast';

	interface ImageData {
		id: string;
		url: string;
		width?: number;
		height?: number;
		status: 'new' | 'annotated' | 'needs_reannotation';
		created_at: string;
	}

	interface Props {
		image: ImageData;
		onStatusChange?: (
			imageId: string,
			newStatus: 'new' | 'annotated' | 'needs_reannotation'
		) => void;
		onDelete?: (imageId: string) => void;
	}

	let { image, onStatusChange, onDelete }: Props = $props();

	let imageLoaded = $state(false);
	let imageError = $state(false);
	let showActions = $state(false);

	function handleImageLoad() {
		imageLoaded = true;
		imageError = false;
	}

	function handleImageError() {
		imageError = true;
		imageLoaded = false;
	}

	function handleAnnotate() {
		goto(`/annotate?imageId=${image.id}`);
	}

	function handleStatusChange(newStatus: 'new' | 'annotated' | 'needs_reannotation') {
		onStatusChange?.(image.id, newStatus);
		showSuccess(`Image status updated to ${newStatus.replace('_', ' ')}`);
	}

	function handleDelete() {
		if (confirm('Are you sure you want to delete this image?')) {
			onDelete?.(image.id);
			showSuccess('Image deleted successfully');
		}
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString();
	}
</script>

<div
	class="group relative overflow-hidden rounded-lg border bg-white shadow-sm transition-all duration-200 hover:shadow-md"
	onmouseenter={() => (showActions = true)}
	onmouseleave={() => (showActions = false)}
	role="button"
	tabindex="0"
>
	<!-- Image Container -->
	<div class="relative aspect-video bg-gray-100">
		{#if !imageError}
			<img
				src={image.url}
				alt="Image from {image.url}"
				class="h-full w-full object-cover transition-opacity duration-300 {imageLoaded
					? 'opacity-100'
					: 'opacity-0'}"
				onload={handleImageLoad}
				onerror={handleImageError}
				loading="lazy"
			/>
		{/if}

		{#if !imageLoaded && !imageError}
			<!-- Loading State -->
			<div class="flex h-full items-center justify-center">
				<div
					class="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"
				></div>
			</div>
		{/if}

		{#if imageError}
			<!-- Error State -->
			<div class="flex h-full flex-col items-center justify-center text-gray-500">
				<svg class="mb-2 h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z"
					/>
				</svg>
				<span class="text-xs">Failed to load</span>
			</div>
		{/if}

		<!-- Status Badge -->
		<div class="absolute top-2 right-2">
			<StatusBadge status={image.status} size="sm" />
		</div>

		<!-- Actions Overlay -->
		{#if showActions && imageLoaded}
			<div
				class="bg-opacity-50 absolute inset-0 bg-black opacity-0 transition-opacity duration-200 group-hover:opacity-100"
			>
				<div class="flex h-full items-center justify-center space-x-2">
					<button
						onclick={handleAnnotate}
						class="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
						title="Annotate this image"
						aria-label="Annotate this image"
					>
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
							/>
						</svg>
					</button>

					<!-- Status Change Dropdown -->
					<div class="relative">
						<select
							onchange={(e) => {
								const target = e.target as HTMLSelectElement;
								handleStatusChange(target.value as 'new' | 'annotated' | 'needs_reannotation');
							}}
							value={image.status}
							class="rounded-lg border bg-white px-2 py-1 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
							title="Change status"
						>
							<option value="new">New</option>
							<option value="annotated">Annotated</option>
							<option value="needs_reannotation">Needs Re-annotation</option>
						</select>
					</div>

					<button
						onclick={handleDelete}
						class="rounded-lg bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:outline-none"
						title="Delete this image"
						aria-label="Delete this image"
					>
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
							/>
						</svg>
					</button>
				</div>
			</div>
		{/if}
	</div>

	<!-- Image Info -->
	<div class="p-4">
		<div class="mb-2 flex items-center justify-between">
			<StatusBadge status={image.status} />
			<span class="text-xs text-gray-500">
				{formatDate(image.created_at)}
			</span>
		</div>

		<div class="mb-2">
			<p class="truncate text-sm font-medium text-gray-900" title={image.url}>
				{new URL(image.url).pathname.split('/').pop() || 'Unknown'}
			</p>
			<p class="truncate text-xs text-gray-500" title={image.url}>
				{image.url}
			</p>
		</div>

		<div class="flex items-center justify-between text-xs text-gray-500">
			<span>
				{#if image.width && image.height}
					{image.width} × {image.height}
				{:else}
					Dimensions unknown
				{/if}
			</span>
		</div>
	</div>
</div>
