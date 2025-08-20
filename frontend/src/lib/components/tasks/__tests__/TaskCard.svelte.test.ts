/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TaskCard from '../TaskCard.svelte';
import { mockTaskSummary } from '$lib/features/tasks/__tests__/mocks';
import type { TaskStatus } from '$lib/graphql/generated/graphql';

describe('TaskCard', () => {
	it('should render task information correctly', () => {
		const task = mockTaskSummary({
			id: 'test-1',
			title: 'Test Task Title',
			projectName: 'Test Project',
			status: 'DRAFT',
			bboxCount: 5,
			createdAt: '2024-01-15T10:00:00Z'
		});

		render(TaskCard, {
			props: { task }
		});

		const card = screen.getByTestId('task-card');
		expect(card).toBeInTheDocument();

		// Check title
		expect(screen.getByText('Test Task Title')).toBeInTheDocument();

		// Check project name
		expect(screen.getByText('Test Project')).toBeInTheDocument();

		// Check bbox count
		expect(screen.getByText('5 annotations')).toBeInTheDocument();

		// Check creation date
		expect(screen.getByText(/Created/)).toBeInTheDocument();

		// Check status badge
		expect(screen.getByTestId('task-status-badge')).toBeInTheDocument();

		// Check view link
		const viewLink = screen.getByTestId('view-task-link');
		expect(viewLink).toHaveAttribute('href', '/tasks/test-1');
	});

	it('should render progress bar when progress is available', () => {
		const task = mockTaskSummary({
			progress: 75
		});

		render(TaskCard, {
			props: { task }
		});

		expect(screen.getByText('Progress')).toBeInTheDocument();
		expect(screen.getByText('75%')).toBeInTheDocument();

		const progressBar = screen.getByRole('progressbar', { hidden: true });
		expect(progressBar).toHaveStyle('width: 75%');
	});

	it('should not render progress bar when progress is undefined', () => {
		const task = mockTaskSummary({
			progress: undefined
		});

		render(TaskCard, {
			props: { task }
		});

		expect(screen.queryByText('Progress')).not.toBeInTheDocument();
	});

	it('should render priority badge when priority is available', () => {
		const task = mockTaskSummary({
			priority: 'high'
		});

		render(TaskCard, {
			props: { task }
		});

		expect(screen.getByText('high')).toBeInTheDocument();
	});

	it('should render assignee when available', () => {
		const task = mockTaskSummary({
			assignee: 'John Doe'
		});

		render(TaskCard, {
			props: { task }
		});

		expect(screen.getByText('John Doe')).toBeInTheDocument();
	});

	it('should render due date when available', () => {
		const task = mockTaskSummary({
			dueDate: '2024-02-01T00:00:00Z'
		});

		render(TaskCard, {
			props: { task }
		});

		expect(screen.getByText(/Due:/)).toBeInTheDocument();
	});

	it('should render edit and delete buttons when handlers provided', () => {
		const task = mockTaskSummary();
		const onEdit = vi.fn();
		const onDelete = vi.fn();

		render(TaskCard, {
			props: {
				task,
				onEdit,
				onDelete
			}
		});

		expect(screen.getByTestId('edit-task-button')).toBeInTheDocument();
		expect(screen.getByTestId('delete-task-button')).toBeInTheDocument();
	});

	it('should not render edit and delete buttons when handlers not provided', () => {
		const task = mockTaskSummary();

		render(TaskCard, {
			props: { task }
		});

		expect(screen.queryByTestId('edit-task-button')).not.toBeInTheDocument();
		expect(screen.queryByTestId('delete-task-button')).not.toBeInTheDocument();
	});

	it('should call onEdit when edit button clicked', async () => {
		const task = mockTaskSummary();
		const onEdit = vi.fn();

		render(TaskCard, {
			props: {
				task,
				onEdit
			}
		});

		const editButton = screen.getByTestId('edit-task-button');
		await fireEvent.click(editButton);

		expect(onEdit).toHaveBeenCalledWith(task);
	});

	it('should call onDelete when delete button clicked', async () => {
		const task = mockTaskSummary();
		const onDelete = vi.fn();

		render(TaskCard, {
			props: {
				task,
				onDelete
			}
		});

		const deleteButton = screen.getByTestId('delete-task-button');
		await fireEvent.click(deleteButton);

		expect(onDelete).toHaveBeenCalledWith(task);
	});

	it('should render image link when imageUrl is available', () => {
		const task = mockTaskSummary({
			imageUrl: '/images/test.jpg',
			imageId: 'image-123'
		});

		render(TaskCard, {
			props: { task }
		});

		const imageLink = screen.getByTestId('view-image-link');
		expect(imageLink).toHaveAttribute('href', '/images/image-123');
	});

	it('should handle empty descriptions gracefully', () => {
		const task = mockTaskSummary({
			title: ''
		});

		render(TaskCard, {
			props: { task }
		});

		// Should fall back to project name
		expect(screen.getByText(new RegExp(`Task in ${task.projectName}`))).toBeInTheDocument();
	});

	it('should format dates correctly', () => {
		const task = mockTaskSummary({
			createdAt: '2024-01-15T10:30:00Z',
			dueDate: '2024-02-01T00:00:00Z'
		});

		render(TaskCard, {
			props: { task }
		});

		// Check that dates are formatted (exact format depends on locale)
		expect(screen.getByText(/Created/)).toBeInTheDocument();
		expect(screen.getByText(/Due:/)).toBeInTheDocument();
	});

	it('should handle all task statuses correctly', () => {
		const statuses = ['DRAFT', 'FINISHED', 'REVIEWED'];

		statuses.forEach((status) => {
			const task = mockTaskSummary({ status: status as TaskStatus });
			const { unmount } = render(TaskCard, {
				props: { task }
			});

			expect(screen.getByTestId('task-status-badge')).toBeInTheDocument();
			unmount();
		});
	});

	it('should have proper accessibility structure', () => {
		const task = mockTaskSummary({
			title: 'Accessible Task Title'
		});

		render(TaskCard, {
			props: { task }
		});

		// Check that the title is properly structured
		const title = screen.getByRole('heading', { level: 3 });
		expect(title).toHaveTextContent('Accessible Task Title');

		// Check that links have proper text
		const viewLink = screen.getByRole('link', { name: /View Task/ });
		expect(viewLink).toBeInTheDocument();
	});
});
