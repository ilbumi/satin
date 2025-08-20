import { BaseAnnotator } from './BaseAnnotator';
import type {
	ClientAnnotation,
	Point,
	AnnotationPointerEvent,
	CanvasState,
	CoordinateTransform,
	ResizeHandle
} from './types';
import { getResizeHandle, applyResize, getResizeCursor } from './utils';

/**
 * Selection tool for selecting and manipulating existing annotations
 * Does not create new annotations, only interacts with existing ones
 */
export class SelectTool extends BaseAnnotator {
	private isEditing = false;
	private isResizing = false;
	private isDragging = false;
	private selectedAnnotation: ClientAnnotation | null = null;
	private activeHandle: ResizeHandle | null = null;
	private dragOffset: Point | null = null;
	private startBounds: ClientAnnotation['bounds'] | null = null;

	constructor(
		canvasState: CanvasState,
		transform: CoordinateTransform,
		callbacks?: {
			onAnnotationCreate?: (annotation: ClientAnnotation) => void;
			onAnnotationUpdate?: (id: string, annotation: Partial<ClientAnnotation>) => void;
			onAnnotationDelete?: (id: string) => void;
			onAnnotationSelect?: (annotation: ClientAnnotation | null) => void;
		}
	) {
		super(canvasState, transform, callbacks);
	}

	onPointerDown(event: AnnotationPointerEvent): void {
		const point = event.point;

		// If we clicked on an annotation, select it
		if (event.target) {
			this.selectAnnotation(event.target);

			// Check if we clicked on a resize handle
			this.activeHandle = getResizeHandle(point, this.selectedAnnotation!.bounds, 8);

			if (this.activeHandle) {
				this.isResizing = true;
				this.startBounds = { ...this.selectedAnnotation!.bounds };
				this.setCursor(getResizeCursor(this.activeHandle));
			} else {
				// Start dragging the annotation
				this.isDragging = true;
				this.dragOffset = {
					x: point.x - this.selectedAnnotation!.bounds.x,
					y: point.y - this.selectedAnnotation!.bounds.y
				};
				this.setCursor('grabbing');
			}
		} else {
			// Clicked on empty space, deselect any selected annotation
			this.selectAnnotation(null);
		}
	}

	onPointerMove(event: AnnotationPointerEvent): void {
		const point = event.point;

		if (this.isResizing && this.selectedAnnotation && this.activeHandle && this.startBounds) {
			// Handle resizing
			const newBounds = applyResize(this.startBounds, this.activeHandle, point, 10);

			// Update the annotation bounds
			this.selectedAnnotation.bounds = newBounds;
			this.onAnnotationUpdate?.(this.selectedAnnotation.id, {
				bounds: newBounds
			});
		} else if (this.isDragging && this.selectedAnnotation && this.dragOffset) {
			// Handle dragging
			const newX = point.x - this.dragOffset.x;
			const newY = point.y - this.dragOffset.y;

			// Update the annotation position
			this.selectedAnnotation.bounds.x = newX;
			this.selectedAnnotation.bounds.y = newY;

			this.onAnnotationUpdate?.(this.selectedAnnotation.id, {
				bounds: { ...this.selectedAnnotation.bounds }
			});
		} else if (this.selectedAnnotation) {
			// Check if hovering over a resize handle
			const handle = getResizeHandle(point, this.selectedAnnotation.bounds, 8);
			if (handle) {
				this.setCursor(getResizeCursor(handle));
			} else {
				// Check if hovering over the annotation body
				const bounds = this.selectedAnnotation.bounds;
				const isInside =
					point.x >= bounds.x &&
					point.x <= bounds.x + bounds.width &&
					point.y >= bounds.y &&
					point.y <= bounds.y + bounds.height;

				this.setCursor(isInside ? 'grab' : 'default');
			}
		} else {
			this.setCursor('default');
		}
	}

	onPointerUp(_event?: AnnotationPointerEvent): void {
		if (this.isResizing && this.selectedAnnotation && this.startBounds) {
			// Finalize resize operation
			this.onAnnotationUpdate?.(this.selectedAnnotation.id, {
				bounds: this.selectedAnnotation.bounds,
				updatedAt: new Date()
			});
		} else if (this.isDragging && this.selectedAnnotation) {
			// Finalize drag operation
			this.onAnnotationUpdate?.(this.selectedAnnotation.id, {
				bounds: this.selectedAnnotation.bounds,
				updatedAt: new Date()
			});
		}

		// Reset state
		this.isResizing = false;
		this.isDragging = false;
		this.activeHandle = null;
		this.dragOffset = null;
		this.startBounds = null;
		this.setCursor('default');
	}

	onKeyDown(event: KeyboardEvent): void {
		// Handle keyboard shortcuts for selection tool
		if (event.key === 'Delete' || event.key === 'Backspace') {
			if (this.selectedAnnotation) {
				this.onAnnotationDelete?.(this.selectedAnnotation.id);
				this.selectedAnnotation = null;
			}
		}
	}

	onActivate(): void {
		// Tool is now active
		this.setCursor('default');
	}

	onDeactivate(): void {
		// Clean up when tool is deactivated
		this.resetToolState();
		this.setCursor('default');
	}

	onDestroy(): void {
		// Clean up when tool is destroyed
		this.resetToolState();

		// Call base cleanup
		this.cleanup();
	}

	getCursor(): string {
		if (this.isResizing && this.activeHandle) {
			return getResizeCursor(this.activeHandle);
		}
		if (this.isDragging) {
			return 'grabbing';
		}
		if (this.selectedAnnotation) {
			return 'grab';
		}
		return 'default';
	}

	/**
	 * Select or deselect an annotation
	 */
	private selectAnnotation(annotation: ClientAnnotation | null): void {
		// Deselect previous annotation
		if (this.selectedAnnotation) {
			this.selectedAnnotation.isSelected = false;
		}

		// Select new annotation
		this.selectedAnnotation = annotation;
		if (annotation) {
			annotation.isSelected = true;
		}

		// Notify parent component
		this.onAnnotationSelect?.(annotation);
	}

	/**
	 * Check if the tool is currently active/editing
	 */
	isActive(): boolean {
		return this.isEditing || this.isResizing || this.isDragging;
	}

	/**
	 * Get currently selected annotation
	 */
	getSelectedAnnotation(): ClientAnnotation | null {
		return this.selectedAnnotation;
	}

	/**
	 * Reset all tool state
	 */
	private resetToolState(): void {
		this.selectedAnnotation = null;
		this.isEditing = false;
		this.isResizing = false;
		this.isDragging = false;
		this.activeHandle = null;
		this.dragOffset = null;
		this.startBounds = null;
	}
}
