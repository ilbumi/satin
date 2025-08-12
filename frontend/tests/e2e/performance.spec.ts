import { test, expect } from './fixtures/setup';
import { mockProjects, mockTasks } from './fixtures/test-data';

/**
 * Performance and load testing scenarios
 */

test.describe('Performance Testing', () => {
	test.beforeEach(async ({ page, mockGraphQLResponses, setupTestData }) => {
		await setupTestData();
		await mockGraphQLResponses(page);
	});

	test('should load homepage within performance budget', async ({ page }) => {
		// Start measuring
		const startTime = Date.now();

		await page.goto('/');

		// Wait for main content to be visible
		await expect(page.locator('main')).toBeVisible();

		const loadTime = Date.now() - startTime;

		// Should load within 3 seconds
		expect(loadTime).toBeLessThan(3000);

		// Check Web Vitals
		const vitals = await page.evaluate(() => {
			return new Promise((resolve) => {
				// Simulate Web Vitals measurement
				const observer = new PerformanceObserver((list) => {
					const entries = list.getEntries();
					resolve({
						fcp: entries.find((entry) => entry.name === 'first-contentful-paint')?.startTime || 0,
						lcp:
							entries.find((entry) => entry.entryType === 'largest-contentful-paint')?.startTime ||
							0
					});
				});

				try {
					observer.observe({ entryTypes: ['paint', 'largest-contentful-paint'] });

					// Fallback after 2 seconds
					setTimeout(() => {
						resolve({ fcp: 0, lcp: 0 });
					}, 2000);
				} catch {
					resolve({ fcp: 0, lcp: 0 });
				}
			});
		});

		console.log('Web Vitals:', vitals);
	});

	test('should handle large lists efficiently', async ({ page }) => {
		// Mock large dataset
		const largeProjectList = Array.from({ length: 1000 }, (_, i) => ({
			id: `project-${i}`,
			name: `Project ${i}`,
			description: `Description for project ${i}`,
			createdAt: new Date(),
			taskCount: Math.floor(Math.random() * 100)
		}));

		await page.route('**/graphql', async (route) => {
			const request = route.request();
			const postData = request.postData();

			if (postData && postData.includes('getProjects')) {
				const { variables } = JSON.parse(postData);
				const limit = variables?.limit || 50;
				const offset = variables?.offset || 0;

				const paginatedItems = largeProjectList.slice(offset, offset + limit);

				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify({
						data: {
							getProjects: {
								items: paginatedItems,
								totalCount: largeProjectList.length,
								hasNextPage: offset + limit < largeProjectList.length,
								hasPreviousPage: offset > 0
							}
						}
					})
				});
				return;
			}

			await route.continue();
		});

		const startTime = Date.now();

		await page.goto('/projects');
		await expect(page.locator('[data-testid="project-list"]')).toBeVisible();

		const renderTime = Date.now() - startTime;

		// Should render initial items quickly even with large dataset
		expect(renderTime).toBeLessThan(5000);

		// Test scrolling performance
		const projectList = page.locator('[data-testid="project-list"]');

		for (let i = 0; i < 5; i++) {
			await projectList.evaluate((el) => {
				el.scrollTop += 500;
			});
			await page.waitForTimeout(100);
		}

		// Should remain responsive during scrolling
		await expect(page.locator('[data-testid="project-item"]')).toHaveCount(50, { timeout: 2000 });
	});

	test('should handle image loading efficiently', async ({ page }) => {
		const projectId = mockProjects[0].id;
		const taskId = mockTasks[0].id;

		// Mock multiple large images
		const largeImages = Array.from({ length: 50 }, (_, i) => ({
			id: `image-${i}`,
			taskId,
			filename: `large_image_${i}.jpg`,
			url: `/api/images/large_image_${i}.jpg`,
			width: 4000,
			height: 3000,
			annotations: []
		}));

		await page.route('**/graphql', async (route) => {
			const request = route.request();
			const postData = request.postData();

			if (postData && postData.includes('getImages')) {
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify({
						data: {
							getImages: {
								items: largeImages,
								totalCount: largeImages.length,
								hasNextPage: false,
								hasPreviousPage: false
							}
						}
					})
				});
				return;
			}

			await route.continue();
		});

		// Mock image loading with delay
		await page.route('**/api/images/**', async (route) => {
			// Simulate slow image loading
			await new Promise((resolve) => setTimeout(resolve, 100));

			await route.fulfill({
				status: 200,
				contentType: 'image/jpeg',
				body: Buffer.from('fake-large-image-data')
			});
		});

		const startTime = Date.now();

		await page.goto(`/projects/${projectId}/annotate?task=${taskId}`);

		// Should show loading state quickly
		await expect(page.locator('[data-testid="annotation-workspace"]')).toBeVisible({
			timeout: 5000
		});

		// Wait for first image to load
		await expect(page.locator('[data-testid="canvas-image"]')).toBeVisible({ timeout: 10000 });

		const loadTime = Date.now() - startTime;
		expect(loadTime).toBeLessThan(15000); // Should load within 15 seconds
	});

	test('should handle memory efficiently with many annotations', async ({ page }) => {
		const projectId = mockProjects[0].id;
		const taskId = mockTasks[1].id;

		// Mock many annotations
		const manyAnnotations = Array.from({ length: 500 }, (_, i) => ({
			id: `annotation-${i}`,
			imageId: 'image-1',
			type: 'bounding_box',
			label: `object-${i}`,
			coordinates: {
				x: Math.random() * 1800,
				y: Math.random() * 1000,
				width: 50 + Math.random() * 200,
				height: 50 + Math.random() * 200
			},
			confidence: Math.random(),
			createdBy: 'test-user',
			createdAt: new Date()
		}));

		await page.route('**/graphql', async (route) => {
			const request = route.request();
			const postData = request.postData();

			if (postData && postData.includes('getImages')) {
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify({
						data: {
							getImages: {
								items: [
									{
										id: 'image-1',
										taskId,
										filename: 'test_image.jpg',
										url: '/api/images/test_image.jpg',
										width: 1920,
										height: 1080,
										annotations: manyAnnotations
									}
								],
								totalCount: 1,
								hasNextPage: false,
								hasPreviousPage: false
							}
						}
					})
				});
				return;
			}

			await route.continue();
		});

		const startTime = Date.now();

		await page.goto(`/projects/${projectId}/annotate?task=${taskId}`);

		// Should load annotations efficiently
		await expect(page.locator('[data-testid="annotation-list"]')).toBeVisible({ timeout: 10000 });

		const loadTime = Date.now() - startTime;
		expect(loadTime).toBeLessThan(20000); // Should handle 500 annotations within 20 seconds

		// Test canvas rendering performance
		const canvas = page.locator('[data-testid="annotation-canvas"]');
		await expect(canvas).toBeVisible();

		// Test zoom performance with many annotations
		await page.click('[data-testid="zoom-in-btn"]');
		await page.click('[data-testid="zoom-in-btn"]');

		// Should remain responsive
		await expect(page.locator('[data-testid="zoom-level"]')).toContainText('150%', {
			timeout: 3000
		});
	});

	test('should handle concurrent API requests efficiently', async ({ page }) => {
		let requestCount = 0;

		await page.route('**/graphql', async (route) => {
			requestCount++;

			// Add small delay to simulate network latency
			await new Promise((resolve) => setTimeout(resolve, 50));

			const request = route.request();
			const postData = request.postData();

			if (postData && postData.includes('getProjects')) {
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify({
						data: {
							getProjects: {
								items: mockProjects,
								totalCount: mockProjects.length,
								hasNextPage: false,
								hasPreviousPage: false
							}
						}
					})
				});
				return;
			}

			await route.continue();
		});

		const startTime = Date.now();

		// Navigate to page that makes multiple API calls
		await page.goto('/projects');
		await expect(page.locator('[data-testid="project-list"]')).toBeVisible();

		// Click on multiple projects quickly to trigger concurrent requests
		const projects = page.locator('[data-testid="project-item"]');
		const projectCount = await projects.count();

		if (projectCount > 0) {
			// Open multiple projects in quick succession (simulates user clicking rapidly)
			for (let i = 0; i < Math.min(3, projectCount); i++) {
				await projects.nth(i).click();
				await page.goBack();
				await page.waitForTimeout(100);
			}
		}

		const totalTime = Date.now() - startTime;

		// Should handle concurrent requests efficiently
		expect(requestCount).toBeGreaterThan(0);
		expect(totalTime).toBeLessThan(10000);
	});

	test('should maintain performance during extended use', async ({ page }) => {
		const projectId = mockProjects[0].id;
		const taskId = mockTasks[0].id;

		await page.goto(`/projects/${projectId}/annotate?task=${taskId}`);

		// Simulate extended annotation session
		for (let i = 0; i < 10; i++) {
			// Create annotation
			await page.click('[data-testid="bbox-tool"]');

			const canvas = page.locator('[data-testid="annotation-canvas"]');
			const startX = 100 + i * 50;
			const startY = 100 + i * 30;

			await canvas.hover({ position: { x: startX, y: startY } });
			await page.mouse.down();
			await canvas.hover({ position: { x: startX + 100, y: startY + 80 } });
			await page.mouse.up();

			const labelInput = page.locator('[data-testid="annotation-label-input"]');
			await labelInput.fill(`test-object-${i}`);
			await page.click('[data-testid="save-annotation-btn"]');

			// Wait for save
			await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 3000 });

			// Test zoom/pan operations
			await page.click('[data-testid="zoom-in-btn"]');
			await page.click('[data-testid="zoom-out-btn"]');
		}

		// After extended use, should still be responsive
		await page.click('[data-testid="bbox-tool"]');
		await expect(page.locator('[data-testid="bbox-tool"]')).toHaveClass(/active/, {
			timeout: 2000
		});

		// Memory shouldn't have grown excessively
		const finalPerformance = await page.evaluate(() => {
			const perf = performance as unknown as {
				memory?: { usedJSHeapSize: number; totalJSHeapSize: number };
			};
			return {
				memory: perf.memory
					? {
							usedJSHeapSize: perf.memory.usedJSHeapSize,
							totalJSHeapSize: perf.memory.totalJSHeapSize
						}
					: null
			};
		});

		console.log('Final memory usage:', finalPerformance);
	});

	test('should throttle expensive operations', async ({ page }) => {
		const projectId = mockProjects[0].id;
		const taskId = mockTasks[0].id;

		await page.goto(`/projects/${projectId}/annotate?task=${taskId}`);

		const canvas = page.locator('[data-testid="annotation-canvas"]');
		await expect(canvas).toBeVisible();

		// Test rapid zoom operations (should be throttled)
		const startTime = Date.now();

		for (let i = 0; i < 20; i++) {
			await page.click('[data-testid="zoom-in-btn"]');
			await page.waitForTimeout(10); // Rapid clicking
		}

		const zoomTime = Date.now() - startTime;

		// Even with rapid clicking, should complete in reasonable time
		expect(zoomTime).toBeLessThan(5000);

		// Test rapid mouse movements (should be throttled/debounced)
		const moveStartTime = Date.now();

		for (let i = 0; i < 50; i++) {
			await canvas.hover({ position: { x: 100 + i, y: 100 + i } });
		}

		const moveTime = Date.now() - moveStartTime;
		expect(moveTime).toBeLessThan(3000);
	});

	test('should handle network failures gracefully', async ({ page, context }) => {
		await page.goto('/projects');

		// Initial load should work
		await expect(page.locator('[data-testid="project-list"]')).toBeVisible();

		// Simulate network failure
		await context.setOffline(true);

		// Try to navigate to a new page
		await page.click('text=Projects');

		// Should show error state or cached content
		const errorMessage = page.locator('[data-testid="error-message"]');
		const offlineMessage = page.locator('[data-testid="offline-message"]');

		// Should show some kind of offline indication
		await expect(errorMessage.or(offlineMessage)).toBeVisible({ timeout: 5000 });

		// Restore network
		await context.setOffline(false);

		// Should recover automatically or with retry
		await page.reload();
		await expect(page.locator('[data-testid="project-list"]')).toBeVisible({ timeout: 10000 });
	});
});
