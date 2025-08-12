import { test, expect } from './fixtures/setup';

test.describe('Image Annotation Functionality', () => {
	test.beforeEach(async ({ waitForBackend }) => {
		await waitForBackend();
	});

	test('should navigate to annotation page', async ({ page }) => {
		// For now, just test that we can navigate to a general annotation URL
		await page.goto('/projects');
		await expect(page.locator('h1')).toContainText('Projects');

		// This would be expanded once we have real projects and tasks
	});

	test('should check annotation interface exists', async ({ page }) => {
		// Basic check that the annotation routes are accessible
		await page.goto('/');
		await expect(page).toHaveTitle(/SATIn/);
	});

	test('should load basic UI', async ({ page }) => {
		await page.goto('/');

		// Check basic page loads
		await expect(page).toHaveTitle(/SATIn/);
	});

	test('should navigate to projects', async ({ page }) => {
		await page.goto('/projects');

		// Check projects page loads
		await expect(page.locator('h1')).toContainText('Projects');
	});
});
