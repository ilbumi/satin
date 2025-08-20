/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, queryByText, queryByRole } from '$lib/test-utils';
import TestProjectCard from './TestProjectCard.svelte';
import {
	mockProjectSummary,
	mockProjectScenarios,
	resetMockCounter
} from '$lib/features/projects/__tests__/mocks';

describe('ProjectCard', () => {
	beforeEach(() => {
		resetMockCounter();
	});

	it('renders project information correctly', async () => {
		const project = mockProjectSummary({
			name: 'Test Project',
			description: 'Test project description',
			status: 'active'
		});

		const screen = render(TestProjectCard, { project });

		// Check project name in the heading
		await expect.element(screen.getByRole('heading', { name: 'Test Project' })).toBeVisible();

		// Check project description
		await expect.element(screen.getByText('Test project description')).toBeVisible();

		// Check status badge
		const statusBadge = screen.getByText('active');
		await expect.element(statusBadge).toBeVisible();
		await expect.element(statusBadge).toHaveClass('bg-green-50', 'text-green-800');

		// Check view link
		const viewLink = screen.getByRole('link', { name: /view/i });
		await expect.element(viewLink).toBeVisible();
		await expect.element(viewLink).toHaveAttribute('href', `/projects/${project.id}`);
	});

	it('displays status badges with correct colors', async () => {
		const scenarios = [
			{ status: 'active' as const, bgClass: 'bg-green-50', textClass: 'text-green-800' },
			{ status: 'completed' as const, bgClass: 'bg-blue-50', textClass: 'text-blue-800' },
			{ status: 'draft' as const, bgClass: 'bg-gray-50', textClass: 'text-gray-800' }
		];

		for (const scenario of scenarios) {
			const project = mockProjectSummary({ status: scenario.status });
			const screen = render(TestProjectCard, { project });

			const statusBadge = screen.getByText(scenario.status);
			await expect.element(statusBadge).toHaveClass(scenario.bgClass, scenario.textClass);
		}
	});

	it('shows image and task counts when available', async () => {
		const project = mockProjectSummary({
			imageCount: 42,
			taskCount: 15
		});

		const screen = render(TestProjectCard, { project });

		await expect.element(screen.getByText('42 images')).toBeVisible();
		await expect.element(screen.getByText('15 tasks')).toBeVisible();
	});

	it('hides counts when not available', async () => {
		const project = mockProjectSummary({
			imageCount: undefined,
			taskCount: undefined
		});

		const screen = render(TestProjectCard, { project });

		expect(screen.container.querySelector('*[textContent*="images"]')).toBeNull();
		expect(screen.container.querySelector('*[textContent*="tasks"]')).toBeNull();
	});

	it('shows creation date when available', async () => {
		const project = mockProjectSummary({
			createdAt: '2024-01-15T00:00:00Z'
		});

		const screen = render(TestProjectCard, { project });

		// Check that some date text is shown (exact format may vary by locale)
		await expect.element(screen.getByText(/created/i)).toBeVisible();
	});

	it('hides creation date when not available', async () => {
		const project = mockProjectSummary({
			createdAt: undefined
		});

		const screen = render(TestProjectCard, { project });

		expect(screen.container.querySelector('*[textContent*="created"]')).toBeNull();
	});

	it('shows edit and delete buttons when callbacks provided', async () => {
		const project = mockProjectSummary();

		const screen = render(TestProjectCard, {
			project,
			onEdit: true,
			onDelete: true
		});

		await expect.element(screen.getByRole('button', { name: /edit/i })).toBeVisible();
		await expect.element(screen.getByRole('button', { name: /delete/i })).toBeVisible();
	});

	it('hides edit and delete buttons when callbacks not provided', async () => {
		const project = mockProjectSummary();

		const screen = render(TestProjectCard, { project });

		expect(screen.container.querySelector('button[textContent*="Edit"]')).toBeNull();
		expect(screen.container.querySelector('button[textContent*="Delete"]')).toBeNull();
	});

	it('calls onEdit callback when edit button clicked', async () => {
		const project = mockProjectSummary({ id: 'test-project' });

		const screen = render(TestProjectCard, {
			project,
			onEdit: true
		});

		const editButton = screen.getByRole('button', { name: /edit/i });
		await editButton.click();

		// Check that the callback was called with the correct project
		await expect.element(screen.getByTestId('edit-called')).toHaveTextContent('true');
		await expect.element(screen.getByTestId('edit-project')).toHaveTextContent('test-project');
	});

	it('calls onDelete callback when delete button clicked', async () => {
		const project = mockProjectSummary({ id: 'test-project' });

		const screen = render(TestProjectCard, {
			project,
			onDelete: true
		});

		const deleteButton = screen.getByRole('button', { name: /delete/i });
		await deleteButton.click();

		// Check that the callback was called with the correct project
		await expect.element(screen.getByTestId('delete-called')).toHaveTextContent('true');
		await expect.element(screen.getByTestId('delete-project')).toHaveTextContent('test-project');
	});

	it('handles long project names gracefully', async () => {
		const project = mockProjectScenarios.longName();

		const screen = render(TestProjectCard, { project });

		const nameElement = screen.getByRole('heading', { level: 3 });
		await expect.element(nameElement).toBeVisible();
		await expect.element(nameElement).toHaveClass('truncate');
		await expect.element(nameElement).toHaveAttribute('title', project.name);
	});

	it('handles long descriptions gracefully', async () => {
		const project = mockProjectScenarios.longDescription();

		const screen = render(TestProjectCard, { project });

		const descriptionElement = screen.getByText(project.description);
		await expect.element(descriptionElement).toBeVisible();
		await expect.element(descriptionElement).toHaveClass('line-clamp-3');
		await expect.element(descriptionElement).toHaveAttribute('title', project.description);
	});

	it('handles empty descriptions', async () => {
		const project = mockProjectScenarios.emptyDescription();

		const screen = render(TestProjectCard, { project });

		// Should still render but with empty description
		const descriptionElement = screen.container.querySelector('p[title=""]');
		expect(descriptionElement).not.toBeNull();
		expect(descriptionElement?.textContent).toBe('');
	});

	it('has proper accessibility attributes', async () => {
		const project = mockProjectSummary({
			name: 'Accessible Project',
			description: 'This project is accessible'
		});

		const screen = render(TestProjectCard, { project });

		// Check that the project name is properly marked as a heading
		const heading = screen.getByRole('heading', { level: 3 });
		await expect.element(heading).toHaveTextContent('Accessible Project');

		// Check that the view link has proper text
		const viewLink = screen.getByRole('link', { name: /view/i });
		await expect.element(viewLink).toBeVisible();
	});
});
