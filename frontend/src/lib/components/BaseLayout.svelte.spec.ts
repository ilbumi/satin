import { page } from '@vitest/browser/context';
import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import BaseLayout from './BaseLayout.svelte';

describe('BaseLayout', () => {
	it('renders header by default', async () => {
		render(BaseLayout);

		const heading = page.getByText('Satin');
		await expect.element(heading).toBeInTheDocument();

		const homeLink = page.getByText('Home');
		await expect.element(homeLink).toBeInTheDocument();

		const annotateLink = page.getByText('Annotate');
		await expect.element(annotateLink).toBeInTheDocument();
	});

	it('renders custom title', async () => {
		render(BaseLayout, {
			props: {
				title: 'Custom Title'
			},
			target: document.body
		});

		await expect.poll(() => document.title).toBe('Custom Title');
	});

	it('hides header when showHeader is false', async () => {
		render(BaseLayout, {
			props: {
				showHeader: false
			},
			target: document.body
		});

		const heading = page.getByText('Satin');
		await expect.element(heading).not.toBeInTheDocument();
	});

	it('shows footer when showFooter is true', async () => {
		render(BaseLayout, {
			props: {
				showFooter: true
			},
			target: document.body
		});

		const footer = page.getByText('© 2025 Satin - Image Annotation Tool');
		await expect.element(footer).toBeInTheDocument();
	});
});
