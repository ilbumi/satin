import type {
	ClientAnnotation,
	CanvasState,
	AnnotationAction,
	CreateAnnotationForm,
	UpdateAnnotationForm,
	Point,
	Rectangle,
	AnnotationTool,
	CanvasMode
} from '../types';
import type { BBox, BBoxInput } from '$lib/graphql/generated/graphql';
import type { MockGraphQLClient } from './test-types';
import { vi } from 'vitest';

/**
 * Mock data factory for annotation tests
 */

let mockIdCounter = 1;

export function mockPoint(overrides?: Partial<Point>): Point {
	return {
		x: 100,
		y: 100,
		...overrides
	};
}

export function mockRectangle(overrides?: Partial<Rectangle>): Rectangle {
	return {
		x: 50,
		y: 50,
		width: 100,
		height: 80,
		...overrides
	};
}

export function mockClientAnnotation(overrides?: Partial<ClientAnnotation>): ClientAnnotation {
	const id = `annotation-${mockIdCounter++}`;
	return {
		id,
		type: 'bbox',
		bounds: mockRectangle(),
		annotation: {
			text: `Test annotation ${id}`,
			tags: ['test', 'mock']
		},
		isSelected: false,
		isEditing: false,
		isDragging: false,
		resizeHandle: null,
		createdAt: new Date('2024-01-01T10:00:00Z'),
		updatedAt: new Date('2024-01-01T10:00:00Z'),
		...overrides
	};
}

export function mockCanvasState(overrides?: Partial<CanvasState>): CanvasState {
	return {
		zoom: 1,
		panX: 0,
		panY: 0,
		imageWidth: 800,
		imageHeight: 600,
		canvasWidth: 1000,
		canvasHeight: 700,
		mode: 'view' as CanvasMode,
		activeTool: 'select' as AnnotationTool,
		isDragging: false,
		lastPointerPos: null,
		selectedAnnotationId: null,
		hoveredAnnotationId: null,
		isDrawing: false,
		drawingStartPos: null,
		drawingCurrentPos: null,
		...overrides
	};
}

type PartialAnnotationAction =
	| Partial<{ type: 'ADD_ANNOTATION'; annotation: ClientAnnotation }>
	| Partial<{ type: 'UPDATE_ANNOTATION'; id: string; annotation: Partial<ClientAnnotation> }>
	| Partial<{ type: 'DELETE_ANNOTATION'; id: string; annotation: ClientAnnotation }>
	| Partial<{ type: 'MOVE_ANNOTATION'; id: string; oldPosition: Point; newPosition: Point }>
	| Partial<{ type: 'RESIZE_ANNOTATION'; id: string; oldBounds: Rectangle; newBounds: Rectangle }>;

export function mockAnnotationAction(overrides?: PartialAnnotationAction): AnnotationAction {
	const baseAction: AnnotationAction = {
		type: 'ADD_ANNOTATION',
		annotation: mockClientAnnotation()
	};

	if (!overrides) {
		return baseAction;
	}

	// Handle specific action types correctly
	if (overrides.type === 'UPDATE_ANNOTATION') {
		const updateOverrides = overrides as Partial<{
			type: 'UPDATE_ANNOTATION';
			id: string;
			annotation: Partial<ClientAnnotation>;
		}>;
		return {
			type: 'UPDATE_ANNOTATION',
			id: updateOverrides.id || 'test-id',
			annotation: updateOverrides.annotation || {}
		};
	}

	if (overrides.type === 'DELETE_ANNOTATION') {
		const deleteOverrides = overrides as Partial<{
			type: 'DELETE_ANNOTATION';
			id: string;
			annotation: ClientAnnotation;
		}>;
		return {
			type: 'DELETE_ANNOTATION',
			id: deleteOverrides.id || 'test-id',
			annotation: deleteOverrides.annotation || mockClientAnnotation()
		};
	}

	if (overrides.type === 'MOVE_ANNOTATION') {
		const moveOverrides = overrides as Partial<{
			type: 'MOVE_ANNOTATION';
			id: string;
			oldPosition: Point;
			newPosition: Point;
		}>;
		return {
			type: 'MOVE_ANNOTATION',
			id: moveOverrides.id || 'test-id',
			oldPosition: moveOverrides.oldPosition || mockPoint(),
			newPosition: moveOverrides.newPosition || mockPoint()
		};
	}

	if (overrides.type === 'RESIZE_ANNOTATION') {
		const resizeOverrides = overrides as Partial<{
			type: 'RESIZE_ANNOTATION';
			id: string;
			oldBounds: Rectangle;
			newBounds: Rectangle;
		}>;
		return {
			type: 'RESIZE_ANNOTATION',
			id: resizeOverrides.id || 'test-id',
			oldBounds: resizeOverrides.oldBounds || mockRectangle(),
			newBounds: resizeOverrides.newBounds || mockRectangle()
		};
	}

	// Default to ADD_ANNOTATION
	return {
		...baseAction,
		...(overrides.type === 'ADD_ANNOTATION' ? overrides : {})
	};
}

