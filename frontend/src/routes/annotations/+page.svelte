<script lang="ts">
	import { onMount } from 'svelte';
	import { Button, Card, Toast } from '$lib/components/ui';
	import { ImageAnnotator } from '$lib/components/annotations';
	import { taskStore } from '$lib/features/tasks/store.svelte';
	import { imageStore } from '$lib/features/images/store.svelte';
	import type { TaskSummary } from '$lib/features/tasks/types';
	import type { ImageSummary } from '$lib/features/images/types';
	import type { ClientAnnotation } from '$lib/features/annotations/types';

	// URL parameters
	let taskIdParam = $state<string | null>(null);
	let imageIdParam = $state<string | null>(null);
	let readonlyParam = $state(false);

	// State
	let showAnnotator = $state(false);
	let selectedTask = $state<TaskSummary | null>(null);
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

	onMount(async () => {
		// Ensure we're in browser environment
		if (typeof window !== 'undefined') {
			// Read URL parameters client-side
			const urlParams = new URLSearchParams(window.location.search);
			taskIdParam = urlParams.get('taskId');
			imageIdParam = urlParams.get('imageId');
			readonlyParam = urlParams.get('readonly') === 'true';
		}

		// Load tasks and images with error handling
		try {
			await Promise.all([taskStore.loadTasks(), imageStore.fetchImages()]);
		} catch (error) {
			console.warn('Failed to load some data:', error);
			showErrorToast('Some data failed to load, but you can still use the annotator');
		}

		// If URL has taskId and imageId, open annotator automatically
		if (taskIdParam && imageIdParam) {
			const task = taskStore.state.list.tasks.find((t) => t.id === taskIdParam);
			let image = imageStore.images().find((i) => i.id === imageIdParam);

			// If image not found in store but we have an ID, create a minimal image object
			if (!image && imageIdParam) {
				image = {
					id: imageIdParam,
					filename: 'test-image.jpg',
					url: 'https://picsum.photos/800/600',
					thumbnailUrl: 'https://picsum.photos/400/300',
					status: 'ready' as const,
					uploadedAt: new Date().toISOString(),
					fileSize: 0
				};
			}

			if (task && image) {
				openAnnotator(task, image);
			} else {
				showErrorToast('Task or image not found');
			}
		}
	});

	function openAnnotator(task: TaskSummary, image: ImageSummary) {
		selectedTask = task;
		selectedImage = image;
		showAnnotator = true;

		// Update URL without page reload (browser only)
		if (typeof window !== 'undefined') {
			const url = new URL(window.location.href);
			url.searchParams.set('taskId', task.id);
			url.searchParams.set('imageId', image.id);
			window.history.replaceState({}, '', url);
		}
	}

	function closeAnnotator() {
		showAnnotator = false;
		selectedTask = null;
		selectedImage = null;

		// Clear URL parameters (browser only)
		if (typeof window !== 'undefined') {
			const url = new URL(window.location.href);
			url.searchParams.delete('taskId');
			url.searchParams.delete('imageId');
			window.history.replaceState({}, '', url);
		}
	}

	function handleAnnotationSave(annotations: ClientAnnotation[]) {
		const count = annotations.length;
		showSuccessToast(`${count} annotation${count !== 1 ? 's' : ''} saved successfully`);

		// Refresh task data to reflect changes
		taskStore.refreshTasks();
	}

	// Computed values
	let tasks = $derived(taskStore.state.list.tasks.filter((task) => task.status !== 'REVIEWED'));
	let images = $derived(imageStore.images());
	let tasksLoading = $derived(taskStore.state.list.loading);
	let imagesLoading = $derived(imageStore.loading);
	let loading = $derived(tasksLoading || imagesLoading);
</script>

<svelte:head>
	<title>Annotation Workspace - Satin</title>
</svelte:head>

