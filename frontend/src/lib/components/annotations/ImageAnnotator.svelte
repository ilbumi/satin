<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Button, Modal, Spinner } from '$lib/components/ui';
	import AnnotationWorkspace from './AnnotationWorkspace.svelte';
	import { annotationStore } from '$lib/features/annotations/store.svelte';
	import { createAnnotationService } from '$lib/features/annotations/service';
	import { graphqlClient } from '$lib/core/api/client';
	import type { ClientAnnotation } from '$lib/features/annotations/types';
	import type { Task, Image } from '$lib/graphql/generated/graphql';

	interface ImageAnnotatorProps {
		open?: boolean;
		task: Task;
		image: Image;
		onClose?: () => void;
		onSaveComplete?: (annotations: ClientAnnotation[]) => void;
		readonly?: boolean;
	}

	let {
		open = $bindable(false),
		task,
		image,
		onClose,
		onSaveComplete,
		readonly = false
	}: ImageAnnotatorProps = $props();

	let loading = $state(true);
	let error = $state<string | null>(null);
	let saving = $state(false);
	let imageNaturalWidth = $state(0);
	let imageNaturalHeight = $state(0);

	// Initialize annotation service
	let annotationService = createAnnotationService(graphqlClient.client);

	onMount(() => {
		if (open) {
			loadAnnotations();
		}
	});

	onDestroy(() => {
		// Clean up annotation store when component is destroyed
		try {
			annotationStore.cleanup();
		} catch (error) {
			console.warn('Failed to cleanup annotation store in ImageAnnotator:', error);
		}
	});

	// Load annotations when opened
	$effect(() => {
		if (open && task.id) {
			loadAnnotations();
		}
	});

	async function loadAnnotations() {
		try {
			loading = true;
			error = null;

			// Load the image to get natural dimensions
			await loadImageDimensions();

			// Load existing annotations from the task
			const annotations = await annotationService.loadTaskAnnotations(task.id);

			// Initialize the annotation store
			annotationStore.initialize(task.id, image.id, imageNaturalWidth, imageNaturalHeight);

			// Load annotations into store
			await annotationStore.loadAnnotations(annotations);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load annotations';
			console.error('Error loading annotations:', err);
		} finally {
			loading = false;
		}
	}

	async function loadImageDimensions(): Promise<void> {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.crossOrigin = 'anonymous';

			// Add timeout to prevent hanging on slow/unresponsive images
			const timeout = setTimeout(() => {
				reject(new Error('Image loading timed out after 10 seconds'));
			}, 10000);

			img.onload = () => {
				clearTimeout(timeout);
				imageNaturalWidth = img.naturalWidth;
				imageNaturalHeight = img.naturalHeight;
				resolve();
			};

			img.onerror = () => {
				clearTimeout(timeout);
				reject(new Error('Failed to load image'));
			};

			img.src = image.url;
		});
	}

	async function handleSave(annotations: ClientAnnotation[]): Promise<void> {
		try {
			saving = true;
			await annotationService.saveTaskAnnotations(task.id, annotations);
			onSaveComplete?.(annotations);
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to save annotations';
			annotationStore.error = message;
			throw err; // Re-throw to let workspace handle it
		} finally {
			saving = false;
		}
	}

	function handleClose() {
		// Check for unsaved changes
		if (annotationStore.getHasUnsavedChanges() && !readonly) {
			const confirmLeave = confirm(
				'You have unsaved changes. Are you sure you want to close without saving?'
			);
			if (!confirmLeave) {
				return;
			}
		}

		// Reset and cleanup the store
		try {
			annotationStore.reset();
			annotationStore.cleanup();
		} catch (error) {
			console.warn('Failed to reset/cleanup annotation store:', error);
		}

		// Close the modal
		open = false;
		onClose?.();
	}

	async function handleSaveAndClose() {
		if (!annotationStore.getHasUnsavedChanges()) {
			handleClose();
			return;
		}

		try {
			await handleSave(annotationStore.annotations);
			handleClose();
		} catch (err) {
			// Error is already handled in handleSave
			console.error('Save failed:', err);
		}
	}

	// Handle keyboard shortcuts
	function handleKeydown(event: KeyboardEvent) {
		if (!open) return;

		// Save shortcut
		if ((event.ctrlKey || event.metaKey) && event.key === 's') {
			event.preventDefault();
			if (!readonly && annotationStore.getHasUnsavedChanges()) {
				handleSave(annotationStore.annotations);
			}
		}

		// Close shortcut (only if no unsaved changes or in view mode)
		if (event.key === 'Escape') {
			if (!annotationStore.getHasUnsavedChanges() || annotationStore.canvas.mode === 'view') {
				event.preventDefault();
				handleClose();
			}
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<Modal
		bind:open
		size="full"
		title="Image Annotation Editor"
		showCloseButton={false}
		closeOnBackdropClick={false}
		closeOnEscape={false}
		onClose={handleClose}
	>
		<div class="image-annotator" data-testid="image-annotator">
			{#if loading}
				<div class="loading-container">
					<Spinner size="lg" />
					<p class="loading-text">Loading image and annotations...</p>
				</div>
			{:else if error}
				<div class="error-container">
					<div class="error-content">
						<div class="error-icon">⚠️</div>
						<h3 class="error-title">Failed to Load</h3>
						<p class="error-message">{error}</p>
						<div class="error-actions">
							<Button variant="primary" onclick={loadAnnotations}>🔄 Retry</Button>
							<Button variant="secondary" onclick={handleClose}>Close</Button>
						</div>
					</div>
				</div>
			{:else if imageNaturalWidth > 0 && imageNaturalHeight > 0}
				<AnnotationWorkspace
					taskId={task.id}
					imageId={image.id}
					imageUrl={image.url}
					imageWidth={imageNaturalWidth}
					imageHeight={imageNaturalHeight}
					{readonly}
					onSave={handleSave}
					onClose={handleClose}
				/>
			{:else}
				<div class="error-container">
					<div class="error-content">
						<div class="error-icon">📷</div>
						<h3 class="error-title">Invalid Image</h3>
						<p class="error-message">Could not determine image dimensions</p>
						<div class="error-actions">
							<Button variant="secondary" onclick={handleClose}>Close</Button>
						</div>
					</div>
				</div>
			{/if}

			<!-- Quick Action Bar (overlay) -->
			{#if !loading && !error && imageNaturalWidth > 0}
				<div class="quick-actions">
					<div class="quick-actions-content">
						<div class="task-info">
							<span class="task-label">Task:</span>
							<span class="task-id">{task.id}</span>
							{#if task.status}
								<span class="task-status status-{task.status.toLowerCase()}">
									{task.status}
								</span>
							{/if}
						</div>

						<div class="action-buttons">
							{#if !readonly}
								<Button
									variant="primary"
									size="sm"
									onclick={handleSaveAndClose}
									disabled={saving || !annotationStore.getHasUnsavedChanges()}
								>
									{#if saving}
										<Spinner size="sm" />
										Saving...
									{:else}
										💾 Save & Close
									{/if}
								</Button>

								<Button
									variant="secondary"
									size="sm"
									data-testid="save-button"
									onclick={() => handleSave(annotationStore.annotations)}
									disabled={saving || !annotationStore.getHasUnsavedChanges()}
								>
									{#if saving}
										<Spinner size="sm" />
									{:else}
										💾 Save
									{/if}
								</Button>
							{/if}

							<Button
								variant="secondary"
								size="sm"
								data-testid="close-button"
								onclick={handleClose}
							>
								{readonly ? '👁️ Close Viewer' : '✕ Close Editor'}
							</Button>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</Modal>
{/if}

<style>
	.image-annotator {
		position: relative;
		height: 100%;
		width: 100%;
		min-height: 600px;
	}

	.loading-container,
	.error-container {
		display: flex;
		height: 100%;
		align-items: center;
		justify-content: center;
		background-color: #f9fafb;
	}

	.loading-container {
		flex-direction: column;
		gap: 1rem;
	}

	.loading-text {
		color: #4b5563;
	}

	.error-container {
		background-color: #fef2f2;
	}

	.error-content {
		display: flex;
		max-width: 28rem;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 2rem;
		text-align: center;
	}

	.error-icon {
		font-size: 4rem;
	}

	.error-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: #7f1d1d;
	}

	.error-message {
		color: #b91c1c;
	}

	.error-actions {
		display: flex;
		gap: 0.5rem;
	}

	.quick-actions {
		pointer-events: none;
		position: absolute;
		top: 1rem;
		right: 1rem;
		left: 1rem;
		z-index: 50;
	}

	.quick-actions-content {
		pointer-events: auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-radius: 0.5rem;
		border: 1px solid #d1d5db;
		background-color: rgba(255, 255, 255, 0.9);
		padding-left: 1rem;
		padding-right: 1rem;
		padding-top: 0.5rem;
		padding-bottom: 0.5rem;
		box-shadow:
			0 10px 15px -3px rgba(0, 0, 0, 0.1),
			0 4px 6px -2px rgba(0, 0, 0, 0.05);
		backdrop-filter: blur(4px);
	}

	.task-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
	}

	.task-label {
		font-weight: 500;
		color: #374151;
	}

	.task-id {
		border-radius: 0.25rem;
		background-color: #f3f4f6;
		padding-left: 0.5rem;
		padding-right: 0.5rem;
		padding-top: 0.25rem;
		padding-bottom: 0.25rem;
		font-family: monospace;
		color: #111827;
	}

	.task-status {
		border-radius: 9999px;
		padding-left: 0.5rem;
		padding-right: 0.5rem;
		padding-top: 0.25rem;
		padding-bottom: 0.25rem;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.task-status.status-draft {
		background-color: #f3f4f6;
		color: #1f2937;
	}

	.task-status.status-finished {
		background-color: #dcfce7;
		color: #166534;
	}

	.task-status.status-reviewed {
		background-color: #dbeafe;
		color: #1e40af;
	}

	.action-buttons {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
</style>
