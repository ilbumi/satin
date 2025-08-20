import { BaseAnnotator } from './BaseAnnotator';
import type {
	ClientAnnotation,
	Point,
	Rectangle,
	AnnotationPointerEvent,
	CanvasState,
	CoordinateTransform,
	ResizeHandle
} from './types';
import { normalizeRectangle, getResizeHandle, applyResize, getResizeCursor } from './utils';

/**
 * Bounding box annotation tool
 * Handles drawing and editing rectangular annotations
 */
export class BoundingBoxTool extends BaseAnnotator {
	private isDrawing = false;
	private isEditing = false;
	private isResizing = false;
	private startPoint: Point | null = null;
	private currentPoint: Point | null = null;
	private selectedAnnotation: ClientAnnotation | null = null;
	private activeHandle: ResizeHandle | null = null;
	private dragOffset: Point | null = null;

	constructor(
		canvasState: CanvasState,
		transform: CoordinateTransform,
		callbacks?: {
			onAnnotationCreate?: (annotation: ClientAnnotation) => void;
			onAnnotationUpdate?: (id: string, annotation: Partial<ClientAnnotation>) => void;
			onAnnotationDelete?: (id: string) => void;
		}
	) {
		super(canvasState, transform, callbacks);
	}

	onPointerDown(event: AnnotationPointerEvent): void {
		console.log('BoundingBoxTool onPointerDown called with:', event);
		const point = event.point;

		// If we clicked on an annotation, select it
		if (event.target) {
			this.selectAnnotation(event.target);

			// Check if we clicked on a resize handle
			this.activeHandle = getResizeHandle(point, this.selectedAnnotation!.bounds, 8);

			if (this.activeHandle) {
				this.isResizing = true;
				this.canvasState.mode = 'edit';
			} else {
				// Start dragging the annotation
				this.isEditing = true;
				this.dragOffset = {
					x: point.x - this.selectedAnnotation!.bounds.x,
					y: point.y - this.selectedAnnotation!.bounds.y
				};
				this.canvasState.mode = 'edit';
			}

			this.onAnnotationUpdate?.(this.selectedAnnotation!.id, { isSelected: true });
			return;
		}

		// Deselect any selected annotation
		if (this.selectedAnnotation) {
			this.selectedAnnotation.isSelected = false;
			this.onAnnotationUpdate?.(this.selectedAnnotation.id, { isSelected: false });
			this.selectedAnnotation = null;
		}

		// Start drawing a new bounding box
		this.isDrawing = true;
		this.startPoint = point;
		this.currentPoint = point;
		this.canvasState.mode = 'draw';
		this.canvasState.isDrawing = true;
		this.canvasState.drawingStartPos = point;
		this.canvasState.drawingCurrentPos = point;
	}

	onPointerMove(event: AnnotationPointerEvent): void {
		const point = event.point;

		if (this.isDrawing && this.startPoint) {
			// Update current drawing position
			this.currentPoint = point;
			this.canvasState.drawingCurrentPos = point;
		} else if (this.isResizing && this.selectedAnnotation && this.activeHandle) {
			// Resize the selected annotation
			const newBounds = applyResize(
				this.selectedAnnotation.bounds,
				this.activeHandle,
				point,
				10 // Minimum size
			);

			// Constrain to image bounds
			const constrainedBounds = this.constrainToImage(newBounds);

			// Update annotation bounds
			this.selectedAnnotation.bounds = constrainedBounds;
			this.selectedAnnotation.updatedAt = new Date();

			this.onAnnotationUpdate?.(this.selectedAnnotation.id, {
				bounds: constrainedBounds,
				updatedAt: this.selectedAnnotation.updatedAt
			});
		} else if (this.isEditing && this.selectedAnnotation && this.dragOffset) {
			// Move the selected annotation
			const newX = point.x - this.dragOffset.x;
			const newY = point.y - this.dragOffset.y;

			// Constrain to image bounds
			const maxX = this.canvasState.imageWidth - this.selectedAnnotation.bounds.width;
			const maxY = this.canvasState.imageHeight - this.selectedAnnotation.bounds.height;

			const constrainedX = Math.max(0, Math.min(newX, maxX));
			const constrainedY = Math.max(0, Math.min(newY, maxY));

			const newBounds = {
				...this.selectedAnnotation.bounds,
				x: constrainedX,
				y: constrainedY
			};

			this.selectedAnnotation.bounds = newBounds;
			this.selectedAnnotation.updatedAt = new Date();

			this.onAnnotationUpdate?.(this.selectedAnnotation.id, {
				bounds: newBounds,
				updatedAt: this.selectedAnnotation.updatedAt
			});
		} else {
			// Update cursor based on what's under the pointer
			if (event.target) {
				const handle = getResizeHandle(point, event.target.bounds, 8);
				if (handle) {
					// Over a resize handle
					this.setCursor(getResizeCursor(handle));
				} else {
					// Over an annotation
					this.setCursor('move');
				}
			} else {
				// Over empty space
				this.setCursor('crosshair');
			}
		}
	}

