import { test, expect } from './fixtures/setup';
import { mockProjects, mockTasks, mockAnnotations } from './fixtures/test-data';

test.describe('Image Annotation Functionality', () => {
	test.beforeEach(async ({ page, mockGraphQLResponses, setupTestData }) => {
		await setupTestData();
		await mockGraphQLResponses(page);
	});

	test.afterEach(async ({ cleanupTestData }) => {
		await cleanupTestData();
	});

	test('should navigate to annotation workspace', async ({ page }) => {
		const projectId = mockProjects[0].id;
		const taskId = mockTasks[0].id;

		await page.goto(`/projects/${projectId}/annotate?task=${taskId}`);

		// Verify we're in the annotation workspace
		await expect(page).toHaveURL(/\/annotate/);
		await expect(page.locator('[data-testid="annotation-workspace"]')).toBeVisible();

		// Check essential components are present
		await expect(page.locator('[data-testid="image-canvas"]')).toBeVisible();
		await expect(page.locator('[data-testid="annotation-panel"]')).toBeVisible();
		await expect(page.locator('[data-testid="annotation-toolbar"]')).toBeVisible();
	});

	test('should load and display image in canvas', async ({ page }) => {
		const projectId = mockProjects[0].id;
		const taskId = mockTasks[0].id;

		await page.goto(`/projects/${projectId}/annotate?task=${taskId}`);

		// Wait for image to load
		const imageElement = page.locator('[data-testid="canvas-image"]');
		await expect(imageElement).toBeVisible();

		// Verify image properties
		await expect(imageElement).toHaveAttribute('src', /\/api\/images\//);

		// Check canvas dimensions are set
		const canvas = page.locator('[data-testid="annotation-canvas"]');
		const canvasWidth = await canvas.getAttribute('width');
		const canvasHeight = await canvas.getAttribute('height');

		expect(parseInt(canvasWidth || '0')).toBeGreaterThan(0);
		expect(parseInt(canvasHeight || '0')).toBeGreaterThan(0);
	});

	test('should display existing annotations', async ({ page }) => {
		const projectId = mockProjects[0].id;
		const taskId = mockTasks[1].id; // Task with existing annotations

		await page.goto(`/projects/${projectId}/annotate?task=${taskId}`);

		// Wait for annotations to load
		await expect(page.locator('[data-testid="annotation-list"]')).toBeVisible();

		// Check that mock annotations are displayed
		for (const annotation of mockAnnotations) {
			await expect(page.locator(`[data-testid="annotation-${annotation.id}"]`)).toBeVisible();
			await expect(page.locator(`text=${annotation.label}`)).toBeVisible();
		}

		// Verify bounding boxes are rendered on canvas
		const boundingBoxes = page.locator('[data-testid="bounding-box"]');
		await expect(boundingBoxes).toHaveCount(mockAnnotations.length);
	});

	test('should create new bounding box annotation', async ({ page }) => {
		const projectId = mockProjects[0].id;
		const taskId = mockTasks[0].id;

		await page.goto(`/projects/${projectId}/annotate?task=${taskId}`);

		// Select bounding box tool
		await page.click('[data-testid="bbox-tool"]');

		// Verify tool is selected
		await expect(page.locator('[data-testid="bbox-tool"]')).toHaveClass(/active/);

		// Draw bounding box on canvas
		const canvas = page.locator('[data-testid="annotation-canvas"]');

		// Mouse down to start drawing
		await canvas.hover({ position: { x: 100, y: 100 } });
		await page.mouse.down();

		// Mouse move to create rectangle
		await canvas.hover({ position: { x: 300, y: 250 } });

		// Mouse up to finish drawing
		await page.mouse.up();

		// Enter label for the annotation
		const labelInput = page.locator('[data-testid="annotation-label-input"]');
		await expect(labelInput).toBeVisible();
		await labelInput.fill('test-object');

		// Save annotation
		await page.click('[data-testid="save-annotation-btn"]');

		// Verify annotation was created
		await expect(
			page.locator('[data-testid="annotation-list"] [data-testid*="annotation-"]')
		).toHaveCount(1);
		await expect(page.locator('text=test-object')).toBeVisible();

		// Verify success message
		await expect(page.locator('[data-testid="success-message"]')).toContainText(
			'Annotation created successfully'
		);
	});

	test('should edit existing annotation', async ({ page }) => {
		const projectId = mockProjects[0].id;
		const taskId = mockTasks[1].id; // Task with existing annotations

		await page.goto(`/projects/${projectId}/annotate?task=${taskId}`);

		// Click on first annotation to select it
		const firstAnnotation = page
			.locator('[data-testid="annotation-list"] [data-testid*="annotation-"]')
			.first();
		await firstAnnotation.click();

		// Verify annotation is selected
		await expect(firstAnnotation).toHaveClass(/selected/);

		// Edit annotation label
		await page.click('[data-testid="edit-annotation-btn"]');

		const labelInput = page.locator('[data-testid="annotation-label-input"]');
		await labelInput.clear();
		await labelInput.fill('updated-label');

		// Save changes
		await page.click('[data-testid="save-annotation-btn"]');

		// Verify label was updated
		await expect(page.locator('text=updated-label')).toBeVisible();
		await expect(page.locator('[data-testid="success-message"]')).toContainText(
			'Annotation updated successfully'
		);
	});

	test('should delete annotation', async ({ page }) => {
		const projectId = mockProjects[0].id;
		const taskId = mockTasks[1].id; // Task with existing annotations

		await page.goto(`/projects/${projectId}/annotate?task=${taskId}`);

		// Get initial annotation count
		const initialCount = await page
			.locator('[data-testid="annotation-list"] [data-testid*="annotation-"]')
			.count();

		// Select first annotation
		const firstAnnotation = page
			.locator('[data-testid="annotation-list"] [data-testid*="annotation-"]')
			.first();
		await firstAnnotation.click();

		// Delete annotation
		await page.click('[data-testid="delete-annotation-btn"]');

		// Confirm deletion
		await expect(page.locator('[data-testid="delete-confirmation-modal"]')).toBeVisible();
		await page.click('[data-testid="confirm-delete-btn"]');

		// Verify annotation was deleted
		const finalCount = await page
			.locator('[data-testid="annotation-list"] [data-testid*="annotation-"]')
			.count();
		expect(finalCount).toBe(initialCount - 1);

		// Verify success message
		await expect(page.locator('[data-testid="success-message"]')).toContainText(
			'Annotation deleted successfully'
		);
	});

	test('should resize existing bounding box', async ({ page }) => {
		const projectId = mockProjects[0].id;
		const taskId = mockTasks[1].id; // Task with existing annotations

		await page.goto(`/projects/${projectId}/annotate?task=${taskId}`);

		// Click on bounding box to select it
		const boundingBox = page.locator('[data-testid="bounding-box"]').first();
		await boundingBox.click();

		// Verify resize handles are visible
		await expect(page.locator('[data-testid="resize-handle"]')).toHaveCount(8); // 4 corners + 4 sides

		// Drag bottom-right corner to resize
		const bottomRightHandle = page.locator('[data-testid="resize-handle-se"]');
		const originalBounds = await boundingBox.boundingBox();

		await bottomRightHandle.dragTo(bottomRightHandle, {
			targetPosition: { x: 50, y: 50 } // Drag 50px in both directions
		});

		// Verify bounding box was resized
		const newBounds = await boundingBox.boundingBox();
		expect(newBounds?.width).toBeGreaterThan(originalBounds?.width || 0);
		expect(newBounds?.height).toBeGreaterThan(originalBounds?.height || 0);
	});

	test('should move existing bounding box', async ({ page }) => {
		const projectId = mockProjects[0].id;
		const taskId = mockTasks[1].id; // Task with existing annotations

		await page.goto(`/projects/${projectId}/annotate?task=${taskId}`);

		// Click on bounding box to select it
		const boundingBox = page.locator('[data-testid="bounding-box"]').first();
		await boundingBox.click();

		const originalBounds = await boundingBox.boundingBox();

		// Drag bounding box to new position
		await boundingBox.dragTo(boundingBox, {
			targetPosition: { x: 100, y: 100 }
		});

		// Verify bounding box moved
		const newBounds = await boundingBox.boundingBox();
		expect(Math.abs((newBounds?.x || 0) - (originalBounds?.x || 0))).toBeGreaterThan(50);
		expect(Math.abs((newBounds?.y || 0) - (originalBounds?.y || 0))).toBeGreaterThan(50);
	});

	test('should zoom in and out on image', async ({ page }) => {
		const projectId = mockProjects[0].id;
		const taskId = mockTasks[0].id;

		await page.goto(`/projects/${projectId}/annotate?task=${taskId}`);

		// Test zoom in
		await page.click('[data-testid="zoom-in-btn"]');

		// Verify zoom level indicator
		await expect(page.locator('[data-testid="zoom-level"]')).toContainText('125%');

		// Test zoom out
		await page.click('[data-testid="zoom-out-btn"]');
		await page.click('[data-testid="zoom-out-btn"]');

		// Verify zoom level
		await expect(page.locator('[data-testid="zoom-level"]')).toContainText('75%');

		// Test fit to screen
		await page.click('[data-testid="fit-to-screen-btn"]');
		await expect(page.locator('[data-testid="zoom-level"]')).toContainText('Fit');
	});

	test('should pan image when zoomed', async ({ page }) => {
		const projectId = mockProjects[0].id;
		const taskId = mockTasks[0].id;

		await page.goto(`/projects/${projectId}/annotate?task=${taskId}`);

		// Zoom in first
		await page.click('[data-testid="zoom-in-btn"]');
		await page.click('[data-testid="zoom-in-btn"]');

		const canvas = page.locator('[data-testid="annotation-canvas"]');

		// Hold space key and drag to pan
		await page.keyboard.down('Space');

		await canvas.hover({ position: { x: 200, y: 200 } });
		await page.mouse.down();
		await canvas.hover({ position: { x: 100, y: 100 } });
		await page.mouse.up();

		await page.keyboard.up('Space');

		// Verify image position changed (this would require checking transform values)
		// For now, just verify no errors occurred
		await expect(canvas).toBeVisible();
	});

	test('should switch between different annotation tools', async ({ page }) => {
		const projectId = mockProjects[0].id;
		const taskId = mockTasks[0].id;

		await page.goto(`/projects/${projectId}/annotate?task=${taskId}`);

		// Test bounding box tool
		await page.click('[data-testid="bbox-tool"]');
		await expect(page.locator('[data-testid="bbox-tool"]')).toHaveClass(/active/);

		// Test polygon tool (if implemented)
		if (await page.locator('[data-testid="polygon-tool"]').isVisible()) {
			await page.click('[data-testid="polygon-tool"]');
			await expect(page.locator('[data-testid="polygon-tool"]')).toHaveClass(/active/);
			await expect(page.locator('[data-testid="bbox-tool"]')).not.toHaveClass(/active/);
		}

		// Test select tool
		await page.click('[data-testid="select-tool"]');
		await expect(page.locator('[data-testid="select-tool"]')).toHaveClass(/active/);
	});

	test('should filter annotations by label', async ({ page }) => {
		const projectId = mockProjects[0].id;
		const taskId = mockTasks[1].id; // Task with existing annotations

		await page.goto(`/projects/${projectId}/annotate?task=${taskId}`);

		// Wait for annotations to load
		await expect(page.locator('[data-testid="annotation-list"]')).toBeVisible();

		const initialCount = await page
			.locator('[data-testid="annotation-list"] [data-testid*="annotation-"]')
			.count();

		// Apply label filter
		const filterInput = page.locator('[data-testid="label-filter-input"]');
		await filterInput.fill('lion');

		// Verify filtered results
		const filteredCount = await page
			.locator('[data-testid="annotation-list"] [data-testid*="annotation-"]')
			.count();
		expect(filteredCount).toBeLessThanOrEqual(initialCount);

		// Clear filter
		await filterInput.clear();

		// Verify all annotations shown again
		const finalCount = await page
			.locator('[data-testid="annotation-list"] [data-testid*="annotation-"]')
			.count();
		expect(finalCount).toBe(initialCount);
	});

	test('should save annotation progress automatically', async ({ page }) => {
		const projectId = mockProjects[0].id;
		const taskId = mockTasks[0].id;

		await page.goto(`/projects/${projectId}/annotate?task=${taskId}`);

		// Create annotation
		await page.click('[data-testid="bbox-tool"]');

		const canvas = page.locator('[data-testid="annotation-canvas"]');
		await canvas.hover({ position: { x: 50, y: 50 } });
		await page.mouse.down();
		await canvas.hover({ position: { x: 150, y: 150 } });
		await page.mouse.up();

		const labelInput = page.locator('[data-testid="annotation-label-input"]');
		await labelInput.fill('auto-save-test');
		await page.click('[data-testid="save-annotation-btn"]');

		// Wait for auto-save indicator
		await expect(page.locator('[data-testid="save-status"]')).toContainText('Saved');

		// Refresh page and verify annotation persisted
		await page.reload();
		await expect(page.locator('text=auto-save-test')).toBeVisible();
	});

	test('should handle keyboard shortcuts', async ({ page }) => {
		const projectId = mockProjects[0].id;
		const taskId = mockTasks[0].id;

		await page.goto(`/projects/${projectId}/annotate?task=${taskId}`);

		// Test tool shortcuts
		await page.keyboard.press('b'); // Bounding box tool
		await expect(page.locator('[data-testid="bbox-tool"]')).toHaveClass(/active/);

		await page.keyboard.press('s'); // Select tool
		await expect(page.locator('[data-testid="select-tool"]')).toHaveClass(/active/);

		// Test zoom shortcuts
		await page.keyboard.press('Control+='); // Zoom in
		await expect(page.locator('[data-testid="zoom-level"]')).toContainText(/1[2-9][0-9]%/);

		await page.keyboard.press('Control+-'); // Zoom out

		// Test delete shortcut (if annotation is selected)
		if (
			(await page.locator('[data-testid="annotation-list"] [data-testid*="annotation-"]').count()) >
			0
		) {
			await page
				.locator('[data-testid="annotation-list"] [data-testid*="annotation-"]')
				.first()
				.click();
			await page.keyboard.press('Delete');
			await page.click('[data-testid="confirm-delete-btn"]'); // Confirm deletion
		}
	});

	test('should export annotations', async ({ page }) => {
		const projectId = mockProjects[0].id;
		const taskId = mockTasks[1].id; // Task with existing annotations

		await page.goto(`/projects/${projectId}/annotate?task=${taskId}`);

		// Wait for annotations to load
		await expect(page.locator('[data-testid="annotation-list"]')).toBeVisible();

		// Start download of annotations
		const downloadPromise = page.waitForEvent('download');
		await page.click('[data-testid="export-annotations-btn"]');

		// Select export format
		await page.selectOption('[data-testid="export-format-select"]', 'json');
		await page.click('[data-testid="confirm-export-btn"]');

		const download = await downloadPromise;

		// Verify download
		expect(download.suggestedFilename()).toMatch(/annotations.*\.json$/);
	});

	test('should handle annotation validation errors', async ({ page }) => {
		const projectId = mockProjects[0].id;
		const taskId = mockTasks[0].id;

		await page.goto(`/projects/${projectId}/annotate?task=${taskId}`);

		// Try to create annotation without label
		await page.click('[data-testid="bbox-tool"]');

		const canvas = page.locator('[data-testid="annotation-canvas"]');
		await canvas.hover({ position: { x: 100, y: 100 } });
		await page.mouse.down();
		await canvas.hover({ position: { x: 200, y: 200 } });
		await page.mouse.up();

		// Try to save without label
		await page.click('[data-testid="save-annotation-btn"]');

		// Check for validation error
		await expect(page.locator('[data-testid="label-error"]')).toContainText('Label is required');

		// Try with invalid characters in label
		const labelInput = page.locator('[data-testid="annotation-label-input"]');
		await labelInput.fill('<script>alert("xss")</script>');
		await page.click('[data-testid="save-annotation-btn"]');

		// Check for validation error
		await expect(page.locator('[data-testid="label-error"]')).toContainText(
			'Label contains invalid characters'
		);
	});
});
