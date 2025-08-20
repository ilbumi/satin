import type { Point, Rectangle, CoordinateTransform, CanvasState } from './types';

/**
 * Create coordinate transformation utilities for annotation canvas
 */
export function createCoordinateTransform(
	canvasState: CanvasState,
	stage?: { x: () => number; y: () => number; scaleX: () => number; scaleY: () => number }
): CoordinateTransform {
	return {
		/**
		 * Convert screen coordinates to canvas coordinates
		 */
		screenToCanvas: (point: Point): Point => {
			if (!stage) return point;

			const stageBox = stage;
			return {
				x: (point.x - stageBox.x()) / stageBox.scaleX(),
				y: (point.y - stageBox.y()) / stageBox.scaleY()
			};
		},

		/**
		 * Convert canvas coordinates to screen coordinates
		 */
		canvasToScreen: (point: Point): Point => {
			if (!stage) return point;

			const stageBox = stage;
			return {
				x: point.x * stageBox.scaleX() + stageBox.x(),
				y: point.y * stageBox.scaleY() + stageBox.y()
			};
		},

		/**
		 * Convert screen coordinates to image coordinates
		 */
		screenToImage: (point: Point): Point => {
			if (!stage) return point;

			// First convert to canvas coordinates
			const canvasPoint = {
				x: (point.x - stage.x()) / stage.scaleX(),
				y: (point.y - stage.y()) / stage.scaleY()
			};

			// Then convert to image coordinates (canvas and image are the same in our case)
			return canvasPoint;
		},

		/**
		 * Convert image coordinates to screen coordinates
		 */
		imageToScreen: (point: Point): Point => {
			if (!stage) return point;

			// Image coordinates are the same as canvas coordinates
			return {
				x: point.x * stage.scaleX() + stage.x(),
				y: point.y * stage.scaleY() + stage.y()
			};
		},

		/**
		 * Convert canvas coordinates to image coordinates
		 */
		canvasToImage: (point: Point): Point => {
			// Canvas and image coordinates are the same in our implementation
			return point;
		},

		/**
		 * Convert image coordinates to canvas coordinates
		 */
		imageToCanvas: (point: Point): Point => {
			// Canvas and image coordinates are the same in our implementation
			return point;
		}
	};
}

/**
 * Calculate the bounds that fit an image within a container while maintaining aspect ratio
 */
export function calculateImageFit(
	imageWidth: number,
	imageHeight: number,
	containerWidth: number,
	containerHeight: number
): { width: number; height: number; x: number; y: number; scale: number } {
	const imageAspect = imageWidth / imageHeight;
	const containerAspect = containerWidth / containerHeight;

	let fitWidth: number;
	let fitHeight: number;

	if (imageAspect > containerAspect) {
		// Image is wider than container aspect ratio
		fitWidth = containerWidth;
		fitHeight = containerWidth / imageAspect;
	} else {
		// Image is taller than container aspect ratio
		fitHeight = containerHeight;
		fitWidth = containerHeight * imageAspect;
	}

	const x = (containerWidth - fitWidth) / 2;
	const y = (containerHeight - fitHeight) / 2;
	const scale = fitWidth / imageWidth;

	return { width: fitWidth, height: fitHeight, x, y, scale };
}

/**
 * Normalize a rectangle to ensure positive width and height
 */
export function normalizeRectangle(rect: Rectangle): Rectangle {
	const x = rect.width < 0 ? rect.x + rect.width : rect.x;
	const y = rect.height < 0 ? rect.y + rect.height : rect.y;
	const width = Math.abs(rect.width);
	const height = Math.abs(rect.height);

	return { x, y, width, height };
}

/**
 * Check if a point is near a rectangle edge (for resize handles)
 */
