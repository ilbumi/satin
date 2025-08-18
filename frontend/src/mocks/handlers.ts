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

// Mock images for testing
const mockImages = [
	{
		id: '1',
		url: '/images/sample1.jpg'
	},
	{
		id: '2',
		url: '/images/sample2.jpg'
	},
	{
		id: '3',
		url: '/images/sample3.jpg'
	},
	{
		id: '4',
		url: '/images/sample4.jpg'
	},
	{
		id: '5',
		url: '/images/sample5.jpg'
	}
];

// Mock tasks for testing
const mockTasks = [
	{
		id: '1',
		status: 'DRAFT',
		createdAt: '2024-01-15T10:00:00Z',
		image: mockImages[0],
		project: mockProjects[0],
		bboxes: [
			{
				x: 10,
				y: 20,
				width: 100,
				height: 80,
				annotation: {
					text: 'Heart region',
					tags: ['organ', 'heart']
				}
			}
		]
	},
	{
		id: '2',
		status: 'FINISHED',
		createdAt: '2024-01-14T09:30:00Z',
		image: mockImages[1],
		project: mockProjects[1],
		bboxes: [
			{
				x: 50,
				y: 60,
				width: 200,
				height: 150,
				annotation: {
					text: 'Vehicle',
					tags: ['car', 'transport']
				}
			},
			{
				x: 300,
				y: 100,
				width: 120,
				height: 80,
				annotation: {
					text: 'License plate',
					tags: ['plate', 'text']
				}
			}
		]
	},
	{
		id: '3',
		status: 'REVIEWED',
		createdAt: '2024-01-13T14:15:00Z',
		image: mockImages[2],
		project: mockProjects[2],
		bboxes: [
			{
				x: 75,
				y: 90,
				width: 80,
				height: 60,
				annotation: {
					text: 'Disease spot',
					tags: ['disease', 'leaf']
				}
			}
		]
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

	// Image queries
	graphql.query('GetImage', ({ variables }) => {
		const { id } = variables as { id: string };
		const image = mockImages.find((img) => img.id === id);

		if (!image) {
			return HttpResponse.json({
				data: { image: null }
			});
		}

		return HttpResponse.json({
			data: { image }
		});
	}),

	graphql.query('GetImages', ({ variables }) => {
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

		let filteredImages = [...mockImages];

		// Apply search filter if provided (check both filters and stringFilters for compatibility)
		const filters = query?.filters || query?.stringFilters;
		if (filters) {
			const searchFilter = filters.find((f) => f.field === 'filename' && f.operator === 'CONTAINS');
			if (searchFilter) {
				const searchTerm = searchFilter.value.toLowerCase();
				filteredImages = filteredImages.filter((img) => img.url.toLowerCase().includes(searchTerm));
			}

			const statusFilter = filters.find((f) => f.field === 'status' && f.operator === 'EQ');
			if (statusFilter && statusFilter.value !== 'all') {
				// For mock data, we'll just return all images regardless of status filter
				// In real implementation, this would filter by actual status
			}
		}

		const totalCount = filteredImages.length;
		const paginatedImages = filteredImages.slice(offset, offset + limit);
		const hasMore = offset + paginatedImages.length < totalCount;

		return HttpResponse.json({
			data: {
				images: {
					objects: paginatedImages,
					totalCount,
					count: paginatedImages.length,
					limit,
					offset,
					hasMore
				}
			}
		});
	}),

	// Image mutations
	graphql.mutation('CreateImage', ({ variables }) => {
		const { url } = variables as { url: string };
		const newImage = {
			id: `image-${Date.now()}`,
			url
		};

		// Add to mock data for consistency in tests
		mockImages.unshift(newImage);

		return HttpResponse.json({
			data: {
				createImage: newImage
			}
		});
	}),

	graphql.mutation('UpdateImage', ({ variables }) => {
		const { id, url } = variables as {
			id: string;
			url?: string;
		};

		const imageIndex = mockImages.findIndex((img) => img.id === id);

		if (imageIndex === -1) {
			return HttpResponse.json({
				data: { updateImage: null }
			});
		}

		const updatedImage = {
			...mockImages[imageIndex],
			...(url && { url })
		};

		mockImages[imageIndex] = updatedImage;

		return HttpResponse.json({
			data: {
				updateImage: updatedImage
			}
		});
	}),

	graphql.mutation('DeleteImage', ({ variables }) => {
		const { id } = variables as { id: string };
		const imageIndex = mockImages.findIndex((img) => img.id === id);

		if (imageIndex === -1) {
			return HttpResponse.json({
				data: { deleteImage: false }
			});
		}

		mockImages.splice(imageIndex, 1);

		return HttpResponse.json({
			data: {
				deleteImage: true
			}
		});
	}),

	// Task queries
	graphql.query('GetTask', ({ variables }) => {
		const { id } = variables as { id: string };
		const task = mockTasks.find((t) => t.id === id);

		if (!task) {
			return HttpResponse.json({
				data: { task: null }
			});
		}

		return HttpResponse.json({
			data: { task }
		});
	}),

	graphql.query('GetTasks', ({ variables }) => {
		const {
			limit = 10,
			offset = 0,
			query
		} = variables as {
			limit?: number;
			offset?: number;
			query?: {
				stringFilters?: Array<{ field: string; operator: string; value: string }>;
				enumFilters?: Array<{ field: string; operator: string; value: string }>;
			};
		};

		let filteredTasks = [...mockTasks];

		// Apply filters if provided
		if (query) {
			// Apply string filters (search)
			if (query.stringFilters) {
				const searchFilter = query.stringFilters.find(
					(f) => f.field === 'project.name' && f.operator === 'CONTAINS'
				);
				if (searchFilter) {
					const searchTerm = searchFilter.value.toLowerCase();
					filteredTasks = filteredTasks.filter((t) =>
						t.project.name.toLowerCase().includes(searchTerm)
					);
				}

				const projectFilter = query.stringFilters.find(
					(f) => f.field === 'project_id' && f.operator === 'EQ'
				);
				if (projectFilter) {
					filteredTasks = filteredTasks.filter((t) => t.project.id === projectFilter.value);
				}
			}

			// Apply enum filters (status)
			if (query.enumFilters) {
				const statusFilter = query.enumFilters.find(
					(f) => f.field === 'status' && f.operator === 'EQ'
				);
				if (statusFilter && statusFilter.value !== 'all') {
					filteredTasks = filteredTasks.filter((t) => t.status === statusFilter.value);
				}
			}
		}

		const totalCount = filteredTasks.length;
		const paginatedTasks = filteredTasks.slice(offset, offset + limit);
		const hasMore = offset + paginatedTasks.length < totalCount;

		return HttpResponse.json({
			data: {
				tasks: {
					objects: paginatedTasks,
					totalCount,
					count: paginatedTasks.length,
					limit,
					offset,
					hasMore
				}
			}
		});
	}),

	graphql.query('GetTaskByImageAndProject', ({ variables }) => {
		const { imageId, projectId } = variables as { imageId: string; projectId: string };
		const task = mockTasks.find((t) => t.image.id === imageId && t.project.id === projectId);

		return HttpResponse.json({
			data: { taskByImageAndProject: task || null }
		});
	}),

	// Task mutations
	graphql.mutation('CreateTask', ({ variables }) => {
		const {
			imageId,
			projectId,
			bboxes = [],
			status = 'DRAFT'
		} = variables as {
			imageId: string;
			projectId: string;
			bboxes?: Array<{
				x: number;
				y: number;
				width: number;
				height: number;
				annotation: { text: string; tags: string[] };
			}>;
			status?: string;
		};

		const image = mockImages.find((img) => img.id === imageId);
		const project = mockProjects.find((proj) => proj.id === projectId);

		if (!image || !project) {
			return HttpResponse.json({
				errors: [{ message: 'Image or project not found' }]
			});
		}

		const newTask = {
			id: `task-${Date.now()}`,
			status,
			createdAt: new Date().toISOString(),
			image,
			project,
			bboxes
		};

		// Add to mock data for consistency in tests
		mockTasks.unshift(newTask);

		return HttpResponse.json({
			data: {
				createTask: newTask
			}
		});
	}),

	graphql.mutation('UpdateTask', ({ variables }) => {
		const { id, imageId, projectId, bboxes, status } = variables as {
			id: string;
			imageId?: string;
			projectId?: string;
			bboxes?: Array<{
				x: number;
				y: number;
				width: number;
				height: number;
				annotation: { text: string; tags: string[] };
			}>;
			status?: string;
		};

		const taskIndex = mockTasks.findIndex((t) => t.id === id);

		if (taskIndex === -1) {
			return HttpResponse.json({
				data: { updateTask: null }
			});
		}

		const updatedTask = { ...mockTasks[taskIndex] };

		if (imageId) {
			const image = mockImages.find((img) => img.id === imageId);
			if (image) updatedTask.image = image;
		}

		if (projectId) {
			const project = mockProjects.find((proj) => proj.id === projectId);
			if (project) updatedTask.project = project;
		}

		if (bboxes !== undefined) {
			updatedTask.bboxes = bboxes;
		}

		if (status !== undefined) {
			updatedTask.status = status;
		}

		mockTasks[taskIndex] = updatedTask;

		return HttpResponse.json({
			data: {
				updateTask: updatedTask
			}
		});
	}),

	graphql.mutation('DeleteTask', ({ variables }) => {
		const { id } = variables as { id: string };
		const taskIndex = mockTasks.findIndex((t) => t.id === id);

		if (taskIndex === -1) {
			return HttpResponse.json({
				data: { deleteTask: false }
			});
		}

		mockTasks.splice(taskIndex, 1);

		return HttpResponse.json({
			data: {
				deleteTask: true
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
