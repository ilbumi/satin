// Core domain entities
export interface Project {
	id: string;
	name: string;
	description: string;
}

export interface Image {
	id: string;
	url: string;
}

export interface Annotation {
	text?: string;
	tags?: string[];
}

export interface BBox {
	x: number;
	y: number;
	width: number;
	height: number;
	annotation: Annotation;
}

export interface BBoxInput {
	x: number;
	y: number;
	width: number;
	height: number;
	annotation: {
		text?: string;
		tags?: string[];
	};
}

export enum TaskStatus {
	DRAFT = 'DRAFT',
	FINISHED = 'FINISHED',
	REVIEWED = 'REVIEWED'
}

export interface Task {
	id: string;
	image: Image;
	project: Project;
	bboxes: BBox[];
	status: TaskStatus;
	createdAt: string;
}

// Pagination types
export interface PageInfo {
	count: number;
	limit: number;
	offset: number;
}

export interface ProjectsPage extends PageInfo {
	objects: Project[];
}

export interface ImagesPage extends PageInfo {
	objects: Image[];
}

export interface TasksPage extends PageInfo {
	objects: Task[];
}

// Form data types
export interface ProjectFormData {
	name: string;
	description: string;
}

export interface ImageFormData {
	url: string;
}

// View model types for UI state
export interface ProjectViewModel extends Project {
	isLoading?: boolean;
	hasError?: boolean;
}

export interface ImageViewModel extends Image {
	isLoading?: boolean;
	hasError?: boolean;
	isSelected?: boolean;
}

export interface TaskViewModel extends Task {
	isLoading?: boolean;
	hasError?: boolean;
	isDirty?: boolean;
}

// Search and filtering
export interface ProjectFilters {
	searchTerm?: string;
	sortBy?: 'name' | 'created';
	status?: 'active' | 'archived';
}

export interface TaskFilters {
	status?: TaskStatus;
	projectId?: string;
	imageId?: string;
}
