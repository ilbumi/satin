import { projectService } from './service';
import type {
	ProjectListState,
	ProjectOperations,
	CreateProjectForm,
	UpdateProjectForm,
	ProjectFilters
} from './types';
import type { Project } from '$lib/graphql/generated/graphql';

function createProjectStore() {
	const state = $state<ProjectListState>({
		projects: [],
		loading: false,
		error: null,
		pagination: {
			limit: 12,
			offset: 0,
			totalCount: 0,
			hasMore: false
		},
		filters: {
			search: '',
			status: 'all'
		}
	});

	async function fetchProjects(): Promise<void> {
		try {
			state.loading = true;
			state.error = null;

			const result = await projectService.getProjects(
				state.pagination.limit,
				state.pagination.offset,
				state.filters
			);

			state.projects = result.objects.map(projectService.mapProjectToSummary);
			state.pagination.totalCount = result.totalCount;
			state.pagination.hasMore = result.hasMore;
		} catch (error) {
			state.error = error instanceof Error ? error.message : 'Failed to fetch projects';
			console.error('Store.fetchProjects error:', error);
		} finally {
			state.loading = false;
		}
	}

	async function createProject(data: CreateProjectForm): Promise<Project | null> {
		try {
			state.error = null;
			const project = await projectService.createProject(data);

			// Optimistically add to the list
			state.projects.unshift(projectService.mapProjectToSummary(project));
			state.pagination.totalCount += 1;

			return project;
		} catch (error) {
			state.error = error instanceof Error ? error.message : 'Failed to create project';
			console.error('Store.createProject error:', error);
			return null;
		}
	}

	async function updateProject(data: UpdateProjectForm): Promise<Project | null> {
		try {
			state.error = null;
			const project = await projectService.updateProject(data);

			if (project) {
				// Update the project in the list
				const index = state.projects.findIndex((p) => p.id === data.id);
				if (index !== -1) {
					state.projects[index] = projectService.mapProjectToSummary(project);
				}
			}

			return project;
		} catch (error) {
			state.error = error instanceof Error ? error.message : 'Failed to update project';
			console.error('Store.updateProject error:', error);
			return null;
		}
	}

	async function deleteProject(id: string): Promise<boolean> {
		try {
			state.error = null;
			const success = await projectService.deleteProject(id);

			if (success) {
				// Remove from the list
				state.projects = state.projects.filter((p) => p.id !== id);
				state.pagination.totalCount -= 1;
			}

			return success;
		} catch (error) {
			state.error = error instanceof Error ? error.message : 'Failed to delete project';
			console.error('Store.deleteProject error:', error);
			return false;
		}
	}

	function setFilters(filters: Partial<ProjectFilters>): void {
		state.filters = { ...state.filters, ...filters };
		state.pagination.offset = 0; // Reset to first page when filtering
		fetchProjects();
	}

	function setPage(offset: number): void {
		state.pagination.offset = offset;
		fetchProjects();
	}

	async function refetch(): Promise<void> {
		await fetchProjects();
	}

	function nextPage(): void {
		if (state.pagination.hasMore) {
			setPage(state.pagination.offset + state.pagination.limit);
		}
	}

	function prevPage(): void {
		if (state.pagination.offset > 0) {
			setPage(Math.max(0, state.pagination.offset - state.pagination.limit));
		}
	}

	function clearError(): void {
		state.error = null;
	}

	const operations: ProjectOperations = {
		fetchProjects,
		createProject,
		updateProject,
		deleteProject,
		setFilters,
		setPage,
		refetch
	};

	return {
		// State getters
		get projects() {
			return state.projects;
		},
		get loading() {
			return state.loading;
		},
		get error() {
			return state.error;
		},
		get pagination() {
			return state.pagination;
		},
		get filters() {
			return state.filters;
		},
		get hasProjects() {
			return state.projects.length > 0;
		},
		get isEmpty() {
			return !state.loading && state.projects.length === 0;
		},

		// Operations
		...operations,
		nextPage,
		prevPage,
		clearError
	};
}

export const projectStore = createProjectStore();
