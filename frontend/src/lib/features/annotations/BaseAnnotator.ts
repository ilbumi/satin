import type {
	ClientAnnotation,
	Point,
	Rectangle,
	AnnotationPointerEvent,
	CanvasState,
	CoordinateTransform
} from './types';

/**
 * Abstract base class for annotation tools
 * Provides common functionality for all annotation types
 */
export abstract class BaseAnnotator {
	protected canvasState: CanvasState;
	protected transform: CoordinateTransform;
	protected onAnnotationCreate?: (annotation: ClientAnnotation) => void;
	protected onAnnotationUpdate?: (id: string, annotation: Partial<ClientAnnotation>) => void;
	protected onAnnotationDelete?: (id: string) => void;

	constructor(
		canvasState: CanvasState,
		transform: CoordinateTransform,
		callbacks?: {
			onAnnotationCreate?: (annotation: ClientAnnotation) => void;
			onAnnotationUpdate?: (id: string, annotation: Partial<ClientAnnotation>) => void;
			onAnnotationDelete?: (id: string) => void;
		}
	) {
		this.canvasState = canvasState;
		this.transform = transform;
		this.onAnnotationCreate = callbacks?.onAnnotationCreate;
		this.onAnnotationUpdate = callbacks?.onAnnotationUpdate;
		this.onAnnotationDelete = callbacks?.onAnnotationDelete;
	}

	/**
	 * Handle pointer down events
	 */
	abstract onPointerDown(event: AnnotationPointerEvent): void;

	/**
	 * Handle pointer move events
	 */
	abstract onPointerMove(event: AnnotationPointerEvent): void;

	/**
	 * Handle pointer up events
	 */
	abstract onPointerUp(_event?: AnnotationPointerEvent): void;

	/**
	 * Handle key down events
	 */
	abstract onKeyDown(event: KeyboardEvent): void;

	/**
	 * Handle tool activation
	 */
	abstract onActivate(): void;

	/**
	 * Handle tool deactivation
	 */
	abstract onDeactivate(): void;

	/**
	 * Get the tool's cursor style
	 */
	abstract getCursor(): string;

	// Test helper methods
	getCanvasState(): CanvasState {
		return this.canvasState;
	}

	getTransform(): CoordinateTransform {
		return this.transform;
	}

	getOnAnnotationCreate(): ((annotation: ClientAnnotation) => void) | undefined {
		return this.onAnnotationCreate;
	}

	getOnAnnotationUpdate():
		| ((id: string, annotation: Partial<ClientAnnotation>) => void)
		| undefined {
		return this.onAnnotationUpdate;
	}

	getOnAnnotationDelete(): ((id: string) => void) | undefined {
		return this.onAnnotationDelete;
	}

	/**
	 * Set the cursor style
	 */
	protected setCursor(cursor: string): void {
		// This will be implemented by the canvas component
		// The implementation should update the canvas element's cursor style
		if (typeof window !== 'undefined' && document.body) {
			document.body.style.cursor = cursor;
		}
	}

	/**
	 * Check if the tool is currently active/drawing
	 */
	abstract isActive(): boolean;

	/**
	 * Validate an annotation before creation/update
	 */
	protected validateAnnotation(annotation: Partial<ClientAnnotation>): boolean {
		if (!annotation.bounds) return false;

		const { x, y, width, height } = annotation.bounds;

		// Check if bounds are valid
		if (width <= 0 || height <= 0) return false;

		// Check if annotation is within image bounds
		if (x < 0 || y < 0) return false;
		if (x + width > this.canvasState.imageWidth || y + height > this.canvasState.imageHeight) {
			return false;
		}

		return true;
	}

	/**
	 * Generate a unique ID for new annotations
	 */
	protected generateId(): string {
		return `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	/**
	 * Calculate distance between two points
	 */
	protected distance(p1: Point, p2: Point): number {
		const dx = p1.x - p2.x;
		const dy = p1.y - p2.y;
		return Math.sqrt(dx * dx + dy * dy);
	}

	/**
	 * Check if a point is inside a rectangle
	 */
	protected pointInRectangle(point: Point, rect: Rectangle): boolean {
		return (
			point.x >= rect.x &&
			point.x <= rect.x + rect.width &&
			point.y >= rect.y &&
			point.y <= rect.y + rect.height
		);
	}

	/**
	 * Get the closest point on a rectangle to a given point
	 */
	protected closestPointOnRectangle(point: Point, rect: Rectangle): Point {
		const x = Math.max(rect.x, Math.min(point.x, rect.x + rect.width));
		const y = Math.max(rect.y, Math.min(point.y, rect.y + rect.height));
		return { x, y };
	}

	/**
	 * Snap point to grid if enabled
	 */
	protected snapToGrid(point: Point, gridSize: number): Point {
		if (!this.canvasState || gridSize <= 0) return point;

		return {
			x: Math.round(point.x / gridSize) * gridSize,
			y: Math.round(point.y / gridSize) * gridSize
		};
	}

	/**
	 * Constrain a rectangle to stay within image bounds
	 */
	protected constrainToImage(rect: Rectangle): Rectangle {
		const imageWidth = this.canvasState.imageWidth;
		const imageHeight = this.canvasState.imageHeight;

		const x = Math.max(0, Math.min(rect.x, imageWidth - rect.width));
		const y = Math.max(0, Math.min(rect.y, imageHeight - rect.height));
		const width = Math.min(rect.width, imageWidth - x);
		const height = Math.min(rect.height, imageHeight - y);

		return { x, y, width, height };
	}

	/**
	 * Create a rectangle from two points
	 */
	protected createRectFromPoints(start: Point, end: Point): Rectangle {
		const x = Math.min(start.x, end.x);
		const y = Math.min(start.y, end.y);
		const width = Math.abs(end.x - start.x);
		const height = Math.abs(end.y - start.y);

		return { x, y, width, height };
	}

	/**
	 * Check if two rectangles overlap
	 */
	protected rectanglesOverlap(rect1: Rectangle, rect2: Rectangle): boolean {
		return !(
			rect1.x + rect1.width < rect2.x ||
			rect2.x + rect2.width < rect1.x ||
			rect1.y + rect1.height < rect2.y ||
			rect2.y + rect2.height < rect1.y
		);
	}

	/**
	 * Get the intersection of two rectangles
	 */
	protected getIntersection(rect1: Rectangle, rect2: Rectangle): Rectangle | null {
		const x = Math.max(rect1.x, rect2.x);
		const y = Math.max(rect1.y, rect2.y);
		const right = Math.min(rect1.x + rect1.width, rect2.x + rect2.width);
		const bottom = Math.min(rect1.y + rect1.height, rect2.y + rect2.height);

		if (right <= x || bottom <= y) {
			return null;
		}

		return {
			x,
			y,
			width: right - x,
			height: bottom - y
		};
	}

	/**
	 * Update canvas state
	 */
	updateCanvasState(state: Partial<CanvasState>): void {
		Object.assign(this.canvasState, state);
	}

	/**
	 * Update coordinate transform
	 */
	updateTransform(transform: CoordinateTransform): void {
		this.transform = transform;
	}
}
