import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BaseAnnotator } from '../BaseAnnotator';
import type {
	ClientAnnotation,
	CanvasState,
	CoordinateTransform,
	Point,
	Rectangle
} from '../types';
import {
	mockCanvasState,
	mockCoordinateTransform,
	mockClientAnnotation,
	mockPointerEvent,
	mockPoint,
	mockRectangle,
	mockKeyboardEvent
} from './mocks';

// Concrete implementation for testing the abstract BaseAnnotator
class TestAnnotator extends BaseAnnotator {
	onPointerDown = vi.fn();
	onPointerMove = vi.fn();
	onPointerUp = vi.fn();
	onKeyDown = vi.fn();
	onActivate = vi.fn();
	onDeactivate = vi.fn();
	getCursor = vi.fn(() => 'default');
	isActive = vi.fn(() => false);

	// Expose protected methods for testing
	public generateId() {
		return super.generateId();
	}
	public validateAnnotation(annotation: Partial<ClientAnnotation>) {
		return super.validateAnnotation(annotation);
	}
	public distance(p1: Point, p2: Point) {
		return super.distance(p1, p2);
	}
	public pointInRectangle(point: Point, rect: Rectangle) {
		return super.pointInRectangle(point, rect);
	}
	public constrainToImage(rect: Rectangle) {
		return super.constrainToImage(rect);
	}
	public createRectFromPoints(start: Point, end: Point) {
		return super.createRectFromPoints(start, end);
	}
}

