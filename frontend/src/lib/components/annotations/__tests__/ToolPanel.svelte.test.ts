/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import ToolPanel from '../ToolPanel.svelte';
import { annotationStore } from '$lib/features/annotations/store.svelte';
import {
	mockCanvasState,
	mockClientAnnotation,
	resetMockCounter
} from '$lib/features/annotations/__tests__/mocks';

// Mock the annotation store using vi.hoisted - move functions outside to avoid dependency issues
const mockAnnotationStoreInstance = vi.hoisted(() => {
	// Create a basic canvas state inline to avoid import issues
	const defaultCanvasState = {
		imageWidth: 800,
		imageHeight: 600,
		canvasWidth: 500,
		canvasHeight: 400,
		zoom: 1,
		panX: 0,
		panY: 0,
		mode: 'view' as const,
		activeTool: 'select' as const,
		selectedAnnotationId: null,
		hoveredAnnotationId: null,
		isDrawing: false,
		drawingStartPos: null,
		drawingCurrentPos: null
	};

	const store = {
		canvas: defaultCanvasState,
		annotations: [],
		selectedAnnotation: vi.fn(() => null),
		setActiveTool: vi.fn(),
		undo: vi.fn(),
		redo: vi.fn(),
		deleteAnnotation: vi.fn(),
		clearAnnotations: vi.fn(),
		getStats: vi.fn(() => ({ total: 0, selected: 0, withText: 0, withTags: 0 })),
		getHasUnsavedChanges: vi.fn(() => false),
		_canUndo: false,
		_canRedo: false
	};

	// Define getters for canUndo and canRedo to simulate $derived behavior
	Object.defineProperty(store, 'canUndo', {
		get: function () {
			return this._canUndo;
		},
		set: function (value) {
			this._canUndo = value;
		},
		configurable: true
	});

	Object.defineProperty(store, 'canRedo', {
		get: function () {
			return this._canRedo;
		},
		set: function (value) {
			this._canRedo = value;
		},
		configurable: true
	});

	return {
		annotationStore: store
	};
});

vi.mock('$lib/features/annotations/store.svelte', () => mockAnnotationStoreInstance);

