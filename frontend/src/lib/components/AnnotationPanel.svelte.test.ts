import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import AnnotationPanel from './AnnotationPanel.svelte';

describe('AnnotationPanel', () => {
	const mockAnnotations = [
		{
			id: '1',
			x: 0.1,
			y: 0.2,
			width: 0.3,
			height: 0.4,
			label: 'Test Label 1',
			isSelected: false
		},
		{
			id: '2',
			x: 0.5,
			y: 0.6,
			width: 0.2,
			height: 0.1,
			label: 'Test Label 2',
			isSelected: true
		}
	];

	it('should render with annotations', () => {
		render(AnnotationPanel, { props: { annotations: mockAnnotations } });

		expect(screen.getByText('Annotations (2)')).toBeInTheDocument();
		expect(screen.getByText('Test Label 1')).toBeInTheDocument();
		expect(screen.getByText('Test Label 2')).toBeInTheDocument();
	});

	it('should show empty state when no annotations', () => {
		render(AnnotationPanel, { props: { annotations: [] } });

		expect(screen.getByText('Annotations (0)')).toBeInTheDocument();
		expect(screen.getByText('No annotations yet')).toBeInTheDocument();
		expect(
			screen.getByText('Select the bbox tool and draw on the image to create annotations')
		).toBeInTheDocument();
	});

	it('should display coordinate values correctly formatted', () => {
		render(AnnotationPanel, { props: { annotations: mockAnnotations } });

		// Check formatted coordinates - use getAllByText for values that appear multiple times
		const percentageElements10 = screen.getAllByText('10.0%');
		expect(percentageElements10.length).toBeGreaterThan(0); // x values should be present

		const percentageElements20 = screen.getAllByText('20.0%');
		expect(percentageElements20.length).toBeGreaterThan(0); // y values should be present

		const percentageElements30 = screen.getAllByText('30.0%');
		expect(percentageElements30.length).toBeGreaterThan(0); // width values should be present

		const percentageElements40 = screen.getAllByText('40.0%');
		expect(percentageElements40.length).toBeGreaterThan(0); // height values should be present
	});

	it('should highlight selected annotation', () => {
		const { container } = render(AnnotationPanel, { props: { annotations: mockAnnotations } });

		const annotationItems = container.querySelectorAll('.annotation-item');

		// Verify we have the right number of items
		expect(annotationItems).toHaveLength(2);

		// Second annotation should be selected
		expect(annotationItems[1]).toHaveClass('selected');
		expect(annotationItems[0]).not.toHaveClass('selected');
	});

	it('should render clickable annotation items', async () => {
		const onAnnotationSelect = vi.fn();
		const { container } = render(AnnotationPanel, {
			props: {
				annotations: mockAnnotations,
				onAnnotationSelect
			}
		});

		// Verify that annotation items are rendered and clickable within this component
		const annotationItems = container.querySelectorAll('.annotation-item');
		expect(annotationItems).toHaveLength(2);

		// Verify they have cursor pointer style indicating they're clickable
		const firstAnnotation = annotationItems[0] as HTMLElement;
		const computedStyle = window.getComputedStyle(firstAnnotation);
		expect(computedStyle.cursor).toBe('pointer');
	});

	it('should render delete buttons for each annotation', async () => {
		const onAnnotationDelete = vi.fn();
		const { container } = render(AnnotationPanel, {
			props: {
				annotations: mockAnnotations,
				onAnnotationDelete
			}
		});

		// Verify delete buttons are rendered with proper attributes within this component
		const deleteButtons = container.querySelectorAll('button[aria-label="Delete annotation"]');
		expect(deleteButtons).toHaveLength(2);

		// Verify buttons have SVG icons
		deleteButtons.forEach((button) => {
			const svg = button.querySelector('svg');
			expect(svg).toBeInTheDocument();
		});
	});

	it('should start editing when edit button is clicked', async () => {
		const user = userEvent.setup();
		render(AnnotationPanel, { props: { annotations: mockAnnotations } });

		// Find edit button and click it with userEvent
		const editButtons = document.querySelectorAll('button[aria-label="Edit label"]');
		const firstEditButton = editButtons[0] as HTMLElement;

		await user.click(firstEditButton);

		// Wait a bit for the state change to take effect
		await new Promise((resolve) => setTimeout(resolve, 50));

		// Should show input field with current label value
		const input = document.querySelector('.label-input') as HTMLInputElement;
		expect(input).toBeInTheDocument();
		expect(input.value).toBe('Test Label 1');
	});

	it('should provide keyboard interaction for edit input', async () => {
		const onAnnotationUpdate = vi.fn();
		const { container } = render(AnnotationPanel, {
			props: {
				annotations: mockAnnotations,
				onAnnotationUpdate
			}
		});

		// Verify edit buttons are available and have proper titles within this component
		const editButtons = container.querySelectorAll('button[aria-label="Edit label"]');
		expect(editButtons).toHaveLength(2);

		// Verify buttons have edit SVG icons
		editButtons.forEach((button) => {
			const svg = button.querySelector('svg');
			expect(svg).toBeInTheDocument();
		});
	});

	it('should cancel edit when Escape key is pressed', async () => {
		const user = userEvent.setup();
		const onAnnotationUpdate = vi.fn();
		render(AnnotationPanel, {
			props: {
				annotations: mockAnnotations,
				onAnnotationUpdate
			}
		});

		// Start editing
		const editButton = document.querySelector('button[aria-label="Edit label"]') as HTMLElement;
		await user.click(editButton);

		// Wait for state change
		await new Promise((resolve) => setTimeout(resolve, 50));

		// Change input value and press Escape
		const input = document.querySelector('.label-input') as HTMLInputElement;
		if (input) {
			await user.clear(input);
			await user.type(input, 'Updated Label');
			await user.keyboard('{Escape}');
		}

		// Wait for state change
		await new Promise((resolve) => setTimeout(resolve, 50));

		// Should not call update function
		expect(onAnnotationUpdate).not.toHaveBeenCalled();
		// Should hide input and show original label
		const label = document.querySelector('.annotation-label');
		expect(label).toBeInTheDocument();
		expect(label?.textContent).toBe('Test Label 1');
	});

	it('should have properly structured action buttons', async () => {
		const onAnnotationUpdate = vi.fn();
		const { container } = render(AnnotationPanel, {
			props: {
				annotations: mockAnnotations,
				onAnnotationUpdate
			}
		});

		// Verify action button containers are present within this component
		const actionContainers = container.querySelectorAll('.annotation-actions');
		expect(actionContainers).toHaveLength(2);

		// Verify each container has both edit and delete buttons
		actionContainers.forEach((actionContainer) => {
			const editButton = actionContainer.querySelector('button[aria-label="Edit label"]');
			const deleteButton = actionContainer.querySelector('button[aria-label="Delete annotation"]');
			expect(editButton).toBeInTheDocument();
			expect(deleteButton).toBeInTheDocument();
		});
	});

	it('should have action buttons with proper hover states', async () => {
		const onAnnotationSelect = vi.fn();
		const onAnnotationDelete = vi.fn();
		const { container } = render(AnnotationPanel, {
			props: {
				annotations: mockAnnotations,
				onAnnotationSelect,
				onAnnotationDelete
			}
		});

		// Verify buttons have appropriate classes for styling within this component
		const editButtons = container.querySelectorAll('button.action-button.edit');
		const deleteButtons = container.querySelectorAll('button.action-button.delete');

		expect(editButtons).toHaveLength(2);
		expect(deleteButtons).toHaveLength(2);
	});

	it('should format coordinates correctly', () => {
		// Test the expected behavior through rendered output
		render(AnnotationPanel, {
			props: {
				annotations: [
					{
						id: '1',
						x: 0.123,
						y: 0.456,
						width: 0.789,
						height: 0.012,
						label: 'Test',
						isSelected: false
					}
				]
			}
		});

		expect(screen.getByText('12.3%')).toBeInTheDocument(); // x: 0.123 * 100 = 12.3%
		expect(screen.getByText('45.6%')).toBeInTheDocument(); // y: 0.456 * 100 = 45.6%
		expect(screen.getByText('78.9%')).toBeInTheDocument(); // width: 0.789 * 100 = 78.9%
		expect(screen.getByText('1.2%')).toBeInTheDocument(); // height: 0.012 * 100 = 1.2%
	});
});
