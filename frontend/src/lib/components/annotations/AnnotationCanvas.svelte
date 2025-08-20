<script lang="ts">
	import { onMount, onDestroy, untrack } from 'svelte';
	import { browser } from '$app/environment';
	import type {
		CanvasState,
		ClientAnnotation,
		Point,
		AnnotationPointerEvent,
		CoordinateTransform
	} from '$lib/features/annotations/types';
	import { createCoordinateTransform, calculateImageFit } from '$lib/features/annotations/utils';

	// Dynamic Konva import for browser-only usage
	let Konva: typeof import('konva').default;
	type KonvaStage = InstanceType<typeof import('konva').default.Stage>;
	type KonvaLayer = InstanceType<typeof import('konva').default.Layer>;
	type KonvaImage = InstanceType<typeof import('konva').default.Image>;
	type KonvaEventObject<T> = {
		evt: T;
		target: InstanceType<typeof import('konva').default.Node>;
		currentTarget: InstanceType<typeof import('konva').default.Node>;
	};

	interface AnnotationCanvasProps {
		imageUrl: string;
		imageWidth: number;
		imageHeight: number;
		annotations?: ClientAnnotation[];
		canvasState?: Partial<CanvasState>;
		onCanvasStateChange?: (state: Partial<CanvasState>) => void;
		onPointerDown?: (event: AnnotationPointerEvent) => void;
		onPointerMove?: (event: AnnotationPointerEvent) => void;
		onPointerUp?: (event: AnnotationPointerEvent) => void;
		readonly?: boolean;
	}

	let {
		imageUrl,
		imageWidth,
		imageHeight,
		annotations = [],
		canvasState = {},
		onCanvasStateChange,
		onPointerDown,
		onPointerMove,
		onPointerUp,
		readonly = false
	}: AnnotationCanvasProps = $props();

	let containerElement: HTMLDivElement;
	let stage: KonvaStage;
	let backgroundLayer: KonvaLayer;
	let annotationLayer: KonvaLayer;
	let imageObj: KonvaImage;
	let imageElement = $state<HTMLImageElement | null>(null);

	// Canvas state
	let internalCanvasState = $state<CanvasState>({
		zoom: 1,
		panX: 0,
		panY: 0,
		imageWidth: imageWidth,
		imageHeight: imageHeight,
		canvasWidth: 800,
		canvasHeight: 600,
		mode: 'view',
		activeTool: 'select',
		isDragging: false,
		lastPointerPos: null,
		selectedAnnotationId: null,
		hoveredAnnotationId: null,
		isDrawing: false,
		drawingStartPos: null,
		drawingCurrentPos: null,
		...canvasState
	});

	// Error state for Konva loading
	let konvaLoadError = $state<string | null>(null);

	// Coordinate transform
	let transform: CoordinateTransform;

	// Track if we're currently panning
	let isPanning = $state(false);
	let lastPanPos = $state<Point | null>(null);

	onMount(async () => {
		if (!browser) return;

		// Dynamically import Konva only in browser
		try {
			const konvaModule = await import('konva');
			Konva = konvaModule.default;

			initializeCanvas();
			loadImage();
		} catch (error) {
			console.error('Failed to load Konva:', error);
			konvaLoadError = 'Failed to load canvas library. Canvas functionality will be limited.';
			// Still load the image for display
			loadImageFallback();
		}
	});

	onDestroy(() => {
		// Clean up window event listeners
		window.removeEventListener('resize', handleResize);

		// Clean up Konva event listeners
		if (stage) {
			stage.off('pointerdown pointermove pointerup wheel');
			stage.destroy();
		}

		// Clean up image element
		if (imageElement) {
			imageElement.onload = null;
			imageElement.onerror = null;
		}
	});

	function initializeCanvas() {
		if (!containerElement || !browser || !Konva) return;

		const containerRect = containerElement.getBoundingClientRect();
		internalCanvasState.canvasWidth = containerRect.width;
		internalCanvasState.canvasHeight = containerRect.height;

		// Create Konva stage
		stage = new Konva.Stage({
			container: containerElement,
			width: internalCanvasState.canvasWidth,
			height: internalCanvasState.canvasHeight
		});

		// Create layers
		backgroundLayer = new Konva.Layer();
		annotationLayer = new Konva.Layer();

		stage.add(backgroundLayer);
		stage.add(annotationLayer);

		// Set up coordinate transform
		transform = createCoordinateTransform(internalCanvasState, stage);

		// Set up event handlers
		setupEventHandlers();

		// Initial fit to image
		fitImageToCanvas();

		// Report initial state to parent
		updateCanvasState();
	}

	function loadImage() {
		if (!browser || !Konva) return;

		imageElement = new Image();
		imageElement.crossOrigin = 'anonymous';

		imageElement.onload = () => {
			// Update actual image dimensions
			if (imageElement) {
				internalCanvasState.imageWidth = imageElement.naturalWidth;
				internalCanvasState.imageHeight = imageElement.naturalHeight;

				// Create Konva image
				imageObj = new Konva.Image({
					image: imageElement,
					width: internalCanvasState.imageWidth,
					height: internalCanvasState.imageHeight
				});
			}

			backgroundLayer.add(imageObj);
			backgroundLayer.batchDraw();

			// Fit image to canvas
			fitImageToCanvas();

			// Render annotations
			renderAnnotations();
		};

		imageElement.onerror = () => {
			console.error('Failed to load image:', imageUrl);
		};

		imageElement.src = imageUrl;
	}

	function loadImageFallback() {
		if (!browser) return;

		imageElement = new Image();
		imageElement.crossOrigin = 'anonymous';

		imageElement.onload = () => {
			// Update actual image dimensions
			if (imageElement) {
				internalCanvasState.imageWidth = imageElement.naturalWidth;
				internalCanvasState.imageHeight = imageElement.naturalHeight;
			}

			// Report initial state to parent
			updateCanvasState();
		};

		imageElement.onerror = () => {
			console.error('Failed to load image:', imageUrl);
		};

		imageElement.src = imageUrl;
	}

	function setupEventHandlers() {
		if (!browser || !Konva || !stage) return;

		// Pointer events
		stage.on('pointerdown', handlePointerDown);
		stage.on('pointermove', handlePointerMove);
		stage.on('pointerup', handlePointerUp);

		// Wheel for zoom
		stage.on('wheel', handleWheel);

		// Window resize
		window.addEventListener('resize', handleResize);
	}

	function handlePointerDown(e: KonvaEventObject<PointerEvent>) {
		e.evt.preventDefault();

		const pos = stage.getPointerPosition();
		if (!pos) return;

		const imagePos = transform.screenToImage(pos);
		const annotationEvent: AnnotationPointerEvent = {
			point: imagePos,
			originalEvent: e.evt,
			target: findAnnotationAtPoint(imagePos)
		};

		// Check if we should start panning (middle mouse or space+click)
		if (e.evt.button === 1 || (e.evt.button === 0 && e.evt.ctrlKey)) {
			isPanning = true;
			lastPanPos = pos;
			stage.container().style.cursor = 'grabbing';
			return;
		}

		onPointerDown?.(annotationEvent);
	}

	function handlePointerMove(e: KonvaEventObject<PointerEvent>) {
		const pos = stage.getPointerPosition();
		if (!pos) return;

		// Handle panning
		if (isPanning && lastPanPos) {
			const deltaX = pos.x - lastPanPos.x;
			const deltaY = pos.y - lastPanPos.y;

			stage.x(stage.x() + deltaX);
			stage.y(stage.y() + deltaY);

			lastPanPos = pos;
			updateCanvasState();
			return;
		}

		const imagePos = transform.screenToImage(pos);
		const annotationEvent: AnnotationPointerEvent = {
			point: imagePos,
			originalEvent: e.evt,
			target: findAnnotationAtPoint(imagePos)
		};

		internalCanvasState.lastPointerPos = imagePos;
		onPointerMove?.(annotationEvent);
	}

	function handlePointerUp(e: KonvaEventObject<PointerEvent>) {
		const pos = stage.getPointerPosition();

		// End panning
		if (isPanning) {
			isPanning = false;
			lastPanPos = null;
			stage.container().style.cursor = 'default';
			return;
		}

		if (!pos) return;

		const imagePos = transform.screenToImage(pos);
		const annotationEvent: AnnotationPointerEvent = {
			point: imagePos,
			originalEvent: e.evt,
			target: findAnnotationAtPoint(imagePos)
		};

		onPointerUp?.(annotationEvent);
	}

	function handleWheel(e: KonvaEventObject<WheelEvent>) {
		e.evt.preventDefault();

		const scaleBy = 1.1;
		const stage = e.target.getStage();
		const pointer = stage?.getPointerPosition();

		if (!stage || !pointer) return;

		const mousePointTo = {
			x: (pointer.x - stage.x()) / stage.scaleX(),
			y: (pointer.y - stage.y()) / stage.scaleY()
		};

		const direction = e.evt.deltaY > 0 ? -1 : 1;
		const newScale = direction > 0 ? stage.scaleX() * scaleBy : stage.scaleX() / scaleBy;

		// Constrain zoom
		const constrainedScale = Math.max(0.1, Math.min(10, newScale));

		stage.scale({ x: constrainedScale, y: constrainedScale });

		const newPos = {
			x: pointer.x - mousePointTo.x * constrainedScale,
			y: pointer.y - mousePointTo.y * constrainedScale
		};

		stage.position(newPos);
		updateCanvasState();
	}

	function handleResize() {
		if (!containerElement || !stage) return;

		const containerRect = containerElement.getBoundingClientRect();
		stage.width(containerRect.width);
		stage.height(containerRect.height);

		internalCanvasState.canvasWidth = containerRect.width;
		internalCanvasState.canvasHeight = containerRect.height;

		updateCanvasState();
	}

	function fitImageToCanvas() {
		if (!browser || !Konva || !stage || !imageObj) return;

		const fit = calculateImageFit(
			internalCanvasState.imageWidth,
			internalCanvasState.imageHeight,
			internalCanvasState.canvasWidth,
			internalCanvasState.canvasHeight
		);

		stage.scale({ x: fit.scale, y: fit.scale });
		stage.position({ x: fit.x, y: fit.y });

		updateCanvasState();
	}

	function findAnnotationAtPoint(point: Point): ClientAnnotation | undefined {
		return annotations.find((annotation) => {
			const { x, y, width, height } = annotation.bounds;
			return point.x >= x && point.x <= x + width && point.y >= y && point.y <= y + height;
		});
	}

	function renderAnnotations() {
		if (!browser || !Konva || !annotationLayer) return;

		// Clear existing annotations
		annotationLayer.destroyChildren();

		// Render each annotation
		annotations.forEach((annotation) => {
			renderAnnotation(annotation);
		});

		annotationLayer.batchDraw();
	}

	function renderAnnotation(annotation: ClientAnnotation) {
		if (annotation.type === 'bbox') {
			const rect = new Konva.Rect({
				x: annotation.bounds.x,
				y: annotation.bounds.y,
				width: annotation.bounds.width,
				height: annotation.bounds.height,
				fill: annotation.isSelected ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
				stroke: annotation.isSelected ? 'rgb(234, 179, 8)' : 'rgb(59, 130, 246)',
				strokeWidth: annotation.isSelected ? 3 : 2,
				listening: !readonly
			});

			annotationLayer.add(rect);

			// Add resize handles if selected and not readonly
			if (annotation.isSelected && !readonly) {
				addResizeHandles(annotation);
			}
		}
	}

	function addResizeHandles(annotation: ClientAnnotation) {
		const { x, y, width, height } = annotation.bounds;
		const handleSize = 8;
		const handles = [
			{ x: x - handleSize / 2, y: y - handleSize / 2, type: 'nw' },
			{ x: x + width / 2 - handleSize / 2, y: y - handleSize / 2, type: 'n' },
			{ x: x + width - handleSize / 2, y: y - handleSize / 2, type: 'ne' },
			{ x: x + width - handleSize / 2, y: y + height / 2 - handleSize / 2, type: 'e' },
			{ x: x + width - handleSize / 2, y: y + height - handleSize / 2, type: 'se' },
			{ x: x + width / 2 - handleSize / 2, y: y + height - handleSize / 2, type: 's' },
			{ x: x - handleSize / 2, y: y + height - handleSize / 2, type: 'sw' },
			{ x: x - handleSize / 2, y: y + height / 2 - handleSize / 2, type: 'w' }
		];

		handles.forEach((handle) => {
			const rect = new Konva.Rect({
				x: handle.x,
				y: handle.y,
				width: handleSize,
				height: handleSize,
				fill: 'white',
				stroke: 'rgb(59, 130, 246)',
				strokeWidth: 2
			});

			annotationLayer.add(rect);
		});
	}

	function updateCanvasState() {
		if (!stage) return;

		internalCanvasState.zoom = stage.scaleX();
		internalCanvasState.panX = stage.x();
		internalCanvasState.panY = stage.y();

		// Update transform
		transform = createCoordinateTransform(internalCanvasState, stage);

		onCanvasStateChange?.(internalCanvasState);
	}

	// Public API for external control
	export function zoomIn() {
		if (!browser || !Konva || !stage) return;
		const newScale = Math.min(stage.scaleX() * 1.2, 10);
		stage.scale({ x: newScale, y: newScale });
		updateCanvasState();
	}

	export function zoomOut() {
		if (!browser || !Konva || !stage) return;
		const newScale = Math.max(stage.scaleX() / 1.2, 0.1);
		stage.scale({ x: newScale, y: newScale });
		updateCanvasState();
	}

	export function resetZoom() {
		fitImageToCanvas();
	}

	export function getTransform(): CoordinateTransform {
		return transform;
	}

	export function getCanvasState(): CanvasState {
		return internalCanvasState;
	}

	// Re-render when annotations change
	$effect(() => {
		if (annotations) {
			renderAnnotations();
		}
	});

	// Update internal state when props change (prevent reactive loops)
	$effect(() => {
		if (canvasState) {
			untrack(() => {
				// Only update if values have actually changed to prevent loops
				Object.assign(internalCanvasState, canvasState);
			});
		}
	});
</script>

<div
	bind:this={containerElement}
	data-testid="annotation-canvas"
	class="annotation-canvas relative h-full w-full overflow-hidden bg-gray-900"
	style="cursor: {isPanning ? 'grabbing' : 'default'}"
	role="application"
	aria-label="{annotations.length} annotations on canvas"
>
	<!-- Canvas will be mounted here by Konva -->
	{#if konvaLoadError && imageElement}
		<!-- Fallback rendering when Konva fails to load -->
		<div class="fallback-canvas flex h-full items-center justify-center">
			<div class="text-center">
				<img
					src={imageElement.src}
					alt="Annotation target"
					class="max-h-full max-w-full object-contain"
					style="max-width: {internalCanvasState.canvasWidth}px; max-height: {internalCanvasState.canvasHeight}px;"
				/>
				<p class="mt-4 text-sm text-yellow-300">{konvaLoadError}</p>
			</div>
		</div>
	{/if}
</div>

<style>
	.annotation-canvas {
		touch-action: none;
		user-select: none;
	}
</style>
