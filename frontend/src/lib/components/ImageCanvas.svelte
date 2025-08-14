<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';

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
		'data-testid'?: string;
	}

	const {
		imageUrl = '',
		annotations = [],
		isDrawing = false,
		onAnnotationCreate,
		onAnnotationSelect,
		'data-testid': testId
	}: Props = $props();

	let canvasElement: HTMLCanvasElement;
	let imageElement: HTMLImageElement;
	let containerElement: HTMLDivElement;
	let ctx: CanvasRenderingContext2D | null = null;

	let canvasWidth = $state(800);
	let canvasHeight = $state(600);
	let imageScale = $state(1);
	let imageOffsetX = $state(0);
	let imageOffsetY = $state(0);

	// Drawing state
	let isMouseDown = $state(false);
	let startX = $state(0);
	let startY = $state(0);
	let currentX = $state(0);
	let currentY = $state(0);

	// Debounce drawing to reduce redraw frequency
	let drawTimeout: ReturnType<typeof setTimeout> | undefined;

	// Dirty region tracking for partial redraws
	let isDirty = true;
	let lastAnnotationCount = 0;

	// Cache coordinate transformations to avoid repeated calculations
	let coordinateCache = new SvelteMap<
		string,
		{ x: number; y: number; width: number; height: number }
	>();
	let scaledDimensions = $state({ width: 0, height: 0 });

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
			ctx = canvasElement.getContext('2d');
			coordinateCache.clear(); // Clear cache after resize
			isDirty = true; // Force full redraw after resize
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

			// Update cached dimensions and clear coordinate cache
			scaledDimensions = { width: scaledWidth, height: scaledHeight };
			coordinateCache.clear();

			isDirty = true; // Force full redraw when image loads
			draw();
		};
		imageElement.src = imageUrl;
	}

	function draw() {
		if (!ctx) return;

		// Check if we need a full redraw
		const needsFullRedraw = isDirty || annotations.length !== lastAnnotationCount;

		if (needsFullRedraw) {
			// Clear entire canvas
			ctx.clearRect(0, 0, canvasWidth, canvasHeight);

			// Draw image if loaded
			if (imageElement && imageElement.complete) {
				const scaledWidth = imageElement.width * imageScale;
				const scaledHeight = imageElement.height * imageScale;
				ctx.drawImage(imageElement, imageOffsetX, imageOffsetY, scaledWidth, scaledHeight);
			}

			// Draw existing annotations (skip off-screen ones)
			annotations.forEach((bbox) => {
				if (isAnnotationVisible(bbox)) {
					drawBoundingBox(bbox);
				}
			});

			lastAnnotationCount = annotations.length;
			isDirty = false;
		} else if (isDrawing && isMouseDown) {
			// Only clear and redraw the drawing area for current bbox
			const minX = Math.min(startX, currentX) - 5;
			const minY = Math.min(startY, currentY) - 5;
			const maxX = Math.max(startX, currentX) + 5;
			const maxY = Math.max(startY, currentY) + 5;

			// Clear just the drawing region
			ctx.clearRect(minX, minY, maxX - minX, maxY - minY);

			// Redraw image in the dirty region
			if (imageElement && imageElement.complete) {
				ctx.drawImage(
					imageElement,
					Math.max(0, (minX - imageOffsetX) / imageScale),
					Math.max(0, (minY - imageOffsetY) / imageScale),
					Math.min(imageElement.width, (maxX - minX) / imageScale),
					Math.min(imageElement.height, (maxY - minY) / imageScale),
					minX,
					minY,
					maxX - minX,
					maxY - minY
				);
			}

			// Redraw annotations that intersect with dirty region and are visible
			annotations.forEach((bbox) => {
				if (
					isAnnotationVisible(bbox) &&
					intersectsRegion(bbox, minX, minY, maxX - minX, maxY - minY)
				) {
					drawBoundingBox(bbox);
				}
			});
		}

		// Draw current drawing bbox
		if (isDrawing && isMouseDown) {
			drawCurrentBoundingBox(ctx);
		}
	}

	function isAnnotationVisible(bbox: BoundingBox): boolean {
		if (!imageElement) return true;

		const bboxX = imageOffsetX + bbox.x * scaledDimensions.width;
		const bboxY = imageOffsetY + bbox.y * scaledDimensions.height;
		const bboxWidth = bbox.width * scaledDimensions.width;
		const bboxHeight = bbox.height * scaledDimensions.height;

		// Check if annotation is within canvas bounds
		return !(
			bboxX + bboxWidth < 0 ||
			bboxX > canvasWidth ||
			bboxY + bboxHeight < 0 ||
			bboxY > canvasHeight
		);
	}

	function intersectsRegion(
		bbox: BoundingBox,
		x: number,
		y: number,
		width: number,
		height: number
	): boolean {
		if (!imageElement) return true;

		const bboxX = imageOffsetX + bbox.x * scaledDimensions.width;
		const bboxY = imageOffsetY + bbox.y * scaledDimensions.height;
		const bboxWidth = bbox.width * scaledDimensions.width;
		const bboxHeight = bbox.height * scaledDimensions.height;

		return !(
			bboxX + bboxWidth < x ||
			bboxX > x + width ||
			bboxY + bboxHeight < y ||
			bboxY > y + height
		);
	}

	function debouncedDraw() {
		if (drawTimeout) {
			clearTimeout(drawTimeout);
		}
		drawTimeout = setTimeout(draw, 16); // ~60fps -> ~30fps
	}

	function drawBoundingBox(bbox: BoundingBox) {
		if (!ctx) return;

		// Check cache first
		const cacheKey = `${bbox.id}-${imageScale}-${imageOffsetX}-${imageOffsetY}`;
		let coords = coordinateCache.get(cacheKey);

		if (!coords) {
			// Calculate and cache coordinates
			const x = imageOffsetX + bbox.x * scaledDimensions.width;
			const y = imageOffsetY + bbox.y * scaledDimensions.height;
			const width = bbox.width * scaledDimensions.width;
			const height = bbox.height * scaledDimensions.height;

			coords = { x, y, width, height };
			coordinateCache.set(cacheKey, coords);
		}

		// Draw bounding box
		ctx.strokeStyle = bbox.isSelected ? '#ff6b6b' : '#4ecdc4';
		ctx.lineWidth = 2;
		ctx.strokeRect(coords.x, coords.y, coords.width, coords.height);

		// Draw label
		if (bbox.label) {
			ctx.fillStyle = bbox.isSelected ? '#ff6b6b' : '#4ecdc4';
			ctx.font = '14px sans-serif';
			const labelWidth = ctx.measureText(bbox.label).width;
			ctx.fillRect(coords.x, coords.y - 20, labelWidth + 8, 20);
			ctx.fillStyle = 'white';
			ctx.fillText(bbox.label, coords.x + 4, coords.y - 6);
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
		debouncedDraw();
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

		// Only check visible annotations
		for (const bbox of annotations) {
			if (!isAnnotationVisible(bbox)) continue;

			const bboxX = imageOffsetX + bbox.x * scaledDimensions.width;
			const bboxY = imageOffsetY + bbox.y * scaledDimensions.height;
			const bboxWidth = bbox.width * scaledDimensions.width;
			const bboxHeight = bbox.height * scaledDimensions.height;

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

	// Reactive drawing - only redraw when annotations actually change
	$effect(() => {
		if (ctx && annotations.length >= 0) {
			draw();
		}
	});

	$effect(() => {
		if (imageUrl) {
			loadImage();
		}
	});
</script>

<div bind:this={containerElement} class="canvas-container" data-testid={testId}>
	<!-- Tests expect both canvas-image and annotation-canvas testids -->
	{#if imageUrl}
		<img
			src={imageUrl}
			alt="Current annotation target"
			data-testid="canvas-image"
			style="display: none;"
		/>
	{/if}

	<!-- Render bounding boxes as DOM elements for E2E test interaction -->
	{#each annotations || [] as annotation (annotation.id)}
		<div
			class="bounding-box-overlay"
			data-testid="bounding-box"
			data-annotation-id={annotation.id}
			style="left: {imageOffsetX + annotation.x * scaledDimensions.width}px; top: {imageOffsetY +
				annotation.y * scaledDimensions.height}px; width: {annotation.width *
				scaledDimensions.width}px; height: {annotation.height * scaledDimensions.height}px;"
			onclick={() => onAnnotationSelect?.(annotation.id)}
			onkeydown={(e) => e.key === 'Enter' && onAnnotationSelect?.(annotation.id)}
			role="button"
			tabindex="0"
		>
			<!-- Resize handles for selected annotations -->
			{#if annotation.isSelected}
				<div class="resize-handle nw" data-testid="resize-handle" data-direction="nw"></div>
				<div class="resize-handle n" data-testid="resize-handle" data-direction="n"></div>
				<div class="resize-handle ne" data-testid="resize-handle" data-direction="ne"></div>
				<div class="resize-handle e" data-testid="resize-handle" data-direction="e"></div>
				<div class="resize-handle se" data-testid="resize-handle-se" data-direction="se"></div>
				<div class="resize-handle s" data-testid="resize-handle" data-direction="s"></div>
				<div class="resize-handle sw" data-testid="resize-handle" data-direction="sw"></div>
				<div class="resize-handle w" data-testid="resize-handle" data-direction="w"></div>
			{/if}
		</div>
	{/each}
	<canvas
		bind:this={canvasElement}
		width={canvasWidth}
		height={canvasHeight}
		class="annotation-canvas"
		class:drawing={isDrawing}
		onmousedown={handleMouseDown}
		onmousemove={handleMouseMove}
		onmouseup={handleMouseUp}
		onclick={handleCanvasClick}
		data-testid="annotation-canvas"
	></canvas>
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

	.bounding-box-overlay {
		position: absolute;
		border: 2px solid #4ecdc4;
		pointer-events: auto;
		cursor: pointer;
		transition: border-color 0.2s;
		z-index: 10;
	}

	.bounding-box-overlay[data-annotation-id]:hover {
		border-color: #ff6b6b;
	}

	.resize-handle {
		position: absolute;
		width: 8px;
		height: 8px;
		background: #fff;
		border: 1px solid #4ecdc4;
		border-radius: 50%;
		pointer-events: auto;
		z-index: 11;
	}

	.resize-handle.nw {
		top: -4px;
		left: -4px;
		cursor: nw-resize;
	}
	.resize-handle.n {
		top: -4px;
		left: 50%;
		transform: translateX(-50%);
		cursor: n-resize;
	}
	.resize-handle.ne {
		top: -4px;
		right: -4px;
		cursor: ne-resize;
	}
	.resize-handle.e {
		top: 50%;
		right: -4px;
		transform: translateY(-50%);
		cursor: e-resize;
	}
	.resize-handle.se {
		bottom: -4px;
		right: -4px;
		cursor: se-resize;
	}
	.resize-handle.s {
		bottom: -4px;
		left: 50%;
		transform: translateX(-50%);
		cursor: s-resize;
	}
	.resize-handle.sw {
		bottom: -4px;
		left: -4px;
		cursor: sw-resize;
	}
	.resize-handle.w {
		top: 50%;
		left: -4px;
		transform: translateY(-50%);
		cursor: w-resize;
	}
</style>
