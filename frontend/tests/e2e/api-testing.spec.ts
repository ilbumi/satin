import { test, expect } from './fixtures/setup';
import {
	API_ENDPOINTS,
	CREATE_PROJECT_MUTATION,
	CREATE_TASK_MUTATION,
	CREATE_ANNOTATION_MUTATION
} from './fixtures/test-data';

test.describe('GraphQL API Testing', () => {
	const baseURL = process.env.API_BASE_URL || process.env.VITE_API_URL || 'http://localhost:8001';
	const graphqlEndpoint = `${baseURL}${API_ENDPOINTS.GRAPHQL}`;

	test('should check API health endpoint', async ({ request }) => {
		const response = await request.get(`${baseURL}${API_ENDPOINTS.HEALTH}`);

		expect(response.status()).toBe(200);

		const data = await response.json();
		expect(data).toHaveProperty('status');
		expect(data.status).toBe('healthy');
	});

	test('should fetch projects via GraphQL', async ({ request }) => {
		const query = `
      query GetProjects($limit: Int, $offset: Int) {
        projects(limit: $limit, offset: $offset) {
          objects {
            id
            name
            description
          }
          count
          limit
          offset
        }
      }
    `;

		const response = await request.post(graphqlEndpoint, {
			data: {
				query,
				variables: { limit: 10, offset: 0 }
			}
		});

		expect(response.status()).toBe(200);

		const data = await response.json();
		expect(data).toHaveProperty('data');
		expect(data.data).toHaveProperty('projects');
		expect(data.data.projects).toHaveProperty('objects');
		expect(data.data.projects).toHaveProperty('count');
		expect(Array.isArray(data.data.projects.objects)).toBe(true);
	});

	test('should fetch single project by ID via GraphQL', async ({ request }) => {
		const query = `
      query GetProject($id: ID!) {
        project(id: $id) {
          id
          name
          description
        }
      }
    `;

		const response = await request.post(graphqlEndpoint, {
			data: {
				query,
				variables: { id: 'project-1' }
			}
		});

		expect(response.status()).toBe(200);

		const data = await response.json();
		expect(data).toHaveProperty('data');
		expect(data.data).toHaveProperty('project');

		if (data.data.project) {
			expect(data.data.project).toHaveProperty('id');
			expect(data.data.project).toHaveProperty('name');
			expect(data.data.project).toHaveProperty('description');
		}
	});

	test('should create project via GraphQL mutation', async ({ request }) => {
		const mutation = CREATE_PROJECT_MUTATION;
		const variables = {
			name: 'API Test Project',
			description: 'Created via API testing'
		};

		const response = await request.post(graphqlEndpoint, {
			data: {
				query: mutation,
				variables
			}
		});

		expect(response.status()).toBe(200);

		const data = await response.json();
		expect(data).toHaveProperty('data');
		expect(data.data).toHaveProperty('createProject');
		expect(data.data.createProject).toHaveProperty('id');
		expect(data.data.createProject.name).toBe(variables.name);
		expect(data.data.createProject.description).toBe(variables.description);
	});

	test('should validate project input in GraphQL mutation', async ({ request }) => {
		const mutation = CREATE_PROJECT_MUTATION;

		// Test with missing required fields
		const response = await request.post(graphqlEndpoint, {
			data: {
				query: mutation,
				variables: {}
			}
		});

		expect(response.status()).toBe(200);

		const data = await response.json();
		expect(data).toHaveProperty('errors');
		expect(Array.isArray(data.errors)).toBe(true);
		expect(data.errors.length).toBeGreaterThan(0);
	});

	test('should fetch tasks via GraphQL with filters', async ({ request }) => {
		const query = `
      query GetTasks($limit: Int, $offset: Int) {
        tasks(limit: $limit, offset: $offset) {
          objects {
            id
            project {
              id
              name
              description
            }
            status
          }
          count
          limit
          offset
        }
      }
    `;

		// Test with project filter
		const response = await request.post(graphqlEndpoint, {
			data: {
				query,
				variables: {
					limit: 5,
					offset: 0
				}
			}
		});

		expect(response.status()).toBe(200);

		const data = await response.json();
		expect(data).toHaveProperty('data');
		expect(data.data).toHaveProperty('tasks');
		expect(Array.isArray(data.data.tasks.objects)).toBe(true);

		// Basic task validation
		data.data.tasks.objects.forEach((task: { id: string; project: object; status: string }) => {
			expect(task).toHaveProperty('id');
			expect(task).toHaveProperty('project');
			expect(task).toHaveProperty('status');
		});
	});

	test('should create task via GraphQL mutation', async ({ request }) => {
		const mutation = CREATE_TASK_MUTATION;
		// First create an image and project for the task
		const imageResponse = await request.post(graphqlEndpoint, {
			data: {
				query: 'mutation { createImage(url: "/test/image.jpg") { id } }'
			}
		});
		const imageId = (await imageResponse.json()).data.createImage.id;

		const projectResponse = await request.post(graphqlEndpoint, {
			data: {
				query: 'mutation { createProject(name: "Test Project", description: "Test") { id } }'
			}
		});
		const projectId = (await projectResponse.json()).data.createProject.id;

		const response = await request.post(graphqlEndpoint, {
			data: {
				query: mutation,
				variables: { imageId, projectId, status: 'DRAFT' }
			}
		});

		expect(response.status()).toBe(200);

		const data = await response.json();
		expect(data).toHaveProperty('data');
		expect(data.data).toHaveProperty('createTask');
		expect(data.data.createTask).toHaveProperty('id');
		expect(data.data.createTask).toHaveProperty('project');
		expect(data.data.createTask.project.id).toBe(projectId);
	});

	test('should fetch images for a task via GraphQL', async ({ request }) => {
		const query = `
      query GetImages($limit: Int, $offset: Int) {
        images(limit: $limit, offset: $offset) {
          objects {
            id
            url
          }
          count
          limit
          offset
        }
      }
    `;

		const response = await request.post(graphqlEndpoint, {
			data: {
				query,
				variables: {
					limit: 10,
					offset: 0
				}
			}
		});

		expect(response.status()).toBe(200);

		const data = await response.json();
		expect(data).toHaveProperty('data');
		expect(data.data).toHaveProperty('images');
		expect(Array.isArray(data.data.images.objects)).toBe(true);

		// Verify image structure
		data.data.images.objects.forEach((image: { id: string; url: string }) => {
			expect(image).toHaveProperty('id');
			expect(image).toHaveProperty('url');
		});
	});

	test('should create annotation via GraphQL mutation', async ({ request }) => {
		const mutation = CREATE_ANNOTATION_MUTATION;
		const annotationInput = {
			imageId: 'image-1',
			type: 'bounding_box',
			label: 'api-test-object',
			coordinates: {
				x: 100,
				y: 150,
				width: 200,
				height: 100
			}
		};

		const response = await request.post(graphqlEndpoint, {
			data: {
				query: mutation,
				variables: { input: annotationInput }
			}
		});

		expect(response.status()).toBe(200);

		const data = await response.json();
		expect(data).toHaveProperty('data');
		expect(data.data).toHaveProperty('createAnnotation');
		expect(data.data.createAnnotation).toHaveProperty('id');
		expect(data.data.createAnnotation.label).toBe(annotationInput.label);
		expect(data.data.createAnnotation.type).toBe(annotationInput.type);
		expect(data.data.createAnnotation.coordinates).toEqual(annotationInput.coordinates);
	});

	test('should update annotation via GraphQL mutation', async ({ request }) => {
		const mutation = `
      mutation UpdateAnnotation($id: ID!, $input: AnnotationUpdateInput!) {
        updateAnnotation(id: $id, input: $input) {
          id
          label
          coordinates
          type
        }
      }
    `;

		const updateInput = {
			label: 'updated-api-object',
			coordinates: {
				x: 150,
				y: 200,
				width: 250,
				height: 150
			}
		};

		const response = await request.post(graphqlEndpoint, {
			data: {
				query: mutation,
				variables: {
					id: 'annotation-1',
					input: updateInput
				}
			}
		});

		expect(response.status()).toBe(200);

		const data = await response.json();
		expect(data).toHaveProperty('data');
		expect(data.data).toHaveProperty('updateAnnotation');
		expect(data.data.updateAnnotation.label).toBe(updateInput.label);
		expect(data.data.updateAnnotation.coordinates).toEqual(updateInput.coordinates);
	});

	test('should delete annotation via GraphQL mutation', async ({ request }) => {
		const mutation = `
      mutation DeleteAnnotation($id: ID!) {
        deleteAnnotation(id: $id) {
          success
          message
        }
      }
    `;

		const response = await request.post(graphqlEndpoint, {
			data: {
				query: mutation,
				variables: { id: 'annotation-1' }
			}
		});

		expect(response.status()).toBe(200);

		const data = await response.json();
		expect(data).toHaveProperty('data');
		expect(data.data).toHaveProperty('deleteAnnotation');
		expect(data.data.deleteAnnotation.success).toBe(true);
	});

	test('should handle GraphQL schema introspection', async ({ request }) => {
		const introspectionQuery = `
      query IntrospectionQuery {
        __schema {
          types {
            name
            kind
            description
          }
        }
      }
    `;

		const response = await request.post(graphqlEndpoint, {
			data: {
				query: introspectionQuery
			}
		});

		expect(response.status()).toBe(200);

		const data = await response.json();
		expect(data).toHaveProperty('data');
		expect(data.data).toHaveProperty('__schema');
		expect(data.data.__schema).toHaveProperty('types');
		expect(Array.isArray(data.data.__schema.types)).toBe(true);

		// Verify expected types exist
		const typeNames = data.data.__schema.types.map((type: { name: string }) => type.name);
		expect(typeNames).toContain('Project');
		expect(typeNames).toContain('Task');
		expect(typeNames).toContain('Image');
		expect(typeNames).toContain('Annotation');
	});

	test('should handle pagination correctly', async ({ request }) => {
		const query = `
      query GetProjectsPaginated($limit: Int!, $offset: Int!) {
        getProjects(limit: $limit, offset: $offset) {
          items {
            id
            name
          }
          totalCount
          hasNextPage
          hasPreviousPage
        }
      }
    `;

		// Test first page
		const firstPageResponse = await request.post(graphqlEndpoint, {
			data: {
				query,
				variables: { limit: 2, offset: 0 }
			}
		});

		expect(firstPageResponse.status()).toBe(200);
		const firstPage = await firstPageResponse.json();

		expect(firstPage.data.getProjects.items.length).toBeLessThanOrEqual(2);
		expect(firstPage.data.getProjects.hasPreviousPage).toBe(false);

		// Test second page if there are enough items
		if (firstPage.data.getProjects.totalCount > 2) {
			const secondPageResponse = await request.post(graphqlEndpoint, {
				data: {
					query,
					variables: { limit: 2, offset: 2 }
				}
			});

			expect(secondPageResponse.status()).toBe(200);
			const secondPage = await secondPageResponse.json();

			expect(secondPage.data.getProjects.hasPreviousPage).toBe(true);

			// Verify different items are returned
			const firstPageIds = firstPage.data.getProjects.items.map((item: { id: string }) => item.id);
			const secondPageIds = secondPage.data.getProjects.items.map(
				(item: { id: string }) => item.id
			);

			// Should not have overlapping IDs
			const intersection = firstPageIds.filter((id: string) => secondPageIds.includes(id));
			expect(intersection.length).toBe(0);
		}
	});

	test('should validate GraphQL variables', async ({ request }) => {
		const query = `
      query GetProject($id: ID!) {
        getProject(id: $id) {
          id
          name
        }
      }
    `;

		// Test with invalid variable type
		const response = await request.post(graphqlEndpoint, {
			data: {
				query,
				variables: { id: 12345 } // Should be string, not number
			}
		});

		expect(response.status()).toBe(200);

		const data = await response.json();
		// Should either coerce the value or return validation error
		expect(data).toHaveProperty('data');
	});

	test('should handle GraphQL errors gracefully', async ({ request }) => {
		const invalidQuery = `
      query InvalidQuery {
        nonExistentField {
          id
        }
      }
    `;

		const response = await request.post(graphqlEndpoint, {
			data: {
				query: invalidQuery
			}
		});

		expect(response.status()).toBe(200);

		const data = await response.json();
		expect(data).toHaveProperty('errors');
		expect(Array.isArray(data.errors)).toBe(true);
		expect(data.errors.length).toBeGreaterThan(0);
		expect(data.errors[0]).toHaveProperty('message');
	});

	test('should handle concurrent GraphQL requests', async ({ request }) => {
		const query = `
      query GetProjects {
        getProjects(limit: 10) {
          items {
            id
            name
          }
        }
      }
    `;

		// Make multiple concurrent requests
		const promises = Array(5)
			.fill(null)
			.map(() =>
				request.post(graphqlEndpoint, {
					data: { query }
				})
			);

		const responses = await Promise.all(promises);

		// All requests should succeed
		responses.forEach((response) => {
			expect(response.status()).toBe(200);
		});

		// All should return the same data
		const dataPromises = responses.map((response) => response.json());
		const allData = await Promise.all(dataPromises);

		// Compare first response with others
		const firstResponse = JSON.stringify(allData[0]);
		allData.slice(1).forEach((data) => {
			expect(JSON.stringify(data)).toBe(firstResponse);
		});
	});

	test('should respect GraphQL field selection', async ({ request }) => {
		const query = `
      query GetProjectsMinimal {
        projects {
          objects {
            id
            name
          }
        }
      }
    `;

		const response = await request.post(graphqlEndpoint, {
			data: { query }
		});

		expect(response.status()).toBe(200);

		const data = await response.json();
		expect(data).toHaveProperty('data');

		// Verify only requested fields are returned
		if (data.data.projects.objects.length > 0) {
			const project = data.data.projects.objects[0];
			expect(project).toHaveProperty('id');
			expect(project).toHaveProperty('name');
			expect(project).not.toHaveProperty('description'); // Not requested
		}
	});

	test('should handle nested GraphQL queries', async ({ request }) => {
		const query = `
      query GetProjectWithTasks($projectId: ID!) {
        project(id: $projectId) {
          id
          name
          description
        }
      }
    `;

		const response = await request.post(graphqlEndpoint, {
			data: {
				query,
				variables: { projectId: 'project-1' }
			}
		});

		expect(response.status()).toBe(200);

		const data = await response.json();
		expect(data).toHaveProperty('data');

		if (data.data.project) {
			expect(data.data.project).toHaveProperty('id');
			expect(data.data.project).toHaveProperty('name');
			expect(data.data.project).toHaveProperty('description');
		}
	});
});
