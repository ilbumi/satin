import { z } from 'zod';

export const createProjectSchema = z.object({
	name: z
		.string()
		.min(1, 'Project name is required')
		.min(3, 'Project name must be at least 3 characters')
		.max(100, 'Project name must be less than 100 characters'),
	description: z
		.string()
		.min(1, 'Project description is required')
		.min(10, 'Project description must be at least 10 characters')
		.max(500, 'Project description must be less than 500 characters')
});

export const updateProjectSchema = z.object({
	id: z.string().min(1, 'Project ID is required'),
	name: z
		.string()
		.min(3, 'Project name must be at least 3 characters')
		.max(100, 'Project name must be less than 100 characters')
		.optional(),
	description: z
		.string()
		.min(10, 'Project description must be at least 10 characters')
		.max(500, 'Project description must be less than 500 characters')
		.optional()
});

export const projectFiltersSchema = z.object({
	search: z.string().optional(),
	status: z.enum(['active', 'completed', 'draft', 'all']).optional()
});

export type CreateProjectFormData = z.infer<typeof createProjectSchema>;
export type UpdateProjectFormData = z.infer<typeof updateProjectSchema>;
export type ProjectFiltersData = z.infer<typeof projectFiltersSchema>;
