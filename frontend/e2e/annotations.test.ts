import { test, expect } from '@playwright/test';
import { TestDataFactory, waitForBackend } from './utils/index.js';

test.describe('Annotation Features E2E', () => {
	let testData: TestDataFactory;
	let testScenario: {
		project: { id: string; name: string };
		image: { id: string; filename: string; url: string };
		task: { id: string; status: string; imageId: string; projectId: string };
	};

	test.beforeAll(async () => {
		// Wait for backend to be ready before running tests
		await waitForBackend();
	});

	test.beforeEach(async ({ page }) => {
		// Create fresh test data for each test
		testData = new TestDataFactory();
		testScenario = await testData.createTestScenario('E2E-Test');

		// Navigate to the homepage first
		await page.goto('http://localhost:5173/');
	});

	test.afterEach(async () => {
		// Clean up test data after each test
		if (testData) {
			await testData.cleanup();
		}
	});

	test.skip('should open annotation editor from task view', async ({ page }) => {
		// Navigate to annotations page
		await page.goto('http://localhost:5173/annotations', {
			waitUntil: 'networkidle'
		});

		// Wait a bit for the page to render
		await page.waitForTimeout(2000);

		// Check if we get an error page or the actual page
		const hasError = await page.locator('text=Server Error').isVisible();
		if (hasError) {
			// If there's an error, try reloading once
			await page.reload({ waitUntil: 'networkidle' });
			await page.waitForTimeout(2000);
		}

		// Now check for the page content - either the header or loading state
		const hasHeader = await page.locator('h1:has-text("Annotation Workspace")').isVisible();
		const hasLoading = await page.locator('text=Loading tasks and images').isVisible();

		// The page should show either the header or loading state
		expect(hasHeader || hasLoading).toBeTruthy();

		// If the page loads successfully, check for basic elements
		if (hasHeader) {
			// Check that we have the main workspace heading
			await expect(page.locator('text=Annotation Workspace')).toBeVisible();

			// Check for either tasks or empty state
			const hasTasks = await page.locator('text=Available Tasks').isVisible();
			const hasEmptyState = await page.locator('text=No Tasks Available').isVisible();

			expect(hasTasks || hasEmptyState).toBeTruthy();
		}
	});

	test('should load and display existing annotations', async ({ page }) => {
		// This test will check loading annotations after they're created in another test
		// For now, we'll create a task with empty annotations and test the zero state

		// Navigate to annotations page with URL parameters using real test data
		await page.goto(
			`http://localhost:5173/annotations?taskId=${testScenario.task.id}&imageId=${testScenario.image.id}`
		);

		await expect(page.locator('[data-testid="image-annotator"]')).toBeVisible();

		// Wait for annotations to load and be displayed
		await expect(page.locator('[data-testid="annotation-canvas"]')).toBeVisible();

		// Check annotation statistics show no annotations initially (clean state)
		await expect(page.locator('text=0')).toBeVisible(); // Total count should be 0
	});

	test('should create new bounding box annotation', async ({ page }) => {
		// Navigate to annotations page with URL parameters using real test data
		const response = await page.goto(
			`http://localhost:5173/annotations?taskId=${testScenario.task.id}&imageId=${testScenario.image.id}`
		);
		expect(response?.status()).toBeLessThan(400);

		await page.waitForLoadState('domcontentloaded');
		await expect(page.locator('[data-testid="image-annotator"]')).toBeVisible({ timeout: 15000 });

		// Wait for canvas to be ready
		await expect(page.locator('[data-testid="annotation-canvas"]')).toBeVisible({ timeout: 10000 });

		// Select bounding box tool
		await page.locator('[data-testid="tool-bbox"]').click();

		// Verify tool is selected
		await expect(page.locator('[data-testid="tool-bbox"]')).toHaveClass(/active/);

		// Draw a bounding box on the canvas
		const canvas = page.locator('[data-testid="annotation-canvas"]');
		await canvas.hover();

		// Simulate drawing: mouse down, move, mouse up
		await canvas.dispatchEvent('mousedown', {
			clientX: 150,
			clientY: 150,
			button: 0
		});

		await canvas.dispatchEvent('mousemove', {
			clientX: 250,
			clientY: 200,
			button: 0
		});

		await canvas.dispatchEvent('mouseup', {
			clientX: 250,
			clientY: 200,
			button: 0
		});

		// Wait for annotation to be created
		await page.waitForTimeout(500);

		// Check that annotation count increased
		await expect(page.locator('text=1')).toBeVisible(); // Should show 1 annotation

		// Verify save button is enabled (unsaved changes)
		await expect(page.locator('[data-testid="save-button"]')).not.toBeDisabled();
	});

	test('should edit annotation text and tags', async ({ page }) => {
		// Navigate to annotations page and create an annotation first
		await page.goto(
			`http://localhost:5173/annotations?taskId=${testScenario.task.id}&imageId=${testScenario.image.id}`
		);

		await expect(page.locator('[data-testid="image-annotator"]')).toBeVisible();

		// First create an annotation to edit
		await page.locator('[data-testid="tool-bbox"]').click();
		const canvas = page.locator('[data-testid="annotation-canvas"]');
		await canvas.dispatchEvent('mousedown', { clientX: 150, clientY: 150, button: 0 });
		await canvas.dispatchEvent('mousemove', { clientX: 250, clientY: 200, button: 0 });
		await canvas.dispatchEvent('mouseup', { clientX: 250, clientY: 200, button: 0 });

		// Wait for annotation to be created
		await page.waitForTimeout(1000);

		// Select the annotation (click on canvas where annotation should be)
		await canvas.click({
			position: { x: 200, y: 175 } // Center of the annotation
		});

		// Verify annotation editing panel appears
		await expect(page.locator('[data-testid="annotation-editor"]')).toBeVisible();

		// Edit the annotation text
		const textInput = page.locator('[data-testid="annotation-text-input"]');
		await textInput.fill('Updated annotation text');

		// Add a tag
		const tagInput = page.locator('[data-testid="annotation-tag-input"]');
		await tagInput.fill('updated');
		await tagInput.press('Enter');

		// Verify changes are reflected
		await expect(page.locator('text=Updated annotation text')).toBeVisible();
		await expect(page.locator('text=updated')).toBeVisible();

		// Verify save button is enabled
		await expect(page.locator('[data-testid="save-button"]')).not.toBeDisabled();
	});

	test('should save annotations and show success', async ({ page }) => {
		// Navigate to annotations page using real test data
		await page.goto(
			`http://localhost:5173/annotations?taskId=${testScenario.task.id}&imageId=${testScenario.image.id}`
		);

		await expect(page.locator('[data-testid="image-annotator"]')).toBeVisible();

		// Create a new annotation first
		await page.locator('[data-testid="tool-bbox"]').click();

		const canvas = page.locator('[data-testid="annotation-canvas"]');
		await canvas.dispatchEvent('mousedown', { clientX: 100, clientY: 100, button: 0 });
		await canvas.dispatchEvent('mousemove', { clientX: 200, clientY: 180, button: 0 });
		await canvas.dispatchEvent('mouseup', { clientX: 200, clientY: 180, button: 0 });

		// Wait for annotation to be created
		await page.waitForTimeout(500);

		// Click save button
		await page.locator('[data-testid="save-button"]').click();

		// Wait for save to complete
		await page.waitForTimeout(1000);

		// Verify save button is disabled (no unsaved changes)
		await expect(page.locator('[data-testid="save-button"]')).toBeDisabled();
	});

	test('should use keyboard shortcuts', async ({ page }) => {
		// Navigate to annotations page with URL parameters using real test data
		await page.goto(
			`http://localhost:5173/annotations?taskId=${testScenario.task.id}&imageId=${testScenario.image.id}`
		);

		await expect(page.locator('[data-testid="image-annotator"]')).toBeVisible();

		// Test tool selection shortcuts
		await page.keyboard.press('v'); // Select tool
		await expect(page.locator('[data-testid="tool-select"]')).toHaveClass(/active/);

		await page.keyboard.press('b'); // Bounding box tool
		await expect(page.locator('[data-testid="tool-bbox"]')).toHaveClass(/active/);

		// Create an annotation first
		const canvas = page.locator('[data-testid="annotation-canvas"]');
		await canvas.dispatchEvent('mousedown', { clientX: 100, clientY: 100, button: 0 });
		await canvas.dispatchEvent('mousemove', { clientX: 200, clientY: 180, button: 0 });
		await canvas.dispatchEvent('mouseup', { clientX: 200, clientY: 180, button: 0 });

		await page.waitForTimeout(500);

		// Test save shortcut
		await page.keyboard.press('Control+s');

		// Wait for save to complete
		await page.waitForTimeout(1000);

		// Verify save completed
		await expect(page.locator('[data-testid="save-button"]')).toBeDisabled();
	});

	test('should handle undo/redo operations', async ({ page }) => {
		// Navigate to annotations page with URL parameters using real test data
		await page.goto(
			`http://localhost:5173/annotations?taskId=${testScenario.task.id}&imageId=${testScenario.image.id}`
		);

		await expect(page.locator('[data-testid="image-annotator"]')).toBeVisible();

		// Select bounding box tool
		await page.locator('[data-testid="tool-bbox"]').click();

		// Create first annotation
		const canvas = page.locator('[data-testid="annotation-canvas"]');
		await canvas.dispatchEvent('mousedown', { clientX: 100, clientY: 100, button: 0 });
		await canvas.dispatchEvent('mousemove', { clientX: 200, clientY: 180, button: 0 });
		await canvas.dispatchEvent('mouseup', { clientX: 200, clientY: 180, button: 0 });

		await page.waitForTimeout(500);

		// Verify annotation was created
		await expect(page.locator('text=1')).toBeVisible();

		// Create second annotation
		await canvas.dispatchEvent('mousedown', { clientX: 250, clientY: 250, button: 0 });
		await canvas.dispatchEvent('mousemove', { clientX: 350, clientY: 330, button: 0 });
		await canvas.dispatchEvent('mouseup', { clientX: 350, clientY: 330, button: 0 });

		await page.waitForTimeout(500);

		// Verify second annotation was created
		await expect(page.locator('text=2')).toBeVisible();

		// Test undo
		await page.locator('[data-testid="undo-button"]').click();
		await expect(page.locator('text=1')).toBeVisible(); // Back to 1 annotation

		// Test redo
		await page.locator('[data-testid="redo-button"]').click();
		await expect(page.locator('text=2')).toBeVisible(); // Back to 2 annotations
	});

	test('should warn about unsaved changes when closing', async ({ page }) => {
		// Navigate to annotations page with URL parameters using real test data
		await page.goto(
			`http://localhost:5173/annotations?taskId=${testScenario.task.id}&imageId=${testScenario.image.id}`
		);

		await expect(page.locator('[data-testid="image-annotator"]')).toBeVisible();

		// Create an annotation to have unsaved changes
		await page.locator('[data-testid="tool-bbox"]').click();

		const canvas = page.locator('[data-testid="annotation-canvas"]');
		await canvas.dispatchEvent('mousedown', { clientX: 100, clientY: 100, button: 0 });
		await canvas.dispatchEvent('mousemove', { clientX: 200, clientY: 180, button: 0 });
		await canvas.dispatchEvent('mouseup', { clientX: 200, clientY: 180, button: 0 });

		await page.waitForTimeout(500);

		// Set up dialog handler to dismiss the confirmation
		page.on('dialog', async (dialog) => {
			expect(dialog.message()).toContain('unsaved changes');
			await dialog.dismiss(); // Cancel closing
		});

		// Try to close the editor
		await page.locator('[data-testid="close-button"]').click();

		// Should still be open because we canceled
		await expect(page.locator('[data-testid="image-annotator"]')).toBeVisible();
	});

	test('should work in readonly mode', async ({ page }) => {
		// Create a completed task for readonly mode testing
		const completedTask = await testData.createTask(
			testScenario.image.id,
			testScenario.project.id,
			'COMPLETED'
		);

		// Navigate to annotations page with URL parameters in readonly mode using real test data
		await page.goto(
			`http://localhost:5173/annotations?taskId=${completedTask.id}&imageId=${testScenario.image.id}&readonly=true`
		);

		await expect(page.locator('[data-testid="image-annotator"]')).toBeVisible();

		// Verify readonly mode indicators
		await expect(page.locator('text=View Mode')).toBeVisible();
		await expect(page.locator('text=👁️ Close Viewer')).toBeVisible();

		// Verify editing tools are not available
		await expect(page.locator('[data-testid="tool-bbox"]')).not.toBeVisible();
		await expect(page.locator('[data-testid="save-button"]')).not.toBeVisible();

		// Verify annotation count shows 0 (no annotations created yet)
		await expect(page.locator('text=0')).toBeVisible(); // No annotations in this clean task
	});

	test('should handle zoom and pan operations', async ({ page }) => {
		// Navigate to annotations page with URL parameters using real test data
		await page.goto(
			`http://localhost:5173/annotations?taskId=${testScenario.task.id}&imageId=${testScenario.image.id}`
		);

		await expect(page.locator('[data-testid="image-annotator"]')).toBeVisible();

		// Wait for canvas to be ready
		await expect(page.locator('[data-testid="annotation-canvas"]')).toBeVisible();

		const canvas = page.locator('[data-testid="annotation-canvas"]');

		// Test zoom in with wheel
		await canvas.hover();
		await canvas.dispatchEvent('wheel', {
			deltaY: -100, // Negative for zoom in
			clientX: 250,
			clientY: 200
		});

		// Test zoom out with wheel
		await canvas.dispatchEvent('wheel', {
			deltaY: 100, // Positive for zoom out
			clientX: 250,
			clientY: 200
		});

		// Test pan operation (middle mouse drag)
		await canvas.dispatchEvent('mousedown', {
			clientX: 200,
			clientY: 200,
			button: 1 // Middle mouse button
		});

		await canvas.dispatchEvent('mousemove', {
			clientX: 250,
			clientY: 250,
			button: 1
		});

		await canvas.dispatchEvent('mouseup', {
			clientX: 250,
			clientY: 250,
			button: 1
		});

		// Canvas should still be functional after zoom/pan
		await expect(canvas).toBeVisible();
	});

	test('should handle error states gracefully', async ({ page }) => {
		// Navigate to annotations page with non-existent task ID to trigger error
		await page.goto(
			'http://localhost:5173/annotations?taskId=non-existent-task-id&imageId=non-existent-image-id'
		);

		await expect(page.locator('[data-testid="image-annotator"]')).toBeVisible();

		// Should show error state when trying to load non-existent data
		await expect(page.locator('text=Failed to Load')).toBeVisible({ timeout: 10000 });
		await expect(page.locator('text=🔄 Retry')).toBeVisible();

		// Error should not crash the application
		await expect(page.locator('[data-testid="image-annotator"]')).toBeVisible();
	});
});
