<script lang="ts">
	import { Button, Card } from '$lib/components/ui';
	import type { ImageDetail } from '$lib/features/images/types';

	interface AddImageByFileProps {
		multiple?: boolean;
		onAdd?: (images: ImageDetail[]) => void;
		onError?: (error: string) => void;
	}

	let { multiple = true, onAdd, onError }: AddImageByFileProps = $props();

	let fileInputRef: HTMLInputElement;
	let dragActive = $state(false);
	let uploading = $state(false);
	let selectedFiles = $state<File[]>([]);

	const maxFileSize = 10 * 1024 * 1024; // 10MB
	const allowedTypes = [
		'image/jpeg',
		'image/jpg',
		'image/png',
		'image/gif',
		'image/webp',
		'image/bmp'
	];

	function validateFile(file: File): string | null {
		if (!allowedTypes.includes(file.type)) {
			return `Unsupported file type: ${file.type}. Allowed types: ${allowedTypes.join(', ')}`;
		}

		if (file.size > maxFileSize) {
			return `File too large: ${(file.size / (1024 * 1024)).toFixed(2)}MB. Maximum size: ${maxFileSize / (1024 * 1024)}MB`;
		}

		return null;
	}

	function handleFileSelect(files: FileList | null) {
		if (!files) return;

		const fileArray = Array.from(files);
		const validFiles: File[] = [];
		const errors: string[] = [];

		for (const file of fileArray) {
			const error = validateFile(file);
			if (error) {
				errors.push(`${file.name}: ${error}`);
			} else {
				validFiles.push(file);
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
	}

	function handleFileInputChange(event: Event) {
		const target = event.target as HTMLInputElement;
		handleFileSelect(target.files);
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		dragActive = true;
	}

	function handleDragLeave(event: DragEvent) {
		event.preventDefault();
		dragActive = false;
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		dragActive = false;
		handleFileSelect(event.dataTransfer?.files || null);
	}

	function removeFile(index: number) {
		selectedFiles = selectedFiles.filter((_, i) => i !== index);
	}

	function triggerFileSelect() {
		fileInputRef?.click();
	}

	async function uploadFiles() {
		if (selectedFiles.length === 0) {
			onError?.('Please select at least one file');
			return;
		}

		uploading = true;
		const uploadedImages: ImageDetail[] = [];
		const errors: string[] = [];

		try {
			for (const file of selectedFiles) {
				try {
					const formData = new FormData();
					formData.append('file', file);

					const response = await fetch('/uploads/', {
						method: 'POST',
						body: formData
					});

					if (!response.ok) {
						const errorData = await response.json();
						throw new Error(errorData.detail || `HTTP ${response.status}`);
					}

					const result = await response.json();
					const uploadData = result.data;

					// Convert upload result to ImageDetail format
					const imageDetail: ImageDetail = {
						id: '', // Will be set when created in GraphQL
						url: uploadData.url,
						filename: uploadData.filename,
						fileSize: uploadData.size,
						mimeType: uploadData.mime_type,
						dimensions: {
							width: uploadData.width,
							height: uploadData.height
						},
						thumbnailUrl: uploadData.url, // Use same URL for now
						previewUrl: uploadData.url,
						metadata: {
							status: 'ready',
							uploadedAt: new Date().toISOString(),
							projectName: undefined
						}
					};

					// Now create the image record in GraphQL with upload metadata
					const graphqlResponse = await fetch('/graphql', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({
							query: `
								mutation CreateImageFromUpload(
									$url: String!
									$filename: String!
									$size: Int!
									$mimeType: String!
									$width: Int!
									$height: Int!
									$imageFormat: String
								) {
									createImageFromUpload(
										url: $url
										filename: $filename
										size: $size
										mimeType: $mimeType
										width: $width
										height: $height
										imageFormat: $imageFormat
									) {
										id
										url
										dimensions {
											width
											height
										}
										metadata {
											filename
											size
											mimeType
											format
											uploadedAt
											isUploaded
										}
									}
								}
							`,
							variables: {
								url: uploadData.url,
								filename: uploadData.filename,
								size: uploadData.size,
								mimeType: uploadData.mime_type,
								width: uploadData.width,
								height: uploadData.height,
								imageFormat: uploadData.format
							}
						})
					});

					if (!graphqlResponse.ok) {
						throw new Error(`GraphQL request failed: ${graphqlResponse.status}`);
					}

					const graphqlResult = await graphqlResponse.json();

					if (graphqlResult.errors) {
						throw new Error(graphqlResult.errors[0].message);
					}

					// Update imageDetail with ID from GraphQL
					imageDetail.id = graphqlResult.data.createImageFromUpload.id;
					uploadedImages.push(imageDetail);
				} catch (error) {
					const errorMsg = error instanceof Error ? error.message : 'Upload failed';
					errors.push(`${file.name}: ${errorMsg}`);
				}
			}

			if (errors.length > 0) {
				onError?.(errors.join('\n'));
			}

			if (uploadedImages.length > 0) {
				onAdd?.(uploadedImages);
				selectedFiles = []; // Clear selected files after successful upload
			}
		} finally {
			uploading = false;
		}
	}

	function clearFiles() {
		selectedFiles = [];
	}

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}
</script>

