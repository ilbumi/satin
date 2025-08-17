<script lang="ts">
	import { Button, Card, Spinner } from '$lib/components/ui';
	import { imageService } from '$lib/features/images/service';
	import type { ImageDetail } from '$lib/features/images/types';

	interface ImageUploadProps {
		multiple?: boolean;
		accept?: string;
		maxSize?: number; // in MB
		disabled?: boolean;
		projectId?: string;
		onUpload?: (images: ImageDetail[]) => void;
		onError?: (error: string) => void;
	}

	let {
		multiple = true,
		accept = 'image/jpeg,image/jpg,image/png,image/webp',
		maxSize = 10,
		disabled = false,
		projectId,
		onUpload,
		onError
	}: ImageUploadProps = $props();

	let fileInput = $state<HTMLInputElement>();
	let dragActive = $state(false);
	let uploading = $state(false);
	let selectedFiles = $state<File[]>([]);
	let uploadProgress = $state<Record<string, number>>({});

	function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files) {
			processFiles(Array.from(input.files));
		}
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		dragActive = false;

		if (event.dataTransfer?.files) {
			processFiles(Array.from(event.dataTransfer.files));
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		dragActive = true;
	}

	function handleDragLeave(event: DragEvent) {
		event.preventDefault();
		// Only set dragActive to false if we're leaving the drop zone entirely
		const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
		const x = event.clientX;
		const y = event.clientY;

		if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
			dragActive = false;
		}
	}

	function processFiles(files: File[]) {
		const validFiles: File[] = [];
		const errors: string[] = [];

		for (const file of files) {
			const validation = imageService.validateImageFile(file);
			if (validation.valid) {
				validFiles.push(file);
			} else {
				errors.push(`${file.name}: ${validation.error}`);
			}
		}

		if (errors.length > 0) {
			onError?.(errors.join('\n'));
		}

		if (validFiles.length > 0) {
			if (multiple) {
				selectedFiles = [...selectedFiles, ...validFiles];
			} else {
				selectedFiles = [validFiles[0]];
			}
		}

		// Reset file input
		if (fileInput) {
			fileInput.value = '';
		}
	}

	function removeFile(index: number) {
		selectedFiles = selectedFiles.filter((_, i) => i !== index);
	}

	async function uploadFiles() {
		if (selectedFiles.length === 0 || uploading) return;

		try {
			uploading = true;
			uploadProgress = {};

			// Initialize progress tracking
			selectedFiles.forEach((file, index) => {
				uploadProgress[`${file.name}-${index}`] = 0;
			});

			const uploadPromises = selectedFiles.map(async (file, index) => {
				const key = `${file.name}-${index}`;

				try {
					// Simulate progress updates
					const progressInterval = setInterval(() => {
						if (uploadProgress[key] < 90) {
							uploadProgress[key] += Math.random() * 20;
							uploadProgress = { ...uploadProgress };
						}
					}, 100);

					const result = await imageService.uploadImage(file, projectId);

					clearInterval(progressInterval);
					uploadProgress[key] = 100;
					uploadProgress = { ...uploadProgress };

					return result;
				} catch (error) {
					uploadProgress[key] = -1; // Indicate error
					uploadProgress = { ...uploadProgress };
					throw error;
				}
			});

			const results = await Promise.allSettled(uploadPromises);
			const successful = results
				.filter((r): r is PromiseFulfilledResult<ImageDetail> => r.status === 'fulfilled')
				.map((r) => r.value);

			const failed = results.filter((r) => r.status === 'rejected');

			if (failed.length > 0) {
				const errors = failed.map(
					(r, i) => `${selectedFiles[i].name}: ${r.reason?.message || 'Upload failed'}`
				);
				onError?.(errors.join('\n'));
			}

			if (successful.length > 0) {
				onUpload?.(successful);
				selectedFiles = []; // Clear after successful upload
			}
		} catch (error) {
			onError?.(error instanceof Error ? error.message : 'Upload failed');
		} finally {
			uploading = false;
			uploadProgress = {};
		}
	}

	function triggerFileInput() {
		fileInput?.click();
	}

	// Format file size for display
	function formatFileSize(bytes: number): string {
		return imageService.formatFileSize(bytes);
	}
