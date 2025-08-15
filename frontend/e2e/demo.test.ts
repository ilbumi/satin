import { test, expect } from './test';

test('home page has expected h1', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});
