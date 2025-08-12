import { test as base, expect, type Page } from '@playwright/test';
import { mockProjects, mockTasks, mockImages } from './test-data';

/**
 * Extended test fixtures with setup utilities
 */

export interface TestFixtures {
	setupTestData: () => Promise<void>;
	cleanupTestData: () => Promise<void>;
	mockGraphQLResponses: (page: Page) => Promise<void>;
	navigateToAnnotation: (page: Page, projectId: string, taskId: string) => Promise<void>;
}

export const test = base.extend<TestFixtures>({
	/**
	 * Set up test data in the database
	 */
	// eslint-disable-next-line no-empty-pattern
	setupTestData: async ({}, use) => {
		const setupFn = async () => {
			// In a real application, you would insert test data into your database
			// For this example, we'll mock the API responses
			console.log('Setting up test data...');

			// You could make actual API calls here to set up data:
			// await fetch(`${process.env.API_BASE_URL || process.env.VITE_API_URL || 'http://localhost:8001'}/graphql`, {
			//   method: 'POST',
			//   headers: { 'Content-Type': 'application/json' },
			//   body: JSON.stringify({
			//     query: CREATE_PROJECT_MUTATION,
			//     variables: { input: mockProjects[0] }
			//   })
			// });
		};

		await use(setupFn);
	},

	/**
	 * Clean up test data after tests
	 */
	// eslint-disable-next-line no-empty-pattern
	cleanupTestData: async ({}, use) => {
		const cleanupFn = async () => {
			console.log('Cleaning up test data...');

			// In a real application, you would clean up test data:
			// await fetch(`${process.env.API_BASE_URL || process.env.VITE_API_URL || 'http://localhost:8001'}/test/cleanup`, { method: 'POST' });
		};

		await use(cleanupFn);
	},

	/**
	 * Mock GraphQL API responses for consistent testing
	 */
	// eslint-disable-next-line no-empty-pattern
	mockGraphQLResponses: async ({}, use) => {
		const mockFn = async (page: Page) => {
			// Mock the GraphQL endpoint
			await page.route('**/graphql', async (route) => {
				const request = route.request();
				const postData = request.postData();

				if (!postData) {
					await route.continue();
					return;
				}

				try {
					const { query, variables } = JSON.parse(postData);

					// Mock projects query (frontend uses 'projects' query)
					if (query.includes('projects') && variables?.limit !== undefined) {
						await route.fulfill({
							status: 200,
							contentType: 'application/json',
							body: JSON.stringify({
								data: {
									projects: {
										objects: mockProjects,
										count: mockProjects.length,
										limit: variables.limit,
										offset: variables.offset || 0
									}
								}
							})
						});
						return;
					}

					// Mock project by ID query (frontend uses 'project' query)
					if (query.includes('project') && !query.includes('projects') && variables?.id) {
						const project = mockProjects.find((p) => p.id === variables.id);
						if (project) {
							await route.fulfill({
								status: 200,
								contentType: 'application/json',
								body: JSON.stringify({
									data: {
										project: {
											...project,
											tasks: mockTasks.filter((t) => t.projectId === project.id)
										}
									}
								})
							});
							return;
						}
					}

					// Mock images query (frontend uses 'images' query)
					if (query.includes('images') && variables?.limit !== undefined) {
						await route.fulfill({
							status: 200,
							contentType: 'application/json',
							body: JSON.stringify({
								data: {
									images: {
										objects: mockImages,
										count: mockImages.length,
										limit: variables.limit,
										offset: variables.offset || 0
									}
								}
							})
						});
						return;
					}

					// Mock task by image and project query
					if (query.includes('taskByImageAndProject')) {
						// Return null to simulate no existing task (will create new one)
						await route.fulfill({
							status: 200,
							contentType: 'application/json',
							body: JSON.stringify({
								data: {
									taskByImageAndProject: null
								}
							})
						});
						return;
					}

					// Mock create mutations
					if (query.includes('createProject')) {
						const newProject = {
							id: `project-${Date.now()}`,
							...variables.input,
							createdAt: new Date(),
							taskCount: 0
						};
						await route.fulfill({
							status: 200,
							contentType: 'application/json',
							body: JSON.stringify({
								data: {
									createProject: newProject
								}
							})
						});
						return;
					}

					if (query.includes('createTask')) {
						const newTask = {
							id: `task-${Date.now()}`,
							project: mockProjects.find((p) => p.id === variables.projectId) || mockProjects[0],
							bboxes: variables.bboxes || [],
							status: variables.status || 'DRAFT'
						};
						await route.fulfill({
							status: 200,
							contentType: 'application/json',
							body: JSON.stringify({
								data: {
									createTask: newTask
								}
							})
						});
						return;
					}

					if (query.includes('updateTask')) {
						const updatedTask = {
							id: variables.id,
							bboxes: variables.bboxes || []
						};
						await route.fulfill({
							status: 200,
							contentType: 'application/json',
							body: JSON.stringify({
								data: {
									updateTask: updatedTask
								}
							})
						});
						return;
					}

					if (query.includes('createAnnotation')) {
						const newAnnotation = {
							id: `annotation-${Date.now()}`,
							...variables.input,
							createdAt: new Date(),
							createdBy: 'test-user'
						};
						await route.fulfill({
							status: 200,
							contentType: 'application/json',
							body: JSON.stringify({
								data: {
									createAnnotation: newAnnotation
								}
							})
						});
						return;
					}

					// Default: continue with actual request
					await route.continue();
				} catch (error) {
					console.error('Error mocking GraphQL response:', error);
					await route.continue();
				}
			});

			// Mock image file requests
			await page.route('**/api/images/**', async (route) => {
				// Serve a placeholder image for testing
				await route.fulfill({
					status: 200,
					contentType: 'image/jpeg',
					body: Buffer.from('fake-image-data')
				});
			});

			// Mock health check
			await page.route('**/health', async (route) => {
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify({ status: 'healthy' })
				});
			});
		};

		await use(mockFn);
	},

	/**
	 * Navigate to annotation workspace
	 */
	// eslint-disable-next-line no-empty-pattern
	navigateToAnnotation: async ({}, use) => {
		const navigateFn = async (page: Page, projectId: string, taskId: string) => {
			await page.goto(`/projects/${projectId}/annotate?task=${taskId}`);
			await expect(page).toHaveTitle(/Annotation/);
		};

		await use(navigateFn);
	}
});

export { expect } from '@playwright/test';
