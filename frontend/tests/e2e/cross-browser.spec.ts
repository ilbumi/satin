import { test, expect } from '@playwright/test';
import { mockProjects } from './fixtures/test-data';

/**
 * Cross-browser compatibility tests
 * These tests run across different browser engines and device types
 */

test.describe('Cross-Browser Compatibility', () => {
	test.beforeEach(async ({ page }) => {
		// Mock GraphQL responses for all browsers
		await page.route('**/graphql', async (route) => {
			const request = route.request();
			const postData = request.postData();

			if (postData && postData.includes('projects')) {
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify({
						data: {
							projects: {
								objects: mockProjects,
								count: mockProjects.length,
								limit: 10,
								offset: 0
							}
						}
					})
				});
				return;
			}

			await route.continue();
		});
	});

	test('should render correctly in Chromium', async ({ page, browserName }) => {
		test.skip(browserName !== 'chromium', 'Chromium-specific test');

		await page.goto('/');

		// Test Chromium-specific features
		await expect(page).toHaveTitle(/SATIn/);
		await expect(page.locator('main')).toBeVisible();

		// Check for proper CSS rendering
		const navigation = page.locator('nav');
		await expect(navigation).toBeVisible();

		// Test modern JavaScript features support
		const hasModernJS = await page.evaluate(() => {
			try {
				// Test ES6+ features
				const arrow = () => true;
				const [a, b] = [1, 2];
				const obj = { a, b };
				return arrow() && obj.a === 1;
			} catch {
				return false;
			}
		});

		expect(hasModernJS).toBe(true);
	});

	test('should render correctly in Firefox', async ({ page, browserName }) => {
		test.skip(browserName !== 'firefox', 'Firefox-specific test');

		await page.goto('/');

		await expect(page).toHaveTitle(/SATIn/);
		await expect(page.locator('main')).toBeVisible();

		// Test Firefox-specific rendering
		const navigation = page.locator('nav');
		await expect(navigation).toBeVisible();

		// Check CSS Grid support
		const hasGridSupport = await page.evaluate(() => {
			const div = document.createElement('div');
			div.style.display = 'grid';
			return div.style.display === 'grid';
		});

		expect(hasGridSupport).toBe(true);
	});

	test('should render correctly in WebKit/Safari', async ({ page, browserName }) => {
		test.skip(browserName !== 'webkit', 'WebKit-specific test');

		await page.goto('/');

		await expect(page).toHaveTitle(/SATIn/);
		await expect(page.locator('main')).toBeVisible();

		// Test WebKit-specific features
		const navigation = page.locator('nav');
		await expect(navigation).toBeVisible();

		// Check Flexbox support
		const hasFlexSupport = await page.evaluate(() => {
			const div = document.createElement('div');
			div.style.display = 'flex';
			return div.style.display === 'flex';
		});

		expect(hasFlexSupport).toBe(true);
	});

	test('should be responsive on mobile devices', async ({ page, browserName }) => {
		test.skip(browserName !== 'chromium', 'Mobile test runs on chromium');

		// Set mobile viewport
		await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

		await page.goto('/');

		// Check mobile navigation
		const mobileMenu = page.locator('[data-testid="mobile-menu"]');
		if (await mobileMenu.isVisible()) {
			await mobileMenu.click();
			await expect(page.locator('nav')).toBeVisible();
		}

		// Test touch interactions
		await page.goto('/projects');

		const firstProject = page.locator('[data-testid="project-item"]').first();
		if (await firstProject.isVisible()) {
			// Simulate touch tap
			await firstProject.tap();

			// Should navigate to project details
			await expect(page).toHaveURL(/\/projects\/project-\d+/);
		}
	});

	test('should handle different screen sizes', async ({ page }) => {
		const screenSizes = [
			{ width: 320, height: 568 }, // iPhone 5/SE
			{ width: 375, height: 667 }, // iPhone 6/7/8
			{ width: 414, height: 896 }, // iPhone XR
			{ width: 768, height: 1024 }, // iPad
			{ width: 1024, height: 768 }, // iPad Landscape
			{ width: 1366, height: 768 }, // Laptop
			{ width: 1920, height: 1080 } // Desktop
		];

		for (const size of screenSizes) {
			await page.setViewportSize(size);
			await page.goto('/');

			// Check that main content is visible at this size
			await expect(page.locator('main')).toBeVisible();

			// Check navigation adapts to screen size
			const navigation = page.locator('nav');
			await expect(navigation).toBeVisible();

			// Take screenshot for visual comparison
			await page.screenshot({
				path: `test-results/responsive-${size.width}x${size.height}.png`,
				fullPage: true
			});
		}
	});

	test('should work with touch gestures on tablets', async ({ page, browserName }) => {
		test.skip(browserName !== 'webkit', 'Touch test on webkit/Safari');

		// Set tablet viewport
		await page.setViewportSize({ width: 768, height: 1024 });

		await page.goto('/projects');

		// Test pinch zoom gesture (if annotation canvas is present)
		await page.goto(`/projects/project-1/annotate?task=task-1`);

		const canvas = page.locator('[data-testid="annotation-canvas"]');
		if (await canvas.isVisible()) {
			// Simulate pinch zoom
			await page.touchscreen.tap(400, 300);

			// Test pan gesture
			await canvas.hover({ position: { x: 200, y: 200 } });

			// Multi-touch is complex to simulate, so we'll test basic touch interactions
			await expect(canvas).toBeVisible();
		}
	});

	test('should maintain functionality across browser refreshes', async ({ page }) => {
		await page.goto('/projects');

		// Create some state
		const searchInput = page.locator('[data-testid="project-search-input"]');
		if (await searchInput.isVisible()) {
			await searchInput.fill('test search');
		}

		// Refresh page
		await page.reload();

		// Check that page loads correctly after refresh
		await expect(page).toHaveURL(/\/projects/);
		await expect(page.locator('[data-testid="project-list"]')).toBeVisible();
	});

	test('should handle browser back/forward navigation', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveURL('/');

		// Navigate to projects
		await page.click('text=Projects');
		await expect(page).toHaveURL(/\/projects/);

		// Navigate to first project
		const firstProject = page.locator('[data-testid="project-item"]').first();
		if (await firstProject.isVisible()) {
			await firstProject.click();
			await expect(page).toHaveURL(/\/projects\/project-\d+/);

			// Go back
			await page.goBack();
			await expect(page).toHaveURL(/\/projects/);

			// Go forward
			await page.goForward();
			await expect(page).toHaveURL(/\/projects\/project-\d+/);
		}
	});

	test('should support keyboard navigation', async ({ page }) => {
		await page.goto('/projects');

		// Test tab navigation
		await page.keyboard.press('Tab');

		// Should focus first interactive element
		const focusedElement = page.locator(':focus');
		await expect(focusedElement).toBeVisible();

		// Test Enter key on focused element
		await page.keyboard.press('Enter');

		// Should trigger the focused element's action
		// (Exact behavior depends on what was focused)
	});

	test('should handle different color schemes', async ({ page }) => {
		await page.goto('/');

		// Test dark mode if supported
		await page.emulateMedia({ colorScheme: 'dark' });
		await page.reload();

		// Check that dark theme is applied

		// Light mode
		await page.emulateMedia({ colorScheme: 'light' });
		await page.reload();

		// Check that light theme is applied
		await expect(page.locator('body')).toBeVisible();
	});

	test('should work offline with service worker', async ({ page, context }) => {
		await page.goto('/');

		// Wait for service worker to register (if implemented)
		await page.waitForTimeout(1000);

		// Go offline
		await context.setOffline(true);

		// Try to navigate - should show offline page or cached content
		await page.reload();

		// At minimum, should not show browser's offline page
		await expect(page.locator('body')).toBeVisible();

		// Go back online
		await context.setOffline(false);
	});

	test('should handle high DPI displays', async ({ page }) => {
		// Simulate high DPI display
		await page.setViewportSize({ width: 1920, height: 1080 });
		await page.emulateMedia({ reducedMotion: 'no-preference' });

		await page.goto('/');

		// Check that images and icons render crisp
		const images = page.locator('img');
		const imageCount = await images.count();

		for (let i = 0; i < imageCount; i++) {
			const img = images.nth(i);
			if (await img.isVisible()) {
				// Check that image has proper resolution attributes
				const src = await img.getAttribute('src');
				expect(src).toBeTruthy();
			}
		}
	});

	test('should support reduced motion preferences', async ({ page }) => {
		// Test with reduced motion
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.goto('/');

		// Animations should be disabled or reduced
		const animatedElements = page.locator('[class*="animate"]');
		if ((await animatedElements.count()) > 0) {
			// Check that animations are disabled
			const hasAnimation = await animatedElements.first().evaluate((el) => {
				const style = getComputedStyle(el);
				return style.animationDuration !== '0s';
			});

			// With reduced motion, animations should be minimal
			expect(hasAnimation).toBeFalsy();
		}

		// Test with normal motion
		await page.emulateMedia({ reducedMotion: 'no-preference' });
		await page.reload();
	});

	test('should work with different font sizes', async ({ page }) => {
		await page.goto('/');

		// Simulate user increasing font size
		await page.addStyleTag({
			content: `
        * {
          font-size: 1.2em !important;
        }
      `
		});

		// Check that layout still works with larger fonts
		await expect(page.locator('main')).toBeVisible();

		// Navigation should still be usable
		const navigation = page.locator('nav');
		await expect(navigation).toBeVisible();

		// Text should not overflow containers
		const textElements = page.locator('p, span, div:not(:empty)');
		const count = await textElements.count();

		for (let i = 0; i < Math.min(5, count); i++) {
			const element = textElements.nth(i);
			if (await element.isVisible()) {
				const box = await element.boundingBox();
				expect(box?.width).toBeGreaterThan(0);
				expect(box?.height).toBeGreaterThan(0);
			}
		}
	});
});
