import { describe, it, expect } from 'vitest';
import { render } from '$lib/test-utils';
import TestHeader from './TestHeader.svelte';

describe('Header', () => {
	it('renders the app title and logo', async () => {
		const screen = render(TestHeader);
		await expect.element(screen.getByText('Satin')).toBeInTheDocument();
		await expect.element(screen.getByText('🎨')).toBeInTheDocument();
	});

	it('renders navigation items', async () => {
		const screen = render(TestHeader);

		await expect.element(screen.getByText('Dashboard')).toBeInTheDocument();
		await expect.element(screen.getByText('Projects')).toBeInTheDocument();
		await expect.element(screen.getByText('Tasks')).toBeInTheDocument();
		await expect.element(screen.getByText('Images')).toBeInTheDocument();
		await expect.element(screen.getByText('Annotations')).toBeInTheDocument();
	});

	it('has mobile navigation toggle', async () => {
		const screen = render(TestHeader);

		// Look for the screen reader text
		await expect.element(screen.getByText('Open sidebar')).toBeInTheDocument();
	});

	it('has settings button', async () => {
		const screen = render(TestHeader);

		await expect.element(screen.getByText('Settings')).toBeInTheDocument();
	});
});