<Card class="p-6">
	<div class="mb-6 text-center">
		<div class="mb-4 text-4xl text-gray-400">📁</div>
		<p class="mb-2 text-lg font-medium text-gray-900">Upload Images</p>
		<p class="mb-4 text-sm text-gray-500">
			Select or drag and drop image files to upload them to your collection
		</p>
	</div>

	<!-- Hidden file input -->
	<input
		bind:this={fileInputRef}
		type="file"
		accept={allowedTypes.join(',')}
		{multiple}
		style="display: none"
		onchange={handleFileInputChange}
	/>

	<!-- Drop zone -->
	<div
		class="rounded-lg border-2 border-dashed p-8 text-center transition-colors {dragActive
			? 'border-blue-400 bg-blue-50'
			: 'border-gray-300 hover:border-gray-400'} {uploading
			? 'pointer-events-none opacity-50'
			: ''}"
		ondragover={handleDragOver}
		ondragleave={handleDragLeave}
		ondrop={handleDrop}
		onclick={triggerFileSelect}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				triggerFileSelect();
			}
		}}
		role="button"
		tabindex="0"
	>
		<div class="mb-4 text-6xl text-gray-400">
			{dragActive ? '⬇️' : '📋'}
		</div>
		<p class="mb-2 text-lg font-medium text-gray-600">
			{dragActive ? 'Drop files here' : 'Click to select files or drag and drop'}
		</p>
		<p class="text-sm text-gray-500">
			Supported: JPEG, PNG, GIF, WebP, BMP • Max {maxFileSize / (1024 * 1024)}MB per file
		</p>
	</div>

	<!-- Selected files list -->
	{#if selectedFiles.length > 0}
		<div class="mt-6">
			<h4 class="mb-3 text-sm font-medium text-gray-900">
				Selected Files ({selectedFiles.length})
			</h4>
			<div class="space-y-2">
				{#each selectedFiles as file, index (file.name + index)}
					<div class="flex items-center justify-between rounded-md bg-gray-50 p-3">
						<div class="flex items-center space-x-3">
							<div class="text-2xl">🖼️</div>
							<div>
								<p class="truncate text-sm font-medium text-gray-900">{file.name}</p>
								<p class="text-xs text-gray-500">
									{formatFileSize(file.size)} • {file.type}
								</p>
							</div>
						</div>
						<Button
							variant="ghost"
							size="sm"
							onclick={() => removeFile(index)}
							disabled={uploading}
							aria-label={`Remove ${file.name}`}
						>
							❌
						</Button>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Actions -->
	<div class="mt-6 flex justify-end space-x-3">
		<Button
			variant="secondary"
			onclick={clearFiles}
			disabled={uploading || selectedFiles.length === 0}
		>
			Clear All
		</Button>
		<Button
			variant="primary"
			onclick={uploadFiles}
			disabled={selectedFiles.length === 0 || uploading}
		>
			{#if uploading}
				<div
					class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"
				></div>
				Uploading...
			{:else}
				Upload {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''}
			{/if}
		</Button>
	</div>
</Card>
