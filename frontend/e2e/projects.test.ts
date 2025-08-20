import { test, expect } from '@playwright/test';

test.describe('Project Management', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to projects page before each test
		await page.goto('/projects');

		// Wait for page to be fully loaded
		await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible();

		// Ensure no modals are open from previous tests
		const openModals = page.locator('dialog[open]');
		const modalCount = await openModals.count();
		if (modalCount > 0) {
			await page.keyboard.press('Escape');
			await expect(page.getByRole('dialog')).not.toBeVisible();
		}
	});

	test('should display projects page', async ({ page }) => {
		// Check page content
		await expect(page.getByText('Manage your annotation projects')).toBeVisible();

		// Check New Project button
		await expect(page.getByRole('button', { name: /new project/i })).toBeVisible();
	});

	test('should display project list', async ({ page }) => {
		// Wait for page to be ready
		await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible();

		// Should show project cards or empty state
		const projectCards = page.locator('[data-testid="project-card"]');
		const emptyState = page.getByText('No projects yet');
		const loadingState = page.getByText('Loading projects');

		// Wait for loading to complete (either projects load or we get empty state)
		await page.waitForFunction(
			() => {
				const cards = document.querySelectorAll('[data-testid="project-card"]');
				const empty = Array.from(document.querySelectorAll('*')).some((el) =>
					el.textContent?.includes('No projects yet')
				);
				const loading = Array.from(document.querySelectorAll('*')).some((el) =>
					el.textContent?.includes('Loading projects')
				);

				return cards.length > 0 || (empty && !loading);
			},
			{ timeout: 10000 }
		);

		// Either project cards or empty state should be visible (but not loading)
		const hasProjects = (await projectCards.count()) > 0;
		const hasEmptyState = await emptyState.isVisible();
		const isLoading = await loadingState.isVisible();

		expect(isLoading).toBeFalsy();
		expect(hasProjects || hasEmptyState).toBeTruthy();
	});

	test('should open create project modal', async ({ page }) => {
		// Ensure we start fresh - check for any existing modals
		const existingModals = await page.locator('dialog[open]').count();
		if (existingModals > 0) {
			await page.keyboard.press('Escape');
			await expect(page.getByRole('dialog')).not.toBeVisible();
		}

		// Wait for page to be fully loaded
		await page.waitForLoadState('networkidle');

		// Click New Project button
		const newProjectButton = page.getByRole('button', { name: /new project/i });
		await expect(newProjectButton).toBeVisible();

		await newProjectButton.click();

		// Wait for modal to appear - use data-testid for reliable selection
		await expect(page.getByTestId('create-project-modal')).toBeVisible({ timeout: 5000 });
		await expect(page.getByText('Create New Project')).toBeVisible();

		// Form fields should be visible
		await expect(page.getByLabel(/project name/i)).toBeVisible();
		await expect(page.getByLabel(/description/i)).toBeVisible();
	});

	test('should create a new project', async ({ page }) => {
		// Ensure we start fresh
		const existingModals = await page.locator('dialog[open]').count();
		if (existingModals > 0) {
			await page.keyboard.press('Escape');
			await expect(page.getByRole('dialog')).not.toBeVisible();
		}

		// Wait for page to be fully loaded
		await page.waitForLoadState('networkidle');

		// Open create modal
		const newProjectButton = page.getByRole('button', { name: /new project/i });
		await expect(newProjectButton).toBeVisible();
		await newProjectButton.click();

		// Wait for modal to appear
		await expect(page.getByTestId('create-project-modal')).toBeVisible({ timeout: 5000 });

		// Fill in the form
		await page.getByLabel(/project name/i).fill('Test E2E Project');
		await page
			.getByLabel(/description/i)
			.fill(
				'This is a test project created by E2E tests to verify the project creation workflow works correctly.'
			);

		// Submit the form
		await page.getByRole('button', { name: /create project/i }).click();

		// Modal should close
		await expect(page.getByTestId('create-project-modal')).not.toBeVisible({ timeout: 5000 });

		// Should show success feedback (toast notification)
		await expect(page.getByText(/project created successfully/i)).toBeVisible({ timeout: 5000 });

		// Wait for network requests to complete
		await page.waitForLoadState('networkidle');

		// Project should appear in the list
		await expect(page.getByText('Test E2E Project')).toBeVisible({ timeout: 5000 });
	});

	test('should validate create project form', async ({ page }) => {
		// Ensure we start fresh
		const existingModals = await page.locator('dialog[open]').count();
		if (existingModals > 0) {
			await page.keyboard.press('Escape');
			await page.waitForTimeout(500); // Give time for modal to close
		}

		// Wait for page to be fully loaded
		await page.waitForLoadState('networkidle');

		// Open create modal
		const newProjectButton = page.getByRole('button', { name: /new project/i });
		await expect(newProjectButton).toBeVisible();

		await newProjectButton.click();

		// Wait for modal to appear
		await expect(page.getByTestId('create-project-modal')).toBeVisible({ timeout: 5000 });

		// Try to submit empty form - button should be disabled
		const createButton = page
			.getByTestId('create-project-modal')
			.getByRole('button', { name: /create project/i });
		await expect(createButton).toBeDisabled();

		// Fill name with too short value
		await page.getByLabel(/project name/i).fill('A');
		await page.getByLabel(/project name/i).blur();

		// Should show validation error
		await expect(page.getByText(/name must be at least/i)).toBeVisible();

		// Fill description with too short value
		await page.getByLabel(/description/i).fill('Short');
		await page.getByLabel(/description/i).blur();

		// Should show validation error
		await expect(page.getByText(/description must be at least/i)).toBeVisible();
	});

	test('should cancel project creation', async ({ page }) => {
		// Ensure we start fresh
		const existingModals = await page.locator('dialog[open]').count();
		if (existingModals > 0) {
			await page.keyboard.press('Escape');
			await expect(page.getByRole('dialog')).not.toBeVisible();
		}

		// Wait for page to be fully loaded
		await page.waitForLoadState('networkidle');

		// Open create modal
		const newProjectButton = page.getByRole('button', { name: /new project/i });
		await expect(newProjectButton).toBeVisible();
		await newProjectButton.click();

		// Wait for modal to appear
		await expect(page.getByTestId('create-project-modal')).toBeVisible({ timeout: 5000 });

		// Fill some data
		await page.getByLabel(/project name/i).fill('Test Project');

		// Cancel
		await page.getByRole('button', { name: /cancel/i }).click();

		// Modal should close
		await expect(page.getByTestId('create-project-modal')).not.toBeVisible({ timeout: 3000 });

		// No project should be created (wait for network to settle)
		await page.waitForLoadState('networkidle');
		expect(await page.getByText('Test Project', { exact: true }).count()).toBe(0);
	});

	test('should filter projects by search', async ({ page }) => {
		// Wait for projects to load
		await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible();
		await page.waitForLoadState('networkidle');

		// First, verify all projects are visible using specific headings
		await expect(page.getByRole('heading', { name: 'Medical Images Dataset' })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Vehicle Detection' })).toBeVisible();

		// Enter search term
		const searchInput = page.getByLabel(/search projects/i);
		await searchInput.fill('Medical');

		// Wait for filter to apply - give more time for debounce
		await expect(searchInput).toHaveValue('Medical');
		await page.waitForTimeout(500); // Wait for debounce + network request

		// Should filter the results - Medical project should still be visible
		await expect(page.getByRole('heading', { name: 'Medical Images Dataset' })).toBeVisible();

		// Other projects should not be visible - wait for them to disappear
		await expect(page.getByRole('heading', { name: 'Vehicle Detection' })).not.toBeVisible({
			timeout: 5000
		});
	});

	test('should clear search filters', async ({ page }) => {
		// Wait for projects to load
		await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible();
		await page.waitForLoadState('networkidle');

		// Apply search filter
		const searchInput = page.getByLabel(/search projects/i);
		await searchInput.fill('Medical');
		await expect(searchInput).toHaveValue('Medical');
		await page.waitForTimeout(500); // Wait for debounce

		// Wait for clear button to appear
		const clearButton = page.getByRole('button', { name: /clear filters/i });
		await expect(clearButton).toBeVisible({ timeout: 3000 });

		// Clear filters
		await clearButton.click();

		// Wait for the clear action to take effect
		await page.waitForTimeout(500);

		// Search input should be cleared
		await expect(searchInput).toHaveValue('', { timeout: 3000 });
	});

	test('should navigate to project detail page', async ({ page }) => {
		// Wait for projects to load
		await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible();

		// Find a project view link
		const viewLink = page.getByRole('link', { name: /view/i }).first();

		if (await viewLink.isVisible()) {
			await viewLink.click();

			// Wait for navigation to complete
			await page.waitForURL(/\/projects\/[^/]+$/);

			// Should navigate to project detail page
			await expect(page.url()).toMatch(/\/projects\/[^/]+$/);

			// Should show project detail content
			await expect(page.getByText('Project Details')).toBeVisible();
			await expect(page.getByText('Project ID', { exact: true })).toBeVisible();
		}
	});

	test('should handle empty state', async ({ page }) => {
		// If there are no projects, should show empty state
		const emptyState = page.getByText('No projects yet');

		if (await emptyState.isVisible()) {
			await expect(
				page.getByText('Create your first annotation project to get started')
			).toBeVisible();
			await expect(page.getByRole('button', { name: /create project/i })).toBeVisible();
		}
	});

	test('should be responsive', async ({ page }) => {
		// Test mobile view
		await page.setViewportSize({ width: 375, height: 667 });

		// Page should still be accessible
		await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible();
		await expect(page.getByRole('button', { name: /new project/i })).toBeVisible();

		// Test tablet view
		await page.setViewportSize({ width: 768, height: 1024 });

		// Page should still be accessible
		await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible();

		// Reset to desktop
		await page.setViewportSize({ width: 1280, height: 720 });
	});

	test('should handle loading states', async ({ page }) => {
		// Navigate to projects page
		await page.goto('/projects');

		// Should show loading state initially (briefly)
		const loadingText = page.getByText('Loading projects...');

		// Either loading state should appear briefly, or content loads immediately
		const hasLoading = await loadingText.isVisible();
		const hasContent = await page
			.getByRole('heading', { name: 'Projects', exact: true })
			.isVisible();

		expect(hasLoading || hasContent).toBeTruthy();

		// Eventually content should load
		await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible();
	});
});
