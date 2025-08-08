<script lang="ts">
	import { page } from '$app/stores';
	import { client } from '$lib/graphql/client';
	import {
		GET_IMAGES,
		CREATE_TASK,
		UPDATE_TASK,
		GET_TASK_BY_IMAGE_AND_PROJECT
	} from '$lib/graphql/queries';
	import type { Image, Task, BBox, BBoxInput, TaskStatus } from '$lib/graphql/types';
	import Navigation from '$lib/components/Navigation.svelte';
	let images: Image[] = $state([]);
	let currentImageIndex = $state(0);
	let currentTask: Task | null = $state(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Canvas and drawing state
	let canvas = $state<HTMLCanvasElement>();
	let ctx: CanvasRenderingContext2D | null = null;
	let imageElement: HTMLImageElement | null = null;
	let isDrawing = $state(false);
	let startX = $state(0);
	let startY = $state(0);
	let currentBBox: BBox | null = $state(null);
	let bboxes: BBox[] = $state([]);

	// Annotation form state
	let showAnnotationForm = $state(false);
	let annotationText = $state('');
	let annotationTags = $state('');
	let editingBBoxIndex = $state(-1);

	$effect(() => {
		const projectId = $page.params.id;
		if (projectId) {
			loadImages();
		}
	});

	$effect(() => {
		if (images.length > 0 && currentImageIndex >= 0) {
			loadTaskForCurrentImage();
		}
	});

	async function loadImages() {
		try {
			loading = true;
			const result = await client.query(GET_IMAGES, { limit: 50, offset: 0 }).toPromise();
			if (result.data?.images) {
				images = result.data.images.objects;
			}
			if (result.error) {
				error = result.error.message;
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load images';
		} finally {
			loading = false;
		}
	}

	async function loadTaskForCurrentImage() {
		if (!images[currentImageIndex]) return;

		try {
			const imageId = images[currentImageIndex].id;
			const projectId = $page.params.id;

			// First, try to find an existing task for this image and project
			const existingTaskResult = await client
				.query(GET_TASK_BY_IMAGE_AND_PROJECT, {
					imageId,
					projectId
				})
				.toPromise();

			if (existingTaskResult.data?.taskByImageAndProject) {
				// Load existing task with annotations
				currentTask = existingTaskResult.data.taskByImageAndProject;
				bboxes = currentTask ? [...currentTask.bboxes] : [];
				console.log(`Loaded existing task with ${bboxes.length} annotations`);
			} else {
				// Create a new task if none exists
				const createTaskResult = await client
					.mutation(CREATE_TASK, {
						imageId,
						projectId,
						bboxes: [],
						status: 'DRAFT' as TaskStatus
					})
					.toPromise();

				if (createTaskResult.data?.createTask) {
					currentTask = createTaskResult.data.createTask;
					bboxes = currentTask ? [...currentTask.bboxes] : [];
					console.log('Created new task for annotation');
				}
			}

			initializeCanvas();
		} catch (err) {
			console.error('Error loading/creating task:', err);
		}
	}

	function initializeCanvas() {
		if (!canvas) return;

		ctx = canvas.getContext('2d');
		if (!ctx) return;

		// Load the image
		if (images[currentImageIndex]) {
			imageElement = new Image();
			imageElement.crossOrigin = 'anonymous';
			imageElement.onload = () => {
				if (!ctx || !imageElement) return;

				// Set canvas size to match image
				if (canvas) {
					canvas.width = imageElement.width;
					canvas.height = imageElement.height;
				}

				// Draw the image
				ctx.drawImage(imageElement, 0, 0);

				// Draw existing bboxes
				drawAllBBoxes();
			};
			imageElement.src = images[currentImageIndex].url;
		}
	}

	function handleMouseDown(event: MouseEvent) {
		if (!ctx || !canvas) return;

		const rect = canvas.getBoundingClientRect();
		const scaleX = canvas.width / rect.width;
		const scaleY = canvas.height / rect.height;

		startX = (event.clientX - rect.left) * scaleX;
		startY = (event.clientY - rect.top) * scaleY;
		isDrawing = true;
	}

	function handleMouseMove(event: MouseEvent) {
		if (!isDrawing || !ctx || !canvas) return;

		const rect = canvas.getBoundingClientRect();
		const scaleX = canvas.width / rect.width;
		const scaleY = canvas.height / rect.height;

		const currentX = (event.clientX - rect.left) * scaleX;
		const currentY = (event.clientY - rect.top) * scaleY;

		// Clear canvas and redraw image
		if (imageElement) {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.drawImage(imageElement, 0, 0);
		}

		// Draw existing bboxes
		drawAllBBoxes();

		// Draw current bbox being drawn
		ctx.strokeStyle = '#ff0000';
		ctx.lineWidth = 2;
		ctx.strokeRect(startX, startY, currentX - startX, currentY - startY);
	}

	function handleMouseUp(event: MouseEvent) {
		if (!isDrawing || !ctx || !canvas) return;

		const rect = canvas.getBoundingClientRect();
		const scaleX = canvas.width / rect.width;
		const scaleY = canvas.height / rect.height;

		const endX = (event.clientX - rect.left) * scaleX;
		const endY = (event.clientY - rect.top) * scaleY;

		// Only create bbox if it has meaningful size
		const width = Math.abs(endX - startX);
		const height = Math.abs(endY - startY);

		if (width > 10 && height > 10) {
			currentBBox = {
				x: Math.min(startX, endX),
				y: Math.min(startY, endY),
				width,
				height,
				annotation: { text: '', tags: [] }
			};

			showAnnotationForm = true;
			annotationText = '';
			annotationTags = '';
		}

		isDrawing = false;
	}

	function drawAllBBoxes() {
		if (!ctx) return;

		bboxes.forEach((bbox, index) => {
			ctx!.strokeStyle = index === editingBBoxIndex ? '#00ff00' : '#0000ff';
			ctx!.lineWidth = 2;
			ctx!.strokeRect(bbox.x, bbox.y, bbox.width, bbox.height);

			// Draw annotation text if it exists
			if (bbox.annotation.text) {
				ctx!.fillStyle = '#0000ff';
				ctx!.font = '14px Arial';
				ctx!.fillText(bbox.annotation.text, bbox.x, bbox.y - 5);
			}
		});
	}

	function saveAnnotation() {
		if (!currentBBox) return;

		const tags = annotationTags
			.split(',')
			.map((tag) => tag.trim())
			.filter((tag) => tag.length > 0);

		currentBBox.annotation = {
			text: annotationText,
			tags
		};

		bboxes = [...bboxes, currentBBox];
		currentBBox = null;
		showAnnotationForm = false;

		// Redraw canvas
		if (imageElement && ctx && canvas) {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.drawImage(imageElement, 0, 0);
			drawAllBBoxes();
		}

		// Save to backend
		saveTask();
	}

	function cancelAnnotation() {
		currentBBox = null;
		showAnnotationForm = false;

		// Redraw canvas without the current bbox
		if (imageElement && ctx && canvas) {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.drawImage(imageElement, 0, 0);
			drawAllBBoxes();
		}
	}

	async function saveTask() {
		if (!currentTask) return;

		try {
			const bboxInputs: BBoxInput[] = bboxes.map((bbox) => ({
				x: bbox.x,
				y: bbox.y,
				width: bbox.width,
				height: bbox.height,
				annotation: {
					text: bbox.annotation.text,
					tags: bbox.annotation.tags
				}
			}));

			const result = await client
				.mutation(UPDATE_TASK, {
					id: currentTask.id,
					bboxes: bboxInputs
				})
				.toPromise();

			if (result.data?.updateTask) {
				currentTask = result.data.updateTask;
				console.log('Task saved successfully');
			}
		} catch (err) {
			console.error('Error saving task:', err);
		}
	}

	function nextImage() {
		if (currentImageIndex < images.length - 1) {
			currentImageIndex++;
		}
	}

	function previousImage() {
		if (currentImageIndex > 0) {
			currentImageIndex--;
		}
	}

	function deleteBBox(index: number) {
		bboxes = bboxes.filter((_, i) => i !== index);

		// Redraw canvas
		if (imageElement && ctx && canvas) {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.drawImage(imageElement, 0, 0);
			drawAllBBoxes();
		}

		saveTask();
	}
</script>

<svelte:head>
	<title>Annotate Images - SATIn</title>
	<meta name="description" content="Annotate images with bounding boxes" />
</svelte:head>

<Navigation />

<div class="annotation-page">
	{#if loading}
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Loading images...</p>
		</div>
	{:else if error}
		<div class="error-state">
			<h2>Error Loading Images</h2>
			<p>{error}</p>
			<a href="/projects" class="back-button">Back to Projects</a>
		</div>
	{:else if images.length === 0}
		<div class="empty-state">
			<h2>No Images Found</h2>
			<p>Add some images to the project first.</p>
			<a href="/projects/{$page.params.id}" class="back-button">Manage Images</a>
		</div>
	{:else}
		<div class="annotation-workspace">
			<!-- Image Navigation -->
			<div class="image-nav">
				<button onclick={previousImage} disabled={currentImageIndex === 0} class="nav-button">
					<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
						<path
							fill-rule="evenodd"
							d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"
						/>
					</svg>
					Previous
				</button>

				<span class="image-counter">
					{currentImageIndex + 1} of {images.length}
				</span>

				<button
					onclick={nextImage}
					disabled={currentImageIndex === images.length - 1}
					class="nav-button"
				>
					Next
					<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
						<path
							fill-rule="evenodd"
							d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"
						/>
					</svg>
				</button>
			</div>

			<!-- Main Canvas Area -->
			<div class="canvas-container">
				<canvas
					bind:this={canvas}
					onmousedown={handleMouseDown}
					onmousemove={handleMouseMove}
					onmouseup={handleMouseUp}
					class="annotation-canvas"
				></canvas>
			</div>

			<!-- Sidebar with Annotations List -->
			<div class="annotation-sidebar">
				<h3>Annotations ({bboxes.length})</h3>

				<div class="annotations-list">
					{#each bboxes as bbox, index (`bbox-${index}`)}
						<div class="annotation-item">
							<div class="annotation-content">
								<strong>Box {index + 1}</strong>
								{#if bbox.annotation.text}
									<p>{bbox.annotation.text}</p>
								{/if}
								{#if bbox.annotation.tags && bbox.annotation.tags.length > 0}
									<div class="tags">
										{#each bbox.annotation.tags as tag (`${index}-${tag}`)}
											<span class="tag">{tag}</span>
										{/each}
									</div>
								{/if}
							</div>
							<button
								onclick={() => deleteBBox(index)}
								class="delete-bbox-button"
								aria-label="Delete bounding box"
							>
								<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
									<path
										d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"
									/>
									<path
										fill-rule="evenodd"
										d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"
									/>
								</svg>
							</button>
						</div>
					{/each}

					{#if bboxes.length === 0}
						<div class="empty-annotations">
							<p>No annotations yet. Draw a bounding box on the image to get started.</p>
						</div>
					{/if}
				</div>

				<div class="annotation-instructions">
					<h4>Instructions</h4>
					<ul>
						<li>Click and drag on the image to draw a bounding box</li>
						<li>Add annotation text and tags when prompted</li>
						<li>Use the navigation buttons to move between images</li>
						<li>Your annotations are saved automatically</li>
					</ul>
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- Annotation Form Modal -->
{#if showAnnotationForm && currentBBox}
	<div
		class="modal-overlay"
		onclick={cancelAnnotation}
		onkeydown={(e) => e.key === 'Escape' && cancelAnnotation()}
		role="dialog"
		tabindex="-1"
	>
		<div
			class="modal-content"
			role="presentation"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.key === 'Escape' && cancelAnnotation()}
		>
			<div class="modal-header">
				<h2>Add Annotation</h2>
				<button class="close-button" onclick={cancelAnnotation} aria-label="Close modal">
					<svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor">
						<path
							d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"
						/>
					</svg>
				</button>
			</div>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					saveAnnotation();
				}}
			>
				<div class="form-group">
					<label for="annotation-text">Description</label>
					<input
						id="annotation-text"
						type="text"
						bind:value={annotationText}
						placeholder="Describe what's in this bounding box"
					/>
				</div>

				<div class="form-group">
					<label for="annotation-tags">Tags</label>
					<input
						id="annotation-tags"
						type="text"
						bind:value={annotationTags}
						placeholder="person, car, building (comma-separated)"
					/>
					<p class="form-help">Separate multiple tags with commas</p>
				</div>

				<div class="modal-actions">
					<button type="button" class="cancel-button" onclick={cancelAnnotation}>Cancel</button>
					<button type="submit" class="save-button">Save Annotation</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	.annotation-page {
		min-height: 100vh;
		background-color: #f8fafc;
	}

	.loading-state,
	.error-state,
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 50vh;
		text-align: center;
		color: #64748b;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #e2e8f0;
		border-top: 4px solid #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.back-button {
		padding: 0.75rem 1.5rem;
		background-color: #3b82f6;
		color: white;
		text-decoration: none;
		border-radius: 8px;
		font-weight: 500;
		transition: background-color 0.2s;
	}

	.back-button:hover {
		background-color: #2563eb;
	}

	.annotation-workspace {
		display: grid;
		grid-template-columns: 1fr 300px;
		grid-template-rows: auto 1fr;
		height: 100vh;
		gap: 1rem;
		padding: 1rem;
	}

	.image-nav {
		grid-column: 1 / -1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		background: white;
		padding: 1rem;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.nav-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.nav-button:hover:not(:disabled) {
		background: #2563eb;
	}

	.nav-button:disabled {
		background: #9ca3af;
		cursor: not-allowed;
	}

	.image-counter {
		font-weight: 500;
		color: #1e293b;
		min-width: 100px;
		text-align: center;
	}

	.canvas-container {
		background: white;
		border-radius: 8px;
		padding: 1rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		overflow: auto;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.annotation-canvas {
		max-width: 100%;
		max-height: 100%;
		border: 1px solid #e2e8f0;
		cursor: crosshair;
	}

	.annotation-sidebar {
		background: white;
		border-radius: 8px;
		padding: 1rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		overflow-y: auto;
	}

	.annotation-sidebar h3 {
		margin: 0 0 1rem 0;
		color: #1e293b;
		font-size: 1.125rem;
		font-weight: 600;
	}

	.annotations-list {
		margin-bottom: 2rem;
	}

	.annotation-item {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		padding: 0.75rem;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		margin-bottom: 0.5rem;
	}

	.annotation-content {
		flex: 1;
	}

	.annotation-content strong {
		display: block;
		color: #1e293b;
		margin-bottom: 0.25rem;
	}

	.annotation-content p {
		margin: 0.25rem 0;
		color: #64748b;
		font-size: 0.875rem;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		margin-top: 0.5rem;
	}

	.tag {
		background: #dbeafe;
		color: #1e40af;
		padding: 0.125rem 0.5rem;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.delete-bbox-button {
		background: #fee2e2;
		color: #dc2626;
		border: none;
		border-radius: 4px;
		padding: 0.25rem;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.delete-bbox-button:hover {
		background: #fecaca;
	}

	.empty-annotations {
		text-align: center;
		color: #64748b;
		font-size: 0.875rem;
		padding: 2rem 1rem;
	}

	.annotation-instructions {
		border-top: 1px solid #e2e8f0;
		padding-top: 1rem;
	}

	.annotation-instructions h4 {
		margin: 0 0 0.5rem 0;
		color: #1e293b;
		font-size: 1rem;
		font-weight: 600;
	}

	.annotation-instructions ul {
		margin: 0;
		padding-left: 1.25rem;
		color: #64748b;
		font-size: 0.875rem;
		line-height: 1.5;
	}

	.annotation-instructions li {
		margin-bottom: 0.25rem;
	}

	/* Modal Styles */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal-content {
		background: white;
		border-radius: 12px;
		padding: 0;
		width: 100%;
		max-width: 500px;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow:
			0 20px 25px -5px rgba(0, 0, 0, 0.1),
			0 10px 10px -5px rgba(0, 0, 0, 0.04);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem 1.5rem 0 1.5rem;
		border-bottom: 1px solid #e2e8f0;
		margin-bottom: 1.5rem;
	}

	.modal-header h2 {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1e293b;
		margin: 0;
	}

	.close-button {
		background: none;
		border: none;
		color: #64748b;
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 6px;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.close-button:hover {
		background-color: #f1f5f9;
		color: #1e293b;
	}

	form {
		padding: 0 1.5rem 1.5rem 1.5rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group label {
		display: block;
		font-weight: 500;
		color: #374151;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
	}

	.form-group input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 0.875rem;
		transition:
			border-color 0.2s,
			box-shadow 0.2s;
		box-sizing: border-box;
	}

	.form-group input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.form-help {
		color: #6b7280;
		font-size: 0.75rem;
		margin: 0.25rem 0 0 0;
	}

	.modal-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
	}

	.cancel-button,
	.save-button {
		padding: 0.75rem 1.5rem;
		border-radius: 6px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		border: 1px solid;
		font-size: 0.875rem;
	}

	.cancel-button {
		background: white;
		color: #6b7280;
		border-color: #d1d5db;
	}

	.cancel-button:hover {
		background-color: #f9fafb;
		color: #374151;
	}

	.save-button {
		background-color: #3b82f6;
		color: white;
		border-color: #3b82f6;
	}

	.save-button:hover {
		background-color: #2563eb;
		border-color: #2563eb;
	}

	@media (max-width: 768px) {
		.annotation-workspace {
			grid-template-columns: 1fr;
			grid-template-rows: auto auto 1fr;
		}

		.annotation-sidebar {
			order: -1;
			max-height: 300px;
		}
	}
</style>
