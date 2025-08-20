/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, queryByRole, queryByText, getTextContent, getByLabelText } from '$lib/test-utils';
import TestProjectFilters from './TestProjectFilters.svelte';
import type { ProjectFilters } from '$lib/features/projects/types';
import { resetMockCounter } from '$lib/features/projects/__tests__/mocks';

describe('ProjectFilters', () => {
	beforeEach(() => {
		resetMockCounter();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	const defaultFilters: ProjectFilters = {
		search: '',
		status: 'all'
	};

	it('renders filter controls', async () => {
		const screen = render(TestProjectFilters, {
			filters: defaultFilters
		});

		// Check search input
		const searchInput = getByLabelText(/search projects/i);
		await expect.element(searchInput).toBeVisible();
		await expect.element(searchInput).toHaveAttribute('placeholder', 'Search by project name...');

		// Check status select
		const statusSelect = getByLabelText(/status/i);
		await expect.element(statusSelect).toBeVisible();

		// Check that clear button is not visible when no filters are active
		expect(screen.container.querySelector('button[textContent*="Clear Filters"]')).toBeNull();
	});

	it('displays current filter values', async () => {
		const activeFilters: ProjectFilters = {
			search: 'medical',
			status: 'active'
		};

		const screen = render(TestProjectFilters, {
			filters: activeFilters
		});

		const searchInput = getByLabelText(/search projects/i);
		const statusSelect = getByLabelText(/status/i);

		// Should display current filter values
		await expect.element(searchInput).toHaveValue('medical');
		await expect.element(statusSelect).toHaveValue('active');
	});

	it('shows clear button when filters are active', async () => {
		const activeFilters: ProjectFilters = {
			search: 'medical',
			status: 'all'
		};

		const screen = render(TestProjectFilters, {
			filters: activeFilters
		});

		// Clear button should be visible
		const clearButton = screen.getByRole('button', { name: /clear filters/i });
		await expect.element(clearButton).toBeVisible();
	});

	it('shows active filter badges', async () => {
		const activeFilters: ProjectFilters = {
			search: 'medical',
			status: 'active'
		};

		const screen = render(TestProjectFilters, {
			filters: activeFilters
		});

		// Should show filter badges
		await expect.element(queryByText('Search: "medical"')).toBeVisible();
		await expect.element(queryByText('Status: active')).toBeVisible();
	});

	it('does not show status badge for "all" status', async () => {
		const filtersWithSearch: ProjectFilters = {
			search: 'medical',
			status: 'all'
		};

		const screen = render(TestProjectFilters, {
			filters: filtersWithSearch
		});

		// Should show search badge but not status badge
		await expect.element(screen.getByText('Search: "medical"')).toBeVisible();
		expect(screen.container.querySelector('*[textContent*="Status:"]')).toBeNull();
	});

	it('handles search input changes with debounce', async () => {
		const screen = render(TestProjectFilters, {
			filters: defaultFilters
		});

		const searchInput = getByLabelText(/search projects/i);

		// Type in search input
		await searchInput.fill('medical');

		// Should not call onChange immediately (debounced)
		await expect.element(screen.getByTestId('filters-change-called')).toHaveTextContent('false');

		// Fast forward time to trigger debounce
		vi.advanceTimersByTime(300);

		// Now should have called onChange
		await expect.element(screen.getByTestId('filters-change-called')).toHaveTextContent('true');

		const lastChange = JSON.parse(
			(await getTextContent(screen.getByTestId('last-filters-change'))) || '{}'
		);
		expect(lastChange.search).toBe('medical');
	});

	it('handles status select changes immediately', async () => {
		const screen = render(TestProjectFilters, {
			filters: defaultFilters
		});

		const statusSelect = getByLabelText(/status/i);

		// Change status
		await statusSelect.selectOptions('active');

		// Should call onChange immediately (no debounce for select)
		await expect.element(screen.getByTestId('filters-change-called')).toHaveTextContent('true');

		const lastChange = JSON.parse(
			(await getTextContent(screen.getByTestId('last-filters-change'))) || '{}'
		);
		expect(lastChange.status).toBe('active');
	});

	it('clears all filters when clear button clicked', async () => {
		const activeFilters: ProjectFilters = {
			search: 'medical',
			status: 'active'
		};

		const screen = render(TestProjectFilters, {
			filters: activeFilters,
			onClear: true
		});

		const clearButton = screen.getByRole('button', { name: /clear filters/i });
		await clearButton.click();

		// Should call onFiltersChange with cleared values
		await expect.element(screen.getByTestId('filters-change-called')).toHaveTextContent('true');

		const lastChange = JSON.parse(
			(await getTextContent(screen.getByTestId('last-filters-change'))) || '{}'
		);
		expect(lastChange.search).toBe('');
		expect(lastChange.status).toBe('all');

		// Should also call onClear if provided
		await expect.element(screen.getByTestId('clear-called')).toHaveTextContent('true');
	});

	it('clears internal state when clear button clicked', async () => {
		const activeFilters: ProjectFilters = {
			search: 'medical',
			status: 'active'
		};

		const screen = render(TestProjectFilters, {
			filters: activeFilters
		});

		const searchInput = getByLabelText(/search projects/i);
		const statusSelect = getByLabelText(/status/i);
		const clearButton = screen.getByRole('button', { name: /clear filters/i });

		// Verify initial state
		await expect.element(searchInput).toHaveValue('medical');
		await expect.element(statusSelect).toHaveValue('active');

		// Clear filters
		await clearButton.click();

		// Internal state should be cleared
		await expect.element(searchInput).toHaveValue('');
		await expect.element(statusSelect).toHaveValue('all');
	});

	it('updates internal state when filters prop changes', async () => {
		const { rerender } = render(TestProjectFilters, {
			filters: defaultFilters
		});

		const searchInput = getByLabelText(/search projects/i);
		const statusSelect = getByLabelText(/status/i);

		// Initially empty
		await expect.element(searchInput).toHaveValue('');
		await expect.element(statusSelect).toHaveValue('all');

		// Update props
		const newFilters: ProjectFilters = {
			search: 'updated',
			status: 'completed'
		};

		await rerender({ filters: newFilters });

		// Should sync with new prop values
		await expect.element(searchInput).toHaveValue('updated');
		await expect.element(statusSelect).toHaveValue('completed');
	});

	it('shows all status options', async () => {
		const screen = render(TestProjectFilters, {
			filters: defaultFilters
		});

		const statusSelect = getByLabelText(/status/i);

		// Check that all status options exist in the DOM (they don't need to be visible)
		expect(screen.getByRole('option', { name: 'All Projects' })).toBeInTheDocument();
		expect(screen.getByRole('option', { name: 'Active' })).toBeInTheDocument();
		expect(screen.getByRole('option', { name: 'Completed' })).toBeInTheDocument();
		expect(screen.getByRole('option', { name: 'Draft' })).toBeInTheDocument();
	});

	it('debounces multiple search changes', async () => {
		const screen = render(TestProjectFilters, {
			filters: defaultFilters
		});

		const searchInput = getByLabelText(/search projects/i);

		// Type multiple characters quickly
		await searchInput.fill('m');
		vi.advanceTimersByTime(100);

		await searchInput.fill('me');
		vi.advanceTimersByTime(100);

		await searchInput.fill('med');
		vi.advanceTimersByTime(100);

		// Should not have called onChange yet
		await expect.element(screen.getByTestId('filters-change-called')).toHaveTextContent('false');

		// Complete the debounce period
		vi.advanceTimersByTime(200);

		// Now should have called onChange once with final value
		await expect.element(screen.getByTestId('filters-change-called')).toHaveTextContent('true');

		const lastChange = JSON.parse(
			(await getTextContent(screen.getByTestId('last-filters-change'))) || '{}'
		);
		expect(lastChange.search).toBe('med');
	});

	it('hides filter badges when no active filters', async () => {
		const screen = render(TestProjectFilters, {
			filters: defaultFilters
		});

		// Should not show any filter badges
		expect(screen.container.querySelector('*[textContent*="Search:"]')).toBeNull();
		expect(screen.container.querySelector('*[textContent*="Status:"]')).toBeNull();
	});

	it('shows filter badges section only when filters are active', async () => {
		const screen = render(TestProjectFilters, {
			filters: defaultFilters
		});

		// Initially no badges section
		expect(screen.container.querySelector('*[textContent*="Search:"]')).toBeNull();

		// Add search filter
		const activeFilters: ProjectFilters = {
			search: 'test',
			status: 'all'
		};

		await screen.rerender({ filters: activeFilters });

		// Now should show badges section
		await expect.element(screen.getByText('Search: "test"')).toBeVisible();
	});

	it('works without onClear callback', async () => {
		const activeFilters: ProjectFilters = {
			search: 'medical',
			status: 'active'
		};

		const screen = render(TestProjectFilters, {
			filters: activeFilters
			// No onClear prop
		});

		const clearButton = screen.getByRole('button', { name: /clear filters/i });

		// Should not throw error when clicking clear without onClear callback
		await clearButton.click();

		// Should still clear filters
		await expect.element(screen.getByTestId('filters-change-called')).toHaveTextContent('true');

		// onClear should not have been called
		await expect.element(screen.getByTestId('clear-called')).toHaveTextContent('false');
	});

	it('has proper accessibility attributes', async () => {
		const screen = render(TestProjectFilters, {
			filters: defaultFilters
		});

		// Check form labels
		const searchInput = getByLabelText(/search projects/i);
		const statusSelect = getByLabelText(/status/i);

		await expect.element(searchInput).toHaveAttribute('id', 'search-projects');
		await expect.element(statusSelect).toHaveAttribute('id', 'filter-status');

		// Check that inputs are properly labeled
		const searchLabel = queryByText('Search Projects');
		const statusLabel = queryByText('Status');

		await expect.element(searchLabel).toHaveAttribute('for', 'search-projects');
		await expect.element(statusLabel).toHaveAttribute('for', 'filter-status');
	});
});
