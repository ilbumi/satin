/**
 * Task Management Feature Module
 *
 * This module provides a complete task management system for annotation tasks.
 * It includes all necessary components, services, and utilities for managing
 * tasks throughout their lifecycle.
 */

// Export the main service and store
export { TaskService } from './service';
export { taskStore } from './store.svelte';

// Export all types
export type {
	TaskSummary,
	CreateTaskForm,
	UpdateTaskForm,
	TaskFilters,
	TaskListState,
	TaskCreateState,
	TaskUpdateState,
	TaskDeleteState,
	TaskStoreState
} from './types';

// Export constants
export { TASK_STATUS_COLORS, TASK_PRIORITY_COLORS, TASK_STATUS_LABELS } from './types';

// Export validation functions
export {
	validateCreateTask,
	validateUpdateTask,
	validateTaskFilters,
	validateBBox,
	validateAnnotation,
	safeValidateCreateTask,
	safeValidateUpdateTask,
	safeValidateTaskFilters,
	safeValidateBBox,
	safeValidateAnnotation
} from './validation';

// Export validation schemas and types
export {
	createTaskSchema,
	updateTaskSchema,
	taskFiltersSchema,
	bboxSchema,
	annotationSchema
} from './validation';

export type {
	CreateTaskFormData,
	UpdateTaskFormData,
	TaskFiltersData,
	BBoxData,
	AnnotationData
} from './validation';
