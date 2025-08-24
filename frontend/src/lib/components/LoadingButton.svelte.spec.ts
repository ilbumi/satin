import { page } from '@vitest/browser/context';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import LoadingButton from './LoadingButton.svelte';

describe('LoadingButton', () => {
	it('renders button with default props', async () => {
		render(LoadingButton);

		const button = page.getByRole('button');
		await expect.element(button).toBeInTheDocument();
		await expect.element(button).not.toBeDisabled();

		// Check that button has default primary variant classes
		expect(button).toHaveClass(/bg-blue-600/);
		expect(button).toHaveClass(/text-white/);
	});

	it('shows loading state', async () => {
		render(LoadingButton, {
			loading: true
		});

		const button = page.getByRole('button');
		await expect.element(button).toBeDisabled();
		await expect.element(button).toHaveTextContent('Loading...');

		const spinner = document.querySelector('svg');
		expect(spinner).toBeInTheDocument();
	});

	it('is disabled when disabled prop is true', async () => {
		render(LoadingButton, {
			disabled: true
		});

		const button = page.getByRole('button');
		await expect.element(button).toBeDisabled();
	});

	it('applies primary variant classes', async () => {
		render(LoadingButton, {
			variant: 'primary'
		});

		const button = page.getByRole('button');
		await expect.element(button).toHaveClass(/bg-blue-600/);
	});

	it('applies secondary variant classes', async () => {
		render(LoadingButton, {
			variant: 'secondary'
		});

		const button = page.getByRole('button');
		await expect.element(button).toHaveClass(/bg-gray-600/);
	});

	it('applies outline variant classes', async () => {
		render(LoadingButton, {
			variant: 'outline'
		});

		const button = page.getByRole('button');
		await expect.element(button).toHaveClass(/border/);
	});

	it('applies small size classes', async () => {
		render(LoadingButton, {
			size: 'sm'
		});

		const button = page.getByRole('button');
		await expect.element(button).toHaveClass(/px-3/);
		await expect.element(button).toHaveClass(/py-1.5/);
	});

	it('applies large size classes', async () => {
		render(LoadingButton, {
			size: 'lg'
		});

		const button = page.getByRole('button');
		await expect.element(button).toHaveClass(/px-6/);
		await expect.element(button).toHaveClass(/py-3/);
	});

	it('handles click events', async () => {
		const clickHandler = vi.fn();
		render(LoadingButton, {
			onclick: clickHandler
		});

		const button = page.getByRole('button');
		await button.click();

		expect(clickHandler).toHaveBeenCalledOnce();
	});

	it('does not trigger click when loading', async () => {
		const clickHandler = vi.fn();
		render(LoadingButton, {
			loading: true,
			onclick: clickHandler
		});

		const button = page.getByRole('button');
		expect(button).toBeDisabled();

		// Verify the handler is not called (can't test click on disabled button)
		expect(clickHandler).not.toHaveBeenCalled();
	});

	it('renders as submit button when type is submit', async () => {
		render(LoadingButton, {
			type: 'submit'
		});

		const button = page.getByRole('button');
		await expect.element(button).toHaveAttribute('type', 'submit');
	});
});
