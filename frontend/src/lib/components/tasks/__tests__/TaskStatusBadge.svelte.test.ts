import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import TaskStatusBadge from '../TaskStatusBadge.svelte';
import type { TaskStatus } from '$lib/graphql/generated/graphql';

describe('TaskStatusBadge', () => {
	beforeEach(() => {
		cleanup();
	});
	it('should render DRAFT status correctly', () => {
		render(TaskStatusBadge, {
			props: {
				status: 'DRAFT' as TaskStatus
			}
		});

		const badge = screen.getByTestId('task-status-badge');
		expect(badge).toBeInTheDocument();
		expect(badge).toHaveTextContent('Draft');
		expect(badge).toHaveAttribute('data-status', 'DRAFT');
		expect(badge).toHaveAttribute('title', 'Task status: Draft');
		expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
	});

	it('should render FINISHED status correctly', () => {
		render(TaskStatusBadge, {
			props: {
				status: 'FINISHED' as TaskStatus
			}
		});

		const badge = screen.getByTestId('task-status-badge');
		expect(badge).toHaveTextContent('Finished');
		expect(badge).toHaveAttribute('data-status', 'FINISHED');
		expect(badge).toHaveClass('bg-green-100', 'text-green-800');
	});

	it('should render REVIEWED status correctly', () => {
		render(TaskStatusBadge, {
			props: {
				status: 'REVIEWED' as TaskStatus
			}
		});

		const badge = screen.getByTestId('task-status-badge');
		expect(badge).toHaveTextContent('Reviewed');
		expect(badge).toHaveAttribute('data-status', 'REVIEWED');
		expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
	});

	it('should apply size classes correctly', () => {
		// Test small size
		cleanup();
		render(TaskStatusBadge, {
			props: {
				status: 'DRAFT' as TaskStatus,
				size: 'sm'
			}
		});

		let badge = screen.getByTestId('task-status-badge');
		expect(badge).toHaveClass('px-2', 'py-0.5', 'text-xs');

		// Test medium size
		cleanup();
		render(TaskStatusBadge, {
			props: {
				status: 'DRAFT' as TaskStatus,
				size: 'md'
			}
		});

		badge = screen.getByTestId('task-status-badge');
		expect(badge).toHaveClass('px-2', 'py-1', 'text-xs');

		// Test large size
		cleanup();
		render(TaskStatusBadge, {
			props: {
				status: 'DRAFT' as TaskStatus,
				size: 'lg'
			}
		});

		badge = screen.getByTestId('task-status-badge');
		expect(badge).toHaveClass('px-3', 'py-1', 'text-sm');
	});

	it('should apply custom class names', () => {
		render(TaskStatusBadge, {
			props: {
				status: 'DRAFT' as TaskStatus,
				class: 'custom-class'
			}
		});

		const badge = screen.getByTestId('task-status-badge');
		expect(badge).toHaveClass('custom-class');
	});

	it('should have proper accessibility attributes', () => {
		render(TaskStatusBadge, {
			props: {
				status: 'FINISHED' as TaskStatus
			}
		});

		const badge = screen.getByTestId('task-status-badge');
		expect(badge).toHaveAttribute('title', 'Task status: Finished');
	});
});
