<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { queryStore, getContextClient, type OperationResult } from '@urql/svelte';
	import {
		GET_IMAGES_BY_STATUS,
		type GetImagesByStatusQuery
	} from '$lib/graphql/operations/images';

	let loading = $state(true);
	let error = $state<string | null>(null);

	const client = getContextClient();

	onMount(async () => {
		try {
			// Fetch images that need annotation (NEW or NEEDS_REANNOTATION status)
			const query = queryStore<GetImagesByStatusQuery>({
				query: GET_IMAGES_BY_STATUS,
				variables: { statuses: ['new', 'needs_reannotation'] },
				client
			});

			// Wait for the query to complete
			const result = await new Promise<OperationResult<GetImagesByStatusQuery>>((resolve) => {
				let unsubscribe: (() => void) | undefined;
				unsubscribe = query.subscribe((value) => {
					if (!value.fetching) {
						if (unsubscribe) unsubscribe();
						resolve(value);
					}
				});
			});

			if (result.error) {
				error = result.error.message;
				loading = false;
				return;
			}

			const images = result.data?.imagesByStatus || [];

			if (images.length === 0) {
				// No images available for annotation
				error = 'No images available for annotation';
				loading = false;
				return;
			}

			// Select a random image
			const randomIndex = Math.floor(Math.random() * images.length);
			const randomImage = images[randomIndex];

			// Redirect to the annotation page for this image
			goto(`/annotate/${randomImage.id}`);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load images';
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>{loading ? 'Finding Image...' : error ? 'Error' : 'Redirecting...'} - Satin</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center">
	<div class="mx-auto max-w-md p-6 text-center">
		{#if loading}
			<!-- Loading State -->
			<div
				class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"
			></div>
			<p class="text-gray-600">Finding a random image to annotate...</p>
		{:else if error}
			<!-- Error State -->
			<div class="rounded-lg bg-red-50 p-6">
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
				<h3 class="mb-2 text-lg font-semibold text-red-800">
					{error === 'No images available for annotation'
						? 'No Images Ready'
						: 'Error Loading Images'}
				</h3>
				<p class="mb-4 text-red-600">
					{#if error === 'No images available for annotation'}
						There are no images that need annotation right now. Please add some images or check if
						all images are already annotated.
					{:else}
						{error}
					{/if}
				</p>
				<div class="space-x-4">
					{#if error === 'No images available for annotation'}
						<button
							onclick={() => goto('/images')}
							class="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
						>
							View All Images
						</button>
					{:else}
						<button
							onclick={() => window.location.reload()}
							class="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
						>
							Try Again
						</button>
						<button
							onclick={() => goto('/images')}
							class="rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
						>
							Back to Images
						</button>
					{/if}
				</div>
			</div>
		{:else}
			<!-- Redirecting State -->
			<div
				class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"
			></div>
			<p class="text-gray-600">Redirecting to annotation page...</p>
		{/if}
	</div>
</div>
