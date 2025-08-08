<script lang="ts">
	import ImageCanvas from './ImageCanvas.svelte';
	import AnnotationToolbar from './AnnotationToolbar.svelte';
	import AnnotationPanel from './AnnotationPanel.svelte';
	import { annotationStore } from '../stores/annotationStore';

	function handleImageUpload(file: File) {
		const url = URL.createObjectURL(file);
		annotationStore.setImageUrl(url);
	}
</script>

<div class="annotation-workspace">
	<div class="workspace-sidebar">
		<AnnotationToolbar
			activeTool={$annotationStore.currentTool}
			onToolChange={annotationStore.setTool}
			onImageUpload={handleImageUpload}
		/>
	</div>

	<div class="workspace-main">
		<div class="canvas-area">
			<ImageCanvas
				imageUrl={$annotationStore.imageUrl}
				annotations={$annotationStore.annotations}
				isDrawing={$annotationStore.currentTool === 'bbox'}
				onAnnotationCreate={annotationStore.createAnnotation}
				onAnnotationSelect={annotationStore.selectAnnotation}
			/>
		</div>
	</div>

	<div class="workspace-panel">
		<AnnotationPanel
			annotations={$annotationStore.annotations}
			onAnnotationSelect={annotationStore.selectAnnotation}
			onAnnotationDelete={annotationStore.deleteAnnotation}
			onAnnotationUpdate={annotationStore.updateAnnotation}
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