	onPointerUp(_event?: AnnotationPointerEvent): void {
		console.log(
			'BoundingBoxTool onPointerUp called, isDrawing:',
			this.isDrawing,
			'startPoint:',
			this.startPoint,
			'currentPoint:',
			this.currentPoint
		);
		if (this.isDrawing && this.startPoint && this.currentPoint) {
			// Complete drawing
			const rect = this.createRectFromPoints(this.startPoint, this.currentPoint);
			const normalizedRect = normalizeRectangle(rect);

			// Constrain to image bounds
			const constrainedRect = this.constrainToImage(normalizedRect);

			// Only create annotation if it has meaningful size
			if (constrainedRect.width >= 10 && constrainedRect.height >= 10) {
				this.createAnnotation(constrainedRect);
			}

			this.resetDrawingState();
		} else if (this.isResizing) {
			// Complete resizing
			this.isResizing = false;
			this.activeHandle = null;
			this.canvasState.mode = 'view';
		} else if (this.isEditing) {
			// Complete editing
			this.isEditing = false;
			this.dragOffset = null;
			this.canvasState.mode = 'view';
		}
	}

	onKeyDown(event: KeyboardEvent): void {
		switch (event.key) {
			case 'Delete':
			case 'Backspace':
				if (this.selectedAnnotation) {
					this.onAnnotationDelete?.(this.selectedAnnotation.id);
					this.selectedAnnotation = null;
				}
				event.preventDefault();
				break;

			case 'Escape':
				if (this.isDrawing) {
					this.resetDrawingState();
				} else if (this.selectedAnnotation) {
					this.selectedAnnotation.isSelected = false;
					this.onAnnotationUpdate?.(this.selectedAnnotation.id, { isSelected: false });
					this.selectedAnnotation = null;
				}
				event.preventDefault();
				break;
		}
	}

	onActivate(): void {
		this.canvasState.activeTool = 'bbox';
		this.setCursor('crosshair');
	}

	onDeactivate(): void {
		this.resetDrawingState();
		if (this.selectedAnnotation) {
			this.selectedAnnotation.isSelected = false;
			this.onAnnotationUpdate?.(this.selectedAnnotation.id, { isSelected: false });
			this.selectedAnnotation = null;
		}
		this.setCursor('default');
	}

	onDestroy(): void {
		// Reset all tool state
		this.resetDrawingState();

		// Clear selected annotation without updating (component is being destroyed)
		this.selectedAnnotation = null;

		// Reset editing state
		this.isEditing = false;
		this.isResizing = false;
		this.activeHandle = null;
		this.dragOffset = null;

		// Call base cleanup
		this.cleanup();
	}

	getCursor(): string {
		if (this.isDrawing) return 'crosshair';
		if (this.isResizing && this.activeHandle) return getResizeCursor(this.activeHandle);
		if (this.isEditing) return 'move';
		return 'crosshair';
	}

	isActive(): boolean {
		return this.isDrawing || this.isEditing || this.isResizing;
	}

	/**
	 * Get the current drawing rectangle (for preview rendering)
	 */
	getDrawingRect(): Rectangle | null {
		if (!this.isDrawing || !this.startPoint || !this.currentPoint) {
			return null;
		}

		const rect = this.createRectFromPoints(this.startPoint, this.currentPoint);
		return normalizeRectangle(rect);
	}

	/**
	 * Get the currently selected annotation
	 */
	getSelectedAnnotation(): ClientAnnotation | null {
		return this.selectedAnnotation;
	}

	/**
	 * Set the selected annotation
	 */
	selectAnnotation(annotation: ClientAnnotation | null): void {
		// Deselect previous
		if (this.selectedAnnotation) {
			this.selectedAnnotation.isSelected = false;
			this.onAnnotationUpdate?.(this.selectedAnnotation.id, { isSelected: false });
		}

		// Select new
		this.selectedAnnotation = annotation;
		if (this.selectedAnnotation) {
			this.selectedAnnotation.isSelected = true;
			this.onAnnotationUpdate?.(this.selectedAnnotation.id, { isSelected: true });
		}
	}

	private createAnnotation(bounds: Rectangle): void {
		console.log('BoundingBoxTool createAnnotation called with bounds:', bounds);
		const annotation: ClientAnnotation = {
			id: this.generateId(),
			type: 'bbox',
			bounds,
			annotation: {
				text: '',
				tags: []
			},
			isSelected: false,
			isEditing: false,
			isDragging: false,
			resizeHandle: null,
			createdAt: new Date(),
			updatedAt: new Date()
		};

		console.log('About to validate and create annotation:', annotation);
		if (this.validateAnnotation(annotation)) {
			console.log('Annotation validated, calling onAnnotationCreate');
			this.onAnnotationCreate?.(annotation);
		} else {
			console.log('Annotation validation failed');
		}
	}

	private resetDrawingState(): void {
		this.isDrawing = false;
		this.startPoint = null;
		this.currentPoint = null;

		// Only update canvas state if it exists (may be null during destruction)
		if (this.canvasState) {
			this.canvasState.mode = 'view';
			this.canvasState.isDrawing = false;
			this.canvasState.drawingStartPos = null;
			this.canvasState.drawingCurrentPos = null;
		}
	}
}
