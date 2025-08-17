import { graphql, HttpResponse, http } from 'msw';

// Mock projects for testing
const mockProjects = [
	{
		id: '1',
		name: 'Medical Images Dataset',
		description: 'Collection of medical scans for annotation'
	},
	{
		id: '2',
		name: 'Vehicle Detection',
		description: 'Traffic camera images for vehicle detection training'
	},
	{
		id: '3',
		name: 'Plant Disease Classification',
		description: 'Agricultural images for plant disease identification'
	}
];

export const handlers = [
	// Existing handler (keeping for backward compatibility)
	graphql.query('GetAllProjects', () => {
		return HttpResponse.json({
			data: {
				projects: mockProjects
			}
		});
	}),

	// Project queries
	graphql.query('GetProject', ({ variables }) => {
		const { id } = variables as { id: string };
		const project = mockProjects.find((p) => p.id === id);

		if (!project) {
			return HttpResponse.json({
				data: { project: null }
			});
		}

		return HttpResponse.json({
			data: { project }
		});
	}),

	graphql.query('GetProjects', ({ variables }) => {
		const {
			limit = 10,
			offset = 0,
			query
		} = variables as {
			limit?: number;
			offset?: number;
			query?: {
				filters?: Array<{ field: string; operator: string; value: string }>;
				stringFilters?: Array<{ field: string; operator: string; value: string }>;
			};
		};

		let filteredProjects = [...mockProjects];

		// Apply search filter if provided (check both filters and stringFilters for compatibility)
		const filters = query?.filters || query?.stringFilters;
		if (filters) {
			const searchFilter = filters.find((f) => f.field === 'name' && f.operator === 'CONTAINS');
			if (searchFilter) {
				const searchTerm = searchFilter.value.toLowerCase();
				filteredProjects = filteredProjects.filter((p) =>
					p.name.toLowerCase().includes(searchTerm)
				);
			}
		}

		const totalCount = filteredProjects.length;
		const paginatedProjects = filteredProjects.slice(offset, offset + limit);
		const hasMore = offset + paginatedProjects.length < totalCount;

		return HttpResponse.json({
			data: {
				projects: {
					objects: paginatedProjects,
					totalCount,
					count: paginatedProjects.length,
					limit,
					offset,
					hasMore
				}
			}
		});
	}),

	// Project mutations
	graphql.mutation('CreateProject', ({ variables }) => {
		const { name, description } = variables as { name: string; description: string };
		const newProject = {
			id: `project-${Date.now()}`,
			name,
			description
		};

		// Add to mock data for consistency in tests
		mockProjects.unshift(newProject);

		return HttpResponse.json({
			data: {
				createProject: newProject
			}
		});
	}),

	graphql.mutation('UpdateProject', ({ variables }) => {
		const { id, name, description } = variables as {
			id: string;
			name?: string;
			description?: string;
		};

		const projectIndex = mockProjects.findIndex((p) => p.id === id);

		if (projectIndex === -1) {
			return HttpResponse.json({
				data: { updateProject: null }
			});
		}

		const updatedProject = {
			...mockProjects[projectIndex],
			...(name && { name }),
			...(description && { description })
		};

		mockProjects[projectIndex] = updatedProject;

		return HttpResponse.json({
			data: {
				updateProject: updatedProject
			}
		});
	}),

	graphql.mutation('DeleteProject', ({ variables }) => {
		const { id } = variables as { id: string };
		const projectIndex = mockProjects.findIndex((p) => p.id === id);

		if (projectIndex === -1) {
			return HttpResponse.json({
				data: { deleteProject: false }
			});
		}

		mockProjects.splice(projectIndex, 1);

		return HttpResponse.json({
			data: {
				deleteProject: true
			}
		});
	}),

	// Schema introspection for GraphQL client
	http.get('http://localhost:8000/graphql', () => {
		return HttpResponse.json({
			data: {
				__schema: {
					queryType: {
						name: 'Query'
					},
					mutationType: {
						name: 'Mutation'
					},
					subscriptionType: null,
					types: []
				}
			}
		});
	})
];
