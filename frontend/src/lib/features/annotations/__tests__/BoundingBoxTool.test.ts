import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BoundingBoxTool } from '../BoundingBoxTool';
import type { ClientAnnotation, CanvasState, CoordinateTransform } from '../types';
import {
	mockCanvasState,
	mockCoordinateTransform,
	mockClientAnnotation,
	mockAnnotationPointerEvent,
	mockPoint,
	mockRectangle,
	mockKeyboardEvent
} from './mocks';

describe('BoundingBoxTool', () => {
	let canvasState: CanvasState;
	let transform: CoordinateTransform;
	let callbacks: {
		onAnnotationCreate: ReturnType<typeof vi.fn>;
		onAnnotationUpdate: ReturnType<typeof vi.fn>;
		onAnnotationDelete: ReturnType<typeof vi.fn>;
	};
	let tool: BoundingBoxTool;

	beforeEach(() => {
		canvasState = mockCanvasState({
			imageWidth: 800,
			imageHeight: 600
		});
		transform = mockCoordinateTransform();
		callbacks = {
			onAnnotationCreate: vi.fn(),
			onAnnotationUpdate: vi.fn(),
			onAnnotationDelete: vi.fn()
		};
		tool = new BoundingBoxTool(canvasState, transform, callbacks);
	});

	describe('constructor', () => {
		it('should initialize with default state', () => {
			expect(tool.isActive()).toBe(false);
			expect(tool.getCursor()).toBe('crosshair');
			expect(tool.getSelectedAnnotation()).toBe(null);
		});
	});

	describe('drawing new annotations', () => {
		it('should start drawing on pointer down in empty space', () => {
			const event = mockAnnotationPointerEvent({
				point: mockPoint({ x: 100, y: 100 }),
				target: undefined
			});

			tool.onPointerDown(event);

			expect(canvasState.mode).toBe('draw');
			expect(canvasState.isDrawing).toBe(true);
			expect(canvasState.drawingStartPos).toEqual(event.point);
		});

		it('should update drawing rectangle on pointer move', () => {
			// Start drawing
			const startEvent = mockAnnotationPointerEvent({
				point: mockPoint({ x: 50, y: 60 }),
				target: undefined
			});
			tool.onPointerDown(startEvent);

			// Move pointer
			const moveEvent = mockAnnotationPointerEvent({
				point: mockPoint({ x: 150, y: 140 }),
				target: undefined
			});
			tool.onPointerMove(moveEvent);

			expect(canvasState.drawingCurrentPos).toEqual(moveEvent.point);

			const drawingRect = tool.getDrawingRect();
			expect(drawingRect).toEqual({
				x: 50,
				y: 60,
				width: 100,
				height: 80
			});
		});

		it('should create annotation on pointer up with valid size', () => {
			// Start drawing
			tool.onPointerDown(
				mockAnnotationPointerEvent({
					point: mockPoint({ x: 50, y: 60 }),
					target: undefined
				})
			);

			// Move to create rectangle
			tool.onPointerMove(
				mockAnnotationPointerEvent({
					point: mockPoint({ x: 150, y: 140 }),
					target: undefined
				})
			);

			// Complete drawing
			tool.onPointerUp(
				mockAnnotationPointerEvent({
					point: mockPoint({ x: 150, y: 140 }),
					target: undefined
				})
			);

			expect(callbacks.onAnnotationCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'bbox',
					bounds: {
						x: 50,
						y: 60,
						width: 100,
						height: 80
					}
				})
			);

			expect(canvasState.mode).toBe('view');
			expect(canvasState.isDrawing).toBe(false);
		});

		it('should not create annotation with insufficient size', () => {
			// Start drawing
			tool.onPointerDown(
				mockAnnotationPointerEvent({
					point: mockPoint({ x: 50, y: 60 }),
					target: undefined
				})
			);

			// Move just a little (less than minimum size)
			tool.onPointerMove(
				mockAnnotationPointerEvent({
					point: mockPoint({ x: 55, y: 65 }),
					target: undefined
				})
			);

			// Complete drawing
			tool.onPointerUp(
				mockAnnotationPointerEvent({
					point: mockPoint({ x: 55, y: 65 }),
					target: undefined
				})
			);

			expect(callbacks.onAnnotationCreate).not.toHaveBeenCalled();
		});

		it('should handle negative width/height during drawing', () => {
			// Start drawing
			tool.onPointerDown(
				mockAnnotationPointerEvent({
					point: mockPoint({ x: 150, y: 140 }),
					target: undefined
				})
			);

			// Move to create rectangle with negative dimensions
			tool.onPointerMove(
				mockAnnotationPointerEvent({
					point: mockPoint({ x: 50, y: 60 }),
					target: undefined
				})
			);

			const drawingRect = tool.getDrawingRect();
			expect(drawingRect).toEqual({
				x: 50,
				y: 60,
				width: 100,
				height: 80
			});
		});
	});

	describe('selecting annotations', () => {
		let existingAnnotation: ClientAnnotation;

		beforeEach(() => {
			existingAnnotation = mockClientAnnotation({
				id: 'test-annotation',
				bounds: mockRectangle({ x: 100, y: 100, width: 50, height: 40 })
			});
		});

		it('should select annotation on pointer down', () => {
			const event = mockAnnotationPointerEvent({
				point: mockPoint({ x: 120, y: 120 }),
				target: existingAnnotation
			});

			tool.onPointerDown(event);

			expect(existingAnnotation.isSelected).toBe(true);
			expect(canvasState.mode).toBe('edit');
			expect(callbacks.onAnnotationUpdate).toHaveBeenCalledWith(existingAnnotation.id, {
				isSelected: true
			});
		});

		it('should deselect previous annotation when selecting new one', () => {
			const firstAnnotation = mockClientAnnotation({ id: 'first' });
			const secondAnnotation = mockClientAnnotation({ id: 'second' });

			// Select first annotation
			tool.selectAnnotation(firstAnnotation);
			expect(firstAnnotation.isSelected).toBe(true);

			// Select second annotation
			const event = mockAnnotationPointerEvent({
				point: mockPoint({ x: 120, y: 120 }),
				target: secondAnnotation
			});
			tool.onPointerDown(event);

			expect(firstAnnotation.isSelected).toBe(false);
			expect(secondAnnotation.isSelected).toBe(true);
		});

		it('should deselect annotation when clicking empty space', () => {
			// First select an annotation
			tool.selectAnnotation(existingAnnotation);
			expect(existingAnnotation.isSelected).toBe(true);

			// Click empty space
			const event = mockAnnotationPointerEvent({
				point: mockPoint({ x: 300, y: 300 }),
				target: undefined
			});
			tool.onPointerDown(event);

			expect(existingAnnotation.isSelected).toBe(false);
			expect(callbacks.onAnnotationUpdate).toHaveBeenCalledWith(existingAnnotation.id, {
				isSelected: false
			});
		});
	});

	describe('moving annotations', () => {
		let annotation: ClientAnnotation;

		beforeEach(() => {
			annotation = mockClientAnnotation({
				id: 'movable',
				bounds: mockRectangle({ x: 100, y: 100, width: 50, height: 40 })
			});

			// Select the annotation first
			const selectEvent = mockAnnotationPointerEvent({
				point: mockPoint({ x: 120, y: 120 }),
				target: annotation
			});
			tool.onPointerDown(selectEvent);
		});

		it('should move annotation on drag', () => {
			// Start moving
			const moveEvent = mockAnnotationPointerEvent({
				point: mockPoint({ x: 140, y: 130 }),
				target: undefined
			});
			tool.onPointerMove(moveEvent);

			// Should move by the difference, accounting for drag offset
			const expectedX = 140 - 20; // New X minus offset (120 - 100)
			const expectedY = 130 - 20; // New Y minus offset (120 - 100)

			expect(annotation.bounds.x).toBe(expectedX);
			expect(annotation.bounds.y).toBe(expectedY);
			expect(callbacks.onAnnotationUpdate).toHaveBeenCalledWith(
				annotation.id,
				expect.objectContaining({
					bounds: expect.objectContaining({
						x: expectedX,
						y: expectedY
					})
				})
			);
		});

		it('should constrain movement to image bounds', () => {
			// Try to move annotation outside image bounds
			const moveEvent = mockAnnotationPointerEvent({
				point: mockPoint({ x: -50, y: -50 }),
				target: undefined
			});
			tool.onPointerMove(moveEvent);

			// Should be constrained to image bounds
			expect(annotation.bounds.x).toBe(0);
			expect(annotation.bounds.y).toBe(0);
		});

		it('should complete move on pointer up', () => {
			// Move annotation
			tool.onPointerMove(
				mockAnnotationPointerEvent({
					point: mockPoint({ x: 140, y: 130 }),
					target: undefined
				})
			);

			// Complete move
			tool.onPointerUp(
				mockAnnotationPointerEvent({
					point: mockPoint({ x: 140, y: 130 }),
					target: undefined
				})
			);

			expect(canvasState.mode).toBe('view');
		});
	});

	describe('resizing annotations', () => {
		let annotation: ClientAnnotation;

		beforeEach(() => {
			annotation = mockClientAnnotation({
				id: 'resizable',
				bounds: mockRectangle({ x: 100, y: 100, width: 100, height: 80 })
			});

			// Mock getResizeHandle to return a handle
			vi.doMock('../utils', async () => {
				const actual = await vi.importActual('../utils');
				return {
					...actual,
					getResizeHandle: vi.fn(() => 'se') // Southeast handle
				};
			});
		});

		it('should start resize when clicking on resize handle', () => {
			const event = mockAnnotationPointerEvent({
				point: mockPoint({ x: 200, y: 180 }), // Southeast corner
				target: annotation
			});

			tool.onPointerDown(event);

			expect(canvasState.mode).toBe('edit');
		});

		it('should update annotation bounds during resize', () => {
			// Start resize (simulate southeast handle)
			const startEvent = mockAnnotationPointerEvent({
				point: mockPoint({ x: 200, y: 180 }),
				target: annotation
			});
			tool.onPointerDown(startEvent);

			// Move to resize
			const resizeEvent = mockAnnotationPointerEvent({
				point: mockPoint({ x: 220, y: 200 }),
				target: undefined
			});
			tool.onPointerMove(resizeEvent);

			// Bounds should be updated (exact values depend on applyResize implementation)
			expect(callbacks.onAnnotationUpdate).toHaveBeenCalledWith(
				annotation.id,
				expect.objectContaining({
					bounds: expect.any(Object)
				})
			);
		});

		it('should complete resize on pointer up', () => {
			// Start and perform resize
			tool.onPointerDown(
				mockAnnotationPointerEvent({
					point: mockPoint({ x: 200, y: 180 }),
					target: annotation
				})
			);

			tool.onPointerMove(
				mockAnnotationPointerEvent({
					point: mockPoint({ x: 220, y: 200 }),
					target: undefined
				})
			);

			// Complete resize
			tool.onPointerUp(
				mockAnnotationPointerEvent({
					point: mockPoint({ x: 220, y: 200 }),
					target: undefined
				})
			);

			expect(canvasState.mode).toBe('view');
		});
	});

	describe('keyboard events', () => {
		let annotation: ClientAnnotation;

		beforeEach(() => {
			annotation = mockClientAnnotation({ id: 'keyboard-test' });
			tool.selectAnnotation(annotation);
		});

		it('should delete selected annotation on Delete key', () => {
			const deleteEvent = mockKeyboardEvent('Delete');

			tool.onKeyDown(deleteEvent);

			expect(callbacks.onAnnotationDelete).toHaveBeenCalledWith(annotation.id);
			expect(tool.getSelectedAnnotation()).toBe(null);
		});

		it('should delete selected annotation on Backspace key', () => {
			const backspaceEvent = mockKeyboardEvent('Backspace');

			tool.onKeyDown(backspaceEvent);

			expect(callbacks.onAnnotationDelete).toHaveBeenCalledWith(annotation.id);
		});

		it('should cancel drawing on Escape key', () => {
			// Start drawing
			tool.onPointerDown(
				mockAnnotationPointerEvent({
					point: mockPoint({ x: 50, y: 60 }),
					target: undefined
				})
			);

			expect(canvasState.isDrawing).toBe(true);

			// Press Escape
			const escapeEvent = mockKeyboardEvent('Escape');
			tool.onKeyDown(escapeEvent);

			expect(canvasState.isDrawing).toBe(false);
			expect(canvasState.mode).toBe('view');
		});

		it('should deselect annotation on Escape key', () => {
			expect(annotation.isSelected).toBe(true);

			const escapeEvent = mockKeyboardEvent('Escape');
			tool.onKeyDown(escapeEvent);

			expect(annotation.isSelected).toBe(false);
			expect(tool.getSelectedAnnotation()).toBe(null);
		});
	});

	describe('tool activation', () => {
		it('should set active tool and cursor on activate', () => {
			tool.onActivate();

			expect(canvasState.activeTool).toBe('bbox');
		});

		it('should reset state on deactivate', () => {
			// Set up some state
			const annotation = mockClientAnnotation();
			tool.selectAnnotation(annotation);

			// Start drawing
			tool.onPointerDown(
				mockAnnotationPointerEvent({
					point: mockPoint({ x: 50, y: 60 }),
					target: undefined
				})
			);

			// Deactivate
			tool.onDeactivate();

			expect(annotation.isSelected).toBe(false);
			expect(canvasState.isDrawing).toBe(false);
			expect(canvasState.mode).toBe('view');
		});
	});

	describe('cursor management', () => {
		it('should return appropriate cursor for current state', () => {
			// Default state
			expect(tool.getCursor()).toBe('crosshair');

			// During drawing (this would require accessing private state)
			// We test this through the isActive method behavior
		});

		it('should report active state correctly', () => {
			expect(tool.isActive()).toBe(false);

			// Start drawing
			tool.onPointerDown(
				mockAnnotationPointerEvent({
					point: mockPoint({ x: 50, y: 60 }),
					target: undefined
				})
			);

			expect(tool.isActive()).toBe(true);
		});
	});

	describe('annotation management', () => {
		it('should get current selected annotation', () => {
			expect(tool.getSelectedAnnotation()).toBe(null);

			const annotation = mockClientAnnotation();
			tool.selectAnnotation(annotation);

			expect(tool.getSelectedAnnotation()).toBe(annotation);
		});

		it('should select annotation programmatically', () => {
			const annotation = mockClientAnnotation();

			tool.selectAnnotation(annotation);

			expect(annotation.isSelected).toBe(true);
			expect(callbacks.onAnnotationUpdate).toHaveBeenCalledWith(annotation.id, {
				isSelected: true
			});
		});

		it('should deselect annotation when selecting null', () => {
			const annotation = mockClientAnnotation();
			tool.selectAnnotation(annotation);

			tool.selectAnnotation(null);

			expect(annotation.isSelected).toBe(false);
			expect(tool.getSelectedAnnotation()).toBe(null);
		});
	});

	describe('drawing rectangle preview', () => {
		it('should return null when not drawing', () => {
			expect(tool.getDrawingRect()).toBe(null);
		});

		it('should return current drawing rectangle', () => {
			// Start drawing
			tool.onPointerDown(
				mockAnnotationPointerEvent({
					point: mockPoint({ x: 50, y: 60 }),
					target: undefined
				})
			);

			// Move pointer
			tool.onPointerMove(
				mockAnnotationPointerEvent({
					point: mockPoint({ x: 150, y: 140 }),
					target: undefined
				})
			);

			const rect = tool.getDrawingRect();
			expect(rect).toEqual({
				x: 50,
				y: 60,
				width: 100,
				height: 80
			});
		});

		it('should handle drawing rectangle with negative dimensions', () => {
			// Start drawing
			tool.onPointerDown(
				mockAnnotationPointerEvent({
					point: mockPoint({ x: 150, y: 140 }),
					target: undefined
				})
			);

			// Move to create negative rectangle
			tool.onPointerMove(
				mockAnnotationPointerEvent({
					point: mockPoint({ x: 50, y: 60 }),
					target: undefined
				})
			);

			const rect = tool.getDrawingRect();
			// Should be normalized
			expect(rect).toEqual({
				x: 50,
				y: 60,
				width: 100,
				height: 80
			});
		});
	});

	describe('edge cases', () => {
		it('should handle rapid pointer events', () => {
			// Rapid down/up without move
			tool.onPointerDown(
				mockAnnotationPointerEvent({
					point: mockPoint({ x: 50, y: 60 }),
					target: undefined
				})
			);

			tool.onPointerUp(
				mockAnnotationPointerEvent({
					point: mockPoint({ x: 50, y: 60 }),
					target: undefined
				})
			);

			// Should not create annotation (no movement)
			expect(callbacks.onAnnotationCreate).not.toHaveBeenCalled();
		});

		it('should handle pointer events without valid state', () => {
			// Move without starting to draw
			tool.onPointerMove(
				mockAnnotationPointerEvent({
					point: mockPoint({ x: 100, y: 100 }),
					target: undefined
				})
			);

			// Should not throw error or change state significantly
			expect(canvasState.isDrawing).toBe(false);
		});

		it('should handle annotation updates without selected annotation', () => {
			// Try to move without selection
			tool.onPointerMove(
				mockAnnotationPointerEvent({
					point: mockPoint({ x: 100, y: 100 }),
					target: undefined
				})
			);

			// Should not call update callback
			expect(callbacks.onAnnotationUpdate).not.toHaveBeenCalled();
		});
	});
});