</script>

<Card class="p-6">
	<!-- Hidden file input -->
	<input
		bind:this={fileInput}
		type="file"
		{accept}
		{multiple}
		{disabled}
		onchange={handleFileSelect}
		class="hidden"
		aria-label="Select images to upload"
	/>

	<!-- Drop zone -->
	<div
		class="rounded-lg border-2 border-dashed p-8 text-center transition-colors {dragActive
			? 'border-blue-500 bg-blue-50'
			: 'border-gray-300 bg-gray-50'} {disabled
			? 'opacity-50'
			: 'hover:bg-blue-25 hover:border-blue-400'}"
		ondrop={handleDrop}
		ondragover={handleDragOver}
		ondragleave={handleDragLeave}
		role="button"
		tabindex="0"
		onclick={triggerFileInput}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				triggerFileInput();
			}
		}}
		aria-label="Click or drag and drop to upload images"
	>
		{#if dragActive}
			<div class="mb-4 text-4xl">📤</div>
			<p class="text-lg font-medium text-blue-600">Drop images here</p>
		{:else}
			<div class="mb-4 text-4xl text-gray-400">🖼️</div>
			<p class="mb-2 text-lg font-medium text-gray-900">Click to upload or drag and drop</p>
			<p class="mb-4 text-sm text-gray-500">
				Supports JPEG, PNG, and WebP up to {maxSize}MB each
			</p>
			<Button variant="primary" {disabled}>Choose Images</Button>
		{/if}
	</div>

	<!-- Selected files -->
	{#if selectedFiles.length > 0}
		<div class="mt-6">
			<h4 class="mb-3 font-medium text-gray-900">
				Selected Files ({selectedFiles.length})
			</h4>

			<div class="max-h-48 space-y-2 overflow-y-auto">
				{#each selectedFiles as file, index (file.name + index)}
					<div
						class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3"
					>
						<div class="flex min-w-0 flex-1 items-center">
							<div class="flex-shrink-0">🖼️</div>
							<div class="ml-3 min-w-0 flex-1">
								<p class="truncate text-sm font-medium text-gray-900">
									{file.name}
								</p>
								<p class="text-xs text-gray-500">
									{formatFileSize(file.size)}
								</p>
							</div>
						</div>

						{#if uploading}
							<div class="ml-4 flex items-center">
								{#if uploadProgress[`${file.name}-${index}`] === -1}
									<span class="text-sm text-red-500">❌ Failed</span>
								{:else if uploadProgress[`${file.name}-${index}`] === 100}
									<span class="text-sm text-green-500">✅ Done</span>
								{:else}
									<div class="flex items-center">
										<Spinner size="sm" />
										<span class="ml-2 text-sm text-gray-600">
											{Math.round(uploadProgress[`${file.name}-${index}`] || 0)}%
										</span>
									</div>
								{/if}
							</div>
						{:else}
							<Button
								variant="ghost"
								size="sm"
								onclick={() => removeFile(index)}
								aria-label={`Remove ${file.name}`}
							>
								❌
							</Button>
						{/if}
					</div>
				{/each}
			</div>

			{#if !uploading}
				<div class="mt-4 flex justify-end space-x-3">
					<Button
						variant="secondary"
						onclick={() => (selectedFiles = [])}
						disabled={selectedFiles.length === 0}
					>
						Clear All
					</Button>
					<Button
						variant="primary"
						onclick={uploadFiles}
						disabled={selectedFiles.length === 0 || uploading}
					>
						Upload {selectedFiles.length} Image{selectedFiles.length !== 1 ? 's' : ''}
					</Button>
				</div>
			{/if}
		</div>
	{/if}
</Card>