describe('ToolPanel', () => {
	const defaultProps = {
		vertical: false,
		compact: false,
		showLabels: true,
		onToolChange: vi.fn()
	};

	beforeEach(() => {
		resetMockCounter();

		// Reset store state
		Object.assign(annotationStore, {
			canvas: mockCanvasState({
				activeTool: 'select'
			}),
			annotations: [],
			selectedAnnotation: vi.fn(() => null),
			setActiveTool: vi.fn(),
			undo: vi.fn(),
			redo: vi.fn(),
			deleteAnnotation: vi.fn(),
			clearAnnotations: vi.fn(),
			getStats: vi.fn(() => ({ total: 0, selected: 0, withText: 0, withTags: 0 })),
			getHasUnsavedChanges: vi.fn(() => false),
			_canUndo: false,
			_canRedo: false
		});
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('rendering', () => {
		it('should render tool panel', () => {
			render(ToolPanel, { props: defaultProps });

			expect(screen.getByTestId('tool-panel')).toBeInTheDocument();
		});

		it('should render tool buttons', () => {
			render(ToolPanel, { props: defaultProps });

			expect(screen.getByTestId('tool-select')).toBeInTheDocument();
			expect(screen.getByTestId('tool-bbox')).toBeInTheDocument();
		});

		it('should render action buttons', () => {
			render(ToolPanel, { props: defaultProps });

			expect(screen.getByTestId('undo-button')).toBeInTheDocument();
			expect(screen.getByTestId('redo-button')).toBeInTheDocument();
		});
	});

	describe('tool selection', () => {
		it('should call setActiveTool when tool is clicked', async () => {
			render(ToolPanel, { props: defaultProps });

			const bboxTool = screen.getByTestId('tool-bbox');
			await fireEvent.click(bboxTool);

			expect(annotationStore.setActiveTool).toHaveBeenCalledWith('bbox');
		});

		it('should call onToolChange callback when tool is selected', async () => {
			const onToolChange = vi.fn();
			render(ToolPanel, { props: { ...defaultProps, onToolChange } });

			const bboxTool = screen.getByTestId('tool-bbox');
			await fireEvent.click(bboxTool);

			expect(onToolChange).toHaveBeenCalledWith('bbox');
		});

		it('should highlight active tool', () => {
			annotationStore.canvas.activeTool = 'bbox';

			render(ToolPanel, { props: defaultProps });

			const bboxTool = screen.getByTestId('tool-bbox');
			expect(bboxTool).toHaveClass('active');
		});
	});

	describe('undo/redo functionality', () => {
		it('should call undo when undo button is clicked', async () => {
			annotationStore.canUndo = vi.fn(() => true);
			render(ToolPanel, { props: defaultProps });

			const undoButton = screen.getByTestId('undo-button');
			await fireEvent.click(undoButton);

			expect(annotationStore.undo).toHaveBeenCalled();
		});

		it('should call redo when redo button is clicked', async () => {
			annotationStore.canRedo = vi.fn(() => true);
			render(ToolPanel, { props: defaultProps });

			const redoButton = screen.getByTestId('redo-button');
			await fireEvent.click(redoButton);

			expect(annotationStore.redo).toHaveBeenCalled();
		});

		it('should disable undo button when canUndo is false', () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(annotationStore as any).canUndo = false;
			render(ToolPanel, { props: defaultProps });

			const undoButton = screen.getByTestId('undo-button');
			expect(undoButton).toBeDisabled();
		});

		it('should disable redo button when canRedo is false', () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(annotationStore as any).canRedo = false;
			render(ToolPanel, { props: defaultProps });

			const redoButton = screen.getByTestId('redo-button');
			expect(redoButton).toBeDisabled();
		});
	});

	describe('keyboard shortcuts', () => {
		it('should handle tool keyboard shortcuts', async () => {
			render(ToolPanel, { props: defaultProps });

			// Press 'v' for select tool
			await fireEvent.keyDown(window, { key: 'v' });
			expect(annotationStore.setActiveTool).toHaveBeenCalledWith('select');

			// Press 'b' for bbox tool
			await fireEvent.keyDown(window, { key: 'b' });
			expect(annotationStore.setActiveTool).toHaveBeenCalledWith('bbox');
		});

		it('should handle undo shortcut (Ctrl+Z)', async () => {
			annotationStore.canUndo = vi.fn(() => true);
			render(ToolPanel, { props: defaultProps });

			await fireEvent.keyDown(window, { key: 'z', ctrlKey: true });
			expect(annotationStore.undo).toHaveBeenCalled();
		});

		it('should handle redo shortcut (Ctrl+Y)', async () => {
			annotationStore.canRedo = vi.fn(() => true);
			render(ToolPanel, { props: defaultProps });

			await fireEvent.keyDown(window, { key: 'y', ctrlKey: true });
			expect(annotationStore.redo).toHaveBeenCalled();
		});

		it('should handle redo shortcut (Ctrl+Shift+Z)', async () => {
			annotationStore.canRedo = vi.fn(() => true);
			render(ToolPanel, { props: defaultProps });

			await fireEvent.keyDown(window, { key: 'z', ctrlKey: true, shiftKey: true });
			expect(annotationStore.redo).toHaveBeenCalled();
		});
	});

	describe('clear annotations', () => {
		it('should call clearAnnotations when clear button is clicked', async () => {
			// Mock window.confirm to return true
			const originalConfirm = window.confirm;
			window.confirm = vi.fn(() => true);

			// Add some annotations so the clear button is enabled
			annotationStore.annotations = [mockClientAnnotation()];

			render(ToolPanel, { props: defaultProps });

			const clearButton = screen.getByTestId('clear-button');
			await fireEvent.click(clearButton);

			expect(window.confirm).toHaveBeenCalledWith('Delete all annotations? This cannot be undone.');
			expect(annotationStore.clearAnnotations).toHaveBeenCalled();

			// Restore original confirm
			window.confirm = originalConfirm;
		});
	});

	describe('layout variations', () => {
		it('should apply vertical class when vertical prop is true', () => {
			render(ToolPanel, { props: { ...defaultProps, vertical: true } });

			const toolPanel = screen.getByTestId('tool-panel');
			expect(toolPanel).toHaveClass('vertical');
		});

		it('should apply compact class when compact prop is true', () => {
			render(ToolPanel, { props: { ...defaultProps, compact: true } });

			const toolPanel = screen.getByTestId('tool-panel');
			expect(toolPanel).toHaveClass('compact');
		});

		it('should hide labels when showLabels is false', () => {
			render(ToolPanel, { props: { ...defaultProps, showLabels: false } });

			expect(screen.queryByText('Tools')).not.toBeInTheDocument();
			expect(screen.queryByText('Actions')).not.toBeInTheDocument();
		});

		it('should hide labels when compact is true', () => {
			render(ToolPanel, { props: { ...defaultProps, compact: true } });

			expect(screen.queryByText('Tools')).not.toBeInTheDocument();
			expect(screen.queryByText('Actions')).not.toBeInTheDocument();
		});
	});

	describe('accessibility', () => {
		it('should have proper ARIA labels', () => {
			render(ToolPanel, { props: defaultProps });

			const selectTool = screen.getByTestId('tool-select');
			expect(selectTool).toHaveAttribute('aria-label', 'Select');

			const bboxTool = screen.getByTestId('tool-bbox');
			expect(bboxTool).toHaveAttribute('aria-label', 'Bounding Box');

			const undoButton = screen.getByTestId('undo-button');
			expect(undoButton).toHaveAttribute('aria-label', 'Undo');

			const redoButton = screen.getByTestId('redo-button');
			expect(redoButton).toHaveAttribute('aria-label', 'Redo');
		});

		it('should have proper title attributes with shortcuts', () => {
			render(ToolPanel, { props: defaultProps });

			const selectTool = screen.getByTestId('tool-select');
			expect(selectTool).toHaveAttribute('title');
			expect(selectTool.getAttribute('title')).toContain('Select');
			expect(selectTool.getAttribute('title')).toContain('V');

			const undoButton = screen.getByTestId('undo-button');
			expect(undoButton).toHaveAttribute('title', 'Undo (Ctrl+Z)');
		});
	});
});
