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

	interface Props {
		imageUrl: string;
		imageId?: string;
		initialAnnotations?: AnnotationData[];
		width?: number;
		height?: number;
		onAnnotationsChange?: (annotations: BoundingBox[]) => void;
		onSaveStatusChange?: (status: 'idle' | 'saving' | 'saved' | 'error') => void;
	}

	interface BoundingBox {
		id: string;
		x: number;
		y: number;
		width: number;
		height: number;
		description?: string;
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
		onAnnotationsChange,
		onSaveStatusChange
	}: Props = $props();

	// GraphQL client for backend operations
	const client = getContextClient();

	let canvasElement: HTMLCanvasElement | undefined = $state();
	let ctx: CanvasRenderingContext2D | null = null;
	let image: HTMLImageElement | null = null;

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

	// Convert backend annotation to frontend bounding box
	function annotationToBoundingBox(annotation: AnnotationData): BoundingBox {
		return {
			id: annotation.id,
			x: annotation.boundingBox.x,
			y: annotation.boundingBox.y,
			width: annotation.boundingBox.width,
			height: annotation.boundingBox.height,
			description: annotation.description,
			confidence: annotation.confidence,
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

	// Save annotations to backend
	async function saveAnnotations() {
		if (!imageId || saveStatus === 'saving') return;

		try {
			saveStatus = 'saving';
			onSaveStatusChange?.(saveStatus);

			// Process new annotations
			const newBoxes = boundingBoxes.filter((box) => box._isNew && !box._isDeleted);
			for (const box of newBoxes) {
				const input = boundingBoxToAnnotationInput(box) as AnnotationCreateInput;
				const result = await client.mutation(CREATE_ANNOTATION, { input }).toPromise();

				if (result.error) {
					console.error('Failed to create annotation:', result.error);
					throw new Error(`Failed to create annotation: ${result.error.message}`);
				}

				if (result.data?.createAnnotation) {
					// Update local box with backend data
					const backendAnnotation = result.data.createAnnotation;
					Object.assign(box, annotationToBoundingBox(backendAnnotation));
					box._isNew = false;
					box._isDirty = false;
					console.log('Successfully created annotation:', backendAnnotation.id);
				} else {
					throw new Error('Create annotation returned no data');
				}
			}

			// Process updated annotations
			const updatedBoxes = boundingBoxes.filter(
				(box) => box._isDirty && !box._isNew && !box._isDeleted
			);
			console.log('Updated boxes to save:', updatedBoxes.length, updatedBoxes);
			for (const box of updatedBoxes) {
				const input = boundingBoxToAnnotationInput(box) as AnnotationUpdateInput;
				const result = await client
					.mutation(UPDATE_ANNOTATION, {
						id: box.id,
						input
					})
					.toPromise();

				if (result.error) {
					console.error('Failed to update annotation:', result.error);
					throw new Error(`Failed to update annotation: ${result.error.message}`);
				}

				if (result.data?.updateAnnotation) {
					// Update local box with backend data
					const backendAnnotation = result.data.updateAnnotation;
					Object.assign(box, annotationToBoundingBox(backendAnnotation));
					box._isDirty = false;
					console.log('Successfully updated annotation:', backendAnnotation.id);
				} else {
					throw new Error('Update annotation returned no data');
				}
			}

			// Process deleted annotations
			const deletedBoxes = boundingBoxes.filter((box) => box._isDeleted);
			for (const box of deletedBoxes) {
				if (!box._isNew) {
					const result = await client.mutation(DELETE_ANNOTATION, { id: box.id }).toPromise();

					if (result.error) {
						console.error('Failed to delete annotation:', result.error);
						throw new Error(`Failed to delete annotation: ${result.error.message}`);
					}

					if (!result.data?.deleteAnnotation) {
						throw new Error('Delete annotation failed');
					}

					console.log('Successfully deleted annotation:', box.id);
				}
			}

			// Remove deleted boxes from local state
			boundingBoxes = boundingBoxes.filter((box) => !box._isDeleted);

			saveStatus = 'saved';
			onSaveStatusChange?.(saveStatus);
			onAnnotationsChange?.(boundingBoxes);

			// Invalidate annotations query cache to ensure fresh data on refresh
			if (imageId) {
				// Force cache invalidation by making a network-only query
				client
					.query(GET_ANNOTATIONS_BY_IMAGE, { imageId: imageId }, { requestPolicy: 'network-only' })
					.toPromise();
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

	// Export functions for external control
	export function deleteAnnotationById(id: string) {
		const box = boundingBoxes.find((b) => b.id === id);
		if (box) {
			box._isDeleted = true;
			saveAnnotations(); // Save immediately on deletion
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

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Delete' && selectedBoxId) {
			boundingBoxes = boundingBoxes.filter((box) => box.id !== selectedBoxId);
			selectedBoxId = null;
			saveAnnotations(); // Save after deletion
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

	onMount(() => {
		if (canvasElement) {
			ctx = canvasElement.getContext('2d');
			loadImage();
		}

		// Add keyboard event listener
		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	});

	function loadImage() {
		if (!imageUrl || !ctx) return;

		image = new Image();
		image.crossOrigin = 'anonymous';
		image.onload = () => {
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
		ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

		// Draw placeholder background
		ctx.fillStyle = '#f3f4f6';
		ctx.fillRect(0, 0, canvasElement.width, canvasElement.height);

		// Draw placeholder text
		ctx.fillStyle = '#9ca3af';
		ctx.font = '16px sans-serif';
		ctx.textAlign = 'center';
		ctx.fillText('Image failed to load', canvasElement.width / 2, canvasElement.height / 2);

		// Reset text align for other operations
		ctx.textAlign = 'left';
	}

	function drawCanvas() {
		if (!ctx || !canvasElement) return;

		// Clear canvas
		ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

		// Draw image if loaded successfully, otherwise show placeholder
		if (image && image.complete && image.naturalWidth > 0) {
			ctx.drawImage(image, 0, 0, canvasElement.width, canvasElement.height);
		} else {
			// Draw placeholder background
			ctx.fillStyle = '#f3f4f6';
			ctx.fillRect(0, 0, canvasElement.width, canvasElement.height);

			// Draw placeholder text
			ctx.fillStyle = '#9ca3af';
			ctx.font = '16px sans-serif';
			ctx.textAlign = 'center';
			ctx.fillText('Loading image...', canvasElement.width / 2, canvasElement.height / 2);
			ctx.textAlign = 'left';
		}

		// Draw saved bounding boxes
		boundingBoxes.forEach((box) => {
			const isSelected = box.id === selectedBoxId;
			ctx!.strokeStyle = isSelected ? '#f59e0b' : '#3b82f6';
			ctx!.lineWidth = isSelected ? 3 : 2;
			ctx!.strokeRect(box.x, box.y, box.width, box.height);

			// Draw selection handles for selected box
			if (isSelected) {
				const handleSize = 8; // Make handles larger for easier clicking
				ctx!.fillStyle = '#f59e0b';
				ctx!.strokeStyle = '#fff';
				ctx!.lineWidth = 1;

				// Corner handles with white border for visibility
				const handles = [
					{ x: box.x, y: box.y }, // top-left
					{ x: box.x + box.width, y: box.y }, // top-right
					{ x: box.x, y: box.y + box.height }, // bottom-left
					{ x: box.x + box.width, y: box.y + box.height } // bottom-right
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

	function isPointInBox(x: number, y: number, box: BoundingBox): boolean {
		return x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height;
	}

	function findBoxAtPoint(x: number, y: number): BoundingBox | null {
		for (let i = boundingBoxes.length - 1; i >= 0; i--) {
			if (isPointInBox(x, y, boundingBoxes[i])) {
				return boundingBoxes[i];
			}
		}
		return null;
	}

	function getHandleAtPoint(
		x: number,
		y: number,
		box: BoundingBox
	): 'tl' | 'tr' | 'bl' | 'br' | null {
		const tolerance = 15; // Much larger tolerance for easier clicking

		// Calculate distances to all corners
		const corners = [
			{ handle: 'tl', x: box.x, y: box.y },
			{ handle: 'tr', x: box.x + box.width, y: box.y },
			{ handle: 'bl', x: box.x, y: box.y + box.height },
			{ handle: 'br', x: box.x + box.width, y: box.y + box.height }
		] as const;

		let closestHandle = null;
		let minDistance = tolerance;

		for (const corner of corners) {
			const distance = Math.sqrt(Math.pow(x - corner.x, 2) + Math.pow(y - corner.y, 2));

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
		const clickX = event.clientX - rect.left;
		const clickY = event.clientY - rect.top;

		if (mode === 'select') {
			// Select mode: handle selection, move, and resize
			const clickedBox = findBoxAtPoint(clickX, clickY);
			if (clickedBox && clickedBox.id === selectedBoxId) {
				// Check if clicking on a resize handle
				const handle = getHandleAtPoint(clickX, clickY, clickedBox);
				if (handle) {
					isResizing = true;
					dragHandle = handle;
					startX = clickX;
					startY = clickY;
					originalBox = { ...clickedBox }; // Store original dimensions
					return;
				}

				// Start dragging the box
				isDragging = true;
				startX = clickX;
				startY = clickY;
				dragOffset = {
					x: clickX - clickedBox.x,
					y: clickY - clickedBox.y
				};
				return;
			}

			if (clickedBox) {
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
			startX = clickX;
			startY = clickY;
			isDrawing = true;
		}
	}

	function handleMouseMove(event: MouseEvent) {
		if (!ctx || !canvasElement) return;

		const rect = canvasElement.getBoundingClientRect();
		const currentX = event.clientX - rect.left;
		const currentY = event.clientY - rect.top;

		if (isResizing && selectedBoxId && dragHandle && originalBox) {
			// Handle box resizing
			const selectedBox = boundingBoxes.find((box) => box.id === selectedBoxId);
			if (selectedBox) {
				const deltaX = currentX - startX;
				const deltaY = currentY - startY;

				switch (dragHandle) {
					case 'tl':
						selectedBox.x = Math.min(
							originalBox.x + deltaX,
							originalBox.x + originalBox.width - 10
						);
						selectedBox.y = Math.min(
							originalBox.y + deltaY,
							originalBox.y + originalBox.height - 10
						);
						selectedBox.width = Math.max(10, originalBox.width - deltaX);
						selectedBox.height = Math.max(10, originalBox.height - deltaY);
						break;
					case 'tr':
						selectedBox.y = Math.min(
							originalBox.y + deltaY,
							originalBox.y + originalBox.height - 10
						);
						selectedBox.width = Math.max(10, originalBox.width + deltaX);
						selectedBox.height = Math.max(10, originalBox.height - deltaY);
						break;
					case 'bl':
						selectedBox.x = Math.min(
							originalBox.x + deltaX,
							originalBox.x + originalBox.width - 10
						);
						selectedBox.width = Math.max(10, originalBox.width - deltaX);
						selectedBox.height = Math.max(10, originalBox.height + deltaY);
						break;
					case 'br':
						selectedBox.width = Math.max(10, originalBox.width + deltaX);
						selectedBox.height = Math.max(10, originalBox.height + deltaY);
						break;
				}

				drawCanvas();
			}
		} else if (isDragging && selectedBoxId) {
			// Handle box moving
			const selectedBox = boundingBoxes.find((box) => box.id === selectedBoxId);
			if (selectedBox) {
				selectedBox.x = currentX - dragOffset.x;
				selectedBox.y = currentY - dragOffset.y;
				drawCanvas();
			}
		} else if (isDrawing) {
			// Handle new box drawing
			drawCanvas();

			// Draw current box being drawn
			ctx.strokeStyle = '#ef4444';
			ctx.lineWidth = 2;
			ctx.setLineDash([5, 5]);
			ctx.strokeRect(startX, startY, currentX - startX, currentY - startY);
			ctx.setLineDash([]);
		}
	}

	function handleMouseUp(event: MouseEvent) {
		if (isDrawing && canvasElement) {
			const rect = canvasElement.getBoundingClientRect();
			const endX = event.clientX - rect.left;
			const endY = event.clientY - rect.top;

			const boxWidth = endX - startX;
			const boxHeight = endY - startY;

			// Only add box if it has meaningful size
			if (Math.abs(boxWidth) > 10 && Math.abs(boxHeight) > 10) {
				const now = new Date().toISOString();
				const newBox: BoundingBox = {
					id: `temp_${crypto.randomUUID()}`, // Temporary ID until saved to backend
					x: Math.min(startX, endX),
					y: Math.min(startY, endY),
					width: Math.abs(boxWidth),
					height: Math.abs(boxHeight),
					description: '',
					createdAt: now,
					updatedAt: now,
					_isNew: true,
					_isDirty: true
				};
				boundingBoxes.push(newBox);
				selectedBoxId = newBox.id;
				saveAnnotations(); // Save immediately on creation
			}
		}

		// Mark annotations as dirty after any modification and save immediately (before resetting flags)
		if (isResizing || isDragging) {
			// Update timestamp and mark as dirty for modified box
			const modifiedBox = boundingBoxes.find((box) => box.id === selectedBoxId);
			if (modifiedBox) {
				console.log('Marking annotation as dirty:', modifiedBox.id, '_isNew:', modifiedBox._isNew);
				modifiedBox.updatedAt = new Date().toISOString();
				modifiedBox._isDirty = true;
				saveAnnotations(); // Save immediately on modification
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

	// Load initial annotations when they change
	$effect(() => {
		const newAnnotations = initialAnnotations.map(annotationToBoundingBox);

		// Skip update if we're currently saving (to avoid conflicts)
		if (saveStatus === 'saving') {
			return;
		}

		// Only update if the content is actually different
		const hasChanged =
			!hasLoadedInitial ||
			newAnnotations.length !== boundingBoxes.length ||
			newAnnotations.some((ann, i) => !boundingBoxes[i] || ann.id !== boundingBoxes[i].id);

		if (hasChanged) {
			boundingBoxes = newAnnotations;
			onAnnotationsChange?.(boundingBoxes);
			hasLoadedInitial = true;
		}
	});

	$effect(() => {
		if (imageUrl && ctx) {
			loadImage();
		}
	});

	// Cleanup on unmount - no longer needed since we save immediately
</script>

<div class="relative">
	<!-- Mode Toggle Buttons -->
	<div class="mb-4 flex gap-2">
		<button
			onclick={() => (mode = 'select')}
			class="rounded px-3 py-2 text-sm font-medium transition-colors {mode === 'select'
				? 'bg-blue-600 text-white'
				: 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
		>
			Select (S)
		</button>
		<button
			onclick={() => (mode = 'draw')}
			class="rounded px-3 py-2 text-sm font-medium transition-colors {mode === 'draw'
				? 'bg-blue-600 text-white'
				: 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
		>
			Draw (D)
		</button>
	</div>

	<canvas
		bind:this={canvasElement}
		{width}
		{height}
		class="border border-gray-300 bg-white {mode === 'draw'
			? 'cursor-crosshair'
			: 'cursor-default'}"
		onmousedown={handleMouseDown}
		onmousemove={handleMouseMove}
		onmouseup={handleMouseUp}
	>
		Your browser does not support the HTML5 canvas element.
	</canvas>
</div>