export function mockCreateAnnotationForm(
	overrides?: Partial<CreateAnnotationForm>
): CreateAnnotationForm {
	return {
		type: 'bbox',
		bounds: mockRectangle(),
		annotation: {
			text: 'Test annotation',
			tags: ['test']
		},
		...overrides
	};
}

export function mockUpdateAnnotationForm(
	overrides?: Partial<UpdateAnnotationForm>
): UpdateAnnotationForm {
	return {
		id: 'annotation-1',
		bounds: mockRectangle(),
		annotation: {
			text: 'Updated annotation',
			tags: ['updated']
		},
		...overrides
	};
}

export function mockBBox(overrides?: Partial<BBox>): BBox {
	return {
		x: 50,
		y: 50,
		width: 100,
		height: 80,
		annotation: {
			text: 'Test bbox annotation',
			tags: ['test', 'bbox']
		},
		...overrides
	};
}

export function mockBBoxInput(overrides?: Partial<BBoxInput>): BBoxInput {
	return {
		x: 50,
		y: 50,
		width: 100,
		height: 80,
		annotation: {
			text: 'Test bbox input',
			tags: ['test', 'input']
		},
		...overrides
	};
}

export function mockTaskWithAnnotations(taskId: string = 'task-1', bboxes: BBox[] = []) {
	return {
		data: {
			task: {
				id: taskId,
				bboxes: bboxes
			}
		}
	};
}

export function mockUpdateTaskResponse(taskId: string = 'task-1', bboxes: BBox[] = []) {
	return {
		data: {
			updateTask: {
				id: taskId,
				bboxes: bboxes
			}
		}
	};
}

export function mockGraphQLError(message: string = 'Test error') {
	return {
		error: {
			message,
			networkError: null,
			graphQLErrors: [
				{
					message,
					locations: [],
					path: [],
					extensions: {}
				}
			]
		}
	};
}

export function mockKonvaStage() {
	return {
		x: vi.fn(() => 0),
		y: vi.fn(() => 0),
		scaleX: vi.fn(() => 1),
		scaleY: vi.fn(() => 1),
		width: vi.fn(() => 1000),
		height: vi.fn(() => 700),
		getPointerPosition: vi.fn(() => ({ x: 100, y: 100 })),
		on: vi.fn(),
		off: vi.fn(),
		draw: vi.fn(),
		add: vi.fn(),
		scale: vi.fn(),
		position: vi.fn(),
		getStage: vi.fn(function (this: unknown) {
			return this;
		}),
		container: vi.fn(() => {
			const div = document.createElement('div');
			div.getBoundingClientRect = vi.fn(() => ({
				left: 0,
				top: 0,
				width: 1000,
				height: 700,
				right: 1000,
				bottom: 700,
				x: 0,
				y: 0,
				toJSON: vi.fn()
			}));
			return div;
		})
	};
}

export function mockKonvaLayer() {
	return {
		add: vi.fn(),
		remove: vi.fn(),
		removeChildren: vi.fn(),
		draw: vi.fn(),
		batchDraw: vi.fn(),
		findOne: vi.fn(),
		find: vi.fn(() => []),
		destroyChildren: vi.fn(),
		listening: vi.fn(() => true),
		visible: vi.fn(() => true)
	};
}

export function mockKonvaRect() {
	return {
		x: vi.fn(() => 50),
		y: vi.fn(() => 50),
		width: vi.fn(() => 100),
		height: vi.fn(() => 80),
		fill: vi.fn(),
		stroke: vi.fn(),
		strokeWidth: vi.fn(),
		listening: vi.fn(),
		visible: vi.fn(),
		on: vi.fn(),
		off: vi.fn(),
		setAttrs: vi.fn(),
		attrs: {},
		destroy: vi.fn(),
		getClientRect: vi.fn(() => ({ x: 50, y: 50, width: 100, height: 80 }))
	};
}

export function mockPointerEvent(
	overrides?: Partial<{
		point: Point;
		target: ClientAnnotation | undefined;
		evt: {
			preventDefault: () => void;
			stopPropagation: () => void;
			button: number;
		};
	}>
): {
	point: Point;
	target: ClientAnnotation | undefined;
	evt: {
		preventDefault: () => void;
		stopPropagation: () => void;
		button: number;
	};
} {
	return {
		point: mockPoint(),
		target: undefined,
		evt: {
			preventDefault: vi.fn(),
			stopPropagation: vi.fn(),
			button: 0
		},
		...overrides
	};
}

