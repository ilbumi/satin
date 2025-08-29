<script lang="ts">
	import { onMount } from 'svelte';
	import { getContextClient } from '@urql/svelte';
	import {
		CREATE_ANNOTATION,
		UPDATE_ANNOTATION,
		DELETE_ANNOTATION,
		GET_ANNOTATIONS_BY_IMAGE,
		type AnnotationData,
		type AnnotationCreateInput,
		type AnnotationUpdateInput
	} from '$lib/graphql/operations/annotations';
	import { handleDeleteResult, handleMutationResult } from '$lib/utils/graphql-errors';

	interface Props {
		imageUrl: string;
		imageId?: string;
		initialAnnotations?: AnnotationData[];
		width?: number;
		height?: number;
		responsive?: boolean;
		onAnnotationsChange?: (annotations: BoundingBox[]) => void;
		onSaveStatusChange?: (status: 'idle' | 'saving' | 'saved' | 'error') => void;
		onDoubleClickAnnotation?: (annotationId: string) => void;
	}

	interface BoundingBox {
		id: string;
		x: number;
		y: number;
		width: number;
		height: number;
		description?: string;
		tags: string[];
		confidence?: number;
		source?: string;
		createdAt: string;
		updatedAt: string;
		// For tracking changes
		_isNew?: boolean;
		_isDirty?: boolean;
		_isDeleted?: boolean;
	}

	let {
		imageUrl,
		imageId,
		initialAnnotations = [],
		width = 800,
		height = 600,
		responsive = false,
		onAnnotationsChange,
		onSaveStatusChange,
		onDoubleClickAnnotation
	}: Props = $props();

	// GraphQL client for backend operations
	const client = getContextClient();

	let canvasElement: HTMLCanvasElement | undefined = $state();
	let canvasContainer: HTMLDivElement | undefined = $state();
	let ctx: CanvasRenderingContext2D | null = null;
	let image: HTMLImageElement | null = null;
	let actualWidth = $state(width);
	let actualHeight = $state(height);

	// Image scaling and positioning for aspect ratio preservation
	let imageScale = $state(1);
	let imageOffsetX = $state(0);
	let imageOffsetY = $state(0);
	let scaledImageWidth = $state(0);
	let scaledImageHeight = $state(0);

	let isDrawing = $state(false);
	let isResizing = $state(false);
	let isDragging = $state(false);
	let startX = $state(0);
	let startY = $state(0);
	let dragHandle = $state<'tl' | 'tr' | 'bl' | 'br' | null>(null);
	let dragOffset = $state({ x: 0, y: 0 });
	let originalBox = $state<BoundingBox | null>(null);
	let boundingBoxes = $state<BoundingBox[]>([]);
	let selectedBoxId = $state<string | null>(null);
	let mode = $state<'select' | 'draw'>('select');

	// Save state
	let saveStatus = $state<'idle' | 'saving' | 'saved' | 'error'>('idle');
	let hasUnsavedChanges = $state(false);
	let saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;
	const SAVE_DEBOUNCE_MS = 1000; // 1 second after last change

	// Double-click tracking
	let lastClickTime = 0;
	let lastClickedBoxId: string | null = null;

	// Performance optimization: RAF and throttling
	let rafId: number | null = null;
	let lastMouseMoveTime = 0;
	const MOUSE_THROTTLE_MS = 16; // 60fps
	let pendingCanvasUpdate = false;

	// Offscreen canvas for caching static elements
	let offscreenCanvas: HTMLCanvasElement | null = null;
	let offscreenCtx: CanvasRenderingContext2D | null = null;
	let staticElementsCached = false;

	// Convert backend annotation to frontend bounding box
	function annotationToBoundingBox(annotation: AnnotationData): BoundingBox {
		return {
			id: annotation.id,
			x: annotation.boundingBox.x,
			y: annotation.boundingBox.y,
			width: annotation.boundingBox.width,
			height: annotation.boundingBox.height,
			description: annotation.description,
			tags: annotation.tags,
			confidence: annotation.confidence ?? undefined,
			source: annotation.source,
			createdAt: annotation.createdAt,
			updatedAt: annotation.updatedAt,
			// Backend annotations are not new, not dirty, and not deleted
			_isNew: false,
			_isDirty: false,
			_isDeleted: false
		};
	}

	// Convert frontend bounding box to backend annotation input
	function boundingBoxToAnnotationInput(
		box: BoundingBox
	): AnnotationCreateInput | AnnotationUpdateInput {
		const baseInput = {
			boundingBox: {
				x: box.x,
				y: box.y,
				width: box.width,
				height: box.height
			},
			description: box.description || '',
			confidence: box.confidence
		};

		if (box._isNew) {
			return {
				...baseInput,
				imageId: imageId!,
				tags: []
			} as AnnotationCreateInput;
		}

		return baseInput as AnnotationUpdateInput;
	}

	// Mark annotations as needing save
	function markAsUnsaved() {
		hasUnsavedChanges = true;
		debouncedSave();
	}

	// Debounced save function
	function debouncedSave() {
		if (saveDebounceTimer) {
			clearTimeout(saveDebounceTimer);
		}

		saveDebounceTimer = setTimeout(() => {
			saveAnnotations();
		}, SAVE_DEBOUNCE_MS);
	}

	// Save annotations to backend
	async function saveAnnotations() {
		if (!imageId || saveStatus === 'saving' || !hasUnsavedChanges) return;

		try {
			saveStatus = 'saving';
			onSaveStatusChange?.(saveStatus);

			// Process new annotations
			const newBoxes = boundingBoxes.filter((box) => box._isNew && !box._isDeleted);
			for (const box of newBoxes) {
				const input = boundingBoxToAnnotationInput(box) as AnnotationCreateInput;
				const result = await client.mutation(CREATE_ANNOTATION, { input }).toPromise();
				const mutationResult = handleMutationResult<AnnotationData>(result, 'createAnnotation');

				if (!mutationResult.success) {
					console.error('Failed to create annotation:', mutationResult.error);
					throw new Error(mutationResult.error || 'Failed to create annotation');
				}

				if (mutationResult.data) {
					// Update local box with backend data
					const backendAnnotation = mutationResult.data;
					Object.assign(box, annotationToBoundingBox(backendAnnotation));
					box._isNew = false;
					box._isDirty = false;
					console.log('Successfully created annotation:', backendAnnotation.id);
				}
			}

			// Process updated annotations
			const updatedBoxes = boundingBoxes.filter(
				(box) => box._isDirty && !box._isNew && !box._isDeleted
			);
			console.log('Updated boxes to save:', updatedBoxes.length, updatedBoxes);
			for (const box of updatedBoxes) {
				const input = boundingBoxToAnnotationInput(box) as AnnotationUpdateInput;
				console.log('Sending update for annotation:', box.id, 'with input:', input);
				const result = await client
					.mutation(UPDATE_ANNOTATION, {
						id: box.id,
						input
					})
					.toPromise();

				const mutationResult = handleMutationResult<AnnotationData>(result, 'updateAnnotation');

				if (!mutationResult.success) {
					console.error('Failed to update annotation:', mutationResult.error);
					throw new Error(mutationResult.error || 'Failed to update annotation');
				}

				if (mutationResult.data) {
					// Update local box with backend data
					const backendAnnotation = mutationResult.data;
					Object.assign(box, annotationToBoundingBox(backendAnnotation));
					box._isDirty = false;
					console.log('Successfully updated annotation:', backendAnnotation.id);
				}
			}

			// Process deleted annotations
			const deletedBoxes = boundingBoxes.filter((box) => box._isDeleted);
			for (const box of deletedBoxes) {
				if (!box._isNew) {
					const result = await client.mutation(DELETE_ANNOTATION, { id: box.id }).toPromise();
					const deleteResult = handleDeleteResult(result, 'deleteAnnotation');

					if (!deleteResult.success) {
						console.error('Failed to delete annotation:', deleteResult.message);
						throw new Error(deleteResult.message);
					}

					console.log('Successfully deleted annotation:', box.id);
				}
			}

			// Remove deleted boxes from local state
			boundingBoxes = boundingBoxes.filter((box) => !box._isDeleted);

			console.log('After save, boundingBoxes:', boundingBoxes.length, boundingBoxes);

			saveStatus = 'saved';
			hasUnsavedChanges = false;
			onSaveStatusChange?.(saveStatus);
			onAnnotationsChange?.(boundingBoxes);

			// Invalidate annotations query cache to ensure parent gets fresh data
			// This is important so the parent component knows about new annotations
			if (imageId) {
				// Delay the cache invalidation slightly to ensure our state is stable
				setTimeout(() => {
					client
						.query(
							GET_ANNOTATIONS_BY_IMAGE,
							{ imageId: imageId },
							{ requestPolicy: 'network-only' }
						)
						.toPromise();
				}, 100);
			}

			// Auto-clear saved status after 2 seconds
			setTimeout(() => {
				if (saveStatus === 'saved') {
					saveStatus = 'idle';
					onSaveStatusChange?.(saveStatus);
				}
			}, 2000);
		} catch (error) {
			console.error('Failed to save annotations:', error);
			saveStatus = 'error';
			onSaveStatusChange?.(saveStatus);

			// Keep error status longer so user can see it
			setTimeout(() => {
				if (saveStatus === 'error') {
					saveStatus = 'idle';
					onSaveStatusChange?.(saveStatus);
				}
			}, 5000);
		}
	}

	// Calculate optimal scaling and positioning to preserve aspect ratio
	function fitImageToCanvas() {
		if (!image || !canvasElement || !image.complete || image.naturalWidth === 0) {
			imageScale = 1;
			imageOffsetX = 0;
			imageOffsetY = 0;
			scaledImageWidth = 0;
			scaledImageHeight = 0;
			return;
		}

		const canvasWidth = actualWidth;
		const canvasHeight = actualHeight;
		const imageWidth = image.naturalWidth;
		const imageHeight = image.naturalHeight;

		// Calculate scale to fit image within canvas while preserving aspect ratio
		const scaleX = canvasWidth / imageWidth;
		const scaleY = canvasHeight / imageHeight;
		const newScale = Math.min(scaleX, scaleY);

		// Calculate scaled dimensions
		const newScaledWidth = imageWidth * newScale;
		const newScaledHeight = imageHeight * newScale;

		// Center the image in the canvas
		const newOffsetX = (canvasWidth - newScaledWidth) / 2;
		const newOffsetY = (canvasHeight - newScaledHeight) / 2;

		// Only update if values have actually changed to prevent infinite loops
		if (
			Math.abs(imageScale - newScale) > 0.001 ||
			Math.abs(imageOffsetX - newOffsetX) > 0.1 ||
			Math.abs(imageOffsetY - newOffsetY) > 0.1
		) {
			imageScale = newScale;
			imageOffsetX = newOffsetX;
			imageOffsetY = newOffsetY;
			scaledImageWidth = newScaledWidth;
			scaledImageHeight = newScaledHeight;

			// Invalidate static cache when dimensions change
			staticElementsCached = false;
			cacheStaticElements();
		}
	}

	// Convert canvas coordinates to image coordinates (for saving annotations)
	function canvasToImageCoords(canvasX: number, canvasY: number): { x: number; y: number } {
		if (!image) return { x: canvasX, y: canvasY };

		// Translate to image space
		const imageX = (canvasX - imageOffsetX) / imageScale;
		const imageY = (canvasY - imageOffsetY) / imageScale;

		// Clamp to image bounds
		return {
			x: Math.max(0, Math.min(image.naturalWidth, imageX)),
			y: Math.max(0, Math.min(image.naturalHeight, imageY))
		};
	}

	// Convert image coordinates to canvas coordinates (for displaying annotations)
	function imageToCanvasCoords(imageX: number, imageY: number): { x: number; y: number } {
		return {
			x: imageX * imageScale + imageOffsetX,
			y: imageY * imageScale + imageOffsetY
		};
	}

	// Check if a point is within the visible image area
	function isPointInImageArea(canvasX: number, canvasY: number): boolean {
		return (
			canvasX >= imageOffsetX &&
			canvasX <= imageOffsetX + scaledImageWidth &&
			canvasY >= imageOffsetY &&
			canvasY <= imageOffsetY + scaledImageHeight
		);
	}

	// Export functions for external control
	export function deleteAnnotationById(id: string) {
		const box = boundingBoxes.find((b) => b.id === id);
		if (box) {
			box._isDeleted = true;
			markAsUnsaved(); // Mark as unsaved and debounce save
		}
		if (selectedBoxId === id) {
			selectedBoxId = null;
		}
		drawCanvas();
	}

	export function selectAnnotationById(id: string) {
		selectedBoxId = id;
		drawCanvas();
	}

	export function setMode(newMode: 'select' | 'draw') {
		mode = newMode;
	}

	export function getMode() {
		return mode;
	}

	function handleKeyDown(event: KeyboardEvent) {
		// Handle Ctrl+S or Cmd+S for manual save
		if ((event.ctrlKey || event.metaKey) && event.key === 's') {
			event.preventDefault();
			if (hasUnsavedChanges) {
				if (saveDebounceTimer) {
					clearTimeout(saveDebounceTimer);
				}
				saveAnnotations();
			}
		} else if (event.key === 'Delete' && selectedBoxId) {
			boundingBoxes = boundingBoxes.filter((box) => box.id !== selectedBoxId);
			selectedBoxId = null;
			markAsUnsaved(); // Mark as unsaved and debounce save
			drawCanvas();
		} else if (event.key === 'Escape') {
			selectedBoxId = null;
			drawCanvas();
		} else if (event.key === 's' || event.key === 'S') {
			mode = 'select';
		} else if (event.key === 'd' || event.key === 'D') {
			mode = 'draw';
		}
	}

	// Handle responsive sizing
	function updateCanvasSize() {
		if (!responsive || !canvasContainer) return;

		const containerRect = canvasContainer.getBoundingClientRect();
		const newWidth = containerRect.width;
		const newHeight = containerRect.height;

		if (newWidth !== actualWidth || newHeight !== actualHeight) {
			actualWidth = newWidth;
			actualHeight = newHeight;

			if (canvasElement) {
				canvasElement.width = actualWidth;
				canvasElement.height = actualHeight;

				// Update offscreen canvas size
				if (offscreenCanvas) {
					offscreenCanvas.width = actualWidth;
					offscreenCanvas.height = actualHeight;
				}

				// Recalculate image fitting
				fitImageToCanvas();
				staticElementsCached = false;
				cacheStaticElements();
				drawCanvas();
			}
		}
	}

	onMount(() => {
		if (canvasElement) {
			ctx = canvasElement.getContext('2d');

			// Set initial canvas size
			if (responsive && canvasContainer) {
				updateCanvasSize();
			} else {
				actualWidth = width;
				actualHeight = height;
				canvasElement.width = actualWidth;
				canvasElement.height = actualHeight;
			}

			// Create offscreen canvas for caching
			offscreenCanvas = document.createElement('canvas');
			offscreenCanvas.width = actualWidth;
			offscreenCanvas.height = actualHeight;
			offscreenCtx = offscreenCanvas.getContext('2d');

			loadImage();
		}

		// Add keyboard event listener
		window.addEventListener('keydown', handleKeyDown);

		// Add resize listener for responsive mode
		if (responsive) {
			const resizeObserver = new ResizeObserver(() => {
				updateCanvasSize();
			});

			if (canvasContainer) {
				resizeObserver.observe(canvasContainer);
			}

			return () => {
				window.removeEventListener('keydown', handleKeyDown);
				resizeObserver.disconnect();
				if (rafId) {
					cancelAnimationFrame(rafId);
				}
			};
		} else {
			return () => {
				window.removeEventListener('keydown', handleKeyDown);
				if (rafId) {
					cancelAnimationFrame(rafId);
				}
			};
		}
	});

	function loadImage() {
		if (!imageUrl || !ctx) return;

		image = new Image();
		image.crossOrigin = 'anonymous';
		image.onload = () => {
			fitImageToCanvas();
			staticElementsCached = false; // Invalidate cache
			cacheStaticElements(); // Re-cache with new image
			drawCanvas();
		};
		image.onerror = () => {
			console.warn('Failed to load image:', imageUrl);
			// Create a placeholder when image fails
			drawPlaceholder();
		};
		image.src = imageUrl;
	}

	function drawPlaceholder() {
		if (!ctx || !canvasElement) return;

		// Clear canvas
		ctx.clearRect(0, 0, actualWidth, actualHeight);

		// Draw placeholder background
		ctx.fillStyle = '#f3f4f6';
		ctx.fillRect(0, 0, actualWidth, actualHeight);

		// Draw placeholder text
		ctx.fillStyle = '#9ca3af';
		ctx.font = '16px sans-serif';
		ctx.textAlign = 'center';
		ctx.fillText('Image failed to load', actualWidth / 2, actualHeight / 2);

		// Reset text align for other operations
		ctx.textAlign = 'left';
	}

	// Cache static elements (background, image) to offscreen canvas
	function cacheStaticElements() {
		if (!offscreenCtx || !offscreenCanvas) return;

		// Clear offscreen canvas
		offscreenCtx.fillStyle = '#f8f9fa';
		offscreenCtx.fillRect(0, 0, actualWidth, actualHeight);

		// Draw checkerboard pattern
		drawCheckerboardPatternToContext(offscreenCtx);

		// Draw image if loaded
		if (image && image.complete && image.naturalWidth > 0) {
			offscreenCtx.drawImage(
				image,
				imageOffsetX,
				imageOffsetY,
				scaledImageWidth,
				scaledImageHeight
			);

			// Draw subtle border around image
			offscreenCtx.strokeStyle = '#e5e7eb';
			offscreenCtx.lineWidth = 1;
			offscreenCtx.strokeRect(
				imageOffsetX - 0.5,
				imageOffsetY - 0.5,
				scaledImageWidth + 1,
				scaledImageHeight + 1
			);
		} else {
			// Draw placeholder
			offscreenCtx.fillStyle = '#f3f4f6';
			offscreenCtx.fillRect(
				imageOffsetX,
				imageOffsetY,
				scaledImageWidth || 400,
				scaledImageHeight || 300
			);

			offscreenCtx.fillStyle = '#9ca3af';
			offscreenCtx.font = '16px sans-serif';
			offscreenCtx.textAlign = 'center';
			offscreenCtx.fillText('Loading image...', actualWidth / 2, actualHeight / 2);
			offscreenCtx.textAlign = 'left';
		}

		staticElementsCached = true;
	}

	function drawCanvas() {
		if (!ctx || !canvasElement) return;

		// Use cached static elements if available
		if (staticElementsCached && offscreenCanvas) {
			ctx.drawImage(offscreenCanvas, 0, 0);
		} else {
			// Fallback to direct drawing
			ctx.fillStyle = '#f8f9fa';
			ctx.fillRect(0, 0, actualWidth, actualHeight);

			drawCheckerboardPattern();

			if (image && image.complete && image.naturalWidth > 0) {
				ctx.drawImage(image, imageOffsetX, imageOffsetY, scaledImageWidth, scaledImageHeight);

				ctx.strokeStyle = '#e5e7eb';
				ctx.lineWidth = 1;
				ctx.strokeRect(
					imageOffsetX - 0.5,
					imageOffsetY - 0.5,
					scaledImageWidth + 1,
					scaledImageHeight + 1
				);
			} else {
				ctx.fillStyle = '#f3f4f6';
				ctx.fillRect(imageOffsetX, imageOffsetY, scaledImageWidth || 400, scaledImageHeight || 300);

				ctx.fillStyle = '#9ca3af';
				ctx.font = '16px sans-serif';
				ctx.textAlign = 'center';
				ctx.fillText('Loading image...', actualWidth / 2, actualHeight / 2);
				ctx.textAlign = 'left';
			}
		}

		// Draw saved bounding boxes (convert from image to canvas coordinates)
		boundingBoxes.forEach((box) => {
			// Convert image coordinates to canvas coordinates for display
			const topLeft = imageToCanvasCoords(box.x, box.y);
			const bottomRight = imageToCanvasCoords(box.x + box.width, box.y + box.height);

			const canvasX = topLeft.x;
			const canvasY = topLeft.y;
			const canvasWidth = bottomRight.x - topLeft.x;
			const canvasHeight = bottomRight.y - topLeft.y;

			const isSelected = box.id === selectedBoxId;
			ctx!.strokeStyle = isSelected ? '#f59e0b' : '#3b82f6';
			ctx!.lineWidth = isSelected ? 3 : 2;
			ctx!.strokeRect(canvasX, canvasY, canvasWidth, canvasHeight);

			// Draw selection handles for selected box
			if (isSelected) {
				const handleSize = 8;
				ctx!.fillStyle = '#f59e0b';
				ctx!.strokeStyle = '#fff';
				ctx!.lineWidth = 1;

				// Corner handles with white border for visibility
				const handles = [
					{ x: canvasX, y: canvasY }, // top-left
					{ x: canvasX + canvasWidth, y: canvasY }, // top-right
					{ x: canvasX, y: canvasY + canvasHeight }, // bottom-left
					{ x: canvasX + canvasWidth, y: canvasY + canvasHeight } // bottom-right
				];

				handles.forEach((handle) => {
					ctx!.fillRect(
						handle.x - handleSize / 2,
						handle.y - handleSize / 2,
						handleSize,
						handleSize
					);
					ctx!.strokeRect(
						handle.x - handleSize / 2,
						handle.y - handleSize / 2,
						handleSize,
						handleSize
					);
				});
			}
		});
	}

	// Draw checkerboard pattern for areas outside image
	function drawCheckerboardPattern() {
		if (!ctx || !canvasElement) return;
		drawCheckerboardPatternToContext(ctx);
	}

	function drawCheckerboardPatternToContext(context: CanvasRenderingContext2D) {
		const squareSize = 16;
		const lightColor = '#ffffff';
		const darkColor = '#f5f5f5';

		for (let x = 0; x < actualWidth; x += squareSize) {
			for (let y = 0; y < actualHeight; y += squareSize) {
				// Skip if this square is within the image area
				if (
					x + squareSize > imageOffsetX &&
					x < imageOffsetX + scaledImageWidth &&
					y + squareSize > imageOffsetY &&
					y < imageOffsetY + scaledImageHeight
				) {
					continue;
				}

				const isEvenSquare = (x / squareSize + y / squareSize) % 2 === 0;
				context.fillStyle = isEvenSquare ? lightColor : darkColor;
				context.fillRect(x, y, squareSize, squareSize);
			}
		}
	}

	function isPointInBox(imageX: number, imageY: number, box: BoundingBox): boolean {
		return (
			imageX >= box.x &&
			imageX <= box.x + box.width &&
			imageY >= box.y &&
			imageY <= box.y + box.height
		);
	}

	function findBoxAtPoint(canvasX: number, canvasY: number): BoundingBox | null {
		// Convert canvas coordinates to image coordinates
		const imageCoords = canvasToImageCoords(canvasX, canvasY);

		for (let i = boundingBoxes.length - 1; i >= 0; i--) {
			if (isPointInBox(imageCoords.x, imageCoords.y, boundingBoxes[i])) {
				return boundingBoxes[i];
			}
		}
		return null;
	}

	function getHandleAtPoint(
		canvasX: number,
		canvasY: number,
		box: BoundingBox
	): 'tl' | 'tr' | 'bl' | 'br' | null {
		const tolerance = 15; // Tolerance in canvas pixels

		// Convert box corners from image to canvas coordinates
		const topLeft = imageToCanvasCoords(box.x, box.y);
		const bottomRight = imageToCanvasCoords(box.x + box.width, box.y + box.height);

		// Calculate distances to all corners in canvas space
		const corners = [
			{ handle: 'tl', x: topLeft.x, y: topLeft.y },
			{ handle: 'tr', x: bottomRight.x, y: topLeft.y },
			{ handle: 'bl', x: topLeft.x, y: bottomRight.y },
			{ handle: 'br', x: bottomRight.x, y: bottomRight.y }
		] as const;

		let closestHandle = null;
		let minDistance = tolerance;

		for (const corner of corners) {
			const distance = Math.sqrt(Math.pow(canvasX - corner.x, 2) + Math.pow(canvasY - corner.y, 2));

			if (distance <= minDistance) {
				minDistance = distance;
				closestHandle = corner.handle;
			}
		}

		return closestHandle;
	}

	function handleMouseDown(event: MouseEvent) {
		if (!canvasElement) return;

		const rect = canvasElement.getBoundingClientRect();
		const canvasX = event.clientX - rect.left;
		const canvasY = event.clientY - rect.top;

		// Only allow interactions within the image area
		if (!isPointInImageArea(canvasX, canvasY)) {
			selectedBoxId = null;
			drawCanvas();
			return;
		}

		if (mode === 'select') {
			// Select mode: handle selection, move, and resize
			const clickedBox = findBoxAtPoint(canvasX, canvasY);
			const currentTime = Date.now();

			if (clickedBox && clickedBox.id === selectedBoxId) {
				// Check for double-click (within 300ms of last click on same box)
				if (lastClickedBoxId === clickedBox.id && currentTime - lastClickTime < 300) {
					onDoubleClickAnnotation?.(clickedBox.id);
					return;
				}

				// Check if clicking on a resize handle
				const handle = getHandleAtPoint(canvasX, canvasY, clickedBox);
				if (handle) {
					isResizing = true;
					dragHandle = handle;
					startX = canvasX;
					startY = canvasY;
					originalBox = { ...clickedBox }; // Store original dimensions
					return;
				}

				// Start dragging the box
				isDragging = true;
				startX = canvasX;
				startY = canvasY;
				const boxCanvasCoords = imageToCanvasCoords(clickedBox.x, clickedBox.y);
				dragOffset = {
					x: canvasX - boxCanvasCoords.x,
					y: canvasY - boxCanvasCoords.y
				};
			}

			if (clickedBox) {
				// Update click tracking
				lastClickTime = currentTime;
				lastClickedBoxId = clickedBox.id;

				selectedBoxId = clickedBox.id;
				drawCanvas();
				return;
			}

			// Click on empty area - deselect
			selectedBoxId = null;
			drawCanvas();
		} else if (mode === 'draw') {
			// Draw mode: only create new boxes
			selectedBoxId = null;
			startX = canvasX;
			startY = canvasY;
			isDrawing = true;
		}
	}

	function scheduleCanvasUpdate() {
		if (!pendingCanvasUpdate) {
			pendingCanvasUpdate = true;
			rafId = requestAnimationFrame(() => {
				drawCanvas();
				pendingCanvasUpdate = false;
			});
		}
	}

	function handleMouseMove(event: MouseEvent) {
		if (!ctx || !canvasElement) return;

		// Throttle mouse move events
		const now = Date.now();
		if (now - lastMouseMoveTime < MOUSE_THROTTLE_MS) {
			return;
		}
		lastMouseMoveTime = now;

		const rect = canvasElement.getBoundingClientRect();
		const canvasX = event.clientX - rect.left;
		const canvasY = event.clientY - rect.top;

		if (isResizing && selectedBoxId && dragHandle && originalBox) {
			// Handle box resizing - work in canvas coordinates but convert deltas to image space
			const selectedBox = boundingBoxes.find((box) => box.id === selectedBoxId);
			if (selectedBox) {
				// Calculate canvas deltas
				const canvasDeltaX = canvasX - startX;
				const canvasDeltaY = canvasY - startY;

				// Convert deltas to image space
				const imageDeltaX = canvasDeltaX / imageScale;
				const imageDeltaY = canvasDeltaY / imageScale;

				const minSize = 10; // Minimum size in image pixels

				switch (dragHandle) {
					case 'tl':
						selectedBox.x = Math.min(
							originalBox.x + imageDeltaX,
							originalBox.x + originalBox.width - minSize
						);
						selectedBox.y = Math.min(
							originalBox.y + imageDeltaY,
							originalBox.y + originalBox.height - minSize
						);
						selectedBox.width = Math.max(minSize, originalBox.width - imageDeltaX);
						selectedBox.height = Math.max(minSize, originalBox.height - imageDeltaY);
						break;
					case 'tr':
						selectedBox.y = Math.min(
							originalBox.y + imageDeltaY,
							originalBox.y + originalBox.height - minSize
						);
						selectedBox.width = Math.max(minSize, originalBox.width + imageDeltaX);
						selectedBox.height = Math.max(minSize, originalBox.height - imageDeltaY);
						break;
					case 'bl':
						selectedBox.x = Math.min(
							originalBox.x + imageDeltaX,
							originalBox.x + originalBox.width - minSize
						);
						selectedBox.width = Math.max(minSize, originalBox.width - imageDeltaX);
						selectedBox.height = Math.max(minSize, originalBox.height + imageDeltaY);
						break;
					case 'br':
						selectedBox.width = Math.max(minSize, originalBox.width + imageDeltaX);
						selectedBox.height = Math.max(minSize, originalBox.height + imageDeltaY);
						break;
				}

				// Clamp to image bounds
				if (image) {
					selectedBox.x = Math.max(
						0,
						Math.min(selectedBox.x, image.naturalWidth - selectedBox.width)
					);
					selectedBox.y = Math.max(
						0,
						Math.min(selectedBox.y, image.naturalHeight - selectedBox.height)
					);
					selectedBox.width = Math.min(selectedBox.width, image.naturalWidth - selectedBox.x);
					selectedBox.height = Math.min(selectedBox.height, image.naturalHeight - selectedBox.y);
				}

				// Mark as dirty immediately when modifying
				if (!selectedBox._isNew) {
					selectedBox._isDirty = true;
				}
				markAsUnsaved();

				scheduleCanvasUpdate();
			}
		} else if (isDragging && selectedBoxId) {
			// Handle box moving - convert canvas coordinates to image coordinates
			const selectedBox = boundingBoxes.find((box) => box.id === selectedBoxId);
			if (selectedBox) {
				const imageCoords = canvasToImageCoords(canvasX - dragOffset.x, canvasY - dragOffset.y);

				// Clamp to image bounds
				if (image) {
					selectedBox.x = Math.max(
						0,
						Math.min(imageCoords.x, image.naturalWidth - selectedBox.width)
					);
					selectedBox.y = Math.max(
						0,
						Math.min(imageCoords.y, image.naturalHeight - selectedBox.height)
					);
				} else {
					selectedBox.x = imageCoords.x;
					selectedBox.y = imageCoords.y;
				}

				// Mark as dirty immediately when modifying
				if (!selectedBox._isNew) {
					selectedBox._isDirty = true;
				}
				markAsUnsaved();

				scheduleCanvasUpdate();
			}
		} else if (isDrawing) {
			// Handle new box drawing - draw in canvas coordinates but will be converted when saved
			drawCanvas();

			// Draw current box being drawn in canvas coordinates
			ctx.strokeStyle = '#ef4444';
			ctx.lineWidth = 2;
			ctx.setLineDash([5, 5]);
			ctx.strokeRect(startX, startY, canvasX - startX, canvasY - startY);
			ctx.setLineDash([]);
		}
	}

	function handleMouseUp(event: MouseEvent) {
		if (isDrawing && canvasElement) {
			const rect = canvasElement.getBoundingClientRect();
			const canvasEndX = event.clientX - rect.left;
			const canvasEndY = event.clientY - rect.top;

			const canvasWidth = canvasEndX - startX;
			const canvasHeight = canvasEndY - startY;

			// Only add box if it has meaningful size in canvas coordinates
			if (Math.abs(canvasWidth) > 10 && Math.abs(canvasHeight) > 10) {
				// Convert canvas coordinates to image coordinates
				const startImageCoords = canvasToImageCoords(startX, startY);
				const endImageCoords = canvasToImageCoords(canvasEndX, canvasEndY);

				const imageX = Math.min(startImageCoords.x, endImageCoords.x);
				const imageY = Math.min(startImageCoords.y, endImageCoords.y);
				const imageWidth = Math.abs(endImageCoords.x - startImageCoords.x);
				const imageHeight = Math.abs(endImageCoords.y - startImageCoords.y);

				// Only create if the box is within image bounds and has meaningful size
				if (imageWidth > 5 && imageHeight > 5 && image) {
					const clampedX = Math.max(0, Math.min(imageX, image.naturalWidth - imageWidth));
					const clampedY = Math.max(0, Math.min(imageY, image.naturalHeight - imageHeight));
					const clampedWidth = Math.min(imageWidth, image.naturalWidth - clampedX);
					const clampedHeight = Math.min(imageHeight, image.naturalHeight - clampedY);

					const now = new Date().toISOString();
					const newBox: BoundingBox = {
						id: `temp_${crypto.randomUUID()}`, // Temporary ID until saved to backend
						x: clampedX,
						y: clampedY,
						width: clampedWidth,
						height: clampedHeight,
						description: '',
						tags: [],
						createdAt: now,
						updatedAt: now,
						_isNew: true,
						_isDirty: true
					};
					boundingBoxes.push(newBox);
					selectedBoxId = newBox.id;
					markAsUnsaved(); // Mark as unsaved and debounce save
				}
			}
		}

		// Mark annotations as dirty after any modification
		if (isResizing || isDragging) {
			// Update timestamp and mark as dirty for modified box
			const modifiedBox = boundingBoxes.find((box) => box.id === selectedBoxId);
			if (modifiedBox) {
				console.log('Marking annotation as dirty:', modifiedBox.id, '_isNew:', modifiedBox._isNew);
				modifiedBox.updatedAt = new Date().toISOString();
				modifiedBox._isDirty = true;
				markAsUnsaved(); // Mark as unsaved and debounce save
			}
		}

		// Reset all interaction states
		isDrawing = false;
		isResizing = false;
		isDragging = false;
		dragHandle = null;
		originalBox = null;

		drawCanvas();
	}

	// Track if initial annotations have been loaded to prevent infinite loops
	let hasLoadedInitial = false;

	// Track the last processed initialAnnotations to prevent infinite loops
	let lastProcessedAnnotations = $state<string>('');

	// Load initial annotations when they change
	$effect(() => {
		// Only react to changes in initialAnnotations
		if (!initialAnnotations) return;

		// Create a simple hash to detect real changes
		const annotationsHash = JSON.stringify(initialAnnotations.map((a) => a.id).sort());
		if (annotationsHash === lastProcessedAnnotations && hasLoadedInitial) {
			return; // No real change, skip processing
		}

		const newAnnotations = initialAnnotations.map(annotationToBoundingBox);

		console.log(
			'Effect running - saveStatus:',
			saveStatus,
			'initialAnnotations:',
			initialAnnotations.length,
			'boundingBoxes:',
			boundingBoxes.length
		);

		// Skip update if we're currently saving or just saved (to avoid conflicts)
		if (saveStatus === 'saving' || saveStatus === 'saved') {
			console.log('Skipping effect update due to saveStatus:', saveStatus);
			return;
		}

		// If this is the initial load, just set the annotations
		if (!hasLoadedInitial) {
			console.log('Initial load - setting boundingBoxes to:', newAnnotations.length, 'annotations');
			boundingBoxes = newAnnotations;
			hasLoadedInitial = true;
			lastProcessedAnnotations = annotationsHash;
			// Don't call onAnnotationsChange here as it might trigger the effect again
			return;
		}

		// For subsequent updates, only update if backend has new data
		if (newAnnotations.length > 0) {
			console.log('Updating from backend:', newAnnotations.length, 'annotations');
			boundingBoxes = newAnnotations;
			lastProcessedAnnotations = annotationsHash;
		}
	});

	$effect(() => {
		if (imageUrl && ctx) {
			loadImage();
		}
	});

	// Cleanup effect for pending saves
	$effect(() => {
		return () => {
			// Save any pending changes on unmount
			if (saveDebounceTimer) {
				clearTimeout(saveDebounceTimer);
				if (hasUnsavedChanges) {
					saveAnnotations();
				}
			}
		};
	});
</script>

<div bind:this={canvasContainer} class={responsive ? 'h-full w-full' : 'relative'}>
	<canvas
		bind:this={canvasElement}
		width={actualWidth}
		height={actualHeight}
		class="border border-gray-300 bg-white {mode === 'draw'
			? 'cursor-crosshair'
			: 'cursor-default'} {responsive ? 'h-full w-full' : ''}"
		onmousedown={handleMouseDown}
		onmousemove={handleMouseMove}
		onmouseup={handleMouseUp}
	>
		Your browser does not support the HTML5 canvas element.
	</canvas>
</div>
