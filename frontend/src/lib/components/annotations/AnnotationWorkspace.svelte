<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Button, Spinner } from '$lib/components/ui';
	import AnnotationCanvas from './AnnotationCanvas.svelte';
	import ToolPanel from './ToolPanel.svelte';
	import { annotationStore } from '$lib/features/annotations/store.svelte';
	import { BoundingBoxTool, SelectTool, BaseAnnotator } from '$lib/features/annotations';
	import type {
		AnnotationPointerEvent,
		ClientAnnotation,
		CanvasState,
		CoordinateTransform,
		AnnotationTool
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
	let tools = $state(new Map<AnnotationTool, BaseAnnotator>());
	let transform: CoordinateTransform | null = null;
	let previousActiveTool: AnnotationTool | null = null;

	// Reactive current tool based on store state
	let currentTool = $derived(() => {
		const activeTool = annotationStore.canvas.activeTool;
		const tool = tools.get(activeTool) || null;
		console.log(
			'currentTool derived - activeTool:',
			activeTool,
			'tool:',
			tool,
			'tools size:',
			tools.size
		);
		return tool;
	});

	// Handle tool switching with proper activation/deactivation
	$effect(() => {
		const activeTool = annotationStore.canvas.activeTool;

		// Deactivate previous tool
		if (previousActiveTool && tools.has(previousActiveTool)) {
			const prevTool = tools.get(previousActiveTool);
			if (prevTool) {
				prevTool.onDeactivate();
			}
		}

		// Activate new tool
		if (activeTool && tools.has(activeTool)) {
			const newTool = tools.get(activeTool);
			if (newTool) {
				newTool.onActivate();
			}
		}

		previousActiveTool = activeTool;
	});

	// Initialize the annotation store
	onMount(() => {
		annotationStore.initialize(taskId, imageId, imageWidth, imageHeight);
		// Don't setup tools immediately - wait for canvas to be ready
	});

	onDestroy(() => {
		// Clean up all tools
		tools.forEach((tool: BaseAnnotator) => tool.onDestroy());
		tools.clear();
	});

	function setupTools() {
		console.log('AnnotationWorkspace setupTools called');
		const canvasState = annotationStore.canvas;

		// Get the actual transform from the canvas
		if (!canvasRef) {
			console.error('Cannot setup tools: canvas not ready');
			return;
		}

		transform = canvasRef.getTransform();
		console.log('Got transform from canvas:', transform);

		// Common tool callbacks
		const toolCallbacks = {
			onAnnotationCreate: (annotation: ClientAnnotation) => {
				console.log('Tool callback: onAnnotationCreate called with:', annotation);
				annotationStore.addAnnotation(annotation);
			},
			onAnnotationUpdate: (id: string, updates: Partial<ClientAnnotation>) => {
				console.log('Tool callback: onAnnotationUpdate called with:', id, updates);
				annotationStore.updateAnnotation(id, updates);
			},
			onAnnotationDelete: (id: string) => {
				console.log('Tool callback: onAnnotationDelete called with:', id);
				annotationStore.deleteAnnotation(id);
			},
			onAnnotationSelect: (annotation: ClientAnnotation | null) => {
				console.log('Tool callback: onAnnotationSelect called with:', annotation);
				annotationStore.selectAnnotation(annotation?.id || null);
			}
		};

		// Create all tools
		console.log('Creating tools with callbacks:', toolCallbacks);
		tools.set('select', new SelectTool(canvasState, transform, toolCallbacks));
		tools.set('bbox', new BoundingBoxTool(canvasState, transform, toolCallbacks));
		console.log('Tools created, tools size:', tools.size);

		// Activate the current tool
		const activeTool = tools.get(annotationStore.canvas.activeTool);
		if (activeTool) {
			console.log('Activating current tool:', annotationStore.canvas.activeTool);
			activeTool.onActivate();
		}

		console.log('Tools setup completed, tools are now ready');
	}

	// Reactive effect to handle tool changes
	$effect(() => {
		const activeTool = annotationStore.canvas.activeTool;

		// Only run if tools are initialized
		if (tools.size === 0) return;

		// Deactivate all tools first
		tools.forEach((tool: BaseAnnotator, toolType: AnnotationTool) => {
			if (toolType !== activeTool) {
				tool.onDeactivate();
			}
		});

		// Activate the selected tool
		const newTool = tools.get(activeTool);
		if (newTool) {
			newTool.onActivate();
		}
	});

	function handleCanvasStateChange(state: Partial<CanvasState>) {
		console.log('AnnotationWorkspace handleCanvasStateChange called with:', state);
		annotationStore.updateCanvasState(state);

		// Setup tools if not already done and canvas is ready
		if (canvasRef && tools.size === 0) {
			console.log('Canvas is ready, setting up tools for the first time');
			// Setup tools immediately when canvas state changes
			setupTools();
		}

		// Update transform for all tools
		if (canvasRef && tools.size > 0) {
			const newTransform = canvasRef.getTransform();
			transform = newTransform;

			console.log('Updating tools with new transform');
			tools.forEach((tool: BaseAnnotator) => {
				tool.updateTransform(newTransform);
				tool.updateCanvasState(annotationStore.canvas);
			});
		}
	}

	function handlePointerDown(event: AnnotationPointerEvent) {
		console.log('AnnotationWorkspace handlePointerDown called with:', event);
		console.log('readonly:', readonly, 'currentTool():', currentTool());
		if (readonly) return;

		const tool = currentTool();
		if (!tool) return;

		tool.onPointerDown(event);
	}

	function handlePointerMove(event: AnnotationPointerEvent) {
		if (readonly) return;

		const tool = currentTool();
		if (!tool) return;

		tool.onPointerMove(event);
	}

	function handlePointerUp(event: AnnotationPointerEvent) {
		if (readonly) return;

		const tool = currentTool();
		if (!tool) return;

		tool.onPointerUp(event);
	}

	function handleToolChange(toolId: AnnotationTool) {
		// Update the annotation store's active tool, which will trigger reactive tool switching
		annotationStore.setActiveTool(toolId);
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

	// Handle workspace-specific keyboard events (not tool shortcuts)
	function handleKeyboard(event: KeyboardEvent) {
		// Handle save shortcut
		if ((event.ctrlKey || event.metaKey) && event.key === 's') {
			event.preventDefault();
			handleSave();
			return;
		}

		// Handle close shortcut
		if (event.key === 'Escape' && annotationStore.canvas.mode === 'view') {
			onClose?.();
			return;
		}

		// Tool shortcuts and delete are handled by ToolPanel
		// Pass other events to current tool if it exists
		if (currentTool() && !isToolShortcut(event)) {
			currentTool()!.onKeyDown(event);
		}
	}

	function isToolShortcut(event: KeyboardEvent): boolean {
		// Check if this is a tool shortcut (v for select, b for bbox, etc.)
		const key = event.key.toLowerCase();
		return (
			key === 'v' ||
			key === 'b' ||
			key === 'delete' ||
			key === 'backspace' ||
			(event.ctrlKey && (key === 'z' || key === 'y'))
		);
	}
</script>

<svelte:window onkeydown={handleKeyboard} />

<div
	class="annotation-workspace"
	data-testid="annotation-workspace"
	data-tools-ready={tools.size > 0 ? 'true' : 'false'}
>
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
