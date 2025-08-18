<script lang="ts">
	import { Button, Card, Input } from '$lib/components/ui';
	import { imageService } from '$lib/features/images/service';
	import type { ImageDetail } from '$lib/features/images/types';

	interface AddImageByUrlProps {
		multiple?: boolean;
		onAdd?: (images: ImageDetail[]) => void;
		onError?: (error: string) => void;
	}

	let { multiple = true, onAdd, onError }: AddImageByUrlProps = $props();

	let imageUrls = $state<string[]>(['']);
	let adding = $state(false);

	function addUrlField() {
		imageUrls = [...imageUrls, ''];
	}

	function removeUrlField(index: number) {
		imageUrls = imageUrls.filter((_, i) => i !== index);
		if (imageUrls.length === 0) {
			imageUrls = [''];
		}
	}

	function updateUrl(index: number, value: string) {
		imageUrls[index] = value;
	}

	function validateUrl(url: string): { valid: boolean; error?: string } {
		if (!url.trim()) {
			return { valid: false, error: 'URL is required' };
		}

		try {
			const urlObj = new URL(url);
			if (!['http:', 'https:'].includes(urlObj.protocol)) {
				return { valid: false, error: 'URL must use HTTP or HTTPS protocol' };
			}
			return { valid: true };
		} catch {
			return { valid: false, error: 'Invalid URL format' };
		}
	}

	async function addImages() {
		if (adding) return;

		const validUrls = imageUrls.filter((url) => url.trim() !== '');
		if (validUrls.length === 0) {
			onError?.('Please enter at least one image URL');
			return;
		}

		const errors: string[] = [];
		const urlsToAdd: string[] = [];

		for (const url of validUrls) {
			const validation = validateUrl(url);
			if (validation.valid) {
				urlsToAdd.push(url.trim());
			} else {
				errors.push(`${url}: ${validation.error}`);
			}
		}

		if (errors.length > 0) {
			onError?.(errors.join('\n'));
		}

		if (urlsToAdd.length === 0) {
			return;
		}

		try {
			adding = true;

			const addPromises = urlsToAdd.map(async (url) => {
				try {
					return await imageService.addImageByUrl(url);
				} catch (error) {
					throw new Error(
						`${url}: ${error instanceof Error ? error.message : 'Failed to add image'}`
					);
				}
			});

			const results = await Promise.allSettled(addPromises);
			const successful = results
				.filter((r): r is PromiseFulfilledResult<ImageDetail> => r.status === 'fulfilled')
				.map((r) => r.value);

			const failed = results.filter((r) => r.status === 'rejected');

			if (failed.length > 0) {
				const failureErrors = failed.map((r) => r.reason?.message || 'Unknown error');
				onError?.(failureErrors.join('\n'));
			}

			if (successful.length > 0) {
				onAdd?.(successful);
				imageUrls = ['']; // Reset after successful addition
			}
		} catch (error) {
			onError?.(error instanceof Error ? error.message : 'Failed to add images');
		} finally {
			adding = false;
		}
	}

	function clearAll() {
		imageUrls = [''];
	}

	// Check if we have valid URLs to add
	let hasValidUrls = $derived(() => {
		return imageUrls.some((url) => url.trim() !== '' && validateUrl(url).valid);
	});
</script>

<Card class="p-6">
	<div class="mb-6 text-center">
		<div class="mb-4 text-4xl text-gray-400">🌐</div>
		<p class="mb-2 text-lg font-medium text-gray-900">Add Images by URL</p>
		<p class="mb-4 text-sm text-gray-500">Enter image URLs to add them to your collection</p>
	</div>

	<!-- URL Input Fields -->
	<div class="space-y-3">
		{#each imageUrls as url, index (index)}
			<div class="flex items-center space-x-2">
				<div class="flex-1">
					<Input
						type="url"
						placeholder="https://example.com/image.jpg"
						value={url}
						oninput={(e: Event) => updateUrl(index, (e.currentTarget as HTMLInputElement).value)}
						disabled={adding}
						class="w-full"
						aria-label={`Image URL ${index + 1}`}
					/>
				</div>

				{#if imageUrls.length > 1}
					<Button
						variant="ghost"
						size="sm"
						onclick={() => removeUrlField(index)}
						disabled={adding}
						aria-label={`Remove URL field ${index + 1}`}
					>
						❌
					</Button>
				{/if}
			</div>
		{/each}
	</div>

	<!-- Add More URL Field Button -->
	{#if multiple}
		<div class="mt-4 text-center">
			<Button
				variant="secondary"
				onclick={addUrlField}
				disabled={adding || imageUrls.length >= 10}
				size="sm"
			>
				+ Add Another URL
			</Button>
		</div>
	{/if}

	<!-- Actions -->
	<div class="mt-6 flex justify-end space-x-3">
		<Button
			variant="secondary"
			onclick={clearAll}
			disabled={adding || imageUrls.every((url) => !url.trim())}
		>
			Clear All
		</Button>
		<Button variant="primary" onclick={addImages} disabled={!hasValidUrls || adding}>
			{#if adding}
				<div
					class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"
				></div>
				Adding...
			{:else}
				Add {imageUrls.filter((url) => url.trim()).length} Image{imageUrls.filter((url) =>
					url.trim()
				).length !== 1
					? 's'
					: ''}
			{/if}
		</Button>
	</div>
</Card>
