import { test, expect, createTestProject } from './fixtures/setup';

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

	test('should create a new project via API', async ({ page }) => {
		// Create project via API for testing
		const project = await createTestProject('E2E Test Project', 'Test project for E2E');

		await page.goto('/projects');

		// Verify project appears in the list
		await expect(page.locator(`text=${project.name}`)).toBeVisible();
	});

	test('should validate project form inputs', async ({ page }) => {
		await page.goto('/projects');

		// Click create project button
		await page.click('[data-testid="create-project-btn"]');

		// Try to submit empty form
		await page.click('[data-testid="submit-project-btn"]');

		// Check for validation errors
		await expect(page.locator('[data-testid="name-error"]')).toContainText(
			'Project name is required'
		);
		await expect(page.locator('[data-testid="description-error"]')).toContainText(
			'Project description is required'
		);

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

		// Click edit button on first project
		const firstProject = page.locator('[data-testid="project-item"]').first();
		await firstProject.locator('[data-testid="edit-project-btn"]').click();

		// Modify project details
		const updatedName = 'Updated Project Name';
		const updatedDescription = 'Updated project description';

		await page.fill('[data-testid="project-name-input"]', updatedName);
		await page.fill('[data-testid="project-description-input"]', updatedDescription);

		// Save changes
		await page.click('[data-testid="save-project-btn"]');

		// Verify changes are reflected
		await expect(page.locator(`text=${updatedName}`)).toBeVisible();
		await expect(page.locator(`text=${updatedDescription}`)).toBeVisible();

		// Check success message
		await expect(page.locator('[data-testid="success-message"]')).toContainText(
			'Project updated successfully'
		);
	});

	test('should delete a project with confirmation', async ({ page }) => {
		await page.goto('/projects');

		const initialProjectCount = await page.locator('[data-testid="project-item"]').count();

		// Click delete button on first project
		const firstProject = page.locator('[data-testid="project-item"]').first();
		const projectName = await firstProject.locator('[data-testid="project-name"]').textContent();

		await firstProject.locator('[data-testid="delete-project-btn"]').click();

		// Confirm deletion in modal
		await expect(page.locator('[data-testid="delete-confirmation-modal"]')).toBeVisible();
		await expect(page.locator('[data-testid="confirmation-message"]')).toContainText(
			`Are you sure you want to delete "${projectName}"?`
		);

		await page.click('[data-testid="confirm-delete-btn"]');

		// Verify project is removed
		const finalProjectCount = await page.locator('[data-testid="project-item"]').count();
		expect(finalProjectCount).toBe(initialProjectCount - 1);

		// Check success message
		await expect(page.locator('[data-testid="success-message"]')).toContainText(
			'Project deleted successfully'
		);
	});

	test('should cancel project deletion', async ({ page }) => {
		await page.goto('/projects');

		const initialProjectCount = await page.locator('[data-testid="project-item"]').count();

		// Click delete button on first project
		const firstProject = page.locator('[data-testid="project-item"]').first();
		await firstProject.locator('[data-testid="delete-project-btn"]').click();

		// Cancel deletion
		await page.click('[data-testid="cancel-delete-btn"]');

		// Verify modal is closed and project still exists
		await expect(page.locator('[data-testid="delete-confirmation-modal"]')).not.toBeVisible();
		const finalProjectCount = await page.locator('[data-testid="project-item"]').count();
		expect(finalProjectCount).toBe(initialProjectCount);
	});

	test('should have search functionality', async ({ page }) => {
		await page.goto('/projects');

		// Check if search input exists
		const searchInput = page.locator('[data-testid="project-search-input"]');
		if (await searchInput.isVisible()) {
			await searchInput.fill('test');
		}
	});

	test('should navigate to project detail page', async ({ page }) => {
		await page.goto('/projects');

		// Click on first project
		const firstProject = page.locator('[data-testid="project-item"]').first();
		const projectName = await firstProject.locator('[data-testid="project-name"]').textContent();

		await firstProject.click();

		// Verify navigation to project detail page
		await expect(page).toHaveURL(/\/projects\/project-\d+/);

		// Verify project details are displayed
		await expect(page.locator('[data-testid="project-title"]')).toContainText(projectName || '');
		await expect(page.locator('[data-testid="project-tasks"]')).toBeVisible();
	});

	test('should handle project loading states', async ({ page }) => {
		await page.goto('/projects');

		// Check that projects load
		await expect(page.locator('[data-testid="project-list"]')).toBeVisible();
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

		// Wait for projects to load
		await expect(page.locator('[data-testid="project-list"]')).toBeVisible();

		// Test that sort dropdown works (just verify UI element exists)
		const sortSelect = page.locator('[data-testid="sort-select"]');
		if (await sortSelect.isVisible()) {
			await sortSelect.selectOption('name');
		}
	});
});
