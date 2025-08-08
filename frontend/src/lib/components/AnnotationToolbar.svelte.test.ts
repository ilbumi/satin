import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import AnnotationToolbar from './AnnotationToolbar.svelte';

describe('AnnotationToolbar', () => {
	it('should render with default tool selection', () => {
		const onToolChange = vi.fn();
		render(AnnotationToolbar, {
			props: {
				activeTool: 'select',
				onToolChange
			}
		});

		expect(screen.getByText('Tools')).toBeInTheDocument();
		expect(screen.getByText('Select')).toBeInTheDocument();
		expect(screen.getByText('Bbox')).toBeInTheDocument();
		expect(screen.getByText('Image')).toBeInTheDocument();
		expect(screen.getByText('Upload Image')).toBeInTheDocument();
		expect(screen.getByText('Instructions')).toBeInTheDocument();
	});

	it('should highlight active tool correctly', () => {
		const onToolChange = vi.fn();
		const { container } = render(AnnotationToolbar, {
			props: {
				activeTool: 'select',
				onToolChange
			}
		});

		const selectButton = container.querySelector('button[title="Select annotations"]');
		const bboxButton = container.querySelector('button[title="Draw bounding boxes"]');

		expect(selectButton).toHaveClass('active');
		expect(bboxButton).not.toHaveClass('active');
	});

	it('should highlight bbox tool when active', () => {
		const onToolChange = vi.fn();
		const { container } = render(AnnotationToolbar, {
			props: {
				activeTool: 'bbox',
				onToolChange
			}
		});

		const selectButton = container.querySelector('button[title="Select annotations"]');
		const bboxButton = container.querySelector('button[title="Draw bounding boxes"]');

		expect(selectButton).not.toHaveClass('active');
		expect(bboxButton).toHaveClass('active');
	});

	it('should render clickable select tool button', async () => {
		const onToolChange = vi.fn();
		const { container } = render(AnnotationToolbar, {
			props: {
				activeTool: 'bbox',
				onToolChange
			}
		});

		const selectButton = container.querySelector('button[title="Select annotations"]');
		expect(selectButton).toBeInTheDocument();
		expect(selectButton).not.toHaveClass('active');

		// Verify button has cursor pointer indicating it's clickable
		const computedStyle = window.getComputedStyle(selectButton!);
		expect(computedStyle.cursor).toBe('pointer');
	});

	it('should render clickable bbox tool button', async () => {
		const onToolChange = vi.fn();
		const { container } = render(AnnotationToolbar, {
			props: {
				activeTool: 'select',
				onToolChange
			}
		});

		const bboxButton = container.querySelector('button[title="Draw bounding boxes"]');
		expect(bboxButton).toBeInTheDocument();
		expect(bboxButton).not.toHaveClass('active');

		// Verify button has cursor pointer indicating it's clickable
		const computedStyle = window.getComputedStyle(bboxButton!);
		expect(computedStyle.cursor).toBe('pointer');
	});

	it('should display correct instructions for select tool', () => {
		const onToolChange = vi.fn();
		const { container } = render(AnnotationToolbar, {
			props: {
				activeTool: 'select',
				onToolChange
			}
		});

		const instructionsText = container.querySelector('.instructions p');
		expect(instructionsText?.textContent).toBe('Click on annotations to select them');
	});

	it('should display correct instructions for bbox tool', () => {
		const onToolChange = vi.fn();
		const { container } = render(AnnotationToolbar, {
			props: {
				activeTool: 'bbox',
				onToolChange
			}
		});

		const instructionsText = container.querySelector('.instructions p');
		expect(instructionsText?.textContent).toBe('Click and drag to draw bounding boxes');
	});

	it('should render upload button with file input', async () => {
		const onToolChange = vi.fn();
		const { container } = render(AnnotationToolbar, {
			props: {
				activeTool: 'select',
				onToolChange
			}
		});

		// Verify upload button exists and has proper structure
		const uploadButton = container.querySelector('.upload-button');
		expect(uploadButton).toBeInTheDocument();
		expect(uploadButton?.textContent?.trim()).toContain('Upload Image');

		// Verify file input is present and hidden
		const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
		expect(fileInput).toBeInTheDocument();
		expect(fileInput).toHaveAttribute('accept', 'image/*');
	});

	it('should have file input configured for image uploads', async () => {
		const onToolChange = vi.fn();
		const onImageUpload = vi.fn();

		const { container } = render(AnnotationToolbar, {
			props: {
				activeTool: 'select',
				onToolChange,
				onImageUpload
			}
		});

		const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
		expect(fileInput).toBeInTheDocument();
		expect(fileInput).toHaveAttribute('accept', 'image/*');
		expect(fileInput).toHaveStyle({ display: 'none' });
	});

	it('should render with proper component structure', async () => {
		const onToolChange = vi.fn();
		const onImageUpload = vi.fn();

		const { container } = render(AnnotationToolbar, {
			props: {
				activeTool: 'select',
				onToolChange,
				onImageUpload
			}
		});

		// Verify main toolbar structure
		const toolbar = container.querySelector('.toolbar');
		expect(toolbar).toBeInTheDocument();

		// Verify tool sections
		const toolSections = container.querySelectorAll('.tool-section');
		expect(toolSections.length).toBeGreaterThanOrEqual(3); // Tools, Image, Instructions
	});

	it('should have proper accessibility attributes', () => {
		const onToolChange = vi.fn();
		const { container } = render(AnnotationToolbar, {
			props: {
				activeTool: 'select',
				onToolChange
			}
		});

		const selectButton = container.querySelector('button[title="Select annotations"]');
		const bboxButton = container.querySelector('button[title="Draw bounding boxes"]');

		expect(selectButton).toHaveAttribute('title', 'Select annotations');
		expect(bboxButton).toHaveAttribute('title', 'Draw bounding boxes');
	});

	it('should have properly configured file input', () => {
		const onToolChange = vi.fn();
		const { container } = render(AnnotationToolbar, {
			props: {
				activeTool: 'select',
				onToolChange
			}
		});

		const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
		expect(fileInput).toHaveAttribute('accept', 'image/*');
		expect(fileInput).toHaveStyle({ display: 'none' });
	});

	it('should have proper SVG icons for tools', () => {
		const onToolChange = vi.fn();
		const { container } = render(AnnotationToolbar, {
			props: {
				activeTool: 'select',
				onToolChange
			}
		});

		const selectButton = container.querySelector('button[title="Select annotations"]');
		const bboxButton = container.querySelector('button[title="Draw bounding boxes"]');
		const uploadButton = container.querySelector('.upload-button');

		// Check that buttons contain SVG elements
		expect(selectButton?.querySelector('svg')).toBeInTheDocument();
		expect(bboxButton?.querySelector('svg')).toBeInTheDocument();
		expect(uploadButton?.querySelector('svg')).toBeInTheDocument();
	});

	it('should update instructions reactively when tool changes', async () => {
		const onToolChange = vi.fn();
		const { rerender, container } = render(AnnotationToolbar, {
			props: {
				activeTool: 'select',
				onToolChange
			}
		});

		let instructionsText = container.querySelector('.instructions p');
		expect(instructionsText?.textContent).toBe('Click on annotations to select them');

		await rerender({
			activeTool: 'bbox',
			onToolChange
		});

		instructionsText = container.querySelector('.instructions p');
		expect(instructionsText?.textContent).toBe('Click and drag to draw bounding boxes');
	});
});
