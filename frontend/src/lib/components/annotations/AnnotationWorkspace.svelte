<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Button, Spinner } from '$lib/components/ui';
	import AnnotationCanvas from './AnnotationCanvas.svelte';
	import ToolPanel from './ToolPanel.svelte';
	import { annotationStore } from '$lib/features/annotations/store.svelte';
	import { BoundingBoxTool } from '$lib/features/annotations/BoundingBoxTool';
	import { createCoordinateTransform } from '$lib/features/annotations/utils';
	import type {
		AnnotationPointerEvent,
		ClientAnnotation,
		CanvasState,
		CoordinateTransform
	} from '$lib/features/annotations/types';

	interface AnnotationWorkspaceProps {
		taskId: string;
		imageId: string;
		imageUrl: string;
		imageWidth: number;
		imageHeight: number;
		readonly?: boolean;
		onSave?: (annotations: ClientAnnotation[]) => Promise<void>;
		onClose?: () => void;
	}

	let {
		taskId,
		imageId,
		imageUrl,
		imageWidth,
		imageHeight,
		readonly = false,
		onSave,
		onClose
	}: AnnotationWorkspaceProps = $props();

	let canvasRef: AnnotationCanvas = $state()!;
	let currentTool: BoundingBoxTool | null = null;
	let transform: CoordinateTransform | null = null;

	// Initialize the annotation store
	onMount(() => {
		annotationStore.initialize(taskId, imageId, imageWidth, imageHeight);
		setupTools();
	});

	onDestroy(() => {
		currentTool = null;
	});

	function setupTools() {
		// Initialize the bounding box tool
		const canvasState = annotationStore.canvas;

		// Create transform (will be updated when canvas is ready)
		transform = createCoordinateTransform(canvasState);

		currentTool = new BoundingBoxTool(canvasState, transform, {
			onAnnotationCreate: (annotation) => {
				annotationStore.addAnnotation(annotation);
			},
			onAnnotationUpdate: (id, updates) => {
				annotationStore.updateAnnotation(id, updates);
			},
			onAnnotationDelete: (id) => {
				annotationStore.deleteAnnotation(id);
			}
		});

		// Activate the default tool
		currentTool.onActivate();
	}

	function handleCanvasStateChange(state: Partial<CanvasState>) {
		annotationStore.updateCanvasState(state);

		// Update transform for tools
		if (canvasRef && currentTool) {
			const newTransform = canvasRef.getTransform();
			currentTool.updateTransform(newTransform);
			currentTool.updateCanvasState(annotationStore.canvas);
		}
	}

	function handlePointerDown(event: AnnotationPointerEvent) {
		if (readonly || !currentTool) return;
		currentTool.onPointerDown(event);
	}

	function handlePointerMove(event: AnnotationPointerEvent) {
		if (readonly || !currentTool) return;
		currentTool.onPointerMove(event);
	}

	function handlePointerUp(event: AnnotationPointerEvent) {
		if (readonly || !currentTool) return;
		currentTool.onPointerUp(event);
	}

	function handleToolChange(toolId: string) {
		if (!currentTool) return;

		// Deactivate current tool
		currentTool.onDeactivate();

		// For now, we only have bbox tool, but this would switch between tools
		if (toolId === 'bbox') {
			currentTool.onActivate();
		} else if (toolId === 'select') {
			// Switch to select mode
			annotationStore.updateCanvasState({ mode: 'view' });
		}
	}

	async function handleSave() {
		if (!onSave) return;

		try {
			annotationStore.saving = true;
			await onSave(annotationStore.annotations);
			// Clear history after successful save
			annotationStore.clearHistory?.();
		} catch (error) {
			annotationStore.error = error instanceof Error ? error.message : 'Save failed';
		} finally {
			annotationStore.saving = false;
		}
	}

	function handleZoomIn() {
		canvasRef?.zoomIn();
	}

	function handleZoomOut() {
		canvasRef?.zoomOut();
	}

	function handleResetZoom() {
		canvasRef?.resetZoom();
	}

	// Handle keyboard events
	function handleKeyboard(event: KeyboardEvent) {
		if (!currentTool) return;

		// Let the tool handle the keyboard event
		currentTool.onKeyDown(event);

		// Handle save shortcut
		if ((event.ctrlKey || event.metaKey) && event.key === 's') {
			event.preventDefault();
			handleSave();
		}

		// Handle close shortcut
		if (event.key === 'Escape' && annotationStore.canvas.mode === 'view') {
			onClose?.();
		}
	}
</script>

<svelte:window onkeydown={handleKeyboard} />

