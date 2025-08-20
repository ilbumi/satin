import type { TaskStatus, BBox } from '$lib/graphql/generated/graphql';

/**
 * Summary interface for displaying tasks in lists
 */
export interface TaskSummary {
	id: string;
	title?: string; // Derived from image or project name for display
	status: TaskStatus;
	createdAt: string;
	projectName: string;
	projectId: string;
	imageUrl: string;
	imageId: string;
	bboxCount: number;
	assignee?: string; // Optional for future use
	priority?: 'low' | 'medium' | 'high'; // Optional for future use
	dueDate?: string; // Optional for future use
	progress?: number; // Optional progress percentage for future use
}

// TaskDetail removed - use Task directly from generated types

/**
 * Form interface for creating new tasks
 */
export interface CreateTaskForm {
	imageId: string;
	projectId: string;
	bboxes?: BBox[];
	status?: TaskStatus;
}

/**
 * Form interface for updating existing tasks
 */
export interface UpdateTaskForm {
	id: string;
	imageId?: string;
	projectId?: string;
	bboxes?: BBox[];
	status?: TaskStatus;
}

/**
 * Interface for task filtering
 */
export interface TaskFilters {
	search?: string;
	status?: TaskStatus | 'all';
	projectId?: string;
	assignee?: string;
	priority?: 'low' | 'medium' | 'high' | 'all';
}

/**
 * Interface for task list state
 */
export interface TaskListState {
	tasks: TaskSummary[];
	loading: boolean;
	error: string | null;
	totalCount: number;
	hasMore: boolean;
	limit: number;
	offset: number;
}

/**
 * Interface for task creation state
 */
export interface TaskCreateState {
	creating: boolean;
	error: string | null;
}

/**
 * Interface for task update state
 */
export interface TaskUpdateState {
	updating: boolean;
	error: string | null;
}

/**
 * Interface for task deletion state
 */
export interface TaskDeleteState {
	deleting: boolean;
	error: string | null;
}

/**
 * Combined task store state interface
 */
export interface TaskStoreState {
	list: TaskListState;
	create: TaskCreateState;
	update: TaskUpdateState;
	delete: TaskDeleteState;
	filters: TaskFilters;
}

/**
 * Task status colors for UI
 */
export const TASK_STATUS_COLORS = {
	DRAFT: 'bg-gray-100 text-gray-800',
	FINISHED: 'bg-green-100 text-green-800',
	REVIEWED: 'bg-blue-100 text-blue-800'
} as const;

/**
 * Priority colors for UI (for future use)
 */
export const TASK_PRIORITY_COLORS = {
	low: 'bg-green-100 text-green-800',
	medium: 'bg-yellow-100 text-yellow-800',
	high: 'bg-red-100 text-red-800'
} as const;

/**
 * Task status display labels
 */
export const TASK_STATUS_LABELS = {
	DRAFT: 'Draft',
	FINISHED: 'Finished',
	REVIEWED: 'Reviewed'
} as const;
