<script lang="ts">
	import { Button } from '$lib/components/ui';
	import { imageService } from '$lib/features/images/service';

	interface Props {
		onUpload?: (files: File[]) => Promise<void>;
		onError?: (error: string) => void;
		multiple?: boolean;
		accept?: string;
	}

	let {
		onUpload = async () => {},
		onError = () => {},
		multiple = true,
		accept = 'image/jpeg,image/jpg,image/png,image/gif,image/webp'
	}: Props = $props();

	let uploading = $state(false);
	let dragOver = $state(false);
	let fileInput: HTMLInputElement;

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files) {
			handleFiles(Array.from(target.files));
		}
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		dragOver = false;

		if (event.dataTransfer?.files) {
			handleFiles(Array.from(event.dataTransfer.files));
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		dragOver = true;
	}

	function handleDragLeave(event: DragEvent) {
		event.preventDefault();
		dragOver = false;
	}

	async function handleFiles(files: File[]) {
		if (files.length === 0) return;

		// Validate files
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
			onError(errors.join('\n'));
		}

		if (validFiles.length === 0) return;

		try {
			uploading = true;
			await onUpload(validFiles);
		} catch (error) {
			onError(error instanceof Error ? error.message : 'Upload failed');
		} finally {
			uploading = false;
			// Reset file input
			if (fileInput) {
				fileInput.value = '';
			}
		}
	}

	function triggerFileSelect() {
		fileInput?.click();
	}
</script>

<div class="space-y-4">
	<!-- File Input (Hidden) -->
	<input
		bind:this={fileInput}
		type="file"
		{accept}
		{multiple}
		class="hidden"
		onchange={handleFileSelect}
	/>

	<!-- Drop Zone -->
	<div
		class="relative rounded-lg border-2 border-dashed p-8 text-center transition-colors {dragOver
			? 'border-blue-400 bg-blue-50'
			: 'border-gray-300 hover:border-gray-400'}"
		ondrop={handleDrop}
		ondragover={handleDragOver}
		ondragleave={handleDragLeave}
		role="button"
		tabindex="0"
		onclick={triggerFileSelect}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				triggerFileSelect();
			}
		}}
	>
		<div class="space-y-4">
			<div class="text-6xl">📤</div>
			<div>
				<p class="text-lg font-medium text-gray-900">Click to upload or drag and drop</p>
				<p class="text-sm text-gray-500">Supports JPEG, PNG, and WebP up to 10MB each</p>
			</div>
			<Button variant="primary" disabled={uploading}>
				{uploading ? 'Uploading...' : 'Select Files'}
			</Button>
		</div>
	</div>

	{#if uploading}
		<div class="text-center">
			<div class="inline-flex items-center space-x-2">
				<div
					class="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"
				></div>
				<span class="text-sm text-gray-600">Uploading images...</span>
			</div>
		</div>
	{/if}
</div>
