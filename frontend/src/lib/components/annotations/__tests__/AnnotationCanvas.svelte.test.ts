import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import AnnotationCanvas from '../AnnotationCanvas.svelte';

// Mock Konva for browser environment
vi.mock('konva', () => ({
	Stage: vi.fn(() => ({
		container: vi.fn(),
		width: vi.fn(),
		height: vi.fn(),
		add: vi.fn(),
		destroy: vi.fn(),
		on: vi.fn(),
		off: vi.fn(),
		getPointerPosition: vi.fn(() => ({ x: 100, y: 100 })),
		batchDraw: vi.fn(),
		scale: vi.fn(),
		scaleX: vi.fn(() => 1),
		scaleY: vi.fn(() => 1),
		x: vi.fn(() => 0),
		y: vi.fn(() => 0),
		position: vi.fn()
	})),
	Layer: vi.fn(() => ({
		add: vi.fn(),
		draw: vi.fn(),
		batchDraw: vi.fn(),
		destroy: vi.fn(),
		destroyChildren: vi.fn()
	})),
	Image: vi.fn(() => ({
		image: vi.fn(),
		width: vi.fn(),
		height: vi.fn(),
		x: vi.fn(),
		y: vi.fn()
	})),
	Rect: vi.fn(() => ({
		x: vi.fn(),
		y: vi.fn(),
		width: vi.fn(),
		height: vi.fn(),
		stroke: vi.fn(),
		strokeWidth: vi.fn(),
		dash: vi.fn(),
		fill: vi.fn()
	})),
	Group: vi.fn(() => ({
		add: vi.fn(),
		destroy: vi.fn(),
		draggable: vi.fn(),
		on: vi.fn()
	})),
	Text: vi.fn(() => ({
		text: vi.fn(),
		fontSize: vi.fn(),
		fill: vi.fn()
	})),
	Transformer: vi.fn(() => ({
		nodes: vi.fn(),
		enabledAnchors: vi.fn()
	}))
}));

// Mock annotation store
vi.mock('$lib/features/annotations/store.svelte', () => ({
	annotationStore: {
		annotations: [],
		canvas: {
			imageWidth: 800,
			imageHeight: 600,
			canvasWidth: 500,
			canvasHeight: 400,
			zoom: 1,
			panX: 0,
			panY: 0,
			mode: 'view',
			activeTool: 'select',
			selectedAnnotationId: null,
			hoveredAnnotationId: null,
			isDrawing: false,
			drawingStartPos: null,
			drawingCurrentPos: null
		},
		setActiveTool: vi.fn(),
		selectAnnotation: vi.fn(),
		setHoveredAnnotation: vi.fn(),
		updateCanvasState: vi.fn(),
		getStats: vi.fn(() => ({ total: 0, selected: 0, withText: 0, withTags: 0 }))
	}
}));

// Mock BoundingBoxTool
vi.mock('$lib/features/annotations/BoundingBoxTool', () => ({
	BoundingBoxTool: vi.fn(() => ({
		onPointerDown: vi.fn(),
		onPointerMove: vi.fn(),
		onPointerUp: vi.fn(),
		onKeyDown: vi.fn(),
		onActivate: vi.fn(),
		onDeactivate: vi.fn(),
		getCursor: vi.fn(() => 'crosshair'),
		isActive: vi.fn(() => false),
		getDrawingRect: vi.fn(() => null),
		getSelectedAnnotation: vi.fn(() => null)
	}))
}));

// Mock coordinate transformation utilities
vi.mock('$lib/features/annotations/utils', () => ({
	createCoordinateTransform: vi.fn(() => ({
		screenToCanvas: vi.fn((point) => point),
		canvasToScreen: vi.fn((point) => point),
		screenToImage: vi.fn((point) => point),
		imageToScreen: vi.fn((point) => point),
		canvasToImage: vi.fn((point) => point),
		imageToCanvas: vi.fn((point) => point)
	})),
	calculateImageFit: vi.fn(() => ({
		width: 400,
		height: 300,
		x: 50,
		y: 75,
		scale: 0.5
	}))
}));

describe('AnnotationCanvas', () => {
	const defaultProps = {
		imageUrl: '/test-image.jpg',
		imageWidth: 800,
		imageHeight: 600,
		annotations: []
	};

	beforeEach(() => {
		// Reset mocks
		vi.clearAllMocks();

		// Mock Image constructor if not already mocked
		if (!globalThis.Image || !vi.isMockFunction(globalThis.Image)) {
			globalThis.Image = vi.fn().mockImplementation(() => {
				const img = {
					crossOrigin: '',
					src: '',
					naturalWidth: 800,
					naturalHeight: 600,
					onload: null as (() => void) | null,
					onerror: null as (() => void) | null,
					addEventListener: vi.fn(),
					removeEventListener: vi.fn()
				};

				// Simulate successful image load
				setTimeout(() => {
					if (img.onload) img.onload();
				}, 0);

				return img;
			}) as unknown as new (width?: number, height?: number) => HTMLImageElement;
		}
	});

	describe('rendering', () => {
		it('should render canvas container', () => {
			render(AnnotationCanvas, { props: defaultProps });
			expect(screen.getByTestId('annotation-canvas')).toBeInTheDocument();
		});

		it('should accept image URL prop', () => {
			const { component } = render(AnnotationCanvas, { props: defaultProps });
			expect(component).toBeDefined();
		});

		it('should accept annotations prop', () => {
			const annotations = [
				{
					id: 'ann-1',
					type: 'bbox' as const,
					bounds: { x: 10, y: 10, width: 100, height: 100 },
					annotation: { text: 'Test', tags: [] },
					createdAt: new Date(),
					updatedAt: new Date(),
					isSelected: false
				}
			];
			const { component } = render(AnnotationCanvas, {
				props: { ...defaultProps, annotations }
			});
			expect(component).toBeDefined();
		});
	});

	describe('initialization', () => {
		it('should initialize with provided dimensions', () => {
			render(AnnotationCanvas, {
				props: {
					...defaultProps,
					imageWidth: 1920,
					imageHeight: 1080
				}
			});
			expect(screen.getByTestId('annotation-canvas')).toBeInTheDocument();
		});

		it('should handle missing image URL gracefully', () => {
			render(AnnotationCanvas, {
				props: {
					...defaultProps,
					imageUrl: ''
				}
			});
			expect(screen.getByTestId('annotation-canvas')).toBeInTheDocument();
		});
	});
});
