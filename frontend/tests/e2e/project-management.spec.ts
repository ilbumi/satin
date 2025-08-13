import { test, expect, createTestProject, waitForProjectsToLoad } from './fixtures/setup';

test.describe('Project Management', () => {
	test.beforeEach(async ({ waitForBackend }) => {
		await waitForBackend();
	});

	test.afterEach(async ({ cleanupTestData }) => {
		await cleanupTestData();
	});

	test('should display home page correctly', async ({ page }) => {
		await page.goto('/');

		// Check page title and main content
		await expect(page).toHaveTitle(/SATIn/);

		// Verify navigation is present
		const navigation = page.locator('nav');
		await expect(navigation).toBeVisible();

		// Check for main content area
		const main = page.locator('main');
		await expect(main).toBeVisible();
	});

	test('should navigate to projects page', async ({ page }) => {
		await page.goto('/');

		// Click on projects navigation link
		await page.click('text=Projects');

		// Verify we're on the projects page
		await expect(page).toHaveURL(/\/projects/);
		await expect(page.locator('h1')).toContainText('Projects');
	});

	test('should display projects page', async ({ page }) => {
		await page.goto('/projects');

		// Wait for projects page to load
		await expect(page.locator('h1')).toContainText('Projects');
	});

	test('should create a new project via UI', async ({ page }) => {
		await page.goto('/projects');
		await waitForProjectsToLoad(page);

		// Click create project button
		await page.click('[data-testid="create-project-btn"]');
		await page.waitForSelector('[data-testid="submit-project-btn"]');

		// Fill out the form
		await page.fill('[data-testid="project-name-input"]', 'UI Test Project');
		await page.fill('[data-testid="project-description-input"]', 'Project created via UI');

		// Submit the form
		await page.click('[data-testid="submit-project-btn"]');

		// Verify project appears in the list
		await expect(
			page.locator(`[data-testid="project-name"]:has-text("UI Test Project")`)
		).toBeVisible({ timeout: 5000 });
	});

	test('should validate project form inputs', async ({ page }) => {
		await page.goto('/projects');

		// Click create project button
		await page.click('[data-testid="create-project-btn"]');

		// Wait for modal to appear
		await page.waitForSelector('[data-testid="submit-project-btn"]', { timeout: 5000 });


		// Test name length validation
		await page.fill('[data-testid="project-name-input"]', 'A'); // Too short
		await page.click('[data-testid="submit-project-btn"]');
		await expect(page.locator('[data-testid="name-error"]')).toContainText(
			'Project name must be at least 3 characters'
		);

		// Test name max length
		const longName = 'A'.repeat(101); // Assuming 100 char limit
		await page.fill('[data-testid="project-name-input"]', longName);
		await page.click('[data-testid="submit-project-btn"]');
		await expect(page.locator('[data-testid="name-error"]')).toContainText(
			'Project name must be less than 100 characters'
		);
	});

	test('should edit an existing project', async ({ page }) => {
		await page.goto('/projects');
		await waitForProjectsToLoad(page);

		// First create a test project
		const project = await createTestProject('Edit Test Project', 'Project to edit');

		// Refresh to see the created project
		await page.evaluate(() =>
			(window as Window & { refreshProjects?: () => Promise<void> }).refreshProjects?.()
		);
		await page.waitForTimeout(1000); // Extra delay for API response
		await waitForProjectsToLoad(page);

		// Click edit button on the test project
		const projectCard = page.locator(
			`[data-testid="project-item"]:has([data-testid="project-name"]:has-text("${project.name}"))`
		);
		await projectCard.locator('[data-testid="edit-project-btn"]').click();

		// Wait for edit modal to appear
		await page.waitForSelector('[data-testid="submit-project-btn"]');

		// Modify project details
		const updatedName = 'Updated Edit Test Project';

		await page.fill('[data-testid="project-name-input"]', updatedName);
		await page.fill('[data-testid="project-description-input"]', 'Updated description');

		// Save changes
		await page.click('[data-testid="submit-project-btn"]');

		// Wait for modal to close and verify changes
		await page.waitForSelector(`[data-testid="project-name"]:has-text("${updatedName}")`, {
			timeout: 5000
		});
	});

	test('should delete a project with confirmation', async ({ page }) => {
		await page.goto('/projects');
		await waitForProjectsToLoad(page);

		// First create a test project
		const project = await createTestProject('Delete Test Project', 'Project to delete');

		// Refresh to see the created project
		await page.evaluate(() =>
			(window as Window & { refreshProjects?: () => Promise<void> }).refreshProjects?.()
		);
		await page.waitForTimeout(1000); // Extra delay for API response
		await waitForProjectsToLoad(page);

		const initialProjectCount = await page.locator('[data-testid="project-item"]').count();

		// Click delete button on the test project
		const projectCard = page.locator(
			`[data-testid="project-item"]:has([data-testid="project-name"]:has-text("${project.name}"))`
		);
		await projectCard.locator('[data-testid="delete-project-btn"]').click();

		// Confirm deletion in modal
		await expect(page.locator('[data-testid="delete-confirmation-modal"]')).toBeVisible();
		await expect(page.locator('[data-testid="confirmation-message"]')).toContainText(project.name);

		await page.click('[data-testid="confirm-delete-btn"]');

		// Wait for the project to be removed
		await page.waitForFunction(
			(projectName) =>
				!document.querySelector(`[data-testid="project-name"]:has-text("${projectName}")`),
			project.name,
			{ timeout: 10000 }
		);

		// Verify project is removed
		const finalProjectCount = await page.locator('[data-testid="project-item"]').count();
		expect(finalProjectCount).toBe(initialProjectCount - 1);
	});

	test('should cancel project deletion', async ({ page }) => {
		await page.goto('/projects');
		await waitForProjectsToLoad(page);

		// First create a test project
		const project = await createTestProject('Cancel Delete Test', 'Project not to delete');

		// Refresh to see the created project
		await page.evaluate(() =>
			(window as Window & { refreshProjects?: () => Promise<void> }).refreshProjects?.()
		);
		await page.waitForTimeout(1000); // Extra delay for API response
		await waitForProjectsToLoad(page);

		const initialProjectCount = await page.locator('[data-testid="project-item"]').count();

		// Click delete button on test project
		const projectCard = page.locator(
			`[data-testid="project-item"]:has([data-testid="project-name"]:has-text("${project.name}"))`
		);
		await projectCard.locator('[data-testid="delete-project-btn"]').click();

		// Wait for modal and cancel deletion
		await page.waitForSelector('[data-testid="delete-confirmation-modal"]');
		await page.click('[data-testid="cancel-delete-btn"]');

		// Verify modal is closed and project still exists
		await expect(page.locator('[data-testid="delete-confirmation-modal"]')).not.toBeVisible();
		await expect(
			page.locator(`[data-testid="project-name"]:has-text("${project.name}")`)
		).toBeVisible();

		const finalProjectCount = await page.locator('[data-testid="project-item"]').count();
		expect(finalProjectCount).toBe(initialProjectCount);
	});

	test('should have search functionality', async ({ page }) => {
		await page.goto('/projects');
		await waitForProjectsToLoad(page);

		// Check if search input exists and is functional
		const searchInput = page.locator('[data-testid="search-input"]');
		await expect(searchInput).toBeVisible();

		// Test that we can type in the search
		await searchInput.fill('test search');
		await expect(searchInput).toHaveValue('test search');
	});

	test('should navigate to project detail page', async ({ page }) => {
		await page.goto('/projects');
		await waitForProjectsToLoad(page);

		// Create a test project first
		const project = await createTestProject('Navigation Test Project', 'Project for navigation');

		// Refresh to see the created project
		await page.evaluate(() =>
			(window as Window & { refreshProjects?: () => Promise<void> }).refreshProjects?.()
		);
		await page.waitForTimeout(1000); // Extra delay for API response
		await waitForProjectsToLoad(page);

		// Click on project link
		const projectLink = page.locator(
			`[data-testid="project-item"]:has([data-testid="project-name"]:has-text("${project.name}")) [data-testid="project-link"]`
		);
		await projectLink.click();

		// Verify navigation to project detail page
		await expect(page).toHaveURL(new RegExp(`/projects/${project.id}`));

		// Verify project details are displayed
		await expect(page.locator('[data-testid="project-title"]')).toContainText(project.name);
		await expect(page.locator('[data-testid="project-tasks"]')).toBeVisible();
	});

	test('should handle project loading states', async ({ page }) => {
		await page.goto('/projects');

		// Check that projects page loads correctly
		await expect(page.locator('h1')).toContainText('Projects');

		// Check that project list container is visible (even if empty)
		const projectsContainer = page.locator('[data-testid="project-list"]');
		const emptyState = page.locator('.empty-state');

		// Either project list or empty state should be visible
		await expect(projectsContainer.or(emptyState)).toBeVisible();
	});

	test('should handle project creation errors', async ({ page }) => {
		// Mock API to return error
		await page.route('**/graphql', async (route) => {
			const request = route.request();
			const postData = request.postData();

			if (postData && postData.includes('createProject')) {
				await route.fulfill({
					status: 400,
					contentType: 'application/json',
					body: JSON.stringify({
						errors: [{ message: 'Project name already exists' }]
					})
				});
				return;
			}

			await route.continue();
		});

		await page.goto('/projects');

		// Try to create a project
		await page.click('[data-testid="create-project-btn"]');
		await page.fill('[data-testid="project-name-input"]', 'Duplicate Project');
		await page.fill('[data-testid="project-description-input"]', 'This will fail');
		await page.click('[data-testid="submit-project-btn"]');

		// Check error message
		await expect(page.locator('[data-testid="error-message"]')).toContainText(
			'Project name already exists'
		);
	});

	test('should sort projects by different criteria', async ({ page }) => {
		await page.goto('/projects');

		// Wait for projects page to load
		await expect(page.locator('h1')).toContainText('Projects');

		// Test that sort dropdown works
		const sortSelect = page.locator('[data-testid="sort-select"]');
		await expect(sortSelect).toBeVisible();

		// Test selecting different sort options
		await sortSelect.selectOption('name');
		await expect(sortSelect).toHaveValue('name');

		await sortSelect.selectOption('created');
		await expect(sortSelect).toHaveValue('created');
	});
});
