<script lang="ts">
	import { onMount, onDestroy, untrack } from 'svelte';
	import { browser } from '$app/environment';
	import { beforeNavigate } from '$app/navigation';
	import type {
		CanvasState,
		ClientAnnotation,
		Point,
		AnnotationPointerEvent,
		CoordinateTransform,
		CanvasConfig,
		PerformanceSettings
	} from '$lib/features/annotations/types';
	import { DEFAULT_CANVAS_CONFIG } from '$lib/features/annotations/types';
	import { createCoordinateTransform, calculateImageFit } from '$lib/features/annotations/utils';

	// Dynamic Konva import for browser-only usage
	let Konva: typeof import('konva').default | null = null;
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
		config?: CanvasConfig;
		performanceMode?: boolean;
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
		readonly = false,
		config = DEFAULT_CANVAS_CONFIG,
		performanceMode = true
	}: AnnotationCanvasProps = $props();

	let containerElement: HTMLDivElement;
	let stage: KonvaStage | null = null;
	let backgroundLayer: KonvaLayer | null = null;
	let annotationLayer: KonvaLayer | null = null;
	let imageObj: KonvaImage | null = null;
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

	// Performance state
	let visibleAnnotations = $state<ClientAnnotation[]>([]);
	let annotationPool = $state<Map<string, InstanceType<typeof import('konva').default.Group>>>(
		new Map()
	);
	let lodLevel = $state<'full' | 'simplified' | 'minimal'>('full');
	let lastViewportCheck = $state<number>(0);
	let frameId = $state<number>(0);

	// Performance settings from config
	const perfSettings: PerformanceSettings = config.performance;

	// Coordinate transform - memoized for performance
	let transform = $derived(() => {
		if (!stage || !Konva) return null;
		return createCoordinateTransform(internalCanvasState, stage);
	});

	// Viewport bounds for culling - memoized
	let viewportBounds = $derived(() => {
		if (!stage || !internalCanvasState) return null;
		const padding = perfSettings.cullingPadding;
		const scale = internalCanvasState.zoom;
		return {
			x: -internalCanvasState.panX / scale - padding,
			y: -internalCanvasState.panY / scale - padding,
			width: internalCanvasState.canvasWidth / scale + padding * 2,
			height: internalCanvasState.canvasHeight / scale + padding * 2
		};
	});

	// Level of detail calculation
	let currentLodLevel = $derived(() => {
		if (!perfSettings.levelOfDetail) return 'full';
		const zoom = internalCanvasState.zoom;
		if (zoom < perfSettings.lodThreshold) return 'minimal';
		if (zoom < perfSettings.lodThreshold * 2) return 'simplified';
		return 'full';
	});

	// Track if we're currently panning
	let isPanning = $state(false);
	let lastPanPos = $state<Point | null>(null);

	// Memoized image fit calculation for performance
	let imageFit = $derived(() => {
		if (
			!internalCanvasState.imageWidth ||
			!internalCanvasState.imageHeight ||
			!internalCanvasState.canvasWidth ||
			!internalCanvasState.canvasHeight
		) {
			return null;
		}
		return calculateImageFit(
			internalCanvasState.imageWidth,
			internalCanvasState.imageHeight,
			internalCanvasState.canvasWidth,
			internalCanvasState.canvasHeight
		);
	});

	onMount(async () => {
		// Only run in browser to prevent SSR/hydration issues
		if (!browser) {
			// Fallback for SSR - just load the image
			loadImageFallback();
			return;
		}

		// Dynamically import Konva only in browser
		try {
			const konvaModule = await import('konva');
			Konva = konvaModule.default;

			// Initialize canvas with Konva
			initializeCanvas();
			loadImage();
		} catch (error) {
			console.error('Failed to load Konva:', error);
			konvaLoadError = 'Failed to load canvas library. Canvas functionality will be limited.';
			// Fallback to image display without Konva
			loadImageFallback();
		}
	});

	// Flag to prevent double cleanup
	let isCleanedUp = $state(false);

	// Cleanup function to be reused
	function cleanup() {
		// Prevent double cleanup
		if (isCleanedUp) return;
		isCleanedUp = true;

		// Clean up performance features first
		cleanupPerformance();

		try {
			// Clean up window event listeners
			window.removeEventListener('resize', handleResize);
		} catch (error) {
			console.warn('Failed to remove window resize listener:', error);
		}

		// Clean up Konva event listeners and stage
		if (stage) {
			try {
				stage.off('pointerdown pointermove pointerup wheel');
				stage.destroy();
			} catch (error) {
				console.warn('Failed to destroy Konva stage:', error);
			} finally {
				stage = null;
				backgroundLayer = null;
				annotationLayer = null;
				imageObj = null;
			}
		}

		// Clean up image element
		if (imageElement) {
			try {
				imageElement.onload = null;
				imageElement.onerror = null;
			} catch (error) {
				console.warn('Failed to clean up image element:', error);
			} finally {
				imageElement = null;
			}
		}

		// Reset internal state
		try {
			konvaLoadError = null;
			isPanning = false;
			lastPanPos = null;
		} catch (error) {
			console.warn('Failed to reset internal state:', error);
		}
	}

	// Clean up before navigation to ensure proper resource disposal
	beforeNavigate(() => {
		cleanup();
	});

	onDestroy(() => {
		cleanup();
	});

	// Enhanced cleanup for performance features
	function cleanupPerformance() {
		// Cancel any ongoing rendering
		if (frameId) {
			cancelAnimationFrame(frameId);
			frameId = 0;
		}

		// Clear annotation pool
		annotationPool.forEach((group) => {
			try {
				group.destroy();
			} catch (error) {
				console.warn('Failed to destroy pooled annotation:', error);
			}
		});
		annotationPool.clear();
		visibleAnnotations = [];
	}

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

		// Coordinate transform is now memoized via $derived

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
				if (Konva) {
					imageObj = new Konva.Image({
						image: imageElement,
						width: internalCanvasState.imageWidth,
						height: internalCanvasState.imageHeight
					});
				}
			}

			if (backgroundLayer && imageObj) {
				backgroundLayer.add(imageObj);
				backgroundLayer.batchDraw();
			}

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

		if (!stage) return;
		const pos = stage.getPointerPosition();
		if (!pos) return;

		const currentTransform = transform();
		const imagePos = currentTransform?.screenToImage(pos);
		if (!imagePos) return;

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
		if (!stage) return;
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

		const currentTransform = transform();
		const imagePos = currentTransform?.screenToImage(pos);
		if (!imagePos) return;

		const annotationEvent: AnnotationPointerEvent = {
			point: imagePos,
			originalEvent: e.evt,
			target: findAnnotationAtPoint(imagePos)
		};

		internalCanvasState.lastPointerPos = imagePos;
		onPointerMove?.(annotationEvent);
	}

	function handlePointerUp(e: KonvaEventObject<PointerEvent>) {
		if (!stage) return;
		const pos = stage.getPointerPosition();

		// End panning
		if (isPanning) {
			isPanning = false;
			lastPanPos = null;
			stage.container().style.cursor = 'default';
			return;
		}

		if (!pos) return;

		const currentTransform = transform();
		const imagePos = currentTransform?.screenToImage(pos);
		if (!imagePos) return;

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

		const currentImageFit = imageFit();
		if (!currentImageFit) return;

		stage.scale({ x: currentImageFit.scale, y: currentImageFit.scale });
		stage.position({ x: currentImageFit.x, y: currentImageFit.y });

		updateCanvasState();
	}

	function findAnnotationAtPoint(point: Point | undefined): ClientAnnotation | undefined {
		if (!point) return undefined;
		// Use visible annotations for performance
		const annotationsToCheck = performanceMode ? visibleAnnotations : annotations;
		return annotationsToCheck.find((annotation) => {
			const { x, y, width, height } = annotation.bounds;
			return point.x >= x && point.x <= x + width && point.y >= y && point.y <= y + height;
		});
	}

	// Viewport culling - check if annotation is in viewport
	function isAnnotationInViewport(annotation: ClientAnnotation): boolean {
		if (!perfSettings.viewportCulling || !viewportBounds()) return true;
		const viewport = viewportBounds()!;
		const bounds = annotation.bounds;
		return (
			bounds.x < viewport.x + viewport.width &&
			bounds.x + bounds.width > viewport.x &&
			bounds.y < viewport.y + viewport.height &&
			bounds.y + bounds.height > viewport.y
		);
	}

	// Update visible annotations with culling
	function updateVisibleAnnotations() {
		if (!performanceMode) {
			visibleAnnotations = annotations;
			return;
		}

		const now = performance.now();
		// Throttle viewport checks to every 16ms (60fps)
		if (now - lastViewportCheck < 16) return;
		lastViewportCheck = now;

		let culled = annotations;

		// Apply viewport culling
		if (perfSettings.viewportCulling && viewportBounds()) {
			culled = annotations.filter(isAnnotationInViewport);
		}

		// Limit maximum visible annotations
		if (culled.length > perfSettings.maxVisibleAnnotations) {
			// Prioritize selected and nearby annotations
			culled.sort((a, b) => {
				if (a.isSelected && !b.isSelected) return -1;
				if (b.isSelected && !a.isSelected) return 1;
				// TODO: Add distance from viewport center as secondary sort
				return 0;
			});
			culled = culled.slice(0, perfSettings.maxVisibleAnnotations);
		}

		visibleAnnotations = culled;
		lodLevel = currentLodLevel();
	}

	// Optimized render with object pooling
	function renderAnnotationOptimized(
		annotation: ClientAnnotation,
		lod: 'full' | 'simplified' | 'minimal'
	) {
		if (!Konva || !annotationLayer) return;

		let group = annotationPool.get(annotation.id);
		if (!group) {
			group = new Konva.Group({
				id: annotation.id,
				listening: !readonly
			});
			annotationPool.set(annotation.id, group);
			annotationLayer.add(group);
		} else {
			// Clear existing children for reuse
			group.destroyChildren();
		}

		if (annotation.type === 'bbox') {
			const rect = new Konva.Rect({
				x: annotation.bounds.x,
				y: annotation.bounds.y,
				width: annotation.bounds.width,
				height: annotation.bounds.height,
				fill: annotation.isSelected ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
				stroke: annotation.isSelected ? 'rgb(234, 179, 8)' : 'rgb(59, 130, 246)',
				strokeWidth: lod === 'minimal' ? 1 : annotation.isSelected ? 3 : 2,
				listening: !readonly && lod !== 'minimal'
			});

			group.add(rect);

			// Only add resize handles in full LOD and when selected
			if (lod === 'full' && annotation.isSelected && !readonly) {
				addResizeHandlesOptimized(group, annotation);
			}
		}

		group.visible(true);
	}

	// Optimized resize handles with pooling
	function addResizeHandlesOptimized(
		group: InstanceType<typeof import('konva').default.Group>,
		annotation: ClientAnnotation
	) {
		if (!Konva) return;
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
			if (!Konva) return;
			const rect = new Konva.Rect({
				x: handle.x,
				y: handle.y,
				width: handleSize,
				height: handleSize,
				fill: 'white',
				stroke: 'rgb(59, 130, 246)',
				strokeWidth: 2
			});
			group.add(rect);
		});
	}

	function renderAnnotations() {
		if (!browser || !Konva || !annotationLayer) return;

		// Update performance state
		updateVisibleAnnotations();

		if (performanceMode) {
			renderAnnotationsOptimized();
		} else {
			renderAnnotationsLegacy();
		}
	}

	// Optimized rendering with batching and culling
	function renderAnnotationsOptimized() {
		if (!browser || !Konva || !annotationLayer) return;

		// Hide unused pooled objects
		annotationPool.forEach((group, id) => {
			if (!visibleAnnotations.find((a) => a.id === id)) {
				group.visible(false);
			}
		});

		// Render visible annotations in batches
		const batchSize = perfSettings.batchSize;
		let batchIndex = 0;

		function renderBatch() {
			const start = batchIndex * batchSize;
			const end = Math.min(start + batchSize, visibleAnnotations.length);

			for (let i = start; i < end; i++) {
				renderAnnotationOptimized(visibleAnnotations[i], lodLevel);
			}

			batchIndex++;

			// Continue with next batch or finish
			if (end < visibleAnnotations.length) {
				frameId = requestAnimationFrame(renderBatch);
			} else {
				// All batches complete - batch draw
				annotationLayer?.batchDraw();
				batchIndex = 0;
			}
		}

		// Cancel any ongoing render
		if (frameId) {
			cancelAnimationFrame(frameId);
		}

		// Start batch rendering
		frameId = requestAnimationFrame(renderBatch);
	}

	// Legacy rendering for compatibility
	function renderAnnotationsLegacy() {
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
		if (annotation.type === 'bbox' && Konva && annotationLayer) {
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

		if (Konva && annotationLayer) {
			handles.forEach((handle) => {
				if (!Konva) return;
				const rect = new Konva.Rect({
					x: handle.x,
					y: handle.y,
					width: handleSize,
					height: handleSize,
					fill: 'white',
					stroke: 'rgb(59, 130, 246)',
					strokeWidth: 2
				});

				if (annotationLayer) {
					annotationLayer.add(rect);
				}
			});
		}
	}

	function updateCanvasState() {
		if (!stage) return;

		internalCanvasState.zoom = stage.scaleX();
		internalCanvasState.panX = stage.x();
		internalCanvasState.panY = stage.y();

		// Transform is automatically updated via $derived

		// Trigger viewport culling update when view changes
		if (performanceMode) {
			updateVisibleAnnotations();
		}

		onCanvasStateChange?.(internalCanvasState);
	}

	// Public API for external control
	export function zoomIn() {
		if (!browser || !Konva || !stage) return;
		const newScale = Math.min(stage.scaleX() * config.zoomStep, config.maxZoom);
		stage.scale({ x: newScale, y: newScale });
		updateCanvasState();
	}

	export function zoomOut() {
		if (!browser || !Konva || !stage) return;
		const newScale = Math.max(stage.scaleX() / config.zoomStep, config.minZoom);
		stage.scale({ x: newScale, y: newScale });
		updateCanvasState();
	}

	export function resetZoom() {
		fitImageToCanvas();
	}

	export function getTransform(): CoordinateTransform | null {
		return transform() || null;
	}

	export function getCanvasState(): CanvasState {
		return internalCanvasState;
	}

	// Performance API
	export function getPerformanceStats() {
		return {
			totalAnnotations: annotations.length,
			visibleAnnotations: visibleAnnotations.length,
			lodLevel: lodLevel,
			pooledObjects: annotationPool.size,
			performanceMode
		};
	}

	export function setPerformanceMode(enabled: boolean) {
		performanceMode = enabled;
		renderAnnotations();
	}

	export function forceFullRender() {
		// Force full re-render without culling
		const wasPerformanceMode = performanceMode;
		performanceMode = false;
		renderAnnotations();
		performanceMode = wasPerformanceMode;
	}

	// Re-render when annotations change - debounced for performance
	let renderTimeout = 0;
	$effect(() => {
		if (annotations) {
			// Debounce frequent annotation updates
			clearTimeout(renderTimeout);
			renderTimeout = setTimeout(() => {
				renderAnnotations();
			}, 16) as unknown as number; // 60fps
		}
	});

	// Re-render when viewport changes significantly
	$effect(() => {
		if (viewportBounds() && performanceMode) {
			clearTimeout(renderTimeout);
			renderTimeout = setTimeout(() => {
				renderAnnotations();
			}, 16) as unknown as number;
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
	aria-label="{annotations.length} annotations ({visibleAnnotations.length} visible) on canvas"
	data-performance-mode={performanceMode}
	data-lod-level={lodLevel}
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
