<script lang="ts">
	import ImageCard from './ImageCard.svelte';
	import LoadingSkeleton from './LoadingSkeleton.svelte';

	interface ImageData {
		id: string;
		url: string;
		width?: number;
		height?: number;
		status: 'NEW' | 'ANNOTATED' | 'NEEDS_REANNOTATION';
		createdAt: string;
	}

	interface Props {
		images: ImageData[];
		loading?: boolean;
		onStatusChange?: (
			imageId: string,
			newStatus: 'NEW' | 'ANNOTATED' | 'NEEDS_REANNOTATION'
		) => void;
		onDelete?: (imageId: string) => void;
		onAddImage?: () => void;
	}

	let { images, loading = false, onStatusChange, onDelete, onAddImage }: Props = $props();
</script>

{#if loading}
	<!-- Loading State -->
	<div class="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
		{#each Array.from({ length: 12 }, (_, i) => i) as i (i)}
			<div class="animate-pulse">
				<LoadingSkeleton variant="rect" height="192px" />
				<div class="mt-3 space-y-2 p-4">
					<LoadingSkeleton height="16px" width="60%" />
					<LoadingSkeleton height="12px" width="100%" />
					<LoadingSkeleton height="12px" width="80%" />
				</div>
			</div>
		{/each}
	</div>
{:else if images.length === 0}
	<!-- Empty State -->
	<div class="rounded-lg bg-gray-50 p-12 text-center">
		<svg
			class="mx-auto h-16 w-16 text-gray-400"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
			/>
		</svg>
		<h3 class="mt-4 text-lg font-semibold text-gray-700">No images found</h3>
		<p class="mt-2 text-gray-500">Get started by adding your first image to the dataset</p>
		{#if onAddImage}
			<button
				onclick={onAddImage}
				class="mt-4 rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
			>
				<svg class="mr-2 inline h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
				Add Your First Image
			</button>
		{/if}
	</div>
{:else}
	<!-- Images Grid -->
	<div class="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
		{#each images as image (image.id)}
			<ImageCard {image} {onStatusChange} {onDelete} />
		{/each}
	</div>
{/if}

<style>
	/* Ensure consistent grid layout */
	@media (min-width: 1536px) {
		.xl\:grid-cols-5 {
			grid-template-columns: repeat(5, minmax(0, 1fr));
		}
	}
</style>
