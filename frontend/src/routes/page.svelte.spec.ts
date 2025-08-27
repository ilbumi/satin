import { page } from '@vitest/browser/context';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';

describe('/+page.svelte', () => {
	it('renders welcome heading', async () => {
		render(Page);

		const heading = page.getByRole('heading', { level: 1 });
		await expect.element(heading).toBeInTheDocument();
		await expect.element(heading).toHaveTextContent('Welcome to Satin');
	});

	it('renders description text', async () => {
		render(Page);

		const description = page.getByText(
			'A lightweight image annotation tool for ML data preparation'
		);
		await expect.element(description).toBeInTheDocument();
	});

	it('renders feature cards', async () => {
		render(Page);

		const uploadCard = page.getByText('Upload Images');
		const annotateCard = page.getByText('Annotate');
		const exportCardHeading = page.getByRole('heading', { name: 'Export' });

		await expect.element(uploadCard).toBeInTheDocument();
		await expect.element(annotateCard).toBeInTheDocument();
		await expect.element(exportCardHeading).toBeInTheDocument();
	});

	it('renders start annotating button with correct link', async () => {
		render(Page);

		const startButton = page.getByRole('link', { name: 'Start Annotating' });
		await expect.element(startButton).toBeInTheDocument();
		await expect.element(startButton).toHaveAttribute('href', '/annotate');
	});
});
