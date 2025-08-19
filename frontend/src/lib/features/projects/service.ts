import { graphqlClient } from '$lib/core/api/client';
import {
	GET_PROJECT,
	GET_PROJECTS,
	CREATE_PROJECT,
	UPDATE_PROJECT,
	DELETE_PROJECT
} from '$lib/core/api/queries';
import type {
	Project,
	ProjectPage,
	GetProjectQuery,
	GetProjectsQuery,
	CreateProjectMutation,
	UpdateProjectMutation,
	DeleteProjectMutation,
	QueryInput
} from '$lib/graphql/generated/graphql';
import type { CreateProjectForm, UpdateProjectForm, ProjectFilters, ProjectSummary } from './types';

export class ProjectService {
	async getProject(id: string): Promise<Project | null> {
		try {
			const result = await graphqlClient.query(GET_PROJECT, { id }).toPromise();

			if (result.error) {
				console.error('Failed to fetch project:', result.error);
				throw new Error(result.error.message);
			}

			return (result.data as GetProjectQuery)?.project || null;
		} catch (error) {
			console.error('ProjectService.getProject error:', error);
			throw error;
		}
	}

	async getProjects(limit = 10, offset = 0, filters?: ProjectFilters): Promise<ProjectPage> {
		try {
			let query: QueryInput | undefined;

			if (filters?.search) {
				query = {
					stringFilters: [
						{
							field: 'name',
							operator: 'CONTAINS',
							value: filters.search
						}
					]
				};
			}

			const result = await graphqlClient
				.query(GET_PROJECTS, {
					limit,
					offset,
					query
				})
				.toPromise();

			if (result.error) {
				console.error('Failed to fetch projects:', result.error);
				throw new Error(result.error.message);
			}

			return (
				(result.data as GetProjectsQuery)?.projects || {
					objects: [],
					totalCount: 0,
					count: 0,
					limit,
					offset,
					hasMore: false
				}
			);
		} catch (error) {
			console.error('ProjectService.getProjects error:', error);
			throw error;
		}
	}

	async createProject(data: CreateProjectForm): Promise<Project> {
		try {
			const result = await graphqlClient.mutation(CREATE_PROJECT, data).toPromise();

			if (result.error) {
				console.error('Failed to create project:', result.error);
				throw new Error(result.error.message);
			}

			if (!(result.data as CreateProjectMutation)?.createProject) {
				throw new Error('Failed to create project: No data returned');
			}

			return (result.data as CreateProjectMutation).createProject;
		} catch (error) {
			console.error('ProjectService.createProject error:', error);
			throw error;
		}
	}

	async updateProject(data: UpdateProjectForm): Promise<Project | null> {
		try {
			const result = await graphqlClient.mutation(UPDATE_PROJECT, data).toPromise();

			if (result.error) {
				console.error('Failed to update project:', result.error);
				throw new Error(result.error.message);
			}

			return (result.data as UpdateProjectMutation)?.updateProject || null;
		} catch (error) {
			console.error('ProjectService.updateProject error:', error);
			throw error;
		}
	}

	async deleteProject(id: string): Promise<boolean> {
		try {
			const result = await graphqlClient.mutation(DELETE_PROJECT, { id }).toPromise();

			if (result.error) {
				console.error('Failed to delete project:', result.error);
				throw new Error(result.error.message);
			}

			return (result.data as DeleteProjectMutation)?.deleteProject || false;
		} catch (error) {
			console.error('ProjectService.deleteProject error:', error);
			throw error;
		}
	}

	mapProjectToSummary(project: Project): ProjectSummary {
		return {
			id: project.id,
			name: project.name,
			description: project.description,
			status: 'active' // Default status since it's not in the backend model yet
		};
	}
}

export const projectService = new ProjectService();
