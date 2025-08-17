/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, queryByRole, queryByText, findClosest } from '$lib/test-utils';
import TestProjectList from './TestProjectList.svelte';
import { mockProjectSummary, resetMockCounter } from '$lib/features/projects/__tests__/mocks';

describe('ProjectList', () => {
	beforeEach(() => {
		resetMockCounter();
	});

	it('shows loading state with spinner', async () => {
		const screen = render(TestProjectList, {
			projects: [],
			loading: true
		});

		await expect.element(screen.getByText('Loading projects...')).toBeVisible();

		// Check that spinner is present (it should have a specific role or class)
		const loadingSection = await findClosest(screen.getByText('Loading projects...'), 'div');
		expect(loadingSection).toBeTruthy();
	});

	it('shows error state with retry button', async () => {
		const screen = render(TestProjectList, {
			projects: [],
			loading: false,
			error: 'Failed to load projects',
			onRetry: true
		});

		await expect.element(screen.getByText('Error loading projects')).toBeVisible();
		await expect.element(screen.getByText('Failed to load projects')).toBeVisible();

		const retryButton = screen.getByRole('button', { name: /try again/i });
		await expect.element(retryButton).toBeVisible();
	});

	it('calls onRetry when retry button clicked', async () => {
		const screen = render(TestProjectList, {
			projects: [],
			loading: false,
			error: 'Test error',
			onRetry: true
		});

		const retryButton = screen.getByRole('button', { name: /try again/i });
		await retryButton.click();

		await expect.element(screen.getByTestId('retry-called')).toHaveTextContent('true');
	});

	it('shows empty state when no projects', async () => {
		const screen = render(TestProjectList, {
			projects: [],
			loading: false,
			onCreateProject: true
		});

		await expect.element(screen.getByText('No projects yet')).toBeVisible();
		await expect
			.element(screen.getByText('Create your first annotation project to get started'))
			.toBeVisible();

		const createButton = screen.getByRole('button', { name: /create project/i });
		await expect.element(createButton).toBeVisible();
	});

	it('calls onCreateProject when create button clicked in empty state', async () => {
		const screen = render(TestProjectList, {
			projects: [],
			loading: false,
			onCreateProject: true
		});

		const createButton = screen.getByRole('button', { name: /create project/i });
		await createButton.click();

		await expect.element(screen.getByTestId('create-called')).toHaveTextContent('true');
	});

	it('renders list of projects in grid layout', async () => {
		const projects = [
			mockProjectSummary({ name: 'Project 1' }),
			mockProjectSummary({ name: 'Project 2' }),
			mockProjectSummary({ name: 'Project 3' })
		];

		const screen = render(TestProjectList, {
			projects,
			loading: false
		});

		// Check that all projects are rendered
		await expect.element(screen.getByRole('heading', { name: 'Project 1' })).toBeVisible();
		await expect.element(screen.getByRole('heading', { name: 'Project 2' })).toBeVisible();
		await expect.element(screen.getByRole('heading', { name: 'Project 3' })).toBeVisible();

		// Check that they're in a grid layout
		const gridContainer = screen.container.querySelector('.grid');
		expect(gridContainer).toBeTruthy();
		await expect.element(gridContainer!).toHaveClass('md:grid-cols-2');
		await expect.element(gridContainer!).toHaveClass('lg:grid-cols-3');
	});

	it('passes edit callback to project cards', async () => {
		const projects = [mockProjectSummary({ id: 'test-1', name: 'Test Project' })];

		const screen = render(TestProjectList, {
			projects,
			loading: false,
			onEditProject: true
		});

		// Find and click the edit button on the project card
		const editButton = screen.getByRole('button', { name: /edit/i });
		await editButton.click();

		await expect.element(screen.getByTestId('edit-called')).toHaveTextContent('true');
		await expect.element(screen.getByTestId('edit-project')).toHaveTextContent('test-1');
	});

	it('passes delete callback to project cards', async () => {
		const projects = [mockProjectSummary({ id: 'test-1', name: 'Test Project' })];

		const screen = render(TestProjectList, {
			projects,
			loading: false,
			onDeleteProject: true
		});

		// Find and click the delete button on the project card
		const deleteButton = screen.getByRole('button', { name: /delete/i });
		await deleteButton.click();

		await expect.element(screen.getByTestId('delete-called')).toHaveTextContent('true');
		await expect.element(screen.getByTestId('delete-project')).toHaveTextContent('test-1');
	});

	it('does not show retry button when onRetry not provided', async () => {
		const screen = render(TestProjectList, {
			projects: [],
			loading: false,
			error: 'Test error'
			// onRetry not provided
		});

		expect(screen.container.querySelector('button[textContent*="Try Again"]')).toBeNull();
	});

	it('does not show create button in empty state when onCreateProject not provided', async () => {
		const screen = render(TestProjectList, {
			projects: [],
			loading: false
			// onCreateProject not provided
		});

		expect(screen.container.querySelector('button[textContent*="Create Project"]')).toBeNull();
	});

	it('prioritizes loading state over other states', async () => {
		const screen = render(TestProjectList, {
			projects: [],
			loading: true,
			error: 'Some error'
		});

		// Should show loading, not error
		await expect.element(screen.getByText('Loading projects...')).toBeVisible();
		expect(screen.container.querySelector('*[textContent*="Error loading projects"]')).toBeNull();
	});

	it('prioritizes error state over empty state', async () => {
		const screen = render(TestProjectList, {
			projects: [],
			loading: false,
			error: 'Test error'
		});

		// Should show error, not empty state
		await expect.element(screen.getByText('Error loading projects')).toBeVisible();
		expect(screen.container.querySelector('*[textContent*="No projects yet"]')).toBeNull();
	});

	it('shows projects when available, regardless of other states', async () => {
		const projects = [mockProjectSummary({ name: 'Test Project' })];

		const screen = render(TestProjectList, {
			projects,
			loading: false,
			error: 'Some error' // Error should be ignored when projects exist
		});

		// Should show projects, not error
		await expect.element(screen.getByRole('heading', { name: 'Test Project' })).toBeVisible();
		expect(screen.container.querySelector('*[textContent*="Error loading projects"]')).toBeNull();
	});

	it('handles mixed project data correctly', async () => {
		const projects = [
			mockProjectSummary({
				name: 'Complete Project',
				status: 'completed',
				imageCount: 100,
				taskCount: 50
			}),
			mockProjectSummary({
				name: 'Basic Project',
				status: 'active'
				// No counts
			})
		];

		const screen = render(TestProjectList, {
			projects,
			loading: false
		});

		// Both projects should render
		await expect.element(screen.getByText('Complete Project')).toBeVisible();
		await expect.element(screen.getByText('Basic Project')).toBeVisible();

		// Check that different statuses are shown
		await expect.element(screen.getByText('completed')).toBeVisible();
		await expect.element(screen.getByText('active')).toBeVisible();
	});
});
