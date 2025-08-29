<script lang="ts">
	import { getContextClient } from '@urql/svelte';
	import { showError, showSuccess } from '$lib/stores/toast.svelte';
	import { CREATE_IMAGE, type ImageCreateInput } from '$lib/graphql/operations/images';
	import { handleMutationResult } from '$lib/utils/graphql-errors';
	import { useDialog } from '$lib/hooks/useDialog.svelte';

	interface Props {
		open: boolean;
		onClose: () => void;
		onSubmit: () => void;
	}

	interface DialogFormData {
		imageUrl: string;
		isValidating: boolean;
		isSubmitting: boolean;
		urlError: string;
	}

	let { open, onClose, onSubmit }: Props = $props();

	// URQL client for mutations
	const client = getContextClient();

	// Use dialog hook for state management
	const dialog = useDialog<DialogFormData>({
		imageUrl: '',
		isValidating: false,
		isSubmitting: false,
		urlError: ''
	});

	let dialogElement: HTMLDialogElement | undefined = $state();

	let isValidUrl = $derived(
		dialog.formData.imageUrl.trim() !== '' &&
			dialog.formData.urlError === '' &&
			!dialog.formData.isValidating
	);

	// Sync external open state with internal dialog state
	$effect(() => {
		if (open !== dialog.isOpen) {
			if (open) {
				dialog.open();
			} else {
				dialog.close();
			}
		}
	});

	// Handle dialog DOM state
	$effect(() => {
		if (dialog.isOpen && dialogElement) {
			dialogElement.showModal();
		} else if (!dialog.isOpen && dialogElement) {
			dialogElement.close();
		}
	});

	function handleClose() {
		dialog.handleClose();
		onClose();
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === dialogElement) {
			handleClose();
		}
	}

	function validateUrl(url: string): boolean {
		if (!url.trim()) {
			dialog.updateData({ urlError: 'Image URL is required' });
			return false;
		}

		try {
			const parsedUrl = new URL(url);
			if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
				dialog.updateData({ urlError: 'URL must use HTTP or HTTPS protocol' });
				return false;
			}
			const ipAddress = parsedUrl.hostname.split('.');
			if (
				parsedUrl.hostname === 'localhost' ||
				(ipAddress.length === 4 && ipAddress[0] === '127')
			) {
				dialog.updateData({ urlError: 'Localhost URLs are not allowed' });
				return false;
			}
			dialog.updateData({ urlError: '' });
			return true;
		} catch {
			dialog.updateData({ urlError: 'Please enter a valid URL' });
			return false;
		}
	}

	async function validateImageUrl(url: string): Promise<boolean> {
		dialog.updateData({ isValidating: true });

		try {
			const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
			const contentType = response.headers.get('content-type');

			if (contentType && !contentType.startsWith('image/')) {
				dialog.updateData({ urlError: 'URL does not point to an image file' });
				return false;
			}

			return true;
		} catch {
			dialog.updateData({
				urlError: 'Unable to validate image URL. Please check the URL is accessible.'
			});
			return false;
		} finally {
			dialog.updateData({ isValidating: false });
		}
	}

	async function handleUrlChange() {
		const url = dialog.formData.imageUrl.trim();

		if (!url) {
			dialog.updateData({ urlError: '' });
			return;
		}

		if (!validateUrl(url)) {
			return;
		}

		await validateImageUrl(url);
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();

		const url = dialog.formData.imageUrl.trim();
		if (!validateUrl(url)) {
			return;
		}

		dialog.updateData({ isSubmitting: true });

		try {
			const input: ImageCreateInput = { url };

			// Execute the mutation using URQL client
			const result = await client.mutation(CREATE_IMAGE, { input }).toPromise();
			const mutationResult = handleMutationResult(result, 'createImage');

			if (mutationResult.success) {
				showSuccess('Image added successfully!');
				// Cache will automatically update due to cache configuration
				onSubmit(); // Notify parent component
				handleClose();
			} else {
				showError(mutationResult.error || 'Failed to add image');
			}
		} catch (error) {
			showError(error instanceof Error ? error.message : 'Failed to add image');
		} finally {
			dialog.updateData({ isSubmitting: false });
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
					bind:value={dialog.formData.imageUrl}
					oninput={handleUrlChange}
					placeholder="https://example.com/image.jpg"
					class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 {dialog
						.formData.urlError
						? 'border-red-300 focus:border-red-500 focus:ring-red-500'
						: ''}"
					disabled={dialog.formData.isSubmitting}
				/>

				{#if dialog.formData.isValidating}
					<div class="mt-2 flex items-center text-sm text-blue-600">
						<div
							class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"
						></div>
						Validating image URL...
					</div>
				{/if}

				{#if dialog.formData.urlError}
					<p class="mt-2 text-sm text-red-600" role="alert">{dialog.formData.urlError}</p>
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
					disabled={dialog.formData.isSubmitting}
				>
					Cancel
				</button>
				<button
					type="submit"
					disabled={!isValidUrl || dialog.formData.isSubmitting}
					class="flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if dialog.formData.isSubmitting}
						<div
							class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
						></div>
					{/if}
					{dialog.formData.isSubmitting ? 'Adding...' : 'Add Image'}
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
