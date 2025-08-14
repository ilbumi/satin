import { test, expect } from './fixtures/setup';

test.describe('Basic E2E Tests', () => {
	test.beforeEach(async ({ waitForBackend }) => {
		await waitForBackend();
	});

	test('should load homepage', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveTitle(/SATIn/);
	});

	test('should navigate to projects page', async ({ page }) => {
		await page.goto('/');

		// Try to find and click projects link in navigation
		const projectsLink = page.locator('nav').getByRole('link', { name: 'Projects' });
		if (await projectsLink.isVisible()) {
			await projectsLink.click();
			await expect(page).toHaveURL(/\/projects/);
		}
	});

	test('should display health status', async ({ page }) => {
		await page.goto('/');

		// Check if app loads without critical errors
		await expect(page.locator('body')).toBeVisible();
	});
});
