<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Button, Card, Modal, Toast } from '$lib/components/ui';
	// Dynamic imports for heavy components
	let ImageGallery: typeof import('$lib/components/images/ImageGallery.svelte').default | null =
		$state(null);
	let VirtualImageGallery:
		| typeof import('$lib/components/images/VirtualImageGallery.svelte').default
		| null = $state(null);
	let AddImageByUrl: typeof import('$lib/components/images/AddImageByUrl.svelte').default | null =
		$state(null);
	let ImageViewer: typeof import('$lib/components/images/ImageViewer.svelte').default | null =
		$state(null);
	import { imageStore } from '$lib/features/images/store.svelte';
	import { taskStore } from '$lib/features/tasks/store.svelte';
	import type { ImageSummary, ImageDetail, ImageFilters } from '$lib/features/images/types';
	import type { ClientAnnotation } from '$lib/features/annotations/types';
	import type { Task } from '$lib/graphql/generated/graphql';
	import { storeCoordinator } from '$lib/core/stores/coordinator.svelte';
	import { errorStore } from '$lib/core/errors';

	let showAddModal = $state(false);
	let showViewer = $state(false);
	let showAnnotator = $state(false);
	let selectedImage = $state<ImageSummary | null>(null);
	let selectedImageForAnnotation = $state<ImageSummary | null>(null);
	let selectedTaskForAnnotation = $state<Task | null>(null);
	let ImageAnnotator = $state<
		typeof import('$lib/components/annotations/ImageAnnotator.svelte').default | null
	>(null);
	let showToast = $state(false);
	let toastMessage = $state('');
	let toastType = $state<'success' | 'error'>('success');

	// Virtualization threshold - use virtual gallery when we have many images
	const VIRTUAL_GALLERY_THRESHOLD = 50;

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

	async function handleImageAnnotate(image: ImageSummary | ImageDetail) {
		// Find or create a task for this image
		try {
			await taskStore.loadTasks();
		} catch (error) {
			console.error('Failed to load tasks:', error);
			showErrorToast('Failed to load tasks');
			return;
		}

		let task = taskStore.state.list.tasks.find((t) => t.imageId === image.id);

		if (!task) {
			// Create a new task for this image
			try {
				// You might want to show a modal to let user select project first
				// For now, we'll create a simple task
				const createForm = {
					imageId: image.id,
					projectId: 'default', // You'd need to handle project selection
					status: 'DRAFT' as const
				};

				await taskStore.createTask(createForm);
				await taskStore.loadTasks(); // Refresh to get the new task
				task = taskStore.state.list.tasks.find((t) => t.imageId === image.id);
			} catch {
				showErrorToast('Failed to create annotation task');
				return;
			}
		}

		if (!task) {
			showErrorToast('Could not create or find annotation task');
			return;
		}

		// Get the actual Task object from the service
		try {
			const taskService = new (await import('$lib/features/tasks/service')).TaskService();
			const fullTask = await taskService.getTask(task.id);

			if (!fullTask) {
				showErrorToast('Could not load task details');
				return;
			}

			// Dynamically import ImageAnnotator before opening
			if (!ImageAnnotator) {
				try {
					const module = await import('$lib/components/annotations');
					ImageAnnotator = module.ImageAnnotator;
				} catch {
					showErrorToast('Failed to load annotation editor');
					return;
				}
			}

			// Open the annotation editor
			selectedImageForAnnotation = image as ImageSummary;
			selectedTaskForAnnotation = fullTask;
			showAnnotator = true;
		} catch (error) {
			console.error('Failed to prepare annotation task:', error);
			showErrorToast('Failed to prepare annotation task');
		}
	}

	function handleAnnotationSave(annotations: ClientAnnotation[]) {
		const count = annotations.length;
		showSuccessToast(`${count} annotation${count !== 1 ? 's' : ''} saved successfully`);

		// Refresh task data
		taskStore.refreshTasks();
	}

	function handleAnnotatorClose() {
		showAnnotator = false;
		selectedImageForAnnotation = null;
		selectedTaskForAnnotation = null;
	}

	function handleAddSuccess(images: ImageDetail[]) {
		showAddModal = false;
		showSuccessToast(`${images.length} image${images.length > 1 ? 's' : ''} added successfully`);
		imageStore.refetch();
	}

	function handleAddError(error: string) {
		showErrorToast(error);
	}

	function handleFiltersChange(filters: Partial<ImageFilters>) {
		imageStore.setFilters(filters);
	}

	function handleLoadMore() {
		imageStore.nextPage();
	}

	// Load images, tasks and components on mount
	onMount(async () => {
		// Load core components first
		try {
			const [galleryModule, virtualGalleryModule, addImageModule, viewerModule] = await Promise.all(
				[
					import('$lib/components/images/ImageGallery.svelte'),
					import('$lib/components/images/VirtualImageGallery.svelte'),
					import('$lib/components/images/AddImageByUrl.svelte'),
					import('$lib/components/images/ImageViewer.svelte')
				]
			);
			ImageGallery = galleryModule.default;
			VirtualImageGallery = virtualGalleryModule.default;
			AddImageByUrl = addImageModule.default;
			ImageViewer = viewerModule.default;
		} catch (error) {
			console.error('Failed to load image components:', error);
			errorStore.addSystemError('Failed to load image components', 'Images Page');
		}

		// Load data using the coordinator to prevent race conditions
		try {
			const result = await storeCoordinator.loadInitialData();
			if (!result.success && result.errors.length > 0) {
				console.warn('Some data failed to load:', result.errors);
				// Errors are already handled by the coordinator and stores
			}
		} catch (error) {
			console.error('Failed to load initial data:', error);
			errorStore.addSystemError('Failed to load page data', 'Images Page');
		}
	});

	onDestroy(() => {
		// Clean up all stores using the coordinator
		storeCoordinator.cleanup();
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
			<Button variant="primary" onclick={() => (showAddModal = true)}>
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

	<!-- Image Gallery - Use virtual gallery for large datasets -->
	{#if imageStore.pagination.totalCount >= VIRTUAL_GALLERY_THRESHOLD && VirtualImageGallery}
		<VirtualImageGallery
			images={imageStore.images()}
			loading={imageStore.loading}
			error={imageStore.error}
			filters={imageStore.filters}
			pagination={imageStore.pagination}
			containerHeight={800}
			onImageView={handleImageView}
			onImageDelete={handleImageDelete}
			onImageAnnotate={handleImageAnnotate}
			onFiltersChange={handleFiltersChange}
			onLoadMore={handleLoadMore}
		/>
	{:else if ImageGallery}
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
			onLoadMore={handleLoadMore}
		/>
	{:else}
		<div class="flex items-center justify-center py-12">
			<div class="animate-pulse text-gray-600">Loading images...</div>
		</div>
	{/if}
</div>

<!-- Add Images Modal -->
{#if AddImageByUrl && showAddModal}
	<Modal bind:open={showAddModal} title="Add Images by URL" size="lg" closeOnBackdropClick={true}>
		<AddImageByUrl multiple={true} onAdd={handleAddSuccess} onError={handleAddError} />
	</Modal>
{/if}

<!-- Image Viewer -->
{#if ImageViewer && showViewer}
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
{/if}

<!-- Image Annotator -->
{#if selectedImageForAnnotation && selectedTaskForAnnotation && ImageAnnotator}
	{@const AnnotatorComponent = ImageAnnotator}
	<AnnotatorComponent
		bind:open={showAnnotator}
		task={selectedTaskForAnnotation}
		image={{
			id: selectedImageForAnnotation.id,
			url: selectedImageForAnnotation.url
		}}
		onClose={handleAnnotatorClose}
		onSaveComplete={handleAnnotationSave}
	/>
{/if}

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
