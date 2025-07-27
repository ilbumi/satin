<script lang="ts">
	import ImageCanvas from './ImageCanvas.svelte';
	import AnnotationToolbar from './AnnotationToolbar.svelte';
	import AnnotationPanel from './AnnotationPanel.svelte';

	interface BoundingBox {
		id: string;
		x: number;
		y: number;
		width: number;
		height: number;
		label: string;
		isSelected: boolean;
	}

	// State
	let currentTool = $state<'select' | 'bbox'>('select');
	let imageUrl = $state<string>('');
	let annotations = $state<BoundingBox[]>([]);
	let selectedAnnotationId = $state<string | null>(null);

	// Sample demo image URL (you can replace with actual image upload)
	const demoImageUrl =
		'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=800&h=600&fit=crop';

	function generateId(): string {
		return Math.random().toString(36).substring(2) + Date.now().toString(36);
	}

	function handleToolChange(tool: 'select' | 'bbox') {
		currentTool = tool;
		// Clear selection when switching to drawing mode
		if (tool === 'bbox') {
			selectedAnnotationId = null;
			updateAnnotationSelection();
		}
	}

	function handleImageUpload(file: File) {
		const url = URL.createObjectURL(file);
		imageUrl = url;
		// Clear annotations when new image is loaded
		annotations = [];
		selectedAnnotationId = null;
	}

	function handleAnnotationCreate(bbox: Omit<BoundingBox, 'id' | 'isSelected'>) {
		const newAnnotation: BoundingBox = {
			...bbox,
			id: generateId(),
			isSelected: false
		};
		annotations = [...annotations, newAnnotation];
	}

	function handleAnnotationSelect(id: string) {
		if (selectedAnnotationId === id) {
			// Deselect if clicking the same annotation
			selectedAnnotationId = null;
		} else {
			selectedAnnotationId = id;
		}
		updateAnnotationSelection();
	}

	function handleAnnotationDelete(id: string) {
		annotations = annotations.filter((ann) => ann.id !== id);
		if (selectedAnnotationId === id) {
			selectedAnnotationId = null;
		}
	}

	function handleAnnotationUpdate(id: string, updates: Partial<BoundingBox>) {
		annotations = annotations.map((ann) => (ann.id === id ? { ...ann, ...updates } : ann));
	}

	function updateAnnotationSelection() {
		annotations = annotations.map((ann) => ({
			...ann,
			isSelected: ann.id === selectedAnnotationId
		}));
	}

	function loadDemoImage() {
		imageUrl = demoImageUrl;
		// Add some demo annotations
		annotations = [
			{
				id: generateId(),
				x: 0.2,
				y: 0.3,
				width: 0.3,
				height: 0.4,
				label: 'Dog',
				isSelected: false
			},
			{
				id: generateId(),
				x: 0.6,
				y: 0.1,
				width: 0.25,
				height: 0.35,
				label: 'Cat',
				isSelected: false
			}
		];
	}

	// Load demo image on mount
	$effect(() => {
		if (!imageUrl) {
			loadDemoImage();
		}
	});
</script>

<div class="annotation-workspace">
	<div class="workspace-sidebar">
		<AnnotationToolbar
			activeTool={currentTool}
			onToolChange={handleToolChange}
			onImageUpload={handleImageUpload}
		/>

		<div class="demo-section">
			<button class="demo-button" onclick={loadDemoImage}> Load Demo Image </button>
		</div>
	</div>

	<div class="workspace-main">
		<div class="canvas-area">
			<ImageCanvas
				{imageUrl}
				{annotations}
				isDrawing={currentTool === 'bbox'}
				onAnnotationCreate={handleAnnotationCreate}
				onAnnotationSelect={handleAnnotationSelect}
			/>
		</div>
	</div>

	<div class="workspace-panel">
		<AnnotationPanel
			{annotations}
			onAnnotationSelect={handleAnnotationSelect}
			onAnnotationDelete={handleAnnotationDelete}
			onAnnotationUpdate={handleAnnotationUpdate}
		/>
	</div>
</div>

<style>
	.annotation-workspace {
		display: grid;
		grid-template-columns: 250px 1fr 300px;
		gap: 1rem;
		height: 100vh;
		padding: 1rem;
		background-color: #f5f7fa;
	}

	.workspace-sidebar {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.workspace-main {
		display: flex;
		flex-direction: column;
		min-height: 0;
	}

	.canvas-area {
		flex: 1;
		min-height: 0;
		background-color: white;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.workspace-panel {
		display: flex;
		flex-direction: column;
		min-height: 0;
	}

	.demo-section {
		padding: 1rem;
		background-color: #fff3cd;
		border: 1px solid #ffeaa7;
		border-radius: 8px;
	}

	.demo-button {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #f39c12;
		border-radius: 6px;
		background-color: #f39c12;
		color: white;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.demo-button:hover {
		background-color: #e67e22;
		border-color: #e67e22;
	}

	/* Responsive design */
	@media (max-width: 1024px) {
		.annotation-workspace {
			grid-template-columns: 1fr;
			grid-template-rows: auto 1fr auto;
			height: 100vh;
		}

		.workspace-sidebar {
			flex-direction: row;
			overflow-x: auto;
		}

		.workspace-panel {
			max-height: 300px;
		}
	}

	@media (max-width: 768px) {
		.annotation-workspace {
			padding: 0.5rem;
			gap: 0.5rem;
		}
	}
</style>
