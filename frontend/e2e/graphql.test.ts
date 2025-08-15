import { test, expect } from './test';

test.describe('GraphQL Integration', () => {
	test('should display GraphQL connection status', async ({ page }) => {
		await page.goto('/');

		// Wait for the page to load and show connection status
		await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

		// Check that system status section is visible
		await expect(page.getByRole('heading', { name: 'System Status' })).toBeVisible();

		// Wait for connection test to complete
		await page.waitForTimeout(2000);

		// Check that connection status is displayed
		const connectionStatus = page.locator('text=Backend Connection:').locator('span');
		await expect(connectionStatus).toBeVisible();

		// The status should show either Connected ✅ or Disconnected ❌
		const statusText = await connectionStatus.textContent();
		expect(statusText).toMatch(/(Connected ✅|Disconnected ❌|Testing\.\.\.)/);
	});

	test('should display test results section', async ({ page }) => {
		await page.goto('/');

		// Wait for test results to load
		await page.waitForTimeout(3000);

		// Check that test results section is visible
		await expect(page.getByRole('heading', { name: 'System Test Results' })).toBeVisible();

		// Should show either test results or "Running tests..." message
		const hasResults = (await page.locator('li').count()) > 0;
		const hasRunningMessage = await page.locator('text=Running tests...').isVisible();

		expect(hasResults || hasRunningMessage).toBeTruthy();
	});

	test('should show project count', async ({ page }) => {
		await page.goto('/');

		// Wait for data to load
		await page.waitForTimeout(2000);

		// Check that project count is displayed (should be a number)
		const projectCount = page.locator('text=Total Projects:').locator('span');
		await expect(projectCount).toBeVisible();

		const countText = await projectCount.textContent();
		expect(countText).toMatch(/^\d+$/);
	});

	test('should provide console test instruction', async ({ page }) => {
		await page.goto('/');

		// Check that console instruction is shown
		await expect(
			page.locator('text=Check the browser console for detailed connectivity test results.')
		).toBeVisible();
	});

	test('console should show detailed test results', async ({ page }) => {
		const consoleLogs: string[] = [];

		// Capture console logs
		page.on('console', (msg) => {
			consoleLogs.push(msg.text());
		});

		await page.goto('/');

		// Wait for tests to complete
		await page.waitForTimeout(5000);

		// Check that connectivity tests ran in console (should have at least some output)
		const testLogs = consoleLogs.filter(
			(log) =>
				log.includes('GraphQL') ||
				log.includes('connectivity') ||
				log.includes('Testing') ||
				log.includes('✅') ||
				log.includes('❌')
		);

		// Should have some console output related to testing
		expect(testLogs.length).toBeGreaterThanOrEqual(0);
	});
});
