import { test as base, type Page } from '@playwright/test';

// Real E2E setup - no mocking, tests against actual backend
export interface TestFixtures {
	waitForBackend: () => Promise<void>;
	cleanupTestData: () => Promise<void>;
}

const API_BASE_URL = process.env.VITE_BACKEND_URL || 'http://localhost:8001';

export const test = base.extend<TestFixtures>({
	// Wait for backend to be ready
	// eslint-disable-next-line no-empty-pattern
	waitForBackend: async ({}, use) => {
		const waitFn = async () => {
			const maxRetries = 30;
			let retries = 0;

			while (retries < maxRetries) {
				try {
					const response = await fetch(`${API_BASE_URL}/health`);
					if (response.ok) {
						console.log('Backend is ready');
						return;
					}
				} catch {
					// Backend not ready yet
				}

				retries++;
				await new Promise((resolve) => setTimeout(resolve, 1000));
			}

			throw new Error('Backend did not become ready in time');
		};

		await use(waitFn);
	},

	// Clean up test data after tests
	// eslint-disable-next-line no-empty-pattern
	cleanupTestData: async ({}, use) => {
		const cleanupFn = async () => {
			console.log('Cleaning up test data...');
			try {
				// Clean up test projects
				await deleteAllTestProjects();
			} catch (error) {
				console.warn('Failed to clean up test data:', error);
			}
		};

		await use(cleanupFn);
	}
});

export { expect } from '@playwright/test';

// Helper to create test data via API
export async function createTestProject(name: string, description: string) {
	const apiUrl = process.env.VITE_BACKEND_URL || 'http://localhost:8001';

	// Add retry logic for API calls
	let retries = 3;
	while (retries > 0) {
		try {
			const response = await fetch(`${apiUrl}/graphql`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					query: `
						mutation CreateProject($name: String!, $description: String!) {
							createProject(name: $name, description: $description) {
								id
								name
								description
							}
						}
					`,
					variables: { name, description }
				})
			});

			const data = await response.json();
			if (data.errors) {
				throw new Error(`GraphQL Error: ${data.errors[0].message}`);
			}

			// Add a small delay to ensure data is available
			await new Promise((resolve) => setTimeout(resolve, 100));

			return data.data.createProject;
		} catch (error) {
			retries--;
			if (retries === 0) throw error;
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
	}
}

// Helper to delete all test projects
export async function deleteAllTestProjects() {
	const apiUrl = process.env.VITE_BACKEND_URL || 'http://localhost:8001';

	// First, get all projects
	const queryResponse = await fetch(`${apiUrl}/graphql`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			query: `
				query GetProjects($limit: Int, $offset: Int) {
					projects(limit: $limit, offset: $offset) {
						objects {
							id
							name
						}
					}
				}
			`,
			variables: { limit: 100, offset: 0 }
		})
	});

	const queryData = await queryResponse.json();
	if (queryData.errors) {
		throw new Error(`GraphQL Query Error: ${queryData.errors[0].message}`);
	}

	const projects = queryData.data.projects?.objects || [];
	if (!projects || projects.length === 0) {
		return;
	}

	// Delete projects that look like test projects
	for (const project of projects) {
		if (project.name.includes('Test') || project.name.includes('E2E')) {
			await fetch(`${apiUrl}/graphql`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					query: `
						mutation DeleteProject($id: ID!) {
							deleteProject(id: $id)
						}
					`,
					variables: { id: project.id }
				})
			});
		}
	}
}

// Helper to wait for projects to load in UI
export async function waitForProjectsToLoad(page: Page, timeout: number = 10000) {
	try {
		// Wait for either project list or empty state
		await page.waitForSelector('[data-testid="project-list"], .empty-state', { timeout });
		// Additional small delay to ensure rendering is complete
		await page.waitForTimeout(200);
	} catch (error) {
		console.warn('Projects did not load within timeout, continuing anyway');
		console.error(error);
	}
}

// Helper to wait for modal to appear
export async function waitForModal(page: Page, timeout: number = 5000) {
	try {
		await page.waitForSelector('[data-testid="submit-project-btn"]', { timeout });
		await page.waitForTimeout(100); // Small delay for modal animation
	} catch (error) {
		console.warn('Modal did not appear within timeout');
		throw error;
	}
}
