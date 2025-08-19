import { graphqlClient } from '$lib/core/api/client';
import type { Client } from '@urql/core';
import type { BBoxInput, BBox } from '$lib/graphql/generated/graphql';
import type { ClientAnnotation, CreateAnnotationForm, UpdateAnnotationForm } from './types';

/**
 * Service for annotation-related GraphQL operations
 */
export class AnnotationService {
	private client: Client;

	constructor(client: Client = graphqlClient.client) {
		this.client = client;
	}

	/**
	 * Load annotations for a task
	 */
	async loadTaskAnnotations(taskId: string): Promise<ClientAnnotation[]> {
		const query = /* GraphQL */ `
			query GetTaskWithAnnotations($taskId: String!) {
				task(id: $taskId) {
					id
					bboxes {
						x
						y
						width
						height
						annotation {
							text
							tags
						}
					}
				}
			}
		`;

		const result = await this.client.query(query, { taskId }).toPromise();

		if (result.error) {
			throw new Error(`Failed to load task annotations: ${result.error.message}`);
		}

		if (!result.data?.task) {
			throw new Error('Task not found');
		}

		// Convert backend bboxes to client annotations
		return this.convertBBoxesToClientAnnotations(result.data.task.bboxes || []);
	}

	/**
	 * Save annotations for a task
	 */
	async saveTaskAnnotations(taskId: string, annotations: ClientAnnotation[]): Promise<void> {
		const bboxes = this.convertClientAnnotationsToBBoxes(annotations);

		const mutation = /* GraphQL */ `
			mutation UpdateTaskAnnotations($taskId: String!, $bboxes: [BBoxInput!]!) {
				updateTask(input: { id: $taskId, bboxes: $bboxes }) {
					id
					bboxes {
						x
						y
						width
						height
						annotation {
							text
							tags
						}
					}
				}
			}
		`;

		const result = await this.client
			.mutation(mutation, {
				taskId,
				bboxes
			})
			.toPromise();

		if (result.error) {
			throw new Error(`Failed to save annotations: ${result.error.message}`);
		}
	}

	/**
	 * Create a new annotation
	 */
	async createAnnotation(taskId: string, form: CreateAnnotationForm): Promise<ClientAnnotation> {
		// For now, we'll just update the task with the new annotation
		// In a more complex system, you might have separate annotation endpoints

		// First, load existing annotations
		const existingAnnotations = await this.loadTaskAnnotations(taskId);

		// Create new client annotation
		const newAnnotation: ClientAnnotation = {
			id: this.generateTempId(),
			type: form.type,
			bounds: form.bounds,
			annotation: form.annotation,
			isSelected: false,
			isEditing: false,
			isDragging: false,
			resizeHandle: null,
			createdAt: new Date(),
			updatedAt: new Date()
		};

		// Add to existing annotations
		const allAnnotations = [...existingAnnotations, newAnnotation];

		// Save all annotations
		await this.saveTaskAnnotations(taskId, allAnnotations);

		return newAnnotation;
	}

	/**
	 * Update an existing annotation
	 */
	async updateAnnotation(taskId: string, form: UpdateAnnotationForm): Promise<void> {
		// Load existing annotations
		const existingAnnotations = await this.loadTaskAnnotations(taskId);

		// Find and update the annotation
		const annotationIndex = existingAnnotations.findIndex((a) => a.id === form.id);
		if (annotationIndex === -1) {
			throw new Error('Annotation not found');
		}

		const annotation = existingAnnotations[annotationIndex];
		if (form.bounds) {
			annotation.bounds = form.bounds;
		}
		if (form.annotation) {
			Object.assign(annotation.annotation, form.annotation);
		}
		annotation.updatedAt = new Date();

		// Save all annotations
		await this.saveTaskAnnotations(taskId, existingAnnotations);
	}

	/**
	 * Delete an annotation
	 */
	async deleteAnnotation(taskId: string, annotationId: string): Promise<void> {
		// Load existing annotations
		const existingAnnotations = await this.loadTaskAnnotations(taskId);

		// Filter out the annotation to delete
		const filteredAnnotations = existingAnnotations.filter((a) => a.id !== annotationId);

		// Save remaining annotations
		await this.saveTaskAnnotations(taskId, filteredAnnotations);
	}

	/**
	 * Bulk update annotations (for performance)
	 */
	async bulkUpdateAnnotations(taskId: string, annotations: ClientAnnotation[]): Promise<void> {
		await this.saveTaskAnnotations(taskId, annotations);
	}

