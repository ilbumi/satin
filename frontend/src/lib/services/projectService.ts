import { client } from '$lib/graphql/client';
import { GET_PROJECTS, CREATE_PROJECT, UPDATE_PROJECT, DELETE_PROJECT } from '$lib/graphql/queries';
import type {
	Project,
	ProjectsPage,
	ProjectFormData,
	PaginationVariables,
	CreateProjectVariables,
	UpdateProjectVariables,
	DeleteProjectVariables
} from '$lib/types';

export class ProjectService {
	/**
	 * Fetch paginated list of projects
	 */
	async getProjects(variables: PaginationVariables = {}): Promise<ProjectsPage> {
		const { limit = 20, offset = 0 } = variables;

		const result = await client.query(GET_PROJECTS, { limit, offset }).toPromise();

		if (result.error) {
			throw new Error(result.error.message);
		}

		if (!result.data?.projects) {
			throw new Error('No projects data received');
		}

		return result.data.projects;
	}

	/**
	 * Create a new project
	 */
	async createProject(formData: ProjectFormData): Promise<Project> {
		const variables: CreateProjectVariables = {
			name: formData.name.trim(),
			description: formData.description.trim()
		};

		const result = await client.mutation(CREATE_PROJECT, variables).toPromise();

		if (result.error) {
			throw new Error(result.error.message);
		}

		if (!result.data?.createProject) {
			throw new Error('Project creation failed');
		}

		return result.data.createProject;
	}

	/**
	 * Update an existing project
	 */
	async updateProject(id: string, formData: ProjectFormData): Promise<Project> {
		const variables: UpdateProjectVariables = {
			id,
			name: formData.name.trim(),
			description: formData.description.trim()
		};

		const result = await client.mutation(UPDATE_PROJECT, variables).toPromise();

		if (result.error) {
			throw new Error(result.error.message);
		}

		if (!result.data?.updateProject) {
			throw new Error('Project update failed');
		}

		return result.data.updateProject;
	}

	/**
	 * Delete a project
	 */
	async deleteProject(id: string): Promise<void> {
		const variables: DeleteProjectVariables = { id };

		const result = await client.mutation(DELETE_PROJECT, variables).toPromise();

		if (result.error) {
			throw new Error(result.error.message);
		}

		if (!result.data?.deleteProject?.success) {
			throw new Error('Project deletion failed');
		}
	}

	/**
	 * Validate project form data
	 */
	validateProjectForm(formData: ProjectFormData): { [key: string]: string } {
		const errors: { [key: string]: string } = {};

		if (!formData.name.trim()) {
			errors.name = 'Project name is required';
		} else if (formData.name.trim().length < 3) {
			errors.name = 'Project name must be at least 3 characters long';
		} else if (formData.name.trim().length > 100) {
			errors.name = 'Project name must be less than 100 characters';
		}

		if (formData.description.trim().length > 500) {
			errors.description = 'Description must be less than 500 characters';
		}

		return errors;
	}

	/**
	 * Search and filter projects
	 */
	filterProjects(
		projects: Project[],
		searchTerm: string,
		sortBy: 'name' | 'created' = 'name'
	): Project[] {
		let filtered = projects;

		// Filter by search term
		if (searchTerm.trim()) {
			const term = searchTerm.toLowerCase();
			filtered = projects.filter(
				(project) =>
					project.name.toLowerCase().includes(term) ||
					project.description.toLowerCase().includes(term)
			);
		}

		// Sort projects
		filtered.sort((a, b) => {
			if (sortBy === 'name') {
				return a.name.localeCompare(b.name);
			} else {
				// Sort by creation date (using ID as proxy)
				return new Date(b.id).getTime() - new Date(a.id).getTime();
			}
		});

		return filtered;
	}
}

// Export singleton instance
export const projectService = new ProjectService();