export function getResizeHandle(
	point: Point,
	rect: Rectangle,
	tolerance: number = 8
): 'nw' | 'n' | 'ne' | 'w' | 'e' | 'sw' | 's' | 'se' | null {
	const { x, y, width, height } = rect;
	const right = x + width;
	const bottom = y + height;

	// Check corners first (higher priority)
	if (isNear(point.x, x, tolerance) && isNear(point.y, y, tolerance)) return 'nw';
	if (isNear(point.x, right, tolerance) && isNear(point.y, y, tolerance)) return 'ne';
	if (isNear(point.x, x, tolerance) && isNear(point.y, bottom, tolerance)) return 'sw';
	if (isNear(point.x, right, tolerance) && isNear(point.y, bottom, tolerance)) return 'se';

	// Check edges
	if (isNear(point.y, y, tolerance) && point.x >= x - tolerance && point.x <= right + tolerance)
		return 'n';
	if (
		isNear(point.y, bottom, tolerance) &&
		point.x >= x - tolerance &&
		point.x <= right + tolerance
	)
		return 's';
	if (isNear(point.x, x, tolerance) && point.y >= y - tolerance && point.y <= bottom + tolerance)
		return 'w';
	if (
		isNear(point.x, right, tolerance) &&
		point.y >= y - tolerance &&
		point.y <= bottom + tolerance
	)
		return 'e';

	return null;
}

/**
 * Check if two numbers are close within a tolerance
 */
function isNear(a: number, b: number, tolerance: number): boolean {
	return Math.abs(a - b) <= tolerance;
}

/**
 * Apply a resize operation to a rectangle
 */
export function applyResize(
	rect: Rectangle,
	handle: 'nw' | 'n' | 'ne' | 'w' | 'e' | 'sw' | 's' | 'se',
	point: Point,
	minSize: number = 10
): Rectangle {
	let { x, y, width, height } = rect;

	switch (handle) {
		case 'nw':
			width = Math.max(minSize, x + width - point.x);
			height = Math.max(minSize, y + height - point.y);
			x = x + rect.width - width;
			y = y + rect.height - height;
			break;
		case 'n':
			height = Math.max(minSize, y + height - point.y);
			y = y + rect.height - height;
			break;
		case 'ne':
			width = Math.max(minSize, point.x - x);
			height = Math.max(minSize, y + height - point.y);
			y = y + rect.height - height;
			break;
		case 'w':
			width = Math.max(minSize, x + width - point.x);
			x = x + rect.width - width;
			break;
		case 'e':
			width = Math.max(minSize, point.x - x);
			break;
		case 'sw':
			width = Math.max(minSize, x + width - point.x);
			height = Math.max(minSize, point.y - y);
			x = x + rect.width - width;
			break;
		case 's':
			height = Math.max(minSize, point.y - y);
			break;
		case 'se':
			width = Math.max(minSize, point.x - x);
			height = Math.max(minSize, point.y - y);
			break;
	}

	return { x, y, width, height };
}

/**
 * Get cursor style for resize handle
 */
export function getResizeCursor(handle: 'nw' | 'n' | 'ne' | 'w' | 'e' | 'sw' | 's' | 'se'): string {
	switch (handle) {
		case 'nw':
		case 'se':
			return 'nw-resize';
		case 'ne':
		case 'sw':
			return 'ne-resize';
		case 'n':
		case 's':
			return 'ns-resize';
		case 'w':
		case 'e':
			return 'ew-resize';
		default:
			return 'default';
	}
}

/**
 * Convert percentage-based coordinates to absolute pixels
 */
export function percentageToPixels(
	percent: { x: number; y: number; width: number; height: number },
	imageSize: { width: number; height: number }
): Rectangle {
	return {
		x: (percent.x / 100) * imageSize.width,
		y: (percent.y / 100) * imageSize.height,
		width: (percent.width / 100) * imageSize.width,
		height: (percent.height / 100) * imageSize.height
	};
}

/**
 * Convert absolute pixels to percentage-based coordinates
 */
export function pixelsToPercentage(
	pixels: Rectangle,
	imageSize: { width: number; height: number }
): { x: number; y: number; width: number; height: number } {
	return {
		x: (pixels.x / imageSize.width) * 100,
		y: (pixels.y / imageSize.height) * 100,
		width: (pixels.width / imageSize.width) * 100,
		height: (pixels.height / imageSize.height) * 100
	};
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
	func: T,
	delay: number
): (...args: Parameters<T>) => void {
	let timeoutId: ReturnType<typeof setTimeout>;

	return (...args: Parameters<T>) => {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => func(...args), delay);
	};
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
	func: T,
	delay: number
): (...args: Parameters<T>) => void {
	let lastCall = 0;

	return (...args: Parameters<T>) => {
		const now = Date.now();
		if (now - lastCall >= delay) {
			lastCall = now;
			func(...args);
		}
	};
}
