<script lang="ts">
	import { onMount } from 'svelte';
	import { showError, showSuccess } from '$lib/stores/toast';

	interface Props {
		open: boolean;
		onClose: () => void;
		onSubmit: (imageUrl: string) => Promise<void>;
	}

	let { open, onClose, onSubmit }: Props = $props();

	let imageUrl = $state('');
	let isValidating = $state(false);
	let isSubmitting = $state(false);
	let urlError = $state('');
	let dialogElement: HTMLDialogElement | undefined = $state();

	let isValidUrl = $derived(imageUrl.trim() !== '' && urlError === '' && !isValidating);

	onMount(() => {
		if (open && dialogElement) {
			dialogElement.showModal();
		}
	});

	$effect(() => {
		if (open && dialogElement) {
			dialogElement.showModal();
			resetForm();
		} else if (!open && dialogElement) {
			dialogElement.close();
		}
	});

	function resetForm() {
		imageUrl = '';
		urlError = '';
		isValidating = false;
		isSubmitting = false;
	}

	function handleClose() {
		resetForm();
		onClose();
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === dialogElement) {
			handleClose();
		}
	}

	function validateUrl(url: string): boolean {
		if (!url.trim()) {
			urlError = 'Image URL is required';
			return false;
		}

		try {
			const parsedUrl = new URL(url);
			if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
				urlError = 'URL must use HTTP or HTTPS protocol';
				return false;
			}
			const ipAddress = parsedUrl.hostname.split('.');
			if (
				parsedUrl.hostname === 'localhost' ||
				(ipAddress.length === 4 && ipAddress[0] === '127')
			) {
				urlError = 'Localhost URLs are not allowed';
				return false;
			}
			urlError = '';
			return true;
		} catch {
			urlError = 'Please enter a valid URL';
			return false;
		}
	}

	async function validateImageUrl(url: string): Promise<boolean> {
		isValidating = true;

		try {
			const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
			const contentType = response.headers.get('content-type');

			if (contentType && !contentType.startsWith('image/')) {
				urlError = 'URL does not point to an image file';
				return false;
			}

			return true;
		} catch {
			urlError = 'Unable to validate image URL. Please check the URL is accessible.';
			return false;
		} finally {
			isValidating = false;
		}
	}

	async function handleUrlChange() {
		const url = imageUrl.trim();

		if (!url) {
			urlError = '';
			return;
		}

		if (!validateUrl(url)) {
			return;
		}

		await validateImageUrl(url);
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();

		const url = imageUrl.trim();
		if (!validateUrl(url)) {
			return;
		}

		isSubmitting = true;

		try {
			await onSubmit(url);
			showSuccess('Image added successfully!');
			handleClose();
		} catch (error) {
			showError(error instanceof Error ? error.message : 'Failed to add image');
		} finally {
			isSubmitting = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			handleClose();
		}
	}
</script>

<dialog
	bind:this={dialogElement}
	onclick={handleBackdropClick}
	onkeydown={handleKeydown}
	class="add-image-dialog"
>
	<div class="w-full max-w-md rounded-lg bg-white p-6">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-xl font-semibold text-gray-900">Add New Image</h2>
			<button
				onclick={handleClose}
				class="text-gray-400 hover:text-gray-600"
				type="button"
				aria-label="Close dialog"
			>
				<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
		</div>

		<form onsubmit={handleSubmit}>
			<div class="mb-4">
				<label for="image-url" class="mb-2 block text-sm font-medium text-gray-700">
					Image URL
				</label>
				<input
					id="image-url"
					type="url"
					required
					bind:value={imageUrl}
					oninput={handleUrlChange}
					placeholder="https://example.com/image.jpg"
					class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 {urlError
						? 'border-red-300 focus:border-red-500 focus:ring-red-500'
						: ''}"
					disabled={isSubmitting}
				/>

				{#if isValidating}
					<div class="mt-2 flex items-center text-sm text-blue-600">
						<div
							class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"
						></div>
						Validating image URL...
					</div>
				{/if}

				{#if urlError}
					<p class="mt-2 text-sm text-red-600" role="alert">{urlError}</p>
				{/if}

				<p class="mt-2 text-xs text-gray-500">
					Enter a direct URL to an image file (JPG, PNG, GIF, WebP, etc.)
				</p>
			</div>

			<div class="flex justify-end space-x-3">
				<button
					type="button"
					onclick={handleClose}
					class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
					disabled={isSubmitting}
				>
					Cancel
				</button>
				<button
					type="submit"
					disabled={!isValidUrl || isSubmitting}
					class="flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if isSubmitting}
						<div
							class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
						></div>
					{/if}
					{isSubmitting ? 'Adding...' : 'Add Image'}
				</button>
			</div>
		</form>
	</div>
</dialog>

<style>
	.add-image-dialog {
		margin: auto;
		padding: 0;
		border: 0;
		border-radius: 0.5rem;
		box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
		max-width: 100vw;
		max-height: 100vh;
	}

	.add-image-dialog::backdrop {
		background-color: rgba(0, 0, 0, 0.5);
	}
</style>
