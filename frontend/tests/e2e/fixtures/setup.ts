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

// Helper to create test data via UI (solves cache sync issues)
export async function createProjectViaUI(page: Page, name: string, description: string) {
	// Make project name unique to avoid duplicate key errors
	const uniqueName = `${name} ${Date.now()}`;

	// Click create project button
	await page.click('[data-testid="create-project-btn"]');

	// Wait for modal and fill form
	await page.waitForSelector('[data-testid="project-name-input"]', { timeout: 5000 });
	await page.fill('[data-testid="project-name-input"]', uniqueName);
	await page.fill('[data-testid="project-description-input"]', description);

	// Submit form
	await page.click('[data-testid="submit-project-btn"]');

	// Wait for either success (modal closes) or error message
	try {
		await Promise.race([
			// Success: modal closes
			page.waitForSelector('[data-testid="submit-project-btn"]', {
				state: 'detached',
				timeout: 15000
			}),
			// Error: error message appears
			page.waitForSelector('[data-testid="error-message"]', { timeout: 15000 }).then(() => {
				throw new Error('Project creation failed - error message appeared');
			})
		]);

		// Wait for project to appear in the list
		await page.waitForSelector(`[data-testid="project-name"]:has-text("${uniqueName}")`, {
			timeout: 10000
		});
	} catch (error) {
		// Check if button is stuck in loading state
		const loadingButton = await page
			.locator('[data-testid="submit-project-btn"]:has-text("Creating...")')
			.isVisible();
		if (loadingButton) {
			throw new Error(
				`Project creation timed out - button stuck in loading state. Backend may be unreachable.`
			);
		}

		// Check for error messages
		const errorMsg = await page.locator('[data-testid="error-message"]').textContent();
		if (errorMsg) {
			throw new Error(`Project creation failed: ${errorMsg}`);
		}

		throw error;
	}

	// Return project info
	return { name: uniqueName, description };
}

// Keep the old API-based function for backward compatibility if needed
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
				console.error('GraphQL Error creating project:', data.errors);
				throw new Error(`GraphQL Error: ${data.errors[0].message}`);
			}

			console.log('Created test project:', data.data.createProject);

			// Add a small delay to ensure data is available
			await new Promise((resolve) => setTimeout(resolve, 500));

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
export async function waitForProjectsToLoad(page: Page) {
	try {
		// Wait for main content to be ready
		await page.waitForSelector('main', { timeout: 5000 });

		// Check if page is stuck in loading state
		const loadingState = await page.locator('p:has-text("Loading projects...")').isVisible();
		if (loadingState) {
			// Wait a bit to see if loading resolves
			await page.waitForTimeout(2000);

			// Check again
			const stillLoading = await page.locator('p:has-text("Loading projects...")').isVisible();
			if (stillLoading) {
				throw new Error('Projects page stuck in loading state - backend may be unreachable');
			}
		}

		// Wait for either project list or empty state message
		await page.waitForSelector('[data-testid="project-list"], h2:has-text("No projects yet")', {
			timeout: 10000
		});

		// Small delay for rendering
		await page.waitForTimeout(200);
	} catch (error) {
		console.warn('Projects page did not load as expected, continuing anyway');
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
