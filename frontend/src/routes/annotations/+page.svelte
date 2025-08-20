<script lang="ts">
	import { onMount } from 'svelte';
	import { taskStore } from '$lib/features/tasks/store.svelte';
	import { imageStore } from '$lib/features/images/store.svelte';
	import { ImageAnnotator } from '$lib/components/annotations';
	import type { TaskSummary } from '$lib/features/tasks/types';
	import type { ImageSummary } from '$lib/features/images/types';
	// Test step 5: Adding all imports
	let debugMessage = $state('Annotations page with all imports loaded successfully!');

	// State
	let showAnnotator = $state(false);
	let selectedTask = $state<TaskSummary | null>(null);
	let selectedImage = $state<ImageSummary | null>(null);

	onMount(async () => {
		try {
			// Check if we have URL parameters
			if (typeof window !== 'undefined') {
				const urlParams = new URLSearchParams(window.location.search);
				const taskIdParam = urlParams.get('taskId');
				const imageIdParam = urlParams.get('imageId');

				if (taskIdParam && imageIdParam) {
					const fallbackImageUrl = `data:image/svg+xml;base64,${btoa(`
						<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
							<rect width="800" height="600" fill="#e2e8f0" />
							<text x="400" y="300" text-anchor="middle" dominant-baseline="middle"
							      font-family="Arial" font-size="24" fill="#64748b">
								Test Image
							</text>
						</svg>
					`)}`;

					// Create fallback task and image for testing
					selectedTask = {
						id: taskIdParam,
						projectId: 'fallback-project',
						projectName: 'Fallback Project',
						title: 'Fallback Task',
						status: 'DRAFT' as const,
						createdAt: new Date().toISOString(),
						imageUrl: fallbackImageUrl,
						imageId: imageIdParam,
						bboxCount: 0
					};

					selectedImage = {
						id: imageIdParam,
						filename: 'test-image.svg',
						url: fallbackImageUrl,
						thumbnailUrl: fallbackImageUrl,
						status: 'ready' as const,
						uploadedAt: new Date().toISOString(),
						fileSize: 0
					};

					showAnnotator = true;
					debugMessage = 'ImageAnnotator opened with URL parameters!';
				}
			}

			// Load store data in background
			try {
				await Promise.all([taskStore.loadTasks(), imageStore.fetchImages()]);
			} catch (error) {
				console.warn('Store loading failed:', error);
			}
		} catch (error) {
			debugMessage = `Page initialization failed: ${error}`;
		}
	});
</script>

<svelte:head>
	<title>Annotation Workspace - Satin</title>
</svelte:head>

<div class="annotation-page">
	{#if !showAnnotator}
		<div class="p-6">
			<h1 class="text-3xl font-bold text-gray-900">Annotation Workspace</h1>
			<p class="mt-2 text-gray-600">{debugMessage}</p>
		</div>
	{/if}

	<!-- Annotation Editor Modal -->
	{#if selectedTask && selectedImage}
		<ImageAnnotator
			bind:open={showAnnotator}
			task={{
				id: selectedTask.id,
				status: selectedTask.status,
				bboxes: [],
				createdAt: new Date().toISOString(),
				image: {
					id: selectedImage.id,
					url: selectedImage.url
				},
				project: {
					id: selectedTask.projectId || 'unknown',
					name: 'Test Project',
					description: 'Test project for annotations'
				}
			}}
			image={{
				id: selectedImage.id,
				url: selectedImage.url
			}}
			readonly={false}
			onClose={() => {
				showAnnotator = false;
			}}
		/>
	{/if}
</div>
