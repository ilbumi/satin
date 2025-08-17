import { describe, it, expect } from 'vitest';
import { render } from '$lib/test-utils';
import TestBreadcrumb from './TestBreadcrumb.svelte';

describe('Breadcrumb', () => {
	it('renders default breadcrumb', async () => {
		const screen = render(TestBreadcrumb);

		// Should show dashboard by default
		await expect.element(screen.getByText('Dashboard')).toBeVisible();
	});

	it('accepts custom breadcrumbs', async () => {
		const customBreadcrumbs = [
			{ label: 'Custom Home', href: '/', icon: '🏠' },
			{ label: 'Custom Page', icon: '📄' }
		];

		const screen = render(TestBreadcrumb, { customBreadcrumbs });

		await expect.element(screen.getByText('Custom Home')).toBeVisible();
		await expect.element(screen.getByText('Custom Page')).toBeVisible();
	});

	it('renders breadcrumb icons', async () => {
		const customBreadcrumbs = [
			{ label: 'Home', href: '/', icon: '🏠' },
			{ label: 'Projects', href: '/projects', icon: '📁' }
		];

		const screen = render(TestBreadcrumb, { customBreadcrumbs });

		await expect.element(screen.getByText('🏠')).toBeVisible();
		await expect.element(screen.getByText('📁')).toBeVisible();
	});
});
