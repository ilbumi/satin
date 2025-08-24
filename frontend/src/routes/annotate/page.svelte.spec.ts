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
		const description = page.getByText('Upload an image to start annotating');
		const uploadButton = page.getByRole('button', { name: 'Upload Image' });

		await expect.element(noImageHeading).toBeInTheDocument();
		await expect.element(description).toBeInTheDocument();
		await expect.element(uploadButton).toBeInTheDocument();
	});

	it('renders sidebar with annotation tools', async () => {
		render(AnnotatePage);

		const toolsHeading = page.getByText('Annotation Tools');
		const boundingBoxTool = page.getByText('🔲 Bounding Box');

		await expect.element(toolsHeading).toBeInTheDocument();
		await expect.element(boundingBoxTool).toBeInTheDocument();
	});

	it('renders labels section', async () => {
		render(AnnotatePage);

		// Wait for component to mount and render
		await new Promise((resolve) => setTimeout(resolve, 500));

		const labelsHeading = page.getByRole('heading', { name: 'Labels' });
		const noLabelsText = page.getByText('No labels defined');
		const addLabelButton = page.getByText('+ Add Label');

		await expect.element(labelsHeading).toBeInTheDocument();
		await expect.element(noLabelsText).toBeInTheDocument();
		await expect.element(addLabelButton).toBeInTheDocument();
	});

	it('renders annotations section', async () => {
		render(AnnotatePage);

		// Wait for component to mount and render
		await new Promise((resolve) => setTimeout(resolve, 500));

		const annotationsHeading = page.getByRole('heading', { name: 'Annotations' });
		const noAnnotationsText = page.getByText('No annotations yet');

		await expect.element(annotationsHeading).toBeInTheDocument();
		await expect.element(noAnnotationsText).toBeInTheDocument();
	});

	it('shows mobile sidebar toggle on mobile', async () => {
		// Set mobile viewport
		Object.defineProperty(window, 'innerWidth', {
			value: 500
		});

		render(AnnotatePage);

		const mobileToggle = page.getByRole('button', { name: 'Toggle sidebar' });
		await expect.element(mobileToggle).toBeInTheDocument();
	});

	it('handles upload button click with loading state', async () => {
		render(AnnotatePage);

		const uploadButton = page.getByRole('button', { name: 'Upload Image' });
		await uploadButton.click();

		// Button should show loading state
		const loadingButton = page.getByText('Loading...');
		await expect.element(loadingButton).toBeInTheDocument();

		// Wait for loading to finish (simulated 2 second delay)
		await new Promise((resolve) => setTimeout(resolve, 2100));

		// Button should be back to normal
		const normalButton = page.getByRole('button', { name: 'Upload Image' });
		await expect.element(normalButton).toBeInTheDocument();
	});

	it('sidebar can be toggled', async () => {
		render(AnnotatePage);

		// Find the sidebar toggle button (the one within the Sidebar component)
		const sidebar = document.querySelector('.z-50.flex.flex-col');
		expect(sidebar).toBeInTheDocument();
		expect(sidebar).toHaveClass(/w-80/);

		// Click the sidebar toggle button
		const toggleButton = page.getByRole('button', { name: 'Collapse sidebar' });
		await toggleButton.click();

		// Sidebar should be collapsed
		expect(sidebar).toHaveClass(/w-12/);
	});

	it('renders bounding box tool as active', async () => {
		render(AnnotatePage);

		const boundingBoxTool = page.getByRole('button', { name: '🔲 Bounding Box' });
		await expect.element(boundingBoxTool).toBeInTheDocument();
		await expect.element(boundingBoxTool).toHaveClass(/bg-blue-50/);
	});

	it('shows future tools message', async () => {
		render(AnnotatePage);

		const futureToolsMessage = page.getByText(
			'Additional tools (points, polygons) coming in future updates'
		);
		await expect.element(futureToolsMessage).toBeInTheDocument();
	});
});
