import { describe, it, expect, vi } from 'vitest';
import { render } from '$lib/test-utils';
import Input from '../Input.svelte';

describe('Input', () => {
	it('renders with default props', async () => {
		const screen = render(Input);

		const input = screen.getByRole('textbox');
		await expect.element(input).toBeVisible();
		await expect.element(input).toHaveAttribute('type', 'text');
		await expect.element(input).not.toBeDisabled();
		await expect.element(input).not.toHaveAttribute('required');
	});

	it('renders with label', async () => {
		const screen = render(Input, {
			label: 'Username',
			id: 'username'
		});

		await expect.element(screen.getByText('Username')).toBeVisible();
		await expect.element(screen.getByLabelText('Username')).toBeVisible();
	});

	it('renders required indicator', async () => {
		const screen = render(Input, {
			label: 'Username',
			required: true
		});

		await expect.element(screen.getByText('*')).toBeVisible();
	});

	it('renders helper text', async () => {
		const screen = render(Input, {
			helperText: 'Enter your username'
		});

		await expect.element(screen.getByText('Enter your username')).toBeVisible();
	});

	it('renders error state', async () => {
		const screen = render(Input, {
			state: 'error',
			errorText: 'This field is required'
		});

		const input = screen.getByRole('textbox');
		await expect.element(input).toHaveAttribute('aria-invalid', 'true');
		await expect.element(input).toHaveClass('ring-red-300');
		await expect.element(screen.getByText('This field is required')).toBeVisible();
	});

	it('renders success state', async () => {
		const screen = render(Input, {
			state: 'success'
		});

		const input = screen.getByRole('textbox');
		await expect.element(input).toHaveClass('ring-green-300');
	});

	it('handles different input types', async () => {
		const emailInput = render(Input, { type: 'email' });
		await expect.element(emailInput.getByRole('textbox')).toHaveAttribute('type', 'email');

		const passwordScreen = render(Input, { type: 'password' });
		const passwordInput = passwordScreen.container.querySelector('input[type="password"]');
		await expect.element(passwordInput).toBeVisible();
	});

	it('handles disabled state', async () => {
		const screen = render(Input, { disabled: true });

		const input = screen.getByRole('textbox');
		await expect.element(input).toBeDisabled();
	});

	it('handles readonly state', async () => {
		const screen = render(Input, { readonly: true });

		const input = screen.getByRole('textbox');
		await expect.element(input).toHaveAttribute('readonly');
	});

	it('calls event handlers', async () => {
		const oninput = vi.fn();
		const onchange = vi.fn();
		const onfocus = vi.fn();
		const onblur = vi.fn();

		const screen = render(Input, {
			oninput,
			onchange,
			onfocus,
			onblur
		});

		const input = screen.getByRole('textbox');

		await input.fill('test');
		expect(oninput).toHaveBeenCalled();
	});

	it('renders with initial value', async () => {
		const screen = render(Input, {
			value: 'initial'
		});

		const input = screen.getByRole('textbox');
		await expect.element(input).toHaveValue('initial');
	});

	it('renders with placeholder', async () => {
		const screen = render(Input, {
			placeholder: 'Enter text here'
		});

		const input = screen.getByRole('textbox');
		await expect.element(input).toHaveAttribute('placeholder', 'Enter text here');
	});

	it('has correct accessibility attributes', async () => {
		const screen = render(Input, {
			label: 'Username',
			helperText: 'Enter your username',
			state: 'error',
			errorText: 'Required field'
		});

		const input = screen.getByRole('textbox');
		await expect.element(input).toHaveAttribute('aria-describedby');
		await expect.element(input).toHaveAttribute('aria-invalid', 'true');
	});
});
