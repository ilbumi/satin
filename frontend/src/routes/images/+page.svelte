<script lang="ts">
	import { onMount } from 'svelte';
	import { Button, Card, Modal, Toast } from '$lib/components/ui';
	import { ImageGallery, AddImageByUrl, ImageViewer, ImageUpload } from '$lib/components/images';
	import { imageStore } from '$lib/features/images/store.svelte';
	import type { ImageSummary, ImageDetail, ImageFilters } from '$lib/features/images/types';

	let showAddModal = $state(false);
	let showUploadModal = $state(false);
	let showViewer = $state(false);
	let selectedImage = $state<ImageSummary | null>(null);
	let showToast = $state(false);
	let toastMessage = $state('');
	let toastType = $state<'success' | 'error'>('success');

	function showSuccessToast(message: string) {
		toastMessage = message;
		toastType = 'success';
		showToast = true;
	}

	function showErrorToast(message: string) {
		toastMessage = message;
		toastType = 'error';
		showToast = true;
	}

	function handleImageView(image: ImageSummary) {
		selectedImage = image;
		showViewer = true;
	}

	function handleImageDelete(image: ImageSummary | ImageDetail) {
		imageStore.deleteImage(image.id).then((success) => {
			if (success) {
				showSuccessToast(`${image.filename} deleted successfully`);
			} else {
				showErrorToast(`Failed to delete ${image.filename}`);
			}
		});
	}

	function handleImageAnnotate(image: ImageSummary | ImageDetail) {
		// Navigate to annotation page
		window.location.href = `/annotations?imageId=${image.id}`;
	}

	function handleAddSuccess(images: ImageDetail[]) {
		showAddModal = false;
		showSuccessToast(`${images.length} image${images.length > 1 ? 's' : ''} added successfully`);
		imageStore.refetch();
	}

	function handleAddError(error: string) {
		showErrorToast(error);
	}

	async function handleUploadSuccess(files: File[]) {
		try {
			const results = await imageStore.uploadImages(files);
			showUploadModal = false;
			showSuccessToast(
				`${results.length} image${results.length > 1 ? 's' : ''} uploaded successfully`
			);
		} catch (error) {
			showErrorToast(error instanceof Error ? error.message : 'Upload failed');
		}
	}

	function handleUploadError(error: string) {
		showErrorToast(error);
	}

	function handleFiltersChange(filters: Partial<ImageFilters>) {
		imageStore.setFilters(filters);
	}

	function handleLoadMore() {
		imageStore.nextPage();
	}

	// Load images on mount
	onMount(() => {
		imageStore.fetchImages();
	});
</script>

<svelte:head>
	<title>Images - Satin</title>
</svelte:head>

<div class="p-6">
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">Images</h1>
			<p class="mt-2 text-gray-600">Browse and manage your image collection</p>
		</div>
		<div class="flex gap-3">
			<Button variant="primary" onclick={() => (showUploadModal = true)}>
				<span class="mr-2">📤</span>
				Upload Images
			</Button>
			<Button variant="secondary" onclick={() => (showAddModal = true)}>
				<span class="mr-2">🌐</span>
				Add by URL
			</Button>
		</div>
	</div>

	<!-- Stats -->
	<div class="mb-8 grid gap-6 md:grid-cols-4">
		<Card>
			<div class="text-center">
				<div class="text-2xl font-bold text-gray-900">{imageStore.stats().total}</div>
				<div class="text-sm text-gray-600">Total Images</div>
			</div>
		</Card>
		<Card>
			<div class="text-center">
				<div class="text-2xl font-bold text-green-600">{imageStore.stats().annotated}</div>
				<div class="text-sm text-gray-600">Annotated</div>
			</div>
		</Card>
		<Card>
			<div class="text-center">
				<div class="text-2xl font-bold text-yellow-600">{imageStore.stats().processing}</div>
				<div class="text-sm text-gray-600">Processing</div>
			</div>
		</Card>
		<Card>
			<div class="text-center">
				<div class="text-2xl font-bold text-gray-400">{imageStore.stats().pending}</div>
				<div class="text-sm text-gray-600">Pending</div>
			</div>
		</Card>
	</div>

	<!-- Image Gallery -->
	<ImageGallery
		images={imageStore.images()}
		loading={imageStore.loading}
		error={imageStore.error}
		filters={imageStore.filters}
		pagination={imageStore.pagination}
		onImageView={handleImageView}
		onImageDelete={handleImageDelete}
		onImageAnnotate={handleImageAnnotate}
		onFiltersChange={handleFiltersChange}
		onUploadClick={() => (showUploadModal = true)}
		onLoadMore={handleLoadMore}
	/>
</div>

<!-- Upload Images Modal -->
<Modal bind:open={showUploadModal} title="Upload Images" size="lg" closeOnBackdropClick={true}>
	<ImageUpload onUpload={handleUploadSuccess} onError={handleUploadError} multiple={true} />
</Modal>

<!-- Add Images Modal -->
<Modal bind:open={showAddModal} title="Add Images by URL" size="lg" closeOnBackdropClick={true}>
	<AddImageByUrl multiple={true} onAdd={handleAddSuccess} onError={handleAddError} />
</Modal>

<!-- Image Viewer -->
<ImageViewer
	bind:open={showViewer}
	image={selectedImage}
	images={imageStore.allImages}
	onDelete={handleImageDelete}
	onAnnotate={handleImageAnnotate}
	onClose={() => {
		showViewer = false;
		selectedImage = null;
	}}
/>

<!-- Toast Notifications -->
{#if showToast}
	<Toast
		type={toastType}
		title={toastType === 'success' ? 'Success' : 'Error'}
		message={toastMessage}
		onClose={() => (showToast = false)}
		duration={4000}
	/>
{/if}
