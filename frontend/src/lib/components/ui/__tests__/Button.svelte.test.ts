import { describe, it, expect, vi } from 'vitest';
import { render } from '$lib/test-utils';
import TestButton from './TestButton.svelte';

describe('Button', () => {
	it('renders with default props', async () => {
		const screen = render(TestButton, {
			content: 'Click me'
		});

		const button = screen.getByRole('button');
		await expect.element(button).toBeVisible();
		await expect.element(button).toHaveTextContent('Click me');
		await expect.element(button).not.toBeDisabled();
		await expect.element(button).toHaveClass('bg-blue-600'); // primary variant
	});

	it('renders primary variant correctly', async () => {
		const screen = render(TestButton, {
			variant: 'primary',
			content: 'Primary'
		});
		await expect.element(screen.getByRole('button')).toHaveClass('bg-blue-600');
	});

	it('renders secondary variant correctly', async () => {
		const screen = render(TestButton, {
			variant: 'secondary',
			content: 'Secondary'
		});
		await expect.element(screen.getByRole('button')).toHaveClass('bg-gray-100');
	});

	it('renders danger variant correctly', async () => {
		const screen = render(TestButton, {
			variant: 'danger',
			content: 'Danger'
		});
		await expect.element(screen.getByRole('button')).toHaveClass('bg-red-600');
	});

	it('renders ghost variant correctly', async () => {
		const screen = render(TestButton, {
			variant: 'ghost',
			content: 'Ghost'
		});
		await expect.element(screen.getByRole('button')).toHaveClass('bg-transparent');
	});

	it('renders small size correctly', async () => {
		const screen = render(TestButton, {
			size: 'sm',
			content: 'Small'
		});
		await expect.element(screen.getByRole('button')).toHaveClass('px-3 py-2 text-sm');
	});

	it('renders medium size correctly', async () => {
		const screen = render(TestButton, {
			size: 'md',
			content: 'Medium'
		});
		await expect.element(screen.getByRole('button')).toHaveClass('px-4 py-2 text-sm');
	});

	it('renders large size correctly', async () => {
		const screen = render(TestButton, {
			size: 'lg',
			content: 'Large'
		});
		await expect.element(screen.getByRole('button')).toHaveClass('px-6 py-3 text-base');
	});

	it('handles disabled state', async () => {
		const screen = render(TestButton, {
			disabled: true,
			content: 'Disabled'
		});

		const button = screen.getByRole('button');
		await expect.element(button).toBeDisabled();
	});

	it('handles loading state', async () => {
		const screen = render(TestButton, {
			loading: true,
			content: 'Loading'
		});

		const button = screen.getByRole('button');
		await expect.element(button).toBeDisabled();
		await expect.element(button).toHaveAttribute('aria-busy', 'true');
		await expect.element(button.getByRole('img')).toBeVisible(); // spinner icon
	});

	it('calls onclick handler when clicked', async () => {
		const onclick = vi.fn();
		const screen = render(TestButton, {
			onclick,
			content: 'Click me'
		});

		const button = screen.getByRole('button');
		await button.click();

		expect(onclick).toHaveBeenCalledOnce();
	});

	it('does not call onclick when disabled', async () => {
		const onclick = vi.fn();
		const screen = render(TestButton, {
			onclick,
			disabled: true,
			content: 'Disabled'
		});

		const button = screen.getByRole('button');
		// Use force: true to click disabled button
		await button.click({ force: true });

		expect(onclick).not.toHaveBeenCalled();
	});

	it('renders with custom class', async () => {
		const screen = render(TestButton, {
			class: 'custom-class',
			content: 'Custom'
		});

		const button = screen.getByRole('button');
		await expect.element(button).toHaveClass('custom-class');
	});

	it('has correct button type for button', async () => {
		const screen = render(TestButton, {
			type: 'button',
			content: 'Button'
		});
		await expect.element(screen.getByRole('button')).toHaveAttribute('type', 'button');
	});

	it('has correct button type for submit', async () => {
		const screen = render(TestButton, {
			type: 'submit',
			content: 'Submit'
		});
		await expect.element(screen.getByRole('button')).toHaveAttribute('type', 'submit');
	});
});
