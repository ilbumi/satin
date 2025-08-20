/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TaskList from '../TaskList.svelte';
import { mockTaskSummary } from '$lib/features/tasks/__tests__/mocks';

describe('TaskList', () => {
	it('should render loading state correctly', () => {
		render(TaskList, {
			props: {
				tasks: [],
				loading: true
			}
		});

		expect(screen.getByTestId('loading-state')).toBeInTheDocument();
		expect(screen.getByText('Loading tasks...')).toBeInTheDocument();
	});

	it('should render error state correctly', () => {
		const onRetry = vi.fn();

		render(TaskList, {
			props: {
				tasks: [],
				loading: false,
				error: 'Network connection failed',
				onRetry
			}
		});

		expect(screen.getByTestId('error-state')).toBeInTheDocument();
		expect(screen.getByText('Network connection failed')).toBeInTheDocument();
		const errorState = screen.getByTestId('error-state');
		expect(errorState.querySelector('button')).toBeInTheDocument();
	});

	it('should render empty state correctly', () => {
		const onCreateTask = vi.fn();

		render(TaskList, {
			props: {
				tasks: [],
				loading: false,
				error: null,
				onCreateTask
			}
		});

		expect(screen.getByTestId('empty-state')).toBeInTheDocument();
		expect(screen.getByText('No tasks yet')).toBeInTheDocument();
		const emptyState = screen.getByTestId('empty-state');
		expect(emptyState.querySelector('button')).toBeInTheDocument();
	});

	it('should render tasks grid when tasks are available', () => {
		const tasks = [
			mockTaskSummary({ id: 'task-1' }),
			mockTaskSummary({ id: 'task-2' }),
			mockTaskSummary({ id: 'task-3' })
		];

		render(TaskList, {
			props: {
				tasks,
				loading: false,
				error: null
			}
		});

		expect(screen.getByTestId('tasks-grid')).toBeInTheDocument();
		expect(screen.getAllByTestId('task-card')).toHaveLength(3);
	});

	it('should render load more button when hasMore is true', () => {
		const tasks = [mockTaskSummary()];
		const onLoadMore = vi.fn();

		render(TaskList, {
			props: {
				tasks,
				loading: false,
				error: null,
				hasMore: true,
				onLoadMore
			}
		});

		expect(screen.getByTestId('load-more-button')).toBeInTheDocument();
		expect(screen.getByText('Load More')).toBeInTheDocument();
	});

	it('should not render load more button when hasMore is false', () => {
		const tasks = [mockTaskSummary()];

		render(TaskList, {
			props: {
				tasks,
				loading: false,
				error: null,
				hasMore: false
			}
		});

		expect(screen.queryByTestId('load-more-button')).not.toBeInTheDocument();
	});

	it('should show loading indicator on load more button when loading', () => {
		const tasks = [mockTaskSummary()];
		const onLoadMore = vi.fn();

		render(TaskList, {
			props: {
				tasks,
				loading: true,
				error: null,
				hasMore: true,
				onLoadMore
			}
		});

		const loadMoreButton = screen.getByTestId('load-more-button');
		expect(loadMoreButton).toBeDisabled();
		expect(screen.getByText('Loading...')).toBeInTheDocument();
	});

	it('should show loading more state when loading with existing tasks', () => {
		const tasks = [mockTaskSummary()];

		render(TaskList, {
			props: {
				tasks,
				loading: true,
				error: null
			}
		});

		expect(screen.getByTestId('loading-more-state')).toBeInTheDocument();
		expect(screen.getByText('Loading more tasks...')).toBeInTheDocument();
	});

	it('should show error banner when error occurs with existing tasks', () => {
		const tasks = [mockTaskSummary()];
		const onRetry = vi.fn();

		render(TaskList, {
			props: {
				tasks,
				loading: false,
				error: 'Failed to load more',
				onRetry
			}
		});

		expect(screen.getByTestId('load-more-error')).toBeInTheDocument();
		expect(screen.getByText('Failed to load more tasks')).toBeInTheDocument();
		expect(screen.getByText('Failed to load more')).toBeInTheDocument();
	});

	it('should call onRetry when retry button clicked', async () => {
		const onRetry = vi.fn();

		render(TaskList, {
			props: {
				tasks: [],
				loading: false,
				error: 'Test error',
				onRetry
			}
		});

		const errorState = screen.getByTestId('error-state');
		const retryButton = errorState.querySelector('button');
		if (retryButton) {
			await fireEvent.click(retryButton);
		}

		expect(onRetry).toHaveBeenCalled();
	});

	it('should call onLoadMore when load more button clicked', async () => {
		const tasks = [mockTaskSummary()];
		const onLoadMore = vi.fn();

		render(TaskList, {
			props: {
				tasks,
				loading: false,
				error: null,
				hasMore: true,
				onLoadMore
			}
		});

		const loadMoreButton = screen.getByTestId('load-more-button');
		await fireEvent.click(loadMoreButton);

		expect(onLoadMore).toHaveBeenCalled();
	});

	it('should call onCreateTask when create button clicked in empty state', async () => {
		const onCreateTask = vi.fn();

		render(TaskList, {
			props: {
				tasks: [],
				loading: false,
				error: null,
				onCreateTask
			}
		});

		const emptyState = screen.getByTestId('empty-state');
		const createButton = emptyState.querySelector('button');
		if (createButton) {
			await fireEvent.click(createButton);
		}

		expect(onCreateTask).toHaveBeenCalled();
	});

	it('should pass edit handler to task cards', () => {
		const tasks = [mockTaskSummary({ id: 'task-1' })];
		const onEditTask = vi.fn();

		render(TaskList, {
			props: {
				tasks,
				loading: false,
				error: null,
				onEditTask
			}
		});

		// Should render edit button since handler is provided
		expect(screen.getByTestId('edit-task-button')).toBeInTheDocument();
	});

	it('should pass delete handler to task cards', () => {
		const tasks = [mockTaskSummary({ id: 'task-1' })];
		const onDeleteTask = vi.fn();

		render(TaskList, {
			props: {
				tasks,
				loading: false,
				error: null,
				onDeleteTask
			}
		});

		// Should render delete button since handler is provided
		expect(screen.getByTestId('delete-task-button')).toBeInTheDocument();
	});

	it('should prioritize loading state over other states', () => {
		render(TaskList, {
			props: {
				tasks: [],
				loading: true,
				error: 'Test error'
			}
		});

		// Loading state should be shown, not error state
		expect(screen.getByTestId('loading-state')).toBeInTheDocument();
		expect(screen.queryByTestId('error-state')).not.toBeInTheDocument();
	});

	it('should prioritize error state over empty state', () => {
		render(TaskList, {
			props: {
				tasks: [],
				loading: false,
				error: 'Test error'
			}
		});

		// Error state should be shown, not empty state
		expect(screen.getByTestId('error-state')).toBeInTheDocument();
		expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
	});

	it('should show tasks when available regardless of other states', () => {
		const tasks = [mockTaskSummary()];

		render(TaskList, {
			props: {
				tasks,
				loading: false,
				error: null
			}
		});

		expect(screen.getByTestId('tasks-grid')).toBeInTheDocument();
		expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
		expect(screen.queryByTestId('error-state')).not.toBeInTheDocument();
		expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
	});
});
