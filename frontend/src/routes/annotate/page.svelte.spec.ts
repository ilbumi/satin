import { page } from '@vitest/browser/context';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import AnnotatePage from './+page.svelte';

describe('annotate/+page.svelte', () => {
	beforeEach(() => {
		Object.defineProperty(window, 'innerWidth', {
			writable: true,
			configurable: true,
			value: 1024
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('renders page heading and title', async () => {
		render(AnnotatePage);

		const heading = page.getByRole('heading', { name: 'Image Annotation' });
		await expect.element(heading).toBeInTheDocument();

		// Check that page title is set
		await expect.poll(() => document.title).toBe('Annotate - Satin');
	});

	it('renders canvas area with placeholder content', async () => {
		render(AnnotatePage);

		const noImageHeading = page.getByText('No Image Loaded');
		const description = page.getByText('Load an image URL to start annotating');

		await expect.element(noImageHeading).toBeInTheDocument();
		await expect.element(description).toBeInTheDocument();

		// The 'Open Image Loader' button only appears when left sidebar is collapsed
		// First, toggle the left sidebar to collapse it
		const leftToggle = page.getByRole('button', { name: 'Toggle left sidebar' });
		await leftToggle.click();

		// Now the button should be visible
		const openImageLoaderButton = page.getByRole('button', { name: 'Open Image Loader' });
		await expect.element(openImageLoaderButton).toBeInTheDocument();
	});

	it('renders sidebar with annotation tools', async () => {
		render(AnnotatePage);

		// Wait for component to mount and render
		await new Promise((resolve) => setTimeout(resolve, 500));

		const toolsHeading = page.getByText('Tools');
		// Use title attribute instead of aria-label since the button uses title
		const selectTool = page.getByTitle('Select (V)');
		const boundingBoxTool = page.getByTitle('Bounding Box (B)');
		const panTool = page.getByTitle('Pan (H)');

		await expect.element(toolsHeading).toBeInTheDocument();
		await expect.element(selectTool).toBeInTheDocument();
		await expect.element(boundingBoxTool).toBeInTheDocument();
		await expect.element(panTool).toBeInTheDocument();
	});

	it('renders view options in tools panel', async () => {
		render(AnnotatePage);

		// Wait for component to mount and render
		await new Promise((resolve) => setTimeout(resolve, 500));

		const viewOptionsHeading = page.getByText('View Options');
		const showAnnotations = page.getByText('Show Annotations');
		const showLabels = page.getByText('Show Labels');
		const showConfidence = page.getByText('Show Confidence');

		await expect.element(viewOptionsHeading).toBeInTheDocument();
		await expect.element(showAnnotations).toBeInTheDocument();
		await expect.element(showLabels).toBeInTheDocument();
		await expect.element(showConfidence).toBeInTheDocument();
	});

	it('renders annotations section', async () => {
		render(AnnotatePage);

		// Wait for component to mount and render
		await new Promise((resolve) => setTimeout(resolve, 500));

		const annotationsHeading = page.getByText('Annotations (0)');
		const noAnnotationsText = page.getByText('No annotations yet. Draw a bounding box to start.');

		await expect.element(annotationsHeading).toBeInTheDocument();
		await expect.element(noAnnotationsText).toBeInTheDocument();
	});

	it('shows sidebar toggle buttons', async () => {
		render(AnnotatePage);

		const leftSidebarToggle = page.getByRole('button', { name: 'Toggle left sidebar' });
		const rightSidebarToggle = page.getByRole('button', { name: 'Toggle right sidebar' });

		await expect.element(leftSidebarToggle).toBeInTheDocument();
		await expect.element(rightSidebarToggle).toBeInTheDocument();
	});

	it('shows keyboard shortcuts panel', async () => {
		render(AnnotatePage);

		// Wait for component to mount and render
		await new Promise((resolve) => setTimeout(resolve, 500));

		const shortcutsHeading = page.getByText('Keyboard Shortcuts');
		const selectShortcut = page.getByText('Select tool');
		const bboxShortcut = page.getByText('Bounding box tool');
		const panShortcut = page.getByText('Pan tool');

		await expect.element(shortcutsHeading).toBeInTheDocument();
		await expect.element(selectShortcut).toBeInTheDocument();
		await expect.element(bboxShortcut).toBeInTheDocument();
		await expect.element(panShortcut).toBeInTheDocument();
	});

	it('sidebar can be toggled', async () => {
		render(AnnotatePage);

		// Find the right sidebar by looking for the annotations panel container
		const rightSidebarContainer = document.querySelector('.border-l.bg-gray-50')?.parentElement;
		expect(rightSidebarContainer).toBeInTheDocument();
		expect(rightSidebarContainer).toHaveClass('w-80');

		// Click the right sidebar toggle button
		const toggleButton = page.getByRole('button', { name: 'Toggle right sidebar' });
		await toggleButton.click();

		// Sidebar should be collapsed
		expect(rightSidebarContainer).toHaveClass('w-0');
	});

	it('renders select tool as active by default', async () => {
		render(AnnotatePage);

		// Wait for component to mount and render
		await new Promise((resolve) => setTimeout(resolve, 500));

		const selectTool = page.getByTitle('Select (V)');
		const boundingBoxTool = page.getByTitle('Bounding Box (B)');

		// Select tool should be active by default
		await expect.element(selectTool).toBeInTheDocument();
		await expect.element(selectTool).toHaveClass(/bg-blue-500/);

		// Bounding box tool should not be active
		await expect.element(boundingBoxTool).toBeInTheDocument();
		await expect.element(boundingBoxTool).toHaveClass(/bg-gray-100/);
	});

	it('shows zoom controls', async () => {
		render(AnnotatePage);

		// Wait for component to mount and render
		await new Promise((resolve) => setTimeout(resolve, 500));

		const zoomHeading = page.getByRole('heading', { name: 'Zoom' });
		const zoomPercentage = page.getByText('100%');
		const resetZoomButton = page.getByRole('button', { name: 'Reset Zoom' });

		await expect.element(zoomHeading).toBeInTheDocument();
		await expect.element(zoomPercentage).toBeInTheDocument();
		await expect.element(resetZoomButton).toBeInTheDocument();
	});
});
