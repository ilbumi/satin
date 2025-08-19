import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnnotationService } from '../service';
import type { ClientAnnotation } from '../types';
import type { Client } from '@urql/core';
import type {
	OperationResultSource,
	OperationResult,
	AnyVariables,
	CombinedError,
	Operation,
	OperationContext
} from '@urql/core';
import { Kind } from 'graphql';
import {
	mockClientAnnotation,
	mockBBox,
	mockTaskWithAnnotations,
	mockUpdateTaskResponse,
	mockGraphQLError,
	mockCreateAnnotationForm,
	mockUpdateAnnotationForm,
	resetMockCounter
} from './mocks';

// Helper function to create properly typed URQL operation results
function createMockOperationResult<T = unknown>(result: {
	data?: T;
	error?: unknown;
}): OperationResultSource<OperationResult<T, AnyVariables>> {
	const mockOperation: Operation = {
		kind: 'query',
		query: { kind: Kind.DOCUMENT, definitions: [] },
		variables: {},
		key: Math.random(),
		context: {
			url: 'http://localhost:8000/graphql',
			requestPolicy: 'cache-first'
		} as OperationContext
	};

	const mockResult: OperationResult<T, AnyVariables> = {
		data: result.data,
		error: result.error as CombinedError | undefined,
		operation: mockOperation,
		stale: false,
		hasNext: false
	};

	return {
		toPromise: () => Promise.resolve(mockResult)
	} as unknown as OperationResultSource<OperationResult<T, AnyVariables>>;
}

