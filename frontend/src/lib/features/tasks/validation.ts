import { z } from 'zod';

/**
 * Schema for bounding box annotation
 */
export const annotationSchema = z.object({
	text: z.string().min(1, 'Annotation text is required').max(500, 'Annotation text is too long'),
	tags: z.array(z.string()).optional().default([])
});

/**
 * Schema for bounding box
 */
export const bboxSchema = z.object({
	x: z.number().min(0, 'X coordinate must be non-negative'),
	y: z.number().min(0, 'Y coordinate must be non-negative'),
	width: z.number().min(1, 'Width must be positive'),
	height: z.number().min(1, 'Height must be positive'),
	annotation: annotationSchema
});

/**
 * Schema for creating a new task
 */
export const createTaskSchema = z.object({
	imageId: z.string().min(1, 'Image is required'),
	projectId: z.string().min(1, 'Project is required'),
	bboxes: z.array(bboxSchema).optional().default([]),
	status: z
		.enum(['DRAFT', 'FINISHED', 'REVIEWED'] as const)
		.optional()
		.default('DRAFT')
});

/**
 * Schema for updating an existing task
 */
export const updateTaskSchema = z.object({
	id: z.string().min(1, 'Task ID is required'),
	imageId: z.string().min(1, 'Image is required').optional(),
	projectId: z.string().min(1, 'Project is required').optional(),
	bboxes: z.array(bboxSchema).optional(),
	status: z.enum(['DRAFT', 'FINISHED', 'REVIEWED'] as const).optional()
});

/**
 * Schema for task filters
 */
export const taskFiltersSchema = z.object({
	search: z.string().max(255, 'Search term is too long').optional(),
	status: z
		.union([z.enum(['DRAFT', 'FINISHED', 'REVIEWED'] as const), z.literal('all')])
		.optional(),
	projectId: z.string().optional(),
	assignee: z.string().optional(),
	priority: z
		.union([z.literal('low'), z.literal('medium'), z.literal('high'), z.literal('all')])
		.optional()
});

/**
 * Type exports for use in components
 */
export type CreateTaskFormData = z.infer<typeof createTaskSchema>;
export type UpdateTaskFormData = z.infer<typeof updateTaskSchema>;
export type TaskFiltersData = z.infer<typeof taskFiltersSchema>;
export type BBoxData = z.infer<typeof bboxSchema>;
export type AnnotationData = z.infer<typeof annotationSchema>;

/**
 * Validation helper functions
 */
export const validateCreateTask = (data: unknown) => createTaskSchema.parse(data);
export const validateUpdateTask = (data: unknown) => updateTaskSchema.parse(data);
export const validateTaskFilters = (data: unknown) => taskFiltersSchema.parse(data);
export const validateBBox = (data: unknown) => bboxSchema.parse(data);
export const validateAnnotation = (data: unknown) => annotationSchema.parse(data);

/**
 * Safe validation functions that return results instead of throwing
 */
export const safeValidateCreateTask = (data: unknown) => createTaskSchema.safeParse(data);
export const safeValidateUpdateTask = (data: unknown) => updateTaskSchema.safeParse(data);
export const safeValidateTaskFilters = (data: unknown) => taskFiltersSchema.safeParse(data);
export const safeValidateBBox = (data: unknown) => bboxSchema.safeParse(data);
export const safeValidateAnnotation = (data: unknown) => annotationSchema.safeParse(data);