describe('BaseAnnotator', () => {
	let canvasState: CanvasState;
	let transform: CoordinateTransform;
	let callbacks: {
		onAnnotationCreate: ReturnType<typeof vi.fn>;
		onAnnotationUpdate: ReturnType<typeof vi.fn>;
		onAnnotationDelete: ReturnType<typeof vi.fn>;
	};
	let annotator: TestAnnotator;

	beforeEach(() => {
		canvasState = mockCanvasState();
		transform = mockCoordinateTransform();
		callbacks = {
			onAnnotationCreate: vi.fn(),
			onAnnotationUpdate: vi.fn(),
			onAnnotationDelete: vi.fn()
		};
		annotator = new TestAnnotator(canvasState, transform, callbacks);
	});

	describe('constructor', () => {
		it('should initialize with canvas state and transform', () => {
			expect(annotator.getCanvasState()).toBe(canvasState);
			expect(annotator.getTransform()).toBe(transform);
		});

		it('should initialize with callbacks', () => {
			expect(annotator.getOnAnnotationCreate()).toBe(callbacks.onAnnotationCreate);
			expect(annotator.getOnAnnotationUpdate()).toBe(callbacks.onAnnotationUpdate);
			expect(annotator.getOnAnnotationDelete()).toBe(callbacks.onAnnotationDelete);
		});

		it('should work without callbacks', () => {
			const annotatorWithoutCallbacks = new TestAnnotator(canvasState, transform);
			expect(annotatorWithoutCallbacks.getOnAnnotationCreate()).toBeUndefined();
		});
	});

	describe('generateId', () => {
		it('should generate unique IDs', () => {
			const id1 = annotator.generateId();
			const id2 = annotator.generateId();

			expect(id1).toBeDefined();
			expect(id2).toBeDefined();
			expect(id1).not.toBe(id2);
		});

		it('should generate IDs in correct format', () => {
			const id = annotator.generateId();
			expect(id).toMatch(/^annotation_\d+_[a-z0-9]+$/); // Should match actual format
		});
	});

	describe('validateAnnotation', () => {
		it('should validate valid annotation', () => {
			const annotation = mockClientAnnotation();
			const result = annotator.validateAnnotation(annotation);

			expect(result).toBe(true);
		});

		it('should reject annotation without bounds', () => {
			const annotation = mockClientAnnotation();
			// @ts-expect-error Testing invalid state
			delete annotation.bounds;

			const result = annotator.validateAnnotation(annotation);
			expect(result).toBe(false);
		});

		it('should reject annotation with zero width', () => {
			const annotation = mockClientAnnotation({
				bounds: mockRectangle({ width: 0 })
			});

			const result = annotator.validateAnnotation(annotation);
			expect(result).toBe(false);
		});

		it('should reject annotation with zero height', () => {
			const annotation = mockClientAnnotation({
				bounds: mockRectangle({ height: 0 })
			});

			const result = annotator.validateAnnotation(annotation);
			expect(result).toBe(false);
		});

		it('should reject annotation with negative dimensions', () => {
			const annotation = mockClientAnnotation({
				bounds: mockRectangle({ width: -10, height: -5 })
			});

			const result = annotator.validateAnnotation(annotation);
			expect(result).toBe(false);
		});

		it('should validate annotation without type (type not checked in validateAnnotation)', () => {
			const annotation = mockClientAnnotation();
			// @ts-expect-error Testing invalid state
			delete annotation.type;

			const result = annotator.validateAnnotation(annotation);
			expect(result).toBe(true); // validateAnnotation only checks bounds, not type
		});

		it('should accept annotation with minimum valid size', () => {
			const annotation = mockClientAnnotation({
				bounds: mockRectangle({ width: 1, height: 1 })
			});

			const result = annotator.validateAnnotation(annotation);
			expect(result).toBe(true);
		});
	});

	describe('createRectFromPoints', () => {
		it('should create rectangle from two points', () => {
			const start = mockPoint({ x: 50, y: 60 });
			const end = mockPoint({ x: 150, y: 140 });

			const result = annotator.createRectFromPoints(start, end);

			expect(result).toEqual({
				x: 50,
				y: 60,
				width: 100,
				height: 80
			});
		});

		it('should handle reversed points (end before start)', () => {
			const start = mockPoint({ x: 150, y: 140 });
			const end = mockPoint({ x: 50, y: 60 });

			const result = annotator.createRectFromPoints(start, end);

			// Method uses Math.min/Math.abs so should normalize the rectangle
			expect(result).toEqual({
				x: 50,
				y: 60,
				width: 100,
				height: 80
			});
		});

		it('should handle same points', () => {
			const start = mockPoint({ x: 100, y: 100 });
			const end = mockPoint({ x: 100, y: 100 });

			const result = annotator.createRectFromPoints(start, end);

			expect(result).toEqual({
				x: 100,
				y: 100,
				width: 0,
				height: 0
			});
		});
	});

	describe('constrainToImage', () => {
		beforeEach(() => {
			canvasState.imageWidth = 800;
			canvasState.imageHeight = 600;
		});

		it('should leave valid bounds unchanged', () => {
			const bounds = mockRectangle({ x: 10, y: 20, width: 100, height: 80 });
			const result = annotator.constrainToImage(bounds);

			expect(result).toEqual(bounds);
		});

		it('should constrain bounds starting before image', () => {
			const bounds = mockRectangle({ x: -10, y: -5, width: 100, height: 80 });
			const result = annotator.constrainToImage(bounds);

			expect(result).toEqual({
				x: 0,
				y: 0,
				width: 100, // Method preserves original width when possible
				height: 80
			});
		});

		it('should constrain bounds extending beyond image', () => {
			const bounds = mockRectangle({ x: 750, y: 550, width: 100, height: 80 });
			const result = annotator.constrainToImage(bounds);

			expect(result).toEqual({
				x: 700, // Math.max(0, Math.min(750, 800-100)) = 700
				y: 520, // Math.max(0, Math.min(550, 600-80)) = 520
				width: 100, // Math.min(100, 800-700) = 100
				height: 80 // Math.min(80, 600-520) = 80
			});
		});

		it('should handle bounds completely outside image', () => {
			const bounds = mockRectangle({ x: 900, y: 700, width: 100, height: 80 });
			const result = annotator.constrainToImage(bounds);

			// Method constraints position but preserves minimum bounds
			expect(result.x).toBe(700); // imageWidth - width = 800 - 100
			expect(result.y).toBe(520); // imageHeight - height = 600 - 80
			expect(result.width).toBe(100); // Original width preserved
			expect(result.height).toBe(80); // Original height preserved
		});

		it('should ensure minimum dimensions are preserved when possible', () => {
			const bounds = mockRectangle({ x: 795, y: 595, width: 20, height: 15 });
			const result = annotator.constrainToImage(bounds);

			expect(result.x).toBe(780); // Math.max(0, Math.min(795, 800-20)) = 780
			expect(result.y).toBe(585); // Math.max(0, Math.min(595, 600-15)) = 585
			expect(result.width).toBe(20); // Math.min(20, 800-780) = 20
			expect(result.height).toBe(15); // Math.min(15, 600-585) = 15
		});
	});

	describe('pointInRectangle', () => {
		const bounds = mockRectangle({ x: 50, y: 60, width: 100, height: 80 });

		it('should detect point inside bounds', () => {
			const point = mockPoint({ x: 100, y: 100 });
			const result = annotator.pointInRectangle(point, bounds);

			expect(result).toBe(true);
		});

		it('should detect point outside bounds', () => {
			const point = mockPoint({ x: 200, y: 100 });
			const result = annotator.pointInRectangle(point, bounds);

			expect(result).toBe(false);
		});

		it('should handle point on boundary', () => {
			const point = mockPoint({ x: 50, y: 60 }); // Top-left corner
			const result = annotator.pointInRectangle(point, bounds);

			expect(result).toBe(true);
		});

		it('should handle point on opposite boundary', () => {
			const point = mockPoint({ x: 150, y: 140 }); // Bottom-right corner
			const result = annotator.pointInRectangle(point, bounds);

			expect(result).toBe(true);
		});

		it('should detect point just outside bounds', () => {
			const point = mockPoint({ x: 151, y: 100 });
			const result = annotator.pointInRectangle(point, bounds);

			expect(result).toBe(false);
		});
	});

	describe('distance', () => {
		it('should calculate distance between two points', () => {
			const point1 = mockPoint({ x: 0, y: 0 });
			const point2 = mockPoint({ x: 3, y: 4 });

			const result = annotator.distance(point1, point2);

			expect(result).toBe(5); // 3-4-5 triangle
		});

		it('should handle same points', () => {
			const point = mockPoint({ x: 100, y: 100 });
			const result = annotator.distance(point, point);

			expect(result).toBe(0);
		});

		it('should handle horizontal distance', () => {
			const point1 = mockPoint({ x: 10, y: 50 });
			const point2 = mockPoint({ x: 20, y: 50 });

			const result = annotator.distance(point1, point2);

			expect(result).toBe(10);
		});

		it('should handle vertical distance', () => {
			const point1 = mockPoint({ x: 50, y: 10 });
			const point2 = mockPoint({ x: 50, y: 30 });

			const result = annotator.distance(point1, point2);

			expect(result).toBe(20);
		});
	});

	describe('abstract method calls', () => {
		it('should call abstract methods when implemented', () => {
			const event = mockPointerEvent();

			annotator.onPointerDown(event);
			annotator.onPointerMove(event);
			annotator.onPointerUp(event);

			expect(annotator.onPointerDown).toHaveBeenCalledWith(event);
			expect(annotator.onPointerMove).toHaveBeenCalledWith(event);
			expect(annotator.onPointerUp).toHaveBeenCalledWith(event);
		});

		it('should call keyboard events', () => {
			const keyEvent = mockKeyboardEvent('Delete');

			annotator.onKeyDown(keyEvent);

			expect(annotator.onKeyDown).toHaveBeenCalledWith(keyEvent);
		});

		it('should call activation methods', () => {
			annotator.onActivate();
			annotator.onDeactivate();

			expect(annotator.onActivate).toHaveBeenCalled();
			expect(annotator.onDeactivate).toHaveBeenCalled();
		});

		it('should call state methods', () => {
			annotator.getCursor();
			annotator.isActive();

			expect(annotator.getCursor).toHaveBeenCalled();
			expect(annotator.isActive).toHaveBeenCalled();
		});
	});
});
