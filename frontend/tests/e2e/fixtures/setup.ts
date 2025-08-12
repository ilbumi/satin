import { test as base, expect, type Page } from '@playwright/test';
import { mockProjects, mockTasks, mockImages } from './test-data';

/**
 * Extended test fixtures with setup utilities
 */

export interface TestFixtures {
	setupTestData: () => Promise<void>;
	cleanupTestData: () => Promise<void>;
	mockGraphQLResponses: (page: Page) => Promise<void>;
	navigateToAnnotation: (projectId: string, taskId: string) => Promise<void>;
}

export const test = base.extend<TestFixtures>({
	/**
	 * Set up test data in the database
	 */
	setupTestData: async (_, use) => {
		const setupFn = async () => {
			// In a real application, you would insert test data into your database
			// For this example, we'll mock the API responses
			console.log('Setting up test data...');

			// You could make actual API calls here to set up data:
			// await fetch('http://localhost:8000/graphql', {
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
	cleanupTestData: async (_, use) => {
		const cleanupFn = async () => {
			console.log('Cleaning up test data...');

			// In a real application, you would clean up test data:
			// await fetch('http://localhost:8000/test/cleanup', { method: 'POST' });
		};

		await use(cleanupFn);
	},

	/**
	 * Mock GraphQL API responses for consistent testing
	 */
	mockGraphQLResponses: async (_, use) => {
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

					// Mock projects query
					if (query.includes('getProjects')) {
						await route.fulfill({
							status: 200,
							contentType: 'application/json',
							body: JSON.stringify({
								data: {
									getProjects: {
										items: mockProjects,
										totalCount: mockProjects.length,
										hasNextPage: false,
										hasPreviousPage: false
									}
								}
							})
						});
						return;
					}

					// Mock project by ID query
					if (query.includes('getProject') && variables?.id) {
						const project = mockProjects.find((p) => p.id === variables.id);
						if (project) {
							await route.fulfill({
								status: 200,
								contentType: 'application/json',
								body: JSON.stringify({
									data: {
										getProject: {
											...project,
											tasks: mockTasks.filter((t) => t.projectId === project.id)
										}
									}
								})
							});
							return;
						}
					}

					// Mock tasks query
					if (query.includes('getTasks')) {
						const projectId = variables?.projectId;
						const tasks = projectId
							? mockTasks.filter((t) => t.projectId === projectId)
							: mockTasks;

						await route.fulfill({
							status: 200,
							contentType: 'application/json',
							body: JSON.stringify({
								data: {
									getTasks: {
										items: tasks,
										totalCount: tasks.length,
										hasNextPage: false,
										hasPreviousPage: false
									}
								}
							})
						});
						return;
					}

					// Mock images query
					if (query.includes('getImages')) {
						const taskId = variables?.taskId;
						const images = taskId ? mockImages.filter((i) => i.taskId === taskId) : mockImages;

						await route.fulfill({
							status: 200,
							contentType: 'application/json',
							body: JSON.stringify({
								data: {
									getImages: {
										items: images,
										totalCount: images.length,
										hasNextPage: false,
										hasPreviousPage: false
									}
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
							...variables.input,
							status: 'pending',
							assignedTo: null
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
	navigateToAnnotation: async ({ page }, use) => {
		const navigateFn = async (projectId: string, taskId: string) => {
			await page.goto(`/projects/${projectId}/annotate?task=${taskId}`);
			await expect(page).toHaveTitle(/Annotation/);
		};

		await use(navigateFn);
	}
});

export { expect } from '@playwright/test';
