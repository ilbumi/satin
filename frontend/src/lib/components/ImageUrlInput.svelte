<script lang="ts">
	import { imageStore } from '$lib/stores/image';
	import LoadingButton from './LoadingButton.svelte';

	let url = $state('');
	let isLoading = $state(false);
	let error = $state('');

	async function handleLoadImage() {
		if (!url.trim()) {
			error = 'Please enter an image URL';
			return;
		}

		try {
			error = '';
			isLoading = true;

			const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
			if (!urlPattern.test(url)) {
				throw new Error('Invalid URL format');
			}

			const imagePattern = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
			if (!imagePattern.test(url) && !url.includes('unsplash') && !url.includes('placeholder')) {
				console.warn('URL may not be an image');
			}

			const tempId = `img-${Date.now()}`;
			await imageStore.loadImage(tempId, url);

			if ($imageStore.error) {
				throw new Error($imageStore.error);
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load image';
		} finally {
			isLoading = false;
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			handleLoadImage();
		}
	}

	const sampleImages = [
		{ label: 'Sample 1', url: 'https://picsum.photos/800/600?random=1' },
		{ label: 'Sample 2', url: 'https://picsum.photos/800/600?random=2' },
		{ label: 'Sample 3', url: 'https://picsum.photos/800/600?random=3' }
	];

	function loadSampleImage(sampleUrl: string) {
		url = sampleUrl;
		handleLoadImage();
	}
</script>

<div class="rounded-lg bg-white p-4 shadow-md">
	<h3 class="mb-3 text-sm font-semibold text-gray-700">Load Image</h3>

	<div class="space-y-3">
		<div>
			<label for="image-url" class="mb-1 block text-sm font-medium text-gray-700">
				Image URL
			</label>
			<input
				id="image-url"
				type="url"
				bind:value={url}
				onkeydown={handleKeyDown}
				placeholder="https://example.com/image.jpg"
				class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
				disabled={isLoading}
			/>
		</div>

		{#if error}
			<div class="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-600">
				{error}
			</div>
		{/if}

		<LoadingButton loading={isLoading} onclick={handleLoadImage} class="w-full">
			Load Image
		</LoadingButton>

		<div class="border-t border-gray-200 pt-3">
			<p class="mb-2 text-xs text-gray-600">Quick samples:</p>
			<div class="flex gap-2">
				{#each sampleImages as sample (sample.label)}
					<button
						onclick={() => loadSampleImage(sample.url)}
						class="rounded bg-gray-100 px-2 py-1 text-xs transition-colors hover:bg-gray-200"
						disabled={isLoading}
					>
						{sample.label}
					</button>
				{/each}
			</div>
		</div>

		<div class="text-xs text-gray-500">
			<p>• Images are loaded from URLs only</p>
			<p>• CORS must be enabled on the image server</p>
			<p>• Supports JPEG, PNG, WebP formats</p>
		</div>
	</div>
</div>