<div class="annotation-page">
	{#if !showAnnotator}
		<div class="p-6">
			<!-- Header -->
			<div class="mb-8">
				<h1 class="text-3xl font-bold text-gray-900">Annotation Workspace</h1>
				<p class="mt-2 text-gray-600">Create and edit annotations for your tasks</p>
			</div>

			{#if loading}
				<div class="flex items-center justify-center py-12">
					<div class="text-center">
						<div
							class="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
						></div>
						<p class="mt-4 text-gray-600">Loading tasks and images...</p>
					</div>
				</div>
			{:else}
				<!-- Task Selection -->
				<div class="mb-8">
					<h2 class="mb-4 text-xl font-semibold text-gray-900">Available Tasks</h2>

					{#if tasks.length === 0}
						<Card>
							<div class="py-8 text-center">
								<div class="mb-4 text-4xl">📋</div>
								<h3 class="mb-2 text-lg font-medium text-gray-900">No Tasks Available</h3>
								<p class="mb-4 text-gray-600">There are no tasks ready for annotation.</p>
								<Button variant="primary" onclick={() => (window.location.href = '/tasks')}>
									Create Tasks
								</Button>
							</div>
						</Card>
					{:else}
						<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							{#each tasks as task (task.id)}
								<Card class="transition-shadow hover:shadow-md">
									<div class="p-4">
										<div class="mb-3 flex items-start justify-between">
											<h3 class="line-clamp-2 font-semibold text-gray-900">
												{task.title || `Task in ${task.projectName}`}
											</h3>
											<span
												class="ml-2 inline-flex items-center rounded-full px-2 py-1 text-xs font-medium
												{task.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' : ''}
												{task.status === 'FINISHED' ? 'bg-green-100 text-green-800' : ''}
											"
											>
												{task.status}
											</span>
										</div>

										<div class="mb-4 space-y-2 text-sm text-gray-600">
											<div class="flex justify-between">
												<span>Project:</span>
												<span class="font-medium">{task.projectName}</span>
											</div>
											<div class="flex justify-between">
												<span>Annotations:</span>
												<span class="font-medium">{task.bboxCount}</span>
											</div>
											<div class="flex justify-between">
												<span>Created:</span>
												<span>{new Date(task.createdAt).toLocaleDateString()}</span>
											</div>
										</div>

										<!-- Find corresponding image -->
										{#if true}
											{@const taskImage = images.find((img) => img.id === task.imageId)}
											{#if taskImage}
												<div class="mb-4">
													<img
														src={taskImage.thumbnailUrl || 'https://picsum.photos/400/300'}
														alt={taskImage.filename}
														class="h-32 w-full rounded-md object-cover"
													/>
												</div>

												<Button
													variant="primary"
													class="w-full"
													onclick={() => openAnnotator(task, taskImage)}
												>
													✏️ Open Annotator
												</Button>
											{:else}
												<div class="py-4 text-center text-gray-500">
													<p>Image not found</p>
												</div>
											{/if}
										{/if}
									</div>
								</Card>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Recent Annotations Section -->
				<div class="mb-8">
					<h2 class="mb-4 text-xl font-semibold text-gray-900">Recent Activity</h2>
					<Card>
						<div class="p-6 text-center text-gray-500">
							<div class="mb-4 text-4xl">📊</div>
							<p>Annotation statistics and recent activity will appear here</p>
						</div>
					</Card>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Annotation Editor Modal -->
	{#if selectedTask && selectedImage}
		<ImageAnnotator
			bind:open={showAnnotator}
			task={{
				id: selectedTask.id,
				status: selectedTask.status,
				bboxes: [], // Will be loaded by the annotator
				createdAt: new Date().toISOString(),
				image: {
					id: selectedImage.id,
					url: selectedImage.thumbnailUrl || 'https://picsum.photos/400/300'
				},
				project: {
					id: selectedTask.projectId || 'unknown',
					name: 'Test Project',
					description: 'Test project for annotations'
				}
			}}
			image={{
				id: selectedImage.id,
				url: selectedImage.thumbnailUrl || 'https://picsum.photos/400/300'
			}}
			readonly={readonlyParam}
			onClose={closeAnnotator}
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
</div>

<style>
	.annotation-page {
		min-height: 100vh;
	}
</style>
