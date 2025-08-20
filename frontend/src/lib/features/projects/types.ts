import type { Project, ProjectPage } from '$lib/graphql/generated/graphql';

export interface ProjectSummary {
	id: string;
	name: string;
	description: string;
	imageCount?: number;
	taskCount?: number;
	status?: 'active' | 'completed' | 'draft';
	createdAt?: string;
	updatedAt?: string;
}

export interface ProjectDetail extends ProjectSummary {
	images?: Array<{
		id: string;
		filename: string;
		status: string;
		thumbnail?: string;
	}>;
	stats?: {
		totalImages: number;
		annotatedImages: number;
		pendingImages: number;
		inProgressImages: number;
	};
}

export interface CreateProjectForm {
	name: string;
	description: string;
}

export interface UpdateProjectForm extends Partial<CreateProjectForm> {
	id: string;
}

export interface ProjectFilters {
	search?: string;
	status?: 'active' | 'completed' | 'draft' | 'all';
}

export interface ProjectListState {
	projects: ProjectSummary[];
	loading: boolean;
	error: string | null;
	pagination: {
		limit: number;
		offset: number;
		totalCount: number;
		hasMore: boolean;
	};
	filters: ProjectFilters;
}

export interface ProjectOperations {
	fetchProjects: () => Promise<void>;
	createProject: (data: CreateProjectForm) => Promise<Project | null>;
	updateProject: (data: UpdateProjectForm) => Promise<Project | null>;
	deleteProject: (id: string) => Promise<boolean>;
	setFilters: (filters: Partial<ProjectFilters>) => void;
	setPage: (offset: number) => void;
	refetch: () => Promise<void>;
}

export type { Project, ProjectPage };
