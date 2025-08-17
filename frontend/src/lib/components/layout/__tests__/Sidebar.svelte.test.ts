import { describe, it, expect } from 'vitest';
import { render } from '$lib/test-utils';
import TestSidebar from './TestSidebar.svelte';

describe('Sidebar', () => {
	it('renders navigation sections', async () => {
		const screen = render(TestSidebar, { isOpen: true });

		await expect.element(screen.getByText('Main')).toBeVisible();
		await expect.element(screen.getByText('Work')).toBeVisible();
		await expect.element(screen.getByText('Tools')).toBeVisible();
	});

	it('renders navigation items', async () => {
		const screen = render(TestSidebar, { isOpen: true });

		await expect.element(screen.getByText('Dashboard')).toBeVisible();
		await expect.element(screen.getByText('Projects')).toBeVisible();
		await expect.element(screen.getByText('Tasks')).toBeVisible();
		await expect.element(screen.getByText('Annotations')).toBeVisible();
	});

	it('displays user information in footer', async () => {
		const screen = render(TestSidebar, { isOpen: true });

		// Check for user email specifically
		await expect.element(screen.getByText('user@example.com')).toBeVisible();
	});

	it('is visible when isOpen is true', async () => {
		const screen = render(TestSidebar, { isOpen: true });

		// Check that navigation is present
		await expect.element(screen.getByText('Navigation')).toBeVisible();
	});
});
