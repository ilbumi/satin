<script lang="ts">
	import { onMount } from 'svelte';

	interface BoundingBox {
		id: string;
		x: number;
		y: number;
		width: number;
		height: number;
		label: string;
		isSelected: boolean;
	}

	interface Props {
		imageUrl?: string;
		annotations?: BoundingBox[];
		isDrawing?: boolean;
		onAnnotationCreate?: (bbox: Omit<BoundingBox, 'id' | 'isSelected'>) => void;
		onAnnotationSelect?: (id: string) => void;
	}

	const {
		imageUrl = '',
		annotations = [],
		isDrawing = false,
		onAnnotationCreate,
		onAnnotationSelect
	}: Props = $props();

	let canvasElement: HTMLCanvasElement;
	let imageElement: HTMLImageElement;
	let containerElement: HTMLDivElement;
	
	let canvasWidth = 800;
	let canvasHeight = 600;
	let imageScale = 1;
	let imageOffsetX = 0;
	let imageOffsetY = 0;

	// Drawing state
	let isMouseDown = $state(false);
	let startX = $state(0);
	let startY = $state(0);
	let currentX = $state(0);
	let currentY = $state(0);

	onMount(() => {
		if (imageUrl) {
			loadImage();
		}
		resizeCanvas();
		window.addEventListener('resize', resizeCanvas);
		return () => window.removeEventListener('resize', resizeCanvas);
	});

	function resizeCanvas() {
		if (!containerElement) return;
		const rect = containerElement.getBoundingClientRect();
		canvasWidth = rect.width;
		canvasHeight = rect.height;
		if (canvasElement) {
			canvasElement.width = canvasWidth;
			canvasElement.height = canvasHeight;
			draw();
		}
	}

	function loadImage() {
		if (!imageUrl) return;
		
		imageElement = new Image();
		imageElement.onload = () => {
			// Calculate scale to fit image in canvas
			const scaleX = canvasWidth / imageElement.width;
			const scaleY = canvasHeight / imageElement.height;
			imageScale = Math.min(scaleX, scaleY, 1); // Don't scale up
			
			// Center the image
			const scaledWidth = imageElement.width * imageScale;
			const scaledHeight = imageElement.height * imageScale;
			imageOffsetX = (canvasWidth - scaledWidth) / 2;
			imageOffsetY = (canvasHeight - scaledHeight) / 2;
			
			draw();
		};
		imageElement.src = imageUrl;
	}

	function draw() {
		if (!canvasElement) return;
		const ctx = canvasElement.getContext('2d');
		if (!ctx) return;

		// Clear canvas
		ctx.clearRect(0, 0, canvasWidth, canvasHeight);

		// Draw image if loaded
		if (imageElement && imageElement.complete) {
			const scaledWidth = imageElement.width * imageScale;
			const scaledHeight = imageElement.height * imageScale;
			ctx.drawImage(imageElement, imageOffsetX, imageOffsetY, scaledWidth, scaledHeight);
		}

		// Draw existing annotations
		annotations.forEach(drawBoundingBox);

		// Draw current drawing bbox
		if (isDrawing && isMouseDown) {
			drawCurrentBoundingBox(ctx);
		}
	}

	function drawBoundingBox(bbox: BoundingBox) {
		if (!canvasElement) return;
		const ctx = canvasElement.getContext('2d');
		if (!ctx) return;

		// Convert normalized coordinates to canvas coordinates
		const scaledWidth = imageElement ? imageElement.width * imageScale : canvasWidth;
		const scaledHeight = imageElement ? imageElement.height * imageScale : canvasHeight;
		
		const x = imageOffsetX + bbox.x * scaledWidth;
		const y = imageOffsetY + bbox.y * scaledHeight;
		const width = bbox.width * scaledWidth;
		const height = bbox.height * scaledHeight;

		// Draw bounding box
		ctx.strokeStyle = bbox.isSelected ? '#ff6b6b' : '#4ecdc4';
		ctx.lineWidth = 2;
		ctx.strokeRect(x, y, width, height);

		// Draw label
		if (bbox.label) {
			ctx.fillStyle = bbox.isSelected ? '#ff6b6b' : '#4ecdc4';
			ctx.font = '14px sans-serif';
			const labelWidth = ctx.measureText(bbox.label).width;
			ctx.fillRect(x, y - 20, labelWidth + 8, 20);
			ctx.fillStyle = 'white';
			ctx.fillText(bbox.label, x + 4, y - 6);
		}
	}

	function drawCurrentBoundingBox(ctx: CanvasRenderingContext2D) {
		const x = Math.min(startX, currentX);
		const y = Math.min(startY, currentY);
		const width = Math.abs(currentX - startX);
		const height = Math.abs(currentY - startY);

		ctx.strokeStyle = '#ff9f43';
		ctx.lineWidth = 2;
		ctx.setLineDash([5, 5]);
		ctx.strokeRect(x, y, width, height);
		ctx.setLineDash([]);
	}

	function getMousePosition(event: MouseEvent) {
		const rect = canvasElement.getBoundingClientRect();
		return {
			x: event.clientX - rect.left,
			y: event.clientY - rect.top
		};
	}

	function canvasToNormalizedCoordinates(canvasX: number, canvasY: number) {
		if (!imageElement) return { x: 0, y: 0 };
		
		const scaledWidth = imageElement.width * imageScale;
		const scaledHeight = imageElement.height * imageScale;
		
		const imageX = canvasX - imageOffsetX;
		const imageY = canvasY - imageOffsetY;
		
		return {
			x: Math.max(0, Math.min(1, imageX / scaledWidth)),
			y: Math.max(0, Math.min(1, imageY / scaledHeight))
		};
	}

	function handleMouseDown(event: MouseEvent) {
		if (!isDrawing) return;
		
		const pos = getMousePosition(event);
		startX = pos.x;
		startY = pos.y;
		currentX = pos.x;
		currentY = pos.y;
		isMouseDown = true;
		
		event.preventDefault();
	}

	function handleMouseMove(event: MouseEvent) {
		if (!isDrawing || !isMouseDown) return;
		
		const pos = getMousePosition(event);
		currentX = pos.x;
		currentY = pos.y;
		draw();
	}

	function handleMouseUp(event: MouseEvent) {
		if (!isDrawing || !isMouseDown) return;
		
		const pos = getMousePosition(event);
		currentX = pos.x;
		currentY = pos.y;
		isMouseDown = false;

		// Only create annotation if the box has a minimum size
		const width = Math.abs(currentX - startX);
		const height = Math.abs(currentY - startY);
		if (width > 10 && height > 10) {
			createAnnotation();
		}
		
		draw();
	}

	function handleCanvasClick(event: MouseEvent) {
		if (isDrawing) return;
		
		const pos = getMousePosition(event);
		const clickedAnnotation = findAnnotationAtPosition(pos.x, pos.y);
		
		if (clickedAnnotation && onAnnotationSelect) {
			onAnnotationSelect(clickedAnnotation.id);
		}
	}

	function findAnnotationAtPosition(x: number, y: number): BoundingBox | null {
		if (!imageElement) return null;
		
		const scaledWidth = imageElement.width * imageScale;
		const scaledHeight = imageElement.height * imageScale;
		
		for (const bbox of annotations) {
			const bboxX = imageOffsetX + bbox.x * scaledWidth;
			const bboxY = imageOffsetY + bbox.y * scaledHeight;
			const bboxWidth = bbox.width * scaledWidth;
			const bboxHeight = bbox.height * scaledHeight;
			
			if (x >= bboxX && x <= bboxX + bboxWidth && y >= bboxY && y <= bboxY + bboxHeight) {
				return bbox;
			}
		}
		return null;
	}

	function createAnnotation() {
		if (!onAnnotationCreate) return;
		
		const startNorm = canvasToNormalizedCoordinates(startX, startY);
		const endNorm = canvasToNormalizedCoordinates(currentX, currentY);
		
		const x = Math.min(startNorm.x, endNorm.x);
		const y = Math.min(startNorm.y, endNorm.y);
		const width = Math.abs(endNorm.x - startNorm.x);
		const height = Math.abs(endNorm.y - startNorm.y);
		
		onAnnotationCreate({
			x,
			y,
			width,
			height,
			label: 'New Annotation'
		});
	}

	// Reactive drawing
	$effect(() => {
		if (canvasElement) {
			draw();
		}
	});

	$effect(() => {
		if (imageUrl) {
			loadImage();
		}
	});
</script>

<div bind:this={containerElement} class="canvas-container">
	<canvas
		bind:this={canvasElement}
		width={canvasWidth}
		height={canvasHeight}
		class="annotation-canvas"
		class:drawing={isDrawing}
		on:mousedown={handleMouseDown}
		on:mousemove={handleMouseMove}
		on:mouseup={handleMouseUp}
		on:click={handleCanvasClick}
	/>
</div>

<style>
	.canvas-container {
		width: 100%;
		height: 100%;
		min-height: 400px;
		position: relative;
		border: 2px solid #e1e8ed;
		border-radius: 8px;
		background-color: #f8f9fa;
		overflow: hidden;
	}

	.annotation-canvas {
		display: block;
		width: 100%;
		height: 100%;
		cursor: default;
	}

	.annotation-canvas.drawing {
		cursor: crosshair;
	}
</style>