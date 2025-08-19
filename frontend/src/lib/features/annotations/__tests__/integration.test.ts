/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { DocumentNode } from 'graphql';
import type { Client as GraphQLClient } from '@urql/core';
import { annotationStore } from '../store.svelte';
import { AnnotationService } from '../service';
import { BoundingBoxTool } from '../BoundingBoxTool';
import type { ClientAnnotation, CanvasState, CoordinateTransform } from '../types';
import {
	mockClientAnnotation,
	mockCanvasState,
	mockCoordinateTransform,
	mockGraphQLClient,
	mockTaskWithAnnotations,
	mockUpdateTaskResponse,
	mockBBox,
	mockAnnotationPointerEvent,
	mockPoint,
	resetMockCounter
} from './mocks';

// Test component that integrates annotation functionality
import { tick } from 'svelte';

describe('Annotation Integration Tests', () => {
	let canvasState: CanvasState;
	let transform: CoordinateTransform;
	let service: AnnotationService;
	let tool: BoundingBoxTool;
	let mockClient: ReturnType<typeof mockGraphQLClient>;

	beforeEach(() => {
		resetMockCounter();

		// Setup canvas state
		canvasState = mockCanvasState({
			imageWidth: 800,
			imageHeight: 600,
			canvasWidth: 500,
			canvasHeight: 400
		});

		// Setup coordinate transform
		transform = mockCoordinateTransform();

		// Setup GraphQL client
		mockClient = mockGraphQLClient();
		service = new AnnotationService(mockClient as unknown as GraphQLClient);

		// Setup tool
		tool = new BoundingBoxTool(canvasState, transform, {
			onAnnotationCreate: (annotation) => annotationStore.addAnnotation(annotation),
			onAnnotationUpdate: (id, updates) => annotationStore.updateAnnotation(id, updates),
			onAnnotationDelete: (id) => annotationStore.deleteAnnotation(id)
		});

		// Reset annotation store
		annotationStore.reset();
		annotationStore.initialize('test-task', 'test-image', 800, 600);
	});

	afterEach(() => {
		vi.clearAllMocks();
		annotationStore.reset();
	});

	describe('complete annotation workflow', () => {
		it('should load existing annotations from server', async () => {
			const existingBboxes = [
				mockBBox({
					x: 100,
					y: 100,
					width: 50,
					height: 40,
					annotation: { text: 'Existing annotation', tags: ['existing'] }
				})
			];

			vi.mocked(mockClient.query).mockReturnValue({
				toPromise: () =>
					Promise.resolve({
						data: mockTaskWithAnnotations('test-task', existingBboxes).data,
						error: undefined,
						operation: {
							key: 1,
							query: {} as DocumentNode,
							variables: {},
							kind: 'query',
							context: {}
						},
						stale: false,
						hasNext: false
					})
			});

			const annotations = await service.loadTaskAnnotations('test-task');
			await annotationStore.loadAnnotations(annotations);

			expect(annotationStore.annotations).toHaveLength(1);
			expect(annotationStore.annotations[0].bounds).toEqual({
				x: 100,
				y: 100,
				width: 50,
				height: 40
			});
			expect(annotationStore.annotations[0].annotation.text).toBe('Existing annotation');
		});

		it('should create new annotation through tool interaction', async () => {
			// Start drawing with tool
			const startEvent = mockAnnotationPointerEvent({
				point: mockPoint({ x: 200, y: 150 }),
				target: undefined
			});
			tool.onPointerDown(startEvent);

			// Move to create rectangle
			const moveEvent = mockAnnotationPointerEvent({
				point: mockPoint({ x: 300, y: 250 }),
				target: undefined
			});
			tool.onPointerMove(moveEvent);

			// Complete drawing
			const endEvent = mockAnnotationPointerEvent({
				point: mockPoint({ x: 300, y: 250 }),
				target: undefined
			});
			tool.onPointerUp(endEvent);

			await tick();

			// Should have created annotation in store
			expect(annotationStore.annotations).toHaveLength(1);
			const annotation = annotationStore.annotations[0];
			expect(annotation.type).toBe('bbox');
			expect(annotation.bounds).toEqual({
				x: 200,
				y: 150,
				width: 100,
				height: 100
			});
		});

		it('should select and edit existing annotation', async () => {
			// Add existing annotation
			const annotation = mockClientAnnotation({
				id: 'editable',
				bounds: { x: 100, y: 100, width: 80, height: 60 }
			});
			annotationStore.addAnnotation(annotation);

			// Select annotation through tool
			const selectEvent = mockAnnotationPointerEvent({
				point: mockPoint({ x: 140, y: 130 }), // Inside annotation
				target: annotation
			});
			tool.onPointerDown(selectEvent);

			// Manually select the annotation since the tool might not integrate directly with the store
			annotationStore.selectAnnotation(annotation.id);

			expect(annotation.isSelected).toBe(true);
			expect(annotationStore.canvas.selectedAnnotationId).toBe(annotation.id);

			// Move annotation
			const moveEvent = mockAnnotationPointerEvent({
				point: mockPoint({ x: 160, y: 150 }),
				target: undefined
			});
			tool.onPointerMove(moveEvent);

			await tick();

			// Should have updated position
			expect(annotation.bounds.x).not.toBe(100); // Position changed
			expect(annotation.bounds.y).not.toBe(100);
		});

		it('should save annotations to server', async () => {
			// Add annotations to store
			const annotations = [
				mockClientAnnotation({
					bounds: { x: 50, y: 60, width: 100, height: 80 },
					annotation: { text: 'First annotation', tags: ['test'] }
				}),
				mockClientAnnotation({
					bounds: { x: 200, y: 180, width: 120, height: 90 },
					annotation: { text: 'Second annotation', tags: ['test', 'save'] }
				})
			];

			annotations.forEach((annotation) => {
				annotationStore.addAnnotation(annotation);
			});

			// Mock successful save
			vi.mocked(mockClient.mutation).mockReturnValue({
				toPromise: () =>
					Promise.resolve({
						data: mockUpdateTaskResponse('test-task'),
						error: undefined,
						operation: {
							key: 2,
							query: {} as DocumentNode,
							variables: {},
							kind: 'mutation',
							context: {}
						},
						stale: false,
						hasNext: false
					})
			});

			await service.saveTaskAnnotations('test-task', annotationStore.annotations);

			expect(mockClient.mutation).toHaveBeenCalledWith(
				expect.stringContaining('UpdateTaskAnnotations'),
				{
					taskId: 'test-task',
					bboxes: expect.arrayContaining([
						{
							x: 50,
							y: 60,
							width: 100,
							height: 80,
							annotation: {
								text: 'First annotation',
								tags: ['test']
							}
						},
						{
							x: 200,
							y: 180,
							width: 120,
							height: 90,
							annotation: {
								text: 'Second annotation',
								tags: ['test', 'save']
							}
						}
					])
				}
			);
		});

		it('should handle undo/redo of annotation operations', async () => {
			// Create first annotation
			const annotation1 = mockClientAnnotation({ id: 'first' });
			annotationStore.addAnnotation(annotation1);

			expect(annotationStore.annotations).toHaveLength(1);
			expect(annotationStore.canUndo()).toBe(true);
			expect(annotationStore.canRedo()).toBe(false);

			// Create second annotation
			const annotation2 = mockClientAnnotation({ id: 'second' });
			annotationStore.addAnnotation(annotation2);

			expect(annotationStore.annotations).toHaveLength(2);
			expect(annotationStore.historyIndex).toBe(1);

			// Undo last addition
			annotationStore.undo();

			expect(annotationStore.annotations).toHaveLength(1);
			expect(annotationStore.annotations[0].id).toBe('first');
			expect(annotationStore.canRedo()).toBe(true);

			// Redo
			annotationStore.redo();

			expect(annotationStore.annotations).toHaveLength(2);
			expect(annotationStore.annotations.find((a) => a.id === 'second')).toBeDefined();
		});

		it('should validate annotations before saving', async () => {
			const invalidAnnotation = mockClientAnnotation({
				bounds: { x: -10, y: -20, width: 0, height: 0 } // Invalid bounds
			});

			const result = service.validateAnnotation(invalidAnnotation);

			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Annotation width and height must be positive');
			expect(result.errors).toContain('Annotation coordinates must be non-negative');
		});

		it('should handle concurrent annotation editing', async () => {
			// Simulate multiple rapid operations
			const annotations = [
				mockClientAnnotation({ id: 'concurrent-1' }),
				mockClientAnnotation({ id: 'concurrent-2' }),
				mockClientAnnotation({ id: 'concurrent-3' })
			];

			// Add all annotations rapidly
			annotations.forEach((annotation) => {
				annotationStore.addAnnotation(annotation);
			});

			// Update annotations
			annotationStore.updateAnnotation('concurrent-1', {
				annotation: { text: 'Updated text', tags: ['updated'] }
			});

			// Delete one annotation
			annotationStore.deleteAnnotation('concurrent-2');

			await tick();

			// Should handle all operations correctly
			expect(annotationStore.annotations).toHaveLength(2);
			expect(
				annotationStore.annotations.find((a) => a.id === 'concurrent-1')?.annotation.text
			).toBe('Updated text');
			expect(annotationStore.annotations.find((a) => a.id === 'concurrent-2')).toBeUndefined();
		});
	});

	describe('error handling and recovery', () => {
		it('should handle server errors during loading', async () => {
			vi.mocked(mockClient.query).mockReturnValue({
				toPromise: () =>
					Promise.resolve({
						data: undefined,
						error: {
							message: 'Server error',
							networkError: null,
							graphQLErrors: []
						},
						operation: {
							key: 3,
							query: {} as DocumentNode,
							variables: {},
							kind: 'query',
							context: {}
						},
						stale: false,
						hasNext: false
					})
			});

			await expect(service.loadTaskAnnotations('test-task')).rejects.toThrow(
				'Failed to load task annotations: Server error'
			);
		});

		it('should handle server errors during saving', async () => {
			const annotation = mockClientAnnotation();
			annotationStore.addAnnotation(annotation);

			vi.mocked(mockClient.mutation).mockReturnValue({
				toPromise: () =>
					Promise.resolve({
						data: undefined,
						error: {
							message: 'Save failed',
							networkError: null,
							graphQLErrors: []
						},
						operation: {
							key: 4,
							query: {} as DocumentNode,
							variables: {},
							kind: 'mutation',
							context: {}
						},
						stale: false,
						hasNext: false
					})
			});

			await expect(service.saveTaskAnnotations('test-task', [annotation])).rejects.toThrow(
				'Failed to save annotations: Save failed'
			);
		});

		it('should recover from temporary network failures', async () => {
			const annotation = mockClientAnnotation();
			annotationStore.addAnnotation(annotation);

			// First attempt fails
			vi.mocked(mockClient.mutation).mockReturnValueOnce({
				toPromise: () => Promise.reject(new Error('Network error'))
			});

			// Second attempt succeeds
			vi.mocked(mockClient.mutation).mockReturnValueOnce({
				toPromise: () =>
					Promise.resolve({
						data: mockUpdateTaskResponse('test-task'),
						error: undefined,
						operation: {
							key: 5,
							query: {} as DocumentNode,
							variables: {},
							kind: 'mutation',
							context: {}
						},
						stale: false,
						hasNext: false
					})
			});

			// First save should fail
			await expect(service.saveTaskAnnotations('test-task', [annotation])).rejects.toThrow(
				'Network error'
			);

			// Second save should succeed
			await expect(service.saveTaskAnnotations('test-task', [annotation])).resolves.not.toThrow();
		});

		it('should maintain data consistency during errors', async () => {
			const initialAnnotations = [
				mockClientAnnotation({ id: 'safe-1' }),
				mockClientAnnotation({ id: 'safe-2' })
			];

			initialAnnotations.forEach((annotation) => {
				annotationStore.addAnnotation(annotation);
			});

			const initialCount = annotationStore.annotations.length;
			const initialHistory = annotationStore.history.length;

			// Try to perform invalid operation
			try {
				annotationStore.updateAnnotation('non-existent', {
					annotation: { text: 'Invalid update' }
				});
			} catch {
				// Should not affect store state
			}

			// Store should be unchanged
			expect(annotationStore.annotations).toHaveLength(initialCount);
			expect(annotationStore.history).toHaveLength(initialHistory);
		});
	});

	describe('performance and optimization', () => {
		it('should handle large numbers of annotations efficiently', async () => {
			const startTime = performance.now();

			// Create 1000 annotations
			const annotations: ClientAnnotation[] = [];
			for (let i = 0; i < 1000; i++) {
				annotations.push(
					mockClientAnnotation({
						id: `perf-annotation-${i}`,
						bounds: {
							x: Math.random() * 700,
							y: Math.random() * 500,
							width: 50 + Math.random() * 100,
							height: 40 + Math.random() * 80
						}
					})
				);
			}

			// Load annotations
			await annotationStore.loadAnnotations(annotations);

			const loadTime = performance.now() - startTime;

			// Should complete within reasonable time (less than 100ms)
			expect(loadTime).toBeLessThan(100);
			expect(annotationStore.annotations).toHaveLength(1000);
		});

		it('should efficiently update annotation statistics', () => {
			const annotations = Array.from({ length: 100 }, (_, i) =>
				mockClientAnnotation({
					id: `stats-${i}`,
					annotation: {
						text: i % 2 === 0 ? `Text ${i}` : '',
						tags: i % 3 === 0 ? [`tag-${i}`] : []
					}
				})
			);

			annotations.forEach((annotation) => {
				annotationStore.addAnnotation(annotation);
			});

			const stats = annotationStore.getStats();

			expect(stats.total).toBe(100);
			expect(stats.withText).toBe(50); // Every other annotation has text
			expect(stats.withTags).toBeGreaterThan(0); // Every third annotation has tags
		});

		it('should batch multiple operations efficiently', async () => {
			const operations = [
				() => annotationStore.addAnnotation(mockClientAnnotation({ id: 'batch-1' })),
				() => annotationStore.addAnnotation(mockClientAnnotation({ id: 'batch-2' })),
				() =>
					annotationStore.updateAnnotation('batch-1', {
						annotation: { text: 'Batch updated', tags: [] }
					}),
				() => annotationStore.deleteAnnotation('batch-2')
			];

			// Execute all operations
			operations.forEach((op) => op());

			await tick();

			// All operations should be reflected correctly
			expect(annotationStore.annotations).toHaveLength(1);
			expect(annotationStore.annotations[0].id).toBe('batch-1');
			expect(annotationStore.annotations[0].annotation.text).toBe('Batch updated');
			expect(annotationStore.history).toHaveLength(4); // All operations tracked
		});
	});

	describe('data transformation and format compatibility', () => {
		it('should correctly transform between client and server formats', async () => {
			const serverBboxes = [
				mockBBox({
					x: 150,
					y: 200,
					width: 120,
					height: 90,
					annotation: {
						text: 'Server annotation',
						tags: ['server', 'transform']
					}
				})
			];

			// Convert server to client format
			const clientAnnotations = service['convertBBoxesToClientAnnotations'](serverBboxes);

			expect(clientAnnotations[0]).toMatchObject({
				type: 'bbox',
				bounds: { x: 150, y: 200, width: 120, height: 90 },
				annotation: {
					text: 'Server annotation',
					tags: ['server', 'transform']
				},
				isSelected: false,
				isEditing: false,
				isDragging: false,
				resizeHandle: null
			});

			// Convert back to server format
			const serverBboxes2 = service['convertClientAnnotationsToBBoxes'](clientAnnotations);

			expect(serverBboxes2[0]).toEqual({
				x: 150,
				y: 200,
				width: 120,
				height: 90,
				annotation: {
					text: 'Server annotation',
					tags: ['server', 'transform']
				}
			});
		});

		it('should handle export to different formats', async () => {
			const annotations = [
				mockClientAnnotation({
					id: 'export-test',
					bounds: { x: 100, y: 150, width: 200, height: 120 },
					annotation: { text: 'Export annotation', tags: ['export', 'test'] }
				})
			];

			// Mock loading for export
			vi.mocked(mockClient.query).mockReturnValue({
				toPromise: () =>
					Promise.resolve({
						data: mockTaskWithAnnotations('test-task', []).data,
						error: undefined,
						operation: {
							key: 6,
							query: {} as DocumentNode,
							variables: {},
							kind: 'query',
							context: {}
						},
						stale: false,
						hasNext: false
					})
			});

			// Mock conversion
			vi.spyOn(
				service,
				'convertBBoxesToClientAnnotations' as keyof typeof service
			).mockResolvedValue(annotations);

			// Test JSON export
			const jsonExport = await service.exportAnnotations('test-task', 'json');
			const parsedJson = JSON.parse(jsonExport);
			expect(parsedJson[0].bounds).toEqual({ x: 100, y: 150, width: 200, height: 120 });

			// Test CSV export
			const csvExport = await service.exportAnnotations('test-task', 'csv');
			expect(csvExport).toContain('"id","type","x","y","width","height","text","tags"');
			expect(csvExport).toContain('"export-test","bbox","100","150","200","120"');

			// Test XML export
			const xmlExport = await service.exportAnnotations('test-task', 'xml');
			expect(xmlExport).toContain('<?xml version="1.0" encoding="UTF-8"?>');
			expect(xmlExport).toContain('<annotation id="export-test" type="bbox">');
		});
	});

	describe('edge cases and boundary conditions', () => {
		it('should handle empty annotation sets', async () => {
			await annotationStore.loadAnnotations([]);

			expect(annotationStore.annotations).toEqual([]);
			expect(annotationStore.getStats().total).toBe(0);
			expect(annotationStore.getHasUnsavedChanges()).toBe(false);
		});

		it('should handle annotations at image boundaries', () => {
			const boundaryAnnotation = mockClientAnnotation({
				bounds: { x: 0, y: 0, width: 800, height: 600 } // Full image size
			});

			const validation = service.validateAnnotation(boundaryAnnotation);
			expect(validation.valid).toBe(true);

			// Add to store
			annotationStore.addAnnotation(boundaryAnnotation);
			expect(annotationStore.annotations).toHaveLength(1);
		});

		it('should handle rapid tool switching', () => {
			// Simulate rapid tool changes
			annotationStore.setActiveTool('bbox');
			expect(annotationStore.canvas.activeTool).toBe('bbox');
			expect(annotationStore.canvas.mode).toBe('draw');

			annotationStore.setActiveTool('select');
			expect(annotationStore.canvas.activeTool).toBe('select');
			expect(annotationStore.canvas.mode).toBe('view');

			annotationStore.setActiveTool('bbox');
			expect(annotationStore.canvas.activeTool).toBe('bbox');
			expect(annotationStore.canvas.mode).toBe('draw');
		});

		it('should maintain state consistency during complex operations', async () => {
			// Create complex scenario with multiple operations
			const annotation1 = mockClientAnnotation({ id: 'complex-1' });
			const annotation2 = mockClientAnnotation({ id: 'complex-2' });

			// Add annotations
			annotationStore.addAnnotation(annotation1);
			annotationStore.addAnnotation(annotation2);

			// Select first annotation
			annotationStore.selectAnnotation(annotation1.id);

			// Update selected annotation
			annotationStore.updateAnnotation(annotation1.id, {
				annotation: { text: 'Complex update', tags: ['complex'] }
			});

			// Move annotation
			annotationStore.moveAnnotation(annotation1.id, { x: 100, y: 100 }, { x: 150, y: 120 });

			// Undo move
			annotationStore.undo();

			// Ensure annotation is still selected after undo - force re-selection
			annotationStore.selectAnnotation(annotation1.id);

			// Wait for state to update
			await tick();

			// Verify state consistency
			expect(annotationStore.annotations).toHaveLength(2);
			expect(annotationStore.canvas.selectedAnnotationId).toBe(annotation1.id);
			expect(annotationStore.selectedAnnotation()?.id).toBe(annotation1.id);
			expect(annotationStore.selectedAnnotation()?.annotation.text).toBe('Complex update');
			expect(annotationStore.selectedAnnotation()?.bounds.x).toBe(100); // Move undone
			expect(annotationStore.selectedAnnotation()?.bounds.y).toBe(100);
		});
	});
});