<div class="annotation-workspace">
	<!-- Header -->
	<div class="workspace-header">
		<div class="header-left">
			<h2 class="workspace-title">Annotation Editor</h2>
			<div class="workspace-info">
				<span class="info-item">Task: {taskId}</span>
				<span class="info-separator">•</span>
				<span class="info-item">Image: {imageWidth}×{imageHeight}</span>
				{#if annotationStore.hasUnsavedChanges()}
					<span class="info-separator">•</span>
					<span class="info-item unsaved">Unsaved changes</span>
				{/if}
			</div>
		</div>

		<div class="header-right">
			<div class="zoom-controls">
				<Button variant="secondary" size="sm" onclick={handleZoomOut}>➖</Button>
				<span class="zoom-display">
					{Math.round(annotationStore.canvas.zoom * 100)}%
				</span>
				<Button variant="secondary" size="sm" onclick={handleZoomIn}>➕</Button>
				<Button variant="secondary" size="sm" onclick={handleResetZoom}>⌂</Button>
			</div>

			<div class="action-buttons">
				{#if !readonly}
					<Button
						variant="primary"
						size="sm"
						onclick={handleSave}
						disabled={annotationStore.saving || !annotationStore.hasUnsavedChanges()}
					>
						{#if annotationStore.saving}
							<Spinner size="sm" />
							Saving...
						{:else}
							💾 Save
						{/if}
					</Button>
				{/if}

				{#if onClose}
					<Button variant="secondary" size="sm" onclick={onClose}>✕ Close</Button>
				{/if}
			</div>
		</div>
	</div>

	<!-- Main Content -->
	<div class="workspace-content">
		<!-- Tool Panel -->
		<div class="tool-panel-container">
			<ToolPanel
				vertical={true}
				compact={false}
				showLabels={true}
				onToolChange={handleToolChange}
			/>
		</div>

		<!-- Canvas Area -->
		<div class="canvas-container">
			{#if annotationStore.loading}
				<div class="loading-overlay">
					<Spinner size="lg" />
					<p>Loading annotations...</p>
				</div>
			{:else if annotationStore.error}
				<div class="error-overlay">
					<div class="error-content">
						<div class="error-icon">⚠️</div>
						<h3>Error</h3>
						<p>{annotationStore.error}</p>
						<Button variant="primary" onclick={() => (annotationStore.error = null)}>
							Dismiss
						</Button>
					</div>
				</div>
			{:else}
				<AnnotationCanvas
					bind:this={canvasRef}
					{imageUrl}
					{imageWidth}
					{imageHeight}
					annotations={annotationStore.annotations}
					canvasState={annotationStore.canvas}
					{readonly}
					onCanvasStateChange={handleCanvasStateChange}
					onPointerDown={handlePointerDown}
					onPointerMove={handlePointerMove}
					onPointerUp={handlePointerUp}
				/>
			{/if}
		</div>

		<!-- Properties Panel -->
		{#if annotationStore.propertiesPanelOpen && annotationStore.selectedAnnotation}
			<div class="properties-panel" data-testid="annotation-editor">
				<div class="properties-header">
					<h3>Annotation Properties</h3>
					<Button
						variant="secondary"
						size="sm"
						onclick={() => (annotationStore.propertiesPanelOpen = false)}
					>
						✕
					</Button>
				</div>

				<div class="properties-content">
					{#if annotationStore.selectedAnnotation()}
						{@const annotation = annotationStore.selectedAnnotation()!}

						<div class="property-group">
							<label for="annotation-text">Text</label>
							<textarea
								id="annotation-text"
								data-testid="annotation-text-input"
								bind:value={annotation.annotation.text}
								placeholder="Add description..."
								rows="3"
								class="property-input"
								oninput={() =>
									annotationStore.updateAnnotation(annotation.id, {
										annotation: { ...annotation.annotation }
									})}
							></textarea>
						</div>

						<div class="property-group">
							<label for="annotation-tags">Tags</label>
							<input
								id="annotation-tags"
								data-testid="annotation-tag-input"
								type="text"
								value={annotation.annotation.tags?.join(', ') || ''}
								placeholder="tag1, tag2, tag3"
								class="property-input"
								oninput={(e) => {
									const tags = e.currentTarget.value
										.split(',')
										.map((tag) => tag.trim())
										.filter((tag) => tag.length > 0);

									annotationStore.updateAnnotation(annotation.id, {
										annotation: { ...annotation.annotation, tags }
									});
								}}
							/>
						</div>

						<div class="property-group">
							<span class="property-label">Bounds</span>
							<div class="bounds-display">
								<div class="bound-item">
									<span>X:</span>
									<span>{Math.round(annotation.bounds.x)}</span>
								</div>
								<div class="bound-item">
									<span>Y:</span>
									<span>{Math.round(annotation.bounds.y)}</span>
								</div>
								<div class="bound-item">
									<span>W:</span>
									<span>{Math.round(annotation.bounds.width)}</span>
								</div>
								<div class="bound-item">
									<span>H:</span>
									<span>{Math.round(annotation.bounds.height)}</span>
								</div>
							</div>
						</div>

						<div class="property-actions">
							<Button
								variant="danger"
								size="sm"
								onclick={() => annotationStore.deleteAnnotation(annotation.id)}
							>
								🗑️ Delete
							</Button>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>

	<!-- Status Bar -->
	<div class="status-bar">
		<div class="status-left">
			{#if true}
				{@const stats = annotationStore.getStats()}
				<span class="status-item">{stats.total} annotations</span>
				{#if stats.selected > 0}
					<span class="status-separator">•</span>
					<span class="status-item">{stats.selected} selected</span>
				{/if}
			{/if}
		</div>

		<div class="status-right">
			<span class="status-item">
				Tool: {annotationStore.canvas.activeTool}
			</span>
			<span class="status-separator">•</span>
			<span class="status-item">
				Mode: {annotationStore.canvas.mode}
			</span>
		</div>
	</div>
</div>

<style>
	.annotation-workspace {
		display: flex;
		height: 100%;
		width: 100%;
		flex-direction: column;
		background-color: #f9fafb;
	}

	.workspace-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-bottom: 1px solid #6b7280;
		background-color: white;
		padding: 1rem;
	}

	.header-left {
		display: flex;
		flex-direction: column;
	}

	.workspace-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #111827;
	}

	.workspace-info {
		margin-top: 0.25rem;
		display: flex;
		align-items: center;
		font-size: 0.875rem;
		color: #4b5563;
	}

	.info-item {
		white-space: nowrap;
	}

	.info-item.unsaved {
		font-weight: 500;
		color: #d97706;
	}

	.info-separator {
		margin-left: 0.5rem;
		margin-right: 0.5rem;
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.zoom-controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.zoom-display {
		min-width: 3rem;
		text-align: center;
		font-family: monospace;
		font-size: 0.875rem;
		color: #374151;
	}

	.action-buttons {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.workspace-content {
		display: flex;
		flex: 1;
		overflow: hidden;
	}

	.tool-panel-container {
		flex-shrink: 0;
	}

	.canvas-container {
		position: relative;
		flex: 1;
	}

	.loading-overlay,
	.error-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #f3f4f6;
	}

	.loading-overlay {
		flex-direction: column;
		gap: 1rem;
	}

	.error-overlay {
		background-color: #fef2f2;
	}

	.error-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		text-align: center;
		max-width: 28rem;
	}

	.error-icon {
		font-size: 2.25rem;
	}

	.error-content h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: rgb(127, 29, 29);
	}

	.error-content p {
		color: rgb(185, 28, 28);
	}

	.properties-panel {
		display: flex;
		width: 20rem;
		flex-direction: column;
		border-left: 1px solid rgb(107, 114, 128);
		background-color: white;
	}

	.properties-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-bottom: 1px solid rgb(107, 114, 128);
		padding: 1rem;
	}

	.properties-header h3 {
		font-weight: 600;
		color: rgb(17, 24, 39);
	}

	.properties-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		overflow-y: auto;
		padding: 1rem;
	}

	.property-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.property-group label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		color: rgb(55, 65, 81);
	}

	.property-input {
		width: 100%;
		border-radius: 0.375rem;
		border: 1px solid rgb(107, 114, 128);
		padding: 0.5rem 0.75rem;
		font-size: 0.875rem;
		outline: none;
	}

	.property-input:focus {
		border-color: transparent;
		box-shadow: 0 0 0 2px rgb(59, 130, 246);
	}

	.bounds-display {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.5rem;
		font-size: 0.875rem;
	}

	.bound-item {
		display: flex;
		justify-content: space-between;
		border-radius: 0.25rem;
		background-color: rgb(249, 250, 251);
		padding: 0.5rem;
	}

	.property-actions {
		border-top: 1px solid rgb(107, 114, 128);
		padding-top: 1rem;
	}

	.status-bar {
		display: flex;
		align-items: center justify-between border-t border-gray-500 bg-white px-4 py-2 text-sm
			text-gray-600;
	}

	.status-left,
	.status-right {
		display: flex;
		align-items: center;
	}

	.status-item {
		white-space: nowrap;
	}

	.status-separator {
		margin-left: 0.5rem;
		margin-right: 0.5rem;
	}
</style>