	/**
	 * Validate annotation data
	 */
	validateAnnotation(annotation: Partial<ClientAnnotation>): { valid: boolean; errors: string[] } {
		const errors: string[] = [];

		if (!annotation.bounds) {
			errors.push('Annotation bounds are required');
		} else {
			const { x, y, width, height } = annotation.bounds;

			if (width <= 0 || height <= 0) {
				errors.push('Annotation width and height must be positive');
			}

			if (x < 0 || y < 0) {
				errors.push('Annotation coordinates must be non-negative');
			}
		}

		if (!annotation.type) {
			errors.push('Annotation type is required');
		}

		return {
			valid: errors.length === 0,
			errors
		};
	}

	/**
	 * Get annotation statistics for a task
	 */
	async getAnnotationStats(taskId: string): Promise<{
		total: number;
		withText: number;
		withTags: number;
		averageSize: number;
	}> {
		const annotations = await this.loadTaskAnnotations(taskId);

		const total = annotations.length;
		const withText = annotations.filter(
			(a) => a.annotation.text && a.annotation.text.trim().length > 0
		).length;
		const withTags = annotations.filter(
			(a) => a.annotation.tags && a.annotation.tags.length > 0
		).length;

		const totalArea = annotations.reduce((sum, a) => sum + a.bounds.width * a.bounds.height, 0);
		const averageSize = total > 0 ? totalArea / total : 0;

		return {
			total,
			withText,
			withTags,
			averageSize
		};
	}

	/**
	 * Export annotations in various formats
	 */
	async exportAnnotations(
		taskId: string,
		format: 'json' | 'csv' | 'xml' = 'json'
	): Promise<string> {
		const annotations = await this.loadTaskAnnotations(taskId);

		switch (format) {
			case 'json':
				return JSON.stringify(annotations, null, 2);

			case 'csv':
				return this.convertToCSV(annotations);

			case 'xml':
				return this.convertToXML(annotations);

			default:
				throw new Error(`Unsupported export format: ${format}`);
		}
	}

	// Private helper methods

	private convertBBoxesToClientAnnotations(bboxes: BBox[]): ClientAnnotation[] {
		return bboxes.map((bbox, index) => ({
			id: `bbox_${index}_${Date.now()}`, // Generate temp ID
			type: 'bbox' as const,
			bounds: {
				x: bbox.x,
				y: bbox.y,
				width: bbox.width,
				height: bbox.height
			},
			annotation: {
				text: bbox.annotation.text || '',
				tags: bbox.annotation.tags || []
			},
			isSelected: false,
			isEditing: false,
			isDragging: false,
			resizeHandle: null,
			createdAt: new Date(), // We don't have this from backend
			updatedAt: new Date()
		}));
	}

	private convertClientAnnotationsToBBoxes(annotations: ClientAnnotation[]): BBoxInput[] {
		return annotations
			.filter((annotation) => annotation.type === 'bbox') // Only bboxes for now
			.map((annotation) => ({
				x: annotation.bounds.x,
				y: annotation.bounds.y,
				width: annotation.bounds.width,
				height: annotation.bounds.height,
				annotation: {
					text: annotation.annotation.text || undefined,
					tags:
						annotation.annotation.tags && annotation.annotation.tags.length > 0
							? annotation.annotation.tags
							: undefined
				}
			}));
	}

	private generateTempId(): string {
		return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	private convertToCSV(annotations: ClientAnnotation[]): string {
		const headers = ['id', 'type', 'x', 'y', 'width', 'height', 'text', 'tags'];
		const rows = annotations.map((a) => [
			a.id,
			a.type,
			a.bounds.x.toString(),
			a.bounds.y.toString(),
			a.bounds.width.toString(),
			a.bounds.height.toString(),
			a.annotation.text || '',
			a.annotation.tags?.join(';') || ''
		]);

		return [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
	}

	private convertToXML(annotations: ClientAnnotation[]): string {
		const xmlAnnotations = annotations
			.map(
				(a) => `
			<annotation id="${a.id}" type="${a.type}">
				<bounds x="${a.bounds.x}" y="${a.bounds.y}" width="${a.bounds.width}" height="${a.bounds.height}" />
				<text>${a.annotation.text || ''}</text>
				<tags>${a.annotation.tags?.join(',') || ''}</tags>
			</annotation>
		`
			)
			.join('');

		return `<?xml version="1.0" encoding="UTF-8"?>
<annotations>
	${xmlAnnotations}
</annotations>`;
	}
}

// Export a singleton instance that will be initialized with the GraphQL client
let annotationService: AnnotationService | null = null;

export function createAnnotationService(client: Client): AnnotationService {
	annotationService = new AnnotationService(client);
	return annotationService;
}

export function getAnnotationService(): AnnotationService {
	if (!annotationService) {
		throw new Error('Annotation service not initialized. Call createAnnotationService first.');
	}
	return annotationService;
}
