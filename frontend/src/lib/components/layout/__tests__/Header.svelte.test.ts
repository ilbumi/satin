import { describe, it, expect } from 'vitest';
import { render } from '$lib/test-utils';
import TestHeader from './TestHeader.svelte';

describe('Header', () => {
	it('renders the app title and logo', async () => {
		const screen = render(TestHeader);
		await expect.element(screen.getByText('Satin')).toBeVisible();
		await expect.element(screen.getByText('🎨')).toBeVisible();
	});

	it('renders navigation items', async () => {
		const screen = render(TestHeader);

		await expect.element(screen.getByText('Dashboard')).toBeVisible();
		await expect.element(screen.getByText('Projects')).toBeVisible();
		await expect.element(screen.getByText('Tasks')).toBeVisible();
		await expect.element(screen.getByText('Images')).toBeVisible();
		await expect.element(screen.getByText('Annotations')).toBeVisible();
	});

	it('has mobile navigation toggle', async () => {
		const screen = render(TestHeader);

		// Look for the screen reader text
		await expect.element(screen.getByText('Open sidebar')).toBeVisible();
	});
});