describe('AnnotationService', () => {
	let service: AnnotationService;
	let mockClient: Client;

	beforeEach(() => {
		resetMockCounter();
		mockClient = {
			query: vi.fn(),
			mutation: vi.fn()
		} as unknown as Client;
		service = new AnnotationService(mockClient);
	});

	describe('loadTaskAnnotations', () => {
		it('should load task annotations successfully', async () => {
			const taskId = 'task-123';
			const bboxes = [mockBBox(), mockBBox()];

			vi.mocked(mockClient.query).mockReturnValue(
				createMockOperationResult(mockTaskWithAnnotations(taskId, bboxes))
			);

			const result = await service.loadTaskAnnotations(taskId);

			expect(mockClient.query).toHaveBeenCalledWith(
				expect.stringContaining('GetTaskWithAnnotations'),
				{ taskId }
			);
			expect(result).toHaveLength(2);
			expect(result[0].type).toBe('bbox');
			expect(result[0].bounds).toEqual({
				x: bboxes[0].x,
				y: bboxes[0].y,
				width: bboxes[0].width,
				height: bboxes[0].height
			});
		});

		it('should handle empty task annotations', async () => {
			const taskId = 'task-empty';

			vi.mocked(mockClient.query).mockReturnValue(
				createMockOperationResult(mockTaskWithAnnotations(taskId, []))
			);

			const result = await service.loadTaskAnnotations(taskId);

			expect(result).toEqual([]);
		});

		it('should throw error when GraphQL query fails', async () => {
			const taskId = 'task-error';

			vi.mocked(mockClient.query).mockReturnValue(
				createMockOperationResult(mockGraphQLError('Failed to load task'))
			);

			await expect(service.loadTaskAnnotations(taskId)).rejects.toThrow(
				'Failed to load task annotations: Failed to load task'
			);
		});

		it('should throw error when task not found', async () => {
			const taskId = 'non-existent';

			vi.mocked(mockClient.query).mockReturnValue(
				createMockOperationResult({ data: { task: null } })
			);

			await expect(service.loadTaskAnnotations(taskId)).rejects.toThrow('Task not found');
		});

		it('should convert backend bboxes to client annotations correctly', async () => {
			const taskId = 'task-convert';
			const bbox = mockBBox({
				x: 100,
				y: 150,
				width: 200,
				height: 120,
				annotation: {
					text: 'Test annotation',
					tags: ['test', 'convert']
				}
			});

			vi.mocked(mockClient.query).mockReturnValue(
				createMockOperationResult(mockTaskWithAnnotations(taskId, [bbox]))
			);

			const result = await service.loadTaskAnnotations(taskId);

			expect(result[0]).toMatchObject({
				type: 'bbox',
				bounds: { x: 100, y: 150, width: 200, height: 120 },
				annotation: {
					text: 'Test annotation',
					tags: ['test', 'convert']
				},
				isSelected: false,
				isEditing: false,
				isDragging: false,
				resizeHandle: null
			});
			expect(result[0].id).toMatch(/^bbox_\d+_\d+$/);
			expect(result[0].createdAt).toBeInstanceOf(Date);
			expect(result[0].updatedAt).toBeInstanceOf(Date);
		});
	});

	describe('saveTaskAnnotations', () => {
		it('should save annotations successfully', async () => {
			const taskId = 'task-save';
			const annotations = [
				mockClientAnnotation({
					bounds: { x: 10, y: 20, width: 100, height: 80 },
					annotation: { text: 'Save test', tags: ['save'] }
				})
			];

			vi.mocked(mockClient.mutation).mockReturnValue(
				createMockOperationResult(mockUpdateTaskResponse(taskId))
			);

			await service.saveTaskAnnotations(taskId, annotations);

			expect(mockClient.mutation).toHaveBeenCalledWith(
				expect.stringContaining('UpdateTaskAnnotations'),
				{
					taskId,
					bboxes: [
						{
							x: 10,
							y: 20,
							width: 100,
							height: 80,
							annotation: {
								text: 'Save test',
								tags: ['save']
							}
						}
					]
				}
			);
		});

		it('should filter out non-bbox annotations', async () => {
			const taskId = 'task-filter';
			const annotations = [
				mockClientAnnotation({ type: 'bbox' }),
				mockClientAnnotation({ type: 'polygon' })
			];

			vi.mocked(mockClient.mutation).mockReturnValue(
				createMockOperationResult(mockUpdateTaskResponse(taskId))
			);

			await service.saveTaskAnnotations(taskId, annotations);

			const callArgs = vi.mocked(mockClient.mutation).mock.calls[0];
			expect(callArgs).toBeDefined();
			if (callArgs && callArgs[1]) {
				expect(callArgs[1].bboxes).toHaveLength(1); // Only bbox should be included
			}
		});

		it('should handle empty text and tags correctly', async () => {
			const taskId = 'task-empty-fields';
			const annotations = [
				mockClientAnnotation({
					annotation: { text: '', tags: [] }
				})
			];

			vi.mocked(mockClient.mutation).mockReturnValue(
				createMockOperationResult(mockUpdateTaskResponse(taskId))
			);

			await service.saveTaskAnnotations(taskId, annotations);

			const callArgs = vi.mocked(mockClient.mutation).mock.calls[0];
			expect(callArgs).toBeDefined();
			if (callArgs && callArgs[1]) {
				const bbox = callArgs[1].bboxes[0];
				expect(bbox.annotation.text).toBeUndefined();
				expect(bbox.annotation.tags).toBeUndefined();
			}
		});

		it('should throw error when mutation fails', async () => {
			const taskId = 'task-fail';
			const annotations = [mockClientAnnotation()];

			vi.mocked(mockClient.mutation).mockReturnValue(
				createMockOperationResult(mockGraphQLError('Save failed'))
			);

			await expect(service.saveTaskAnnotations(taskId, annotations)).rejects.toThrow(
				'Failed to save annotations: Save failed'
			);
		});
	});

	describe('createAnnotation', () => {
		it('should create new annotation', async () => {
			const taskId = 'task-create';
			const form = mockCreateAnnotationForm();

			// Mock loading existing annotations
			vi.mocked(mockClient.query).mockReturnValue(
				createMockOperationResult(mockTaskWithAnnotations(taskId, []))
			);

			// Mock saving annotations
			vi.mocked(mockClient.mutation).mockReturnValue(
				createMockOperationResult(mockUpdateTaskResponse(taskId))
			);

			const result = await service.createAnnotation(taskId, form);

			expect(result.type).toBe(form.type);
			expect(result.bounds).toEqual(form.bounds);
			expect(result.annotation).toEqual(form.annotation);
			expect(result.id).toMatch(/^temp_\d+_[a-z0-9]+$/);
		});

		it('should add to existing annotations', async () => {
			const taskId = 'task-add';
			const existingBboxes = [mockBBox()];
			const form = mockCreateAnnotationForm();

			// Mock loading existing annotations
			vi.mocked(mockClient.query).mockReturnValue(
				createMockOperationResult(mockTaskWithAnnotations(taskId, existingBboxes))
			);

			// Mock saving annotations
			vi.mocked(mockClient.mutation).mockReturnValue(
				createMockOperationResult(mockUpdateTaskResponse(taskId))
			);

			await service.createAnnotation(taskId, form);

			// Should call save with existing + new annotation
			const saveCall = vi.mocked(mockClient.mutation).mock.calls[0];
			expect(saveCall).toBeDefined();
			if (saveCall && saveCall[1]) {
				expect(saveCall[1].bboxes).toHaveLength(2); // 1 existing + 1 new
			}
		});
	});

	describe('updateAnnotation', () => {
		it('should update existing annotation', async () => {
			const taskId = 'task-update';
			const existingAnnotation = mockClientAnnotation({ id: 'update-me' });
			const form = mockUpdateAnnotationForm({
				id: 'update-me',
				annotation: { text: 'Updated text', tags: ['updated'] }
			});

			// Mock loading existing annotations
			vi.mocked(mockClient.query).mockReturnValue(
				createMockOperationResult(mockTaskWithAnnotations(taskId, []))
			);

			// Mock the conversion to return our existing annotation
			vi.spyOn(
				service as AnnotationService & {
					convertBBoxesToClientAnnotations: (bboxes: unknown[]) => ClientAnnotation[];
				},
				'convertBBoxesToClientAnnotations'
			).mockReturnValue([existingAnnotation]);

			// Mock saving annotations
			vi.mocked(mockClient.mutation).mockReturnValue(
				createMockOperationResult(mockUpdateTaskResponse(taskId))
			);

			await service.updateAnnotation(taskId, form);

			expect(mockClient.mutation).toHaveBeenCalled();
		});

		it('should throw error when annotation not found', async () => {
			const taskId = 'task-not-found';
			const form = mockUpdateAnnotationForm({ id: 'non-existent' });

			// Mock loading empty annotations
			vi.mocked(mockClient.query).mockReturnValue(
				createMockOperationResult(mockTaskWithAnnotations(taskId, []))
			);

			await expect(service.updateAnnotation(taskId, form)).rejects.toThrow('Annotation not found');
		});
	});

	describe('deleteAnnotation', () => {
		it('should delete annotation', async () => {
			const taskId = 'task-delete';
			const annotationId = 'delete-me';
			const existingAnnotations = [
				mockClientAnnotation({ id: 'keep-me' }),
				mockClientAnnotation({ id: annotationId })
			];

			// Mock loading existing annotations
			vi.mocked(mockClient.query).mockReturnValue(
				createMockOperationResult(mockTaskWithAnnotations(taskId, []))
			);

			// Mock the conversion to return our annotations
			vi.spyOn(
				service as AnnotationService & {
					convertBBoxesToClientAnnotations: (bboxes: unknown[]) => ClientAnnotation[];
				},
				'convertBBoxesToClientAnnotations'
			).mockReturnValue(existingAnnotations);

			// Mock saving annotations
			vi.mocked(mockClient.mutation).mockReturnValue(
				createMockOperationResult(mockUpdateTaskResponse(taskId))
			);

			await service.deleteAnnotation(taskId, annotationId);

			// Should save without the deleted annotation
			const saveCall = vi.mocked(mockClient.mutation).mock.calls[0];
			expect(saveCall).toBeDefined();
			if (saveCall && saveCall[1]) {
				expect(saveCall[1].bboxes).toHaveLength(1); // Only 'keep-me' should remain
			}
		});
	});

	describe('bulkUpdateAnnotations', () => {
		it('should save all annotations', async () => {
			const taskId = 'task-bulk';
			const annotations = [mockClientAnnotation(), mockClientAnnotation()];

			vi.mocked(mockClient.mutation).mockReturnValue(
				createMockOperationResult(mockUpdateTaskResponse(taskId))
			);

			await service.bulkUpdateAnnotations(taskId, annotations);

			expect(mockClient.mutation).toHaveBeenCalledWith(
				expect.stringContaining('UpdateTaskAnnotations'),
				expect.objectContaining({
					taskId,
					bboxes: expect.arrayContaining([expect.objectContaining({ x: expect.any(Number) })])
				})
			);
		});
	});

	describe('validateAnnotation', () => {
		it('should validate valid annotation', () => {
			const annotation = mockClientAnnotation();

			const result = service.validateAnnotation(annotation);

			expect(result.valid).toBe(true);
			expect(result.errors).toEqual([]);
		});

		it('should reject annotation without bounds', () => {
			const annotation = mockClientAnnotation();
			// @ts-expect-error Testing validation
			delete annotation.bounds;

			const result = service.validateAnnotation(annotation);

			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Annotation bounds are required');
		});

		it('should reject annotation with zero width', () => {
			const annotation = mockClientAnnotation({
				bounds: { x: 10, y: 20, width: 0, height: 80 }
			});

			const result = service.validateAnnotation(annotation);

			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Annotation width and height must be positive');
		});

		it('should reject annotation with negative coordinates', () => {
			const annotation = mockClientAnnotation({
				bounds: { x: -10, y: -20, width: 100, height: 80 }
			});

			const result = service.validateAnnotation(annotation);

			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Annotation coordinates must be non-negative');
		});

		it('should reject annotation without type', () => {
			const annotation = mockClientAnnotation();
			// @ts-expect-error Testing validation
			delete annotation.type;

			const result = service.validateAnnotation(annotation);

			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Annotation type is required');
		});
	});

	describe('getAnnotationStats', () => {
		it('should calculate annotation statistics', async () => {
			const taskId = 'task-stats';
			const annotations = [
				mockClientAnnotation({
					bounds: { x: 0, y: 0, width: 100, height: 100 }, // Area: 10000
					annotation: { text: 'Has text', tags: ['has-tags'] }
				}),
				mockClientAnnotation({
					bounds: { x: 0, y: 0, width: 50, height: 50 }, // Area: 2500
					annotation: { text: '', tags: [] }
				}),
				mockClientAnnotation({
					bounds: { x: 0, y: 0, width: 200, height: 150 }, // Area: 30000
					annotation: { text: 'Also has text', tags: ['also-has-tags'] }
				})
			];

			// Mock loading annotations
			vi.mocked(mockClient.query).mockReturnValue(
				createMockOperationResult(mockTaskWithAnnotations(taskId, []))
			);

			// Mock the conversion to return our test annotations
			vi.spyOn(
				service as AnnotationService & {
					convertBBoxesToClientAnnotations: (bboxes: unknown[]) => ClientAnnotation[];
				},
				'convertBBoxesToClientAnnotations'
			).mockReturnValue(annotations);

			const stats = await service.getAnnotationStats(taskId);

			expect(stats.total).toBe(3);
			expect(stats.withText).toBe(2); // Annotations with non-empty text
			expect(stats.withTags).toBe(2); // Annotations with tags
			expect(stats.averageSize).toBe((10000 + 2500 + 30000) / 3); // Average area
		});

		it('should handle empty annotations', async () => {
			const taskId = 'task-empty-stats';

			vi.mocked(mockClient.query).mockReturnValue(
				createMockOperationResult(mockTaskWithAnnotations(taskId, []))
			);

			const stats = await service.getAnnotationStats(taskId);

			expect(stats.total).toBe(0);
			expect(stats.withText).toBe(0);
			expect(stats.withTags).toBe(0);
			expect(stats.averageSize).toBe(0);
		});
	});

	describe('exportAnnotations', () => {
		let annotations: ClientAnnotation[];

		beforeEach(() => {
			annotations = [
				mockClientAnnotation({
					id: 'export-1',
					bounds: { x: 10, y: 20, width: 100, height: 80 },
					annotation: { text: 'Export test', tags: ['export'] }
				})
			];

			// Mock loading annotations
			vi.mocked(mockClient.query).mockReturnValue(
				createMockOperationResult(mockTaskWithAnnotations('task-export', []))
			);

			// Mock the conversion
			vi.spyOn(
				service as AnnotationService & {
					convertBBoxesToClientAnnotations: (bboxes: unknown[]) => ClientAnnotation[];
				},
				'convertBBoxesToClientAnnotations'
			).mockReturnValue(annotations);
		});

		it('should export annotations as JSON', async () => {
			const result = await service.exportAnnotations('task-export', 'json');

			const parsed = JSON.parse(result);
			expect(parsed).toHaveLength(1);
			expect(parsed[0]).toMatchObject({
				id: 'export-1',
				bounds: { x: 10, y: 20, width: 100, height: 80 }
			});
		});

		it('should export annotations as CSV', async () => {
			const result = await service.exportAnnotations('task-export', 'csv');

			expect(result).toContain('"id","type","x","y","width","height","text","tags"');
			expect(result).toContain('"export-1","bbox","10","20","100","80","Export test","export"');
		});

		it('should export annotations as XML', async () => {
			const result = await service.exportAnnotations('task-export', 'xml');

			expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
			expect(result).toContain('<annotations>');
			expect(result).toContain('<annotation id="export-1" type="bbox">');
			expect(result).toContain('<bounds x="10" y="20" width="100" height="80" />');
			expect(result).toContain('<text>Export test</text>');
			expect(result).toContain('<tags>export</tags>');
		});

		it('should throw error for unsupported format', async () => {
			// @ts-expect-error Testing invalid format
			await expect(service.exportAnnotations('task-export', 'invalid')).rejects.toThrow(
				'Unsupported export format: invalid'
			);
		});
	});

	describe('data conversion methods', () => {
		it('should convert BBoxes to ClientAnnotations', () => {
			const bboxes = [
				mockBBox({
					x: 100,
					y: 150,
					width: 200,
					height: 120,
					annotation: { text: 'Test', tags: ['test'] }
				})
			];

			const result = service['convertBBoxesToClientAnnotations'](bboxes);

			expect(result).toHaveLength(1);
			expect(result[0]).toMatchObject({
				type: 'bbox',
				bounds: { x: 100, y: 150, width: 200, height: 120 },
				annotation: { text: 'Test', tags: ['test'] },
				isSelected: false,
				isEditing: false,
				isDragging: false,
				resizeHandle: null
			});
		});

		it('should convert ClientAnnotations to BBoxes', () => {
			const annotations = [
				mockClientAnnotation({
					type: 'bbox',
					bounds: { x: 10, y: 20, width: 100, height: 80 },
					annotation: { text: 'Convert test', tags: ['convert'] }
				})
			];

			const result = service['convertClientAnnotationsToBBoxes'](annotations);

			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				x: 10,
				y: 20,
				width: 100,
				height: 80,
				annotation: {
					text: 'Convert test',
					tags: ['convert']
				}
			});
		});

		it('should generate unique temporary IDs', () => {
			const id1 = service['generateTempId']();
			const id2 = service['generateTempId']();

			expect(id1).toMatch(/^temp_\d+_[a-z0-9]+$/);
			expect(id2).toMatch(/^temp_\d+_[a-z0-9]+$/);
			expect(id1).not.toBe(id2);
		});
	});
});
