import { describe, it, expect } from 'vitest';
import { render } from '$lib/test-utils';
import TestSidebar from './TestSidebar.svelte';

describe('Sidebar', () => {
	it('renders navigation sections', async () => {
		const screen = render(TestSidebar, { isOpen: true });

		await expect.element(screen.getByText('Main')).toBeInTheDocument();
		await expect.element(screen.getByText('Work')).toBeInTheDocument();
		await expect.element(screen.getByText('Tools')).toBeInTheDocument();
	});

	it('renders navigation items', async () => {
		const screen = render(TestSidebar, { isOpen: true });

		await expect.element(screen.getByText('Dashboard')).toBeInTheDocument();
		await expect.element(screen.getByText('Projects')).toBeInTheDocument();
		await expect.element(screen.getByText('Tasks')).toBeInTheDocument();
		await expect.element(screen.getByText('Annotations')).toBeInTheDocument();
	});

	it('displays user information in footer', async () => {
		const screen = render(TestSidebar, { isOpen: true });

		// Check for user email specifically
		await expect.element(screen.getByText('user@example.com')).toBeInTheDocument();
	});

	it('is visible when isOpen is true', async () => {
		const screen = render(TestSidebar, { isOpen: true });

		// Check that navigation is present
		await expect.element(screen.getByText('Navigation')).toBeInTheDocument();
	});
});
