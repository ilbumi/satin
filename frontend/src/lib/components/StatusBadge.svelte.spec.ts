import { page } from '@vitest/browser/context';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import StatusBadge from './StatusBadge.svelte';

describe('StatusBadge', () => {
	it('renders new status badge', async () => {
		render(StatusBadge, {
			status: 'NEW'
		});

		const badge = document.querySelector('span.inline-flex.items-center');
		expect(badge).toBeInTheDocument();
		expect(badge).toHaveClass(/bg-blue-50/);
		expect(badge).toHaveClass(/text-blue-700/);
		expect(badge).toHaveClass(/border-blue-200/);

		const text = page.getByText('New');
		await expect.element(text).toBeInTheDocument();

		const icon = page.getByText('🆕');
		await expect.element(icon).toBeInTheDocument();
	});

	it('renders annotated status badge', async () => {
		render(StatusBadge, {
			status: 'ANNOTATED'
		});

		const badge = document.querySelector('span.inline-flex.items-center');
		expect(badge).toHaveClass(/bg-green-50/);
		expect(badge).toHaveClass(/text-green-700/);
		expect(badge).toHaveClass(/border-green-200/);

		const text = page.getByText('Annotated');
		await expect.element(text).toBeInTheDocument();

		const icon = page.getByText('✅');
		await expect.element(icon).toBeInTheDocument();
	});

	it('renders needs_reannotation status badge', async () => {
		render(StatusBadge, {
			status: 'NEEDS_REANNOTATION'
		});

		const badge = document.querySelector('span.inline-flex.items-center');
		expect(badge).toHaveClass(/bg-orange-50/);
		expect(badge).toHaveClass(/text-orange-700/);
		expect(badge).toHaveClass(/border-orange-200/);

		const text = page.getByText('Re-annotate');
		await expect.element(text).toBeInTheDocument();

		const icon = page.getByText('⚠️');
		await expect.element(icon).toBeInTheDocument();
	});

	it('renders small size badge', async () => {
		render(StatusBadge, {
			status: 'NEW',
			size: 'sm'
		});

		const badge = document.querySelector('span.inline-flex.items-center');
		expect(badge).toHaveClass(/px-2/);
		expect(badge).toHaveClass(/py-1/);
		expect(badge).toHaveClass(/text-xs/);

		// Small size should only show icon, not text
		const text = page.getByText('New');
		await expect.element(text).not.toBeInTheDocument();

		const icon = page.getByText('🆕');
		await expect.element(icon).toBeInTheDocument();
	});

	it('renders medium size badge', async () => {
		render(StatusBadge, {
			status: 'ANNOTATED',
			size: 'md'
		});

		const badge = document.querySelector('span.inline-flex.items-center');
		expect(badge).toHaveClass(/px-2\.5/);
		expect(badge).toHaveClass(/py-1\.5/);
		expect(badge).toHaveClass(/text-sm/);

		const text = page.getByText('Annotated');
		await expect.element(text).toBeInTheDocument();
	});

	it('renders large size badge', async () => {
		render(StatusBadge, {
			status: 'NEEDS_REANNOTATION',
			size: 'lg'
		});

		const badge = document.querySelector('span.inline-flex.items-center');
		expect(badge).toHaveClass(/px-3/);
		expect(badge).toHaveClass(/py-2/);
		expect(badge).toHaveClass(/text-base/);

		const text = page.getByText('Re-annotate');
		await expect.element(text).toBeInTheDocument();
	});

	it('has correct title attribute', async () => {
		render(StatusBadge, {
			status: 'ANNOTATED'
		});

		const badge = document.querySelector('span.inline-flex.items-center');
		expect(badge).toHaveAttribute('title', 'Annotated');
	});

	it('has aria-hidden on icon span', async () => {
		render(StatusBadge, {
			status: 'NEW'
		});

		const icon = document.querySelector('span[aria-hidden="true"]');
		expect(icon).toBeInTheDocument();
		expect(icon).toHaveTextContent('🆕');
	});
});
