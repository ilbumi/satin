import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
	createCoordinateTransform,
	calculateImageFit,
	normalizeRectangle,
	getResizeHandle,
	applyResize,
	getResizeCursor,
	percentageToPixels,
	pixelsToPercentage,
	clamp,
	debounce,
	throttle
} from '../utils';
import type { CanvasState } from '../types';
import { mockCanvasState, mockKonvaStage, mockPoint, mockRectangle } from './mocks';

describe('Annotation Utils', () => {
	describe('createCoordinateTransform', () => {
		let canvasState: CanvasState;
		let mockStage: ReturnType<typeof mockKonvaStage>;

		beforeEach(() => {
			canvasState = mockCanvasState();
			mockStage = mockKonvaStage();
		});

		it('should return point unchanged when no stage provided', () => {
			const transform = createCoordinateTransform(canvasState);
			const point = mockPoint({ x: 100, y: 50 });

			expect(transform.screenToCanvas(point)).toEqual(point);
			expect(transform.canvasToScreen(point)).toEqual(point);
			expect(transform.screenToImage(point)).toEqual(point);
			expect(transform.imageToScreen(point)).toEqual(point);
		});

		it('should transform screen to canvas coordinates correctly', () => {
			mockStage.x.mockReturnValue(20);
			mockStage.y.mockReturnValue(30);
			mockStage.scaleX.mockReturnValue(2);
			mockStage.scaleY.mockReturnValue(1.5);

			const transform = createCoordinateTransform(canvasState, mockStage);
			const screenPoint = mockPoint({ x: 120, y: 130 });

			const result = transform.screenToCanvas(screenPoint);

			expect(result).toEqual({
				x: (120 - 20) / 2, // (screenX - stageX) / scaleX
				y: (130 - 30) / 1.5 // (screenY - stageY) / scaleY
			});
		});

		it('should transform canvas to screen coordinates correctly', () => {
			mockStage.x.mockReturnValue(20);
			mockStage.y.mockReturnValue(30);
			mockStage.scaleX.mockReturnValue(2);
			mockStage.scaleY.mockReturnValue(1.5);

			const transform = createCoordinateTransform(canvasState, mockStage);
			const canvasPoint = mockPoint({ x: 50, y: 60 });

			const result = transform.canvasToScreen(canvasPoint);

			expect(result).toEqual({
				x: 50 * 2 + 20, // canvasX * scaleX + stageX
				y: 60 * 1.5 + 30 // canvasY * scaleY + stageY
			});
		});

		it('should handle screen to image transformation', () => {
			mockStage.x.mockReturnValue(10);
			mockStage.y.mockReturnValue(15);
			mockStage.scaleX.mockReturnValue(1.5);
			mockStage.scaleY.mockReturnValue(1.2);

			const transform = createCoordinateTransform(canvasState, mockStage);
			const screenPoint = mockPoint({ x: 100, y: 120 });

			const result = transform.screenToImage(screenPoint);

			// Should first convert to canvas, then to image (which is the same as canvas in our case)
			expect(result).toEqual({
				x: (100 - 10) / 1.5,
				y: (120 - 15) / 1.2
			});
		});

		it('should handle image to screen transformation', () => {
			mockStage.x.mockReturnValue(10);
			mockStage.y.mockReturnValue(15);
			mockStage.scaleX.mockReturnValue(1.5);
			mockStage.scaleY.mockReturnValue(1.2);

			const transform = createCoordinateTransform(canvasState, mockStage);
			const imagePoint = mockPoint({ x: 50, y: 60 });

			const result = transform.imageToScreen(imagePoint);

			expect(result).toEqual({
				x: 50 * 1.5 + 10,
				y: 60 * 1.2 + 15
			});
		});

		it('should handle canvas to image and image to canvas (identity)', () => {
			const transform = createCoordinateTransform(canvasState, mockStage);
			const point = mockPoint({ x: 100, y: 50 });

			expect(transform.canvasToImage(point)).toEqual(point);
			expect(transform.imageToCanvas(point)).toEqual(point);
		});
	});

	describe('calculateImageFit', () => {
		it('should fit wide image in container', () => {
			const result = calculateImageFit(1600, 800, 800, 600);

			expect(result.width).toBe(800); // Fits container width
			expect(result.height).toBe(400); // Maintains aspect ratio
			expect(result.x).toBe(0); // Centered horizontally
			expect(result.y).toBe(100); // Centered vertically
			expect(result.scale).toBe(0.5); // Scale factor
		});

		it('should fit tall image in container', () => {
			const result = calculateImageFit(800, 1200, 800, 600);

			expect(result.width).toBe(400); // Maintains aspect ratio
			expect(result.height).toBe(600); // Fits container height
			expect(result.x).toBe(200); // Centered horizontally
			expect(result.y).toBe(0); // Centered vertically
			expect(result.scale).toBe(0.5); // Scale factor
		});

		it('should handle square image and container', () => {
			const result = calculateImageFit(400, 400, 600, 600);

			expect(result.width).toBe(600);
			expect(result.height).toBe(600);
			expect(result.x).toBe(0);
			expect(result.y).toBe(0);
			expect(result.scale).toBe(1.5);
		});

		it('should handle very small container', () => {
			const result = calculateImageFit(800, 600, 100, 80);

			expect(result.width).toBe(100);
			expect(result.height).toBe(75);
			expect(result.x).toBe(0);
			expect(result.y).toBe(2.5);
			expect(result.scale).toBe(0.125);
		});
	});

	describe('normalizeRectangle', () => {
		it('should handle positive width and height', () => {
			const rect = mockRectangle({ x: 10, y: 20, width: 100, height: 80 });
			const result = normalizeRectangle(rect);

			expect(result).toEqual({ x: 10, y: 20, width: 100, height: 80 });
		});

		it('should normalize negative width', () => {
			const rect = mockRectangle({ x: 110, y: 20, width: -100, height: 80 });
			const result = normalizeRectangle(rect);

			expect(result).toEqual({ x: 10, y: 20, width: 100, height: 80 });
		});

		it('should normalize negative height', () => {
			const rect = mockRectangle({ x: 10, y: 100, width: 100, height: -80 });
			const result = normalizeRectangle(rect);

			expect(result).toEqual({ x: 10, y: 20, width: 100, height: 80 });
		});

		it('should normalize both negative width and height', () => {
			const rect = mockRectangle({ x: 110, y: 100, width: -100, height: -80 });
			const result = normalizeRectangle(rect);

			expect(result).toEqual({ x: 10, y: 20, width: 100, height: 80 });
		});

		it('should handle zero dimensions', () => {
			const rect = mockRectangle({ x: 10, y: 20, width: 0, height: 0 });
			const result = normalizeRectangle(rect);

			expect(result).toEqual({ x: 10, y: 20, width: 0, height: 0 });
		});
	});

	describe('getResizeHandle', () => {
		const rect = mockRectangle({ x: 50, y: 60, width: 100, height: 80 });
		const tolerance = 8;

		it('should detect corner handles', () => {
			expect(getResizeHandle(mockPoint({ x: 50, y: 60 }), rect, tolerance)).toBe('nw');
			expect(getResizeHandle(mockPoint({ x: 150, y: 60 }), rect, tolerance)).toBe('ne');
			expect(getResizeHandle(mockPoint({ x: 50, y: 140 }), rect, tolerance)).toBe('sw');
			expect(getResizeHandle(mockPoint({ x: 150, y: 140 }), rect, tolerance)).toBe('se');
		});

		it('should detect edge handles', () => {
			expect(getResizeHandle(mockPoint({ x: 100, y: 60 }), rect, tolerance)).toBe('n');
			expect(getResizeHandle(mockPoint({ x: 100, y: 140 }), rect, tolerance)).toBe('s');
			expect(getResizeHandle(mockPoint({ x: 50, y: 100 }), rect, tolerance)).toBe('w');
			expect(getResizeHandle(mockPoint({ x: 150, y: 100 }), rect, tolerance)).toBe('e');
		});

		it('should prioritize corners over edges', () => {
			// Point very close to both corner and edge
			expect(getResizeHandle(mockPoint({ x: 52, y: 62 }), rect, tolerance)).toBe('nw');
		});

		it('should return null for points outside tolerance', () => {
			expect(getResizeHandle(mockPoint({ x: 40, y: 60 }), rect, tolerance)).toBe(null);
			expect(getResizeHandle(mockPoint({ x: 100, y: 100 }), rect, tolerance)).toBe(null);
		});

		it('should respect custom tolerance', () => {
			const smallTolerance = 2;
			expect(getResizeHandle(mockPoint({ x: 53, y: 60 }), rect, smallTolerance)).toBe('n');
			expect(getResizeHandle(mockPoint({ x: 51, y: 60 }), rect, smallTolerance)).toBe('nw');
		});
	});

	describe('applyResize', () => {
		const originalRect = mockRectangle({ x: 50, y: 60, width: 100, height: 80 });
		const minSize = 10;

		it('should handle northwest resize', () => {
			const newPoint = mockPoint({ x: 40, y: 50 });
			const result = applyResize(originalRect, 'nw', newPoint, minSize);

			expect(result.x).toBe(40);
			expect(result.y).toBe(50);
			expect(result.width).toBe(110); // Original right edge at 150, new left at 40
			expect(result.height).toBe(90); // Original bottom edge at 140, new top at 50
		});

		it('should handle southeast resize', () => {
			const newPoint = mockPoint({ x: 160, y: 150 });
			const result = applyResize(originalRect, 'se', newPoint, minSize);

			expect(result.x).toBe(50); // Unchanged
			expect(result.y).toBe(60); // Unchanged
			expect(result.width).toBe(110); // 160 - 50
			expect(result.height).toBe(90); // 150 - 60
		});

		it('should handle north resize', () => {
			const newPoint = mockPoint({ x: 100, y: 40 });
			const result = applyResize(originalRect, 'n', newPoint, minSize);

			expect(result.x).toBe(50); // Unchanged
			expect(result.y).toBe(40); // New top
			expect(result.width).toBe(100); // Unchanged
			expect(result.height).toBe(100); // Original bottom (140) - new top (40)
		});

		it('should handle east resize', () => {
			const newPoint = mockPoint({ x: 170, y: 100 });
			const result = applyResize(originalRect, 'e', newPoint, minSize);

			expect(result.x).toBe(50); // Unchanged
			expect(result.y).toBe(60); // Unchanged
			expect(result.width).toBe(120); // 170 - 50
			expect(result.height).toBe(80); // Unchanged
		});

		it('should enforce minimum size', () => {
			const newPoint = mockPoint({ x: 55, y: 65 }); // Very small resize
			const result = applyResize(originalRect, 'se', newPoint, minSize);

			expect(result.width).toBe(minSize);
			expect(result.height).toBe(minSize);
		});

		it('should handle all resize handles', () => {
			const handles = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'] as const;
			const newPoint = mockPoint({ x: 160, y: 150 });

			handles.forEach((handle) => {
				const result = applyResize(originalRect, handle, newPoint, minSize);

				// Should return a valid rectangle
				expect(result.width).toBeGreaterThanOrEqual(minSize);
				expect(result.height).toBeGreaterThanOrEqual(minSize);
				expect(typeof result.x).toBe('number');
				expect(typeof result.y).toBe('number');
			});
		});
	});

	describe('getResizeCursor', () => {
		it('should return correct cursor for each handle', () => {
			expect(getResizeCursor('nw')).toBe('nw-resize');
			expect(getResizeCursor('se')).toBe('nw-resize');
			expect(getResizeCursor('ne')).toBe('ne-resize');
			expect(getResizeCursor('sw')).toBe('ne-resize');
			expect(getResizeCursor('n')).toBe('ns-resize');
			expect(getResizeCursor('s')).toBe('ns-resize');
			expect(getResizeCursor('w')).toBe('ew-resize');
			expect(getResizeCursor('e')).toBe('ew-resize');
		});
	});

	describe('percentageToPixels', () => {
		it('should convert percentage coordinates to pixels', () => {
			const percent = { x: 25, y: 50, width: 50, height: 25 };
			const imageSize = { width: 800, height: 600 };

			const result = percentageToPixels(percent, imageSize);

			expect(result).toEqual({
				x: 200, // 25% of 800
				y: 300, // 50% of 600
				width: 400, // 50% of 800
				height: 150 // 25% of 600
			});
		});

		it('should handle zero percentages', () => {
			const percent = { x: 0, y: 0, width: 0, height: 0 };
			const imageSize = { width: 800, height: 600 };

			const result = percentageToPixels(percent, imageSize);

			expect(result).toEqual({ x: 0, y: 0, width: 0, height: 0 });
		});

		it('should handle 100% percentages', () => {
			const percent = { x: 0, y: 0, width: 100, height: 100 };
			const imageSize = { width: 800, height: 600 };

			const result = percentageToPixels(percent, imageSize);

			expect(result).toEqual({ x: 0, y: 0, width: 800, height: 600 });
		});
	});

	describe('pixelsToPercentage', () => {
		it('should convert pixel coordinates to percentages', () => {
			const pixels = mockRectangle({ x: 200, y: 300, width: 400, height: 150 });
			const imageSize = { width: 800, height: 600 };

			const result = pixelsToPercentage(pixels, imageSize);

			expect(result).toEqual({
				x: 25, // 200/800 * 100
				y: 50, // 300/600 * 100
				width: 50, // 400/800 * 100
				height: 25 // 150/600 * 100
			});
		});

		it('should handle zero pixel values', () => {
			const pixels = mockRectangle({ x: 0, y: 0, width: 0, height: 0 });
			const imageSize = { width: 800, height: 600 };

			const result = pixelsToPercentage(pixels, imageSize);

			expect(result).toEqual({ x: 0, y: 0, width: 0, height: 0 });
		});

		it('should handle full image size', () => {
			const pixels = mockRectangle({ x: 0, y: 0, width: 800, height: 600 });
			const imageSize = { width: 800, height: 600 };

			const result = pixelsToPercentage(pixels, imageSize);

			expect(result).toEqual({ x: 0, y: 0, width: 100, height: 100 });
		});
	});

	describe('clamp', () => {
		it('should clamp value to minimum', () => {
			expect(clamp(5, 10, 20)).toBe(10);
		});

		it('should clamp value to maximum', () => {
			expect(clamp(25, 10, 20)).toBe(20);
		});

		it('should return value when within range', () => {
			expect(clamp(15, 10, 20)).toBe(15);
		});

		it('should handle equal min and max', () => {
			expect(clamp(5, 10, 10)).toBe(10);
			expect(clamp(15, 10, 10)).toBe(10);
		});
	});

	describe('debounce', () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it('should delay function execution', () => {
			const mockFn = vi.fn();
			const debouncedFn = debounce(mockFn, 100);

			debouncedFn('test');
			expect(mockFn).not.toHaveBeenCalled();

			vi.advanceTimersByTime(100);
			expect(mockFn).toHaveBeenCalledWith('test');
		});

		it('should cancel previous call when called again', () => {
			const mockFn = vi.fn();
			const debouncedFn = debounce(mockFn, 100);

			debouncedFn('first');
			vi.advanceTimersByTime(50);
			debouncedFn('second');
			vi.advanceTimersByTime(100);

			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenCalledWith('second');
		});
	});

	describe('throttle', () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it('should limit function calls', () => {
			const mockFn = vi.fn();
			const throttledFn = throttle(mockFn, 100);

			throttledFn('first');
			expect(mockFn).toHaveBeenCalledWith('first');

			throttledFn('second');
			expect(mockFn).toHaveBeenCalledTimes(1); // Should not call again

			vi.advanceTimersByTime(100);
			throttledFn('third');
			expect(mockFn).toHaveBeenCalledTimes(2);
			expect(mockFn).toHaveBeenLastCalledWith('third');
		});

		it('should allow immediate first call', () => {
			const mockFn = vi.fn();
			const throttledFn = throttle(mockFn, 100);

			throttledFn('test');
			expect(mockFn).toHaveBeenCalledWith('test');
			expect(mockFn).toHaveBeenCalledTimes(1);
		});
	});
});
