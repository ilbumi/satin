<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Konva from 'konva';
	import type {
		CanvasState,
		ClientAnnotation,
		Point,
		AnnotationPointerEvent,
		CoordinateTransform
	} from '$lib/features/annotations/types';
	import { createCoordinateTransform, calculateImageFit } from '$lib/features/annotations/utils';

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
	let stage: Konva.Stage;
	let backgroundLayer: Konva.Layer;
	let annotationLayer: Konva.Layer;
	let imageObj: Konva.Image;
	let imageElement: HTMLImageElement;

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

	// Coordinate transform
	let transform: CoordinateTransform;

	// Track if we're currently panning
	let isPanning = $state(false);
	let lastPanPos = $state<Point | null>(null);

	onMount(() => {
		initializeCanvas();
		loadImage();
	});

	onDestroy(() => {
		stage?.destroy();
	});

	function initializeCanvas() {
		if (!containerElement) return;

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
	}

	function loadImage() {
		imageElement = new Image();
		imageElement.crossOrigin = 'anonymous';

		imageElement.onload = () => {
			// Update actual image dimensions
			internalCanvasState.imageWidth = imageElement.naturalWidth;
			internalCanvasState.imageHeight = imageElement.naturalHeight;

			// Create Konva image
			imageObj = new Konva.Image({
				image: imageElement,
				width: internalCanvasState.imageWidth,
				height: internalCanvasState.imageHeight
			});

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

	function setupEventHandlers() {
		// Pointer events
		stage.on('pointerdown', handlePointerDown);
		stage.on('pointermove', handlePointerMove);
		stage.on('pointerup', handlePointerUp);

		// Wheel for zoom
		stage.on('wheel', handleWheel);

		// Window resize
		window.addEventListener('resize', handleResize);
	}

	function handlePointerDown(e: Konva.KonvaEventObject<PointerEvent>) {
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

	function handlePointerMove(e: Konva.KonvaEventObject<PointerEvent>) {
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

	function handlePointerUp(e: Konva.KonvaEventObject<PointerEvent>) {
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

	function handleWheel(e: Konva.KonvaEventObject<WheelEvent>) {
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
		if (!stage || !imageObj) return;

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
		if (!annotationLayer) return;

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
		if (!stage) return;
		const newScale = Math.min(stage.scaleX() * 1.2, 10);
		stage.scale({ x: newScale, y: newScale });
		updateCanvasState();
	}

	export function zoomOut() {
		if (!stage) return;
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

	// Update internal state when props change
	$effect(() => {
		Object.assign(internalCanvasState, canvasState);
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
</div>

<style>
	.annotation-canvas {
		touch-action: none;
		user-select: none;
	}
</style>
