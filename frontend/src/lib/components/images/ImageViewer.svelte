<script lang="ts">
	import { Button, Modal, Spinner } from '$lib/components/ui';
	import { imageService } from '$lib/features/images/service';
	import type { ImageDetail, ImageSummary } from '$lib/features/images/types';

	interface ImageViewerProps {
		open?: boolean;
		image: ImageSummary | ImageDetail | null;
		images?: ImageSummary[]; // For navigation between images
		onClose?: () => void;
		onDelete?: (image: ImageSummary | ImageDetail) => void;
		onAnnotate?: (image: ImageSummary | ImageDetail) => void;
		onDownload?: (image: ImageSummary | ImageDetail) => void;
	}

	let {
		open = $bindable(false),
		image,
		images = [],
		onClose,
		onDelete,
		onAnnotate,
		onDownload
	}: ImageViewerProps = $props();

	let imageElement = $state<HTMLImageElement>();
	let imageLoading = $state(true);
	let imageError = $state(false);
	let fullDetail = $state<ImageDetail | null>(null);
	let loadingDetail = $state(false);

	// Zoom and pan state
	let zoom = $state(1);
	let panX = $state(0);
	let panY = $state(0);
	let isDragging = $state(false);
	let lastMouseX = $state(0);
	let lastMouseY = $state(0);

	// Navigation
	const currentIndex = $derived(() => {
		if (!image || images.length === 0) return -1;
		return images.findIndex((img) => img.id === image.id);
	});

	const hasNext = $derived(() => currentIndex() >= 0 && currentIndex() < images.length - 1);
	const hasPrev = $derived(() => currentIndex() > 0);

	// Load full image details when image changes
	$effect(() => {
		if (image && 'filename' in image && !('metadata' in image)) {
			loadImageDetails(image.id);
		} else if (image) {
			fullDetail = image as ImageDetail;
		}
	});

	async function loadImageDetails(id: string) {
		try {
			loadingDetail = true;
			const detail = await imageService.getImage(id);
			fullDetail = detail;
		} catch (error) {
			console.error('Failed to load image details:', error);
		} finally {
			loadingDetail = false;
		}
	}

	function handleImageLoad() {
		imageLoading = false;
		imageError = false;
		resetZoom();
	}

	function handleImageError() {
		imageLoading = false;
		imageError = true;
	}

	function resetZoom() {
		zoom = 1;
		panX = 0;
		panY = 0;
	}

	function zoomIn() {
		zoom = Math.min(zoom * 1.5, 5);
	}

	function zoomOut() {
		zoom = Math.max(zoom / 1.5, 0.5);
		// Adjust pan to keep image centered
		if (zoom === 0.5) {
			panX = 0;
			panY = 0;
		}
	}

	function handleWheel(event: WheelEvent) {
		event.preventDefault();
		if (event.deltaY < 0) {
			zoomIn();
		} else {
			zoomOut();
		}
	}

	function handleMouseDown(event: MouseEvent) {
		if (zoom > 1) {
			isDragging = true;
			lastMouseX = event.clientX;
			lastMouseY = event.clientY;
		}
	}

	function handleMouseMove(event: MouseEvent) {
		if (isDragging && zoom > 1) {
			const deltaX = event.clientX - lastMouseX;
			const deltaY = event.clientY - lastMouseY;

			panX += deltaX;
			panY += deltaY;

			lastMouseX = event.clientX;
			lastMouseY = event.clientY;
		}
	}

	function handleMouseUp() {
		isDragging = false;
	}

	function navigateNext() {
		if (hasNext()) {
			// Update the image prop (would need parent to handle this)
			// This is a simplified approach - in real implementation,
			// you'd want to emit an event to the parent component
			console.log('Navigate to next image');
		}
	}

	function navigatePrev() {
		if (hasPrev()) {
			// Update the image prop (would need parent to handle this)
			console.log('Navigate to previous image');
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		switch (event.key) {
			case 'ArrowLeft':
				event.preventDefault();
				navigatePrev();
				break;
			case 'ArrowRight':
				event.preventDefault();
				navigateNext();
				break;
			case 'Escape':
				event.preventDefault();
				onClose?.();
				break;
			case '+':
			case '=':
				event.preventDefault();
				zoomIn();
				break;
			case '-':
				event.preventDefault();
				zoomOut();
				break;
			case '0':
				event.preventDefault();
				resetZoom();
				break;
		}
	}

	function handleDownload() {
		if (!image) return;

		if (onDownload) {
			onDownload(image);
		} else {
			// Default download behavior
			const link = document.createElement('a');
			const imageUrl = fullDetail?.url || ('url' in image ? image.url : '');
			const filename = fullDetail?.filename || image.filename || 'image';
			link.href = imageUrl;
			link.download = filename;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		}
	}

	function formatFileSize(bytes: number): string {
		return imageService.formatFileSize(bytes);
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'annotated':
				return 'bg-green-100 text-green-800';
			case 'ready':
				return 'bg-blue-100 text-blue-800';
			case 'processing':
				return 'bg-yellow-100 text-yellow-800';
			case 'pending':
				return 'bg-gray-100 text-gray-800';
			case 'error':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if image}
	<Modal
		bind:open
		size="full"
		title={fullDetail?.filename || image.filename || 'Image Viewer'}
		showCloseButton={true}
		closeOnBackdropClick={true}
		closeOnEscape={true}
		{onClose}
	>
		<div class="flex h-full">
			<!-- Main image area -->
			<div class="flex flex-1 flex-col">
				<!-- Toolbar -->
				<div class="flex items-center justify-between border-b border-gray-200 bg-gray-50 p-4">
					<div class="flex items-center space-x-4">
						<!-- Navigation -->
						{#if images.length > 1}
							<div class="flex items-center space-x-2">
								<Button
									variant="secondary"
									size="sm"
									onclick={navigatePrev}
									disabled={!hasPrev()}
									aria-label="Previous image"
								>
									⬅️
								</Button>
								<span class="text-sm text-gray-600">
									{currentIndex() + 1} of {images.length}
								</span>
								<Button
									variant="secondary"
									size="sm"
									onclick={navigateNext}
									disabled={!hasNext()}
									aria-label="Next image"
								>
									➡️
								</Button>
							</div>
						{/if}

						<!-- Zoom controls -->
						<div class="flex items-center space-x-2">
							<Button variant="secondary" size="sm" onclick={zoomOut} disabled={zoom <= 0.5}>
								➖
							</Button>
							<span class="min-w-16 text-center text-sm text-gray-600">
								{Math.round(zoom * 100)}%
							</span>
							<Button variant="secondary" size="sm" onclick={zoomIn} disabled={zoom >= 5}>
								➕
							</Button>
							<Button variant="secondary" size="sm" onclick={resetZoom}>⌂ Fit</Button>
						</div>
					</div>

					<!-- Actions -->
					<div class="flex items-center space-x-2">
						<Button variant="secondary" size="sm" onclick={handleDownload}>💾 Download</Button>

						{#if onAnnotate}
							<Button variant="secondary" size="sm" onclick={() => onAnnotate?.(image)}>
								✏️ Annotate
							</Button>
						{/if}

						{#if onDelete}
							<Button
								variant="danger"
								size="sm"
								onclick={() => {
									if (confirm(`Delete ${fullDetail?.filename || 'this image'}?`)) {
										onDelete?.(image);
									}
								}}
							>
								🗑️ Delete
							</Button>
						{/if}
					</div>
				</div>

				<!-- Image display area -->
				<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
				<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
				<div
					class="relative flex flex-1 items-center justify-center overflow-hidden bg-gray-900"
					onwheel={handleWheel}
					onmousedown={handleMouseDown}
					onmousemove={handleMouseMove}
					onmouseup={handleMouseUp}
					onmouseleave={handleMouseUp}
					style="cursor: {zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'}"
					role="application"
					aria-label="Image viewer with zoom and pan controls"
					tabindex="0"
				>
					{#if imageLoading}
						<div class="flex flex-col items-center text-white">
							<Spinner size="lg" />
							<p class="mt-4">Loading image...</p>
						</div>
					{:else if imageError}
						<div class="flex flex-col items-center text-white">
							<div class="mb-4 text-6xl">❌</div>
							<p>Failed to load image</p>
						</div>
					{:else}
						<img
							bind:this={imageElement}
							src={fullDetail?.previewUrl || fullDetail?.url || image.thumbnailUrl}
							alt={fullDetail?.filename || image.filename}
							class="max-w-none transition-transform"
							style="transform: scale({zoom}) translate({panX / zoom}px, {panY / zoom}px)"
							onload={handleImageLoad}
							onerror={handleImageError}
							draggable="false"
						/>
					{/if}
				</div>

				<!-- Instructions -->
				<div class="bg-gray-100 p-2 text-center text-xs text-gray-600">
					Use mouse wheel to zoom • Drag to pan • Arrow keys to navigate • Esc to close
				</div>
			</div>

			<!-- Sidebar with image info -->
			<div class="w-80 overflow-y-auto border-l border-gray-200 bg-white p-6">
				{#if loadingDetail}
					<div class="flex items-center justify-center py-8">
						<Spinner size="md" />
					</div>
				{:else if fullDetail}
					<div class="space-y-6">
						<!-- Basic info -->
						<div>
							<h3 class="mb-4 text-lg font-semibold text-gray-900">Image Details</h3>

							<dl class="space-y-3">
								<div>
									<dt class="text-sm font-medium text-gray-500">Filename</dt>
									<dd class="text-sm break-all text-gray-900">{fullDetail.filename}</dd>
								</div>

								<div>
									<dt class="text-sm font-medium text-gray-500">Status</dt>
									<dd class="mt-1">
										<span
											class="inline-flex rounded-full px-2 py-1 text-xs font-medium {getStatusColor(
												fullDetail.metadata?.status || 'ready'
											)}"
										>
											{fullDetail.metadata?.status || 'ready'}
										</span>
									</dd>
								</div>

								{#if fullDetail.dimensions}
									<div>
										<dt class="text-sm font-medium text-gray-500">Dimensions</dt>
										<dd class="text-sm text-gray-900">
											{fullDetail.dimensions.width} × {fullDetail.dimensions.height}
										</dd>
									</div>
								{/if}

								<div>
									<dt class="text-sm font-medium text-gray-500">File Size</dt>
									<dd class="text-sm text-gray-900">{formatFileSize(fullDetail.fileSize)}</dd>
								</div>

								<div>
									<dt class="text-sm font-medium text-gray-500">Type</dt>
									<dd class="text-sm text-gray-900">{fullDetail.mimeType}</dd>
								</div>

								{#if fullDetail.metadata?.projectName}
									<div>
										<dt class="text-sm font-medium text-gray-500">Project</dt>
										<dd class="text-sm text-gray-900">{fullDetail.metadata.projectName}</dd>
									</div>
								{/if}

								{#if fullDetail.metadata?.uploadedAt}
									<div>
										<dt class="text-sm font-medium text-gray-500">Uploaded</dt>
										<dd class="text-sm text-gray-900">
											{new Date(fullDetail.metadata.uploadedAt).toLocaleString()}
										</dd>
									</div>
								{/if}

								{#if fullDetail.metadata?.annotations}
									<div>
										<dt class="text-sm font-medium text-gray-500">Annotations</dt>
										<dd class="text-sm text-gray-900">{fullDetail.metadata.annotations}</dd>
									</div>
								{/if}
							</dl>
						</div>

						<!-- Actions -->
						<div class="space-y-2">
							<Button variant="primary" class="w-full" onclick={handleDownload}>
								💾 Download Original
							</Button>

							{#if onAnnotate}
								<Button variant="secondary" class="w-full" onclick={() => onAnnotate?.(image)}>
									✏️ Open in Annotator
								</Button>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		</div>
	</Modal>
{/if}