export function mockAnnotationPointerEvent(
	overrides?: Partial<{
		point: Point;
		target: ClientAnnotation | undefined;
		originalEvent: PointerEvent;
	}>
): {
	point: Point;
	target: ClientAnnotation | undefined;
	originalEvent: PointerEvent;
} {
	// Create a minimal mock PointerEvent - handle cases where PointerEvent is not available
	let mockPointer: PointerEvent;

	if (typeof PointerEvent !== 'undefined') {
		mockPointer = new PointerEvent('pointerdown', {
			pointerId: 1,
			clientX: 100,
			clientY: 100,
			button: 0
		});
	} else {
		// Fallback for server-side or environments without PointerEvent
		mockPointer = {
			type: 'pointerdown',
			pointerId: 1,
			clientX: 100,
			clientY: 100,
			button: 0,
			ctrlKey: false,
			shiftKey: false,
			altKey: false,
			metaKey: false
		} as PointerEvent;
	}

	return {
		point: mockPoint(),
		target: undefined,
		originalEvent: mockPointer,
		...overrides
	};
}

export function mockKeyboardEvent(
	key: string = 'Enter',
	overrides?: Partial<KeyboardEvent>
): KeyboardEvent {
	const event = new KeyboardEvent('keydown', {
		key,
		ctrlKey: false,
		metaKey: false,
		shiftKey: false,
		altKey: false,
		...overrides
	});

	// Add preventDefault method for tests
	(
		event as KeyboardEvent & { preventDefault: () => void; stopPropagation: () => void }
	).preventDefault = vi.fn();
	(
		event as KeyboardEvent & { preventDefault: () => void; stopPropagation: () => void }
	).stopPropagation = vi.fn();

	return event;
}

export function mockImage(width: number = 800, height: number = 600) {
	const mockImg = {
		naturalWidth: width,
		naturalHeight: height,
		crossOrigin: '',
		src: '',
		onload: null as (() => void) | null,
		onerror: null as (() => void) | null,
		addEventListener: vi.fn(),
		removeEventListener: vi.fn()
	};

	// Simulate successful image load
	setTimeout(() => {
		if (mockImg.onload) {
			mockImg.onload();
		}
	}, 0);

	return mockImg;
}

export function mockCoordinateTransform() {
	return {
		screenToCanvas: vi.fn((point: Point) => point),
		canvasToScreen: vi.fn((point: Point) => point),
		screenToImage: vi.fn((point: Point) => point),
		imageToScreen: vi.fn((point: Point) => point),
		canvasToImage: vi.fn((point: Point) => point),
		imageToCanvas: vi.fn((point: Point) => point)
	};
}

export function mockAnnotationStore() {
	return {
		annotations: [],
		taskId: null,
		imageId: null,
		canvas: mockCanvasState(),
		history: [],
		historyIndex: -1,
		maxHistorySize: 50,
		loading: false,
		saving: false,
		error: null,
		toolPanelOpen: true,
		propertiesPanelOpen: true,
		canUndo: false,
		canRedo: false,
		selectedAnnotation: null,
		hoveredAnnotation: null,
		hasUnsavedChanges: false,
		getHasUnsavedChanges: vi.fn(() => false),
		initialize: vi.fn(),
		loadAnnotations: vi.fn(),
		addAnnotation: vi.fn(),
		updateAnnotation: vi.fn(),
		deleteAnnotation: vi.fn(),
		moveAnnotation: vi.fn(),
		resizeAnnotation: vi.fn(),
		undo: vi.fn(),
		redo: vi.fn(),
		selectAnnotation: vi.fn(),
		setHoveredAnnotation: vi.fn(),
		setActiveTool: vi.fn(),
		updateCanvasState: vi.fn(),
		clearAnnotations: vi.fn(),
		getStats: vi.fn(() => ({ total: 0, selected: 0, withText: 0, withTags: 0 })),
		exportAnnotations: vi.fn(() => []),
		reset: vi.fn()
	};
}

export function mockAnnotationService() {
	return {
		loadTaskAnnotations: vi.fn(() => Promise.resolve([mockClientAnnotation()])),
		saveTaskAnnotations: vi.fn(() => Promise.resolve()),
		createAnnotation: vi.fn((taskId: string, form: CreateAnnotationForm) =>
			Promise.resolve(mockClientAnnotation({ type: form.type, bounds: form.bounds }))
		),
		updateAnnotation: vi.fn(() => Promise.resolve()),
		deleteAnnotation: vi.fn(() => Promise.resolve()),
		bulkUpdateAnnotations: vi.fn(() => Promise.resolve()),
		validateAnnotation: vi.fn(() => ({ valid: true, errors: [] })),
		getAnnotationStats: vi.fn(() =>
			Promise.resolve({
				total: 0,
				withText: 0,
				withTags: 0,
				averageSize: 0
			})
		),
		exportAnnotations: vi.fn(() => Promise.resolve('[]'))
	};
}

export function mockGraphQLClient(): MockGraphQLClient {
	return {
		query: vi.fn() as MockGraphQLClient['query'],
		mutation: vi.fn() as MockGraphQLClient['mutation']
	};
}

export function resetMockCounter() {
	mockIdCounter = 1;
}

// Export vi for tests that need it
export { vi } from 'vitest';
