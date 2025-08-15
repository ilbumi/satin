import { describe, it, expect, vi } from 'vitest';
import { render } from '$lib/test-utils';
import Select from '../Select.svelte';
import type { SelectOption } from '../Select.svelte';

const mockOptions: SelectOption[] = [
	{ value: 'option1', label: 'Option 1' },
	{ value: 'option2', label: 'Option 2' },
	{ value: 'option3', label: 'Option 3', disabled: true }
];

describe('Select', () => {
	it('renders with default props', async () => {
		const screen = render(Select, { options: mockOptions });

		const select = screen.getByRole('combobox');
		await expect.element(select).toBeVisible();
		await expect.element(select).not.toBeDisabled();
		await expect.element(select).not.toHaveAttribute('required');
	});

	it('renders options correctly', async () => {
		const screen = render(Select, { options: mockOptions });

		const options = screen.container.querySelectorAll('option');

		// Should have 3 options
		expect(options).toHaveLength(3);
		await expect.element(options[0]).toHaveTextContent('Option 1');
		await expect.element(options[1]).toHaveTextContent('Option 2');
		await expect.element(options[2]).toHaveTextContent('Option 3');
	});

	it('renders with placeholder', async () => {
		const screen = render(Select, {
			options: mockOptions,
			placeholder: 'Choose an option'
		});

		const options = screen.container.querySelectorAll('option');

		// Should have 4 options (3 + placeholder)
		expect(options).toHaveLength(4);
		await expect.element(options[0]).toHaveTextContent('Choose an option');
		await expect.element(options[0]).toHaveValue('');
	});

	it('renders with label', async () => {
		const screen = render(Select, {
			options: mockOptions,
			label: 'Select Option',
			id: 'test-select'
		});

		await expect.element(screen.getByText('Select Option')).toBeVisible();
		await expect.element(screen.getByLabelText('Select Option')).toBeVisible();
	});

	it('renders required indicator', async () => {
		const screen = render(Select, {
			options: mockOptions,
			label: 'Select Option',
			required: true
		});

		await expect.element(screen.getByText('*')).toBeVisible();
	});

	it('renders helper text', async () => {
		const screen = render(Select, {
			options: mockOptions,
			helperText: 'Please select an option'
		});

		await expect.element(screen.getByText('Please select an option')).toBeVisible();
	});

	it('renders error state', async () => {
		const screen = render(Select, {
			options: mockOptions,
			state: 'error',
			errorText: 'This field is required'
		});

		const select = screen.getByRole('combobox');
		await expect.element(select).toHaveAttribute('aria-invalid', 'true');
		await expect.element(select).toHaveClass('ring-red-300');
		await expect.element(screen.getByText('This field is required')).toBeVisible();
	});

	it('renders success state', async () => {
		const screen = render(Select, {
			options: mockOptions,
			state: 'success'
		});

		const select = screen.getByRole('combobox');
		await expect.element(select).toHaveClass('ring-green-300');
	});

	it('handles disabled state', async () => {
		const screen = render(Select, {
			options: mockOptions,
			disabled: true
		});

		const select = screen.getByRole('combobox');
		await expect.element(select).toBeDisabled();
	});

	it('handles disabled options', async () => {
		const screen = render(Select, { options: mockOptions });

		const disabledOption = screen.container.querySelector('option[value="option3"]');
		await expect.element(disabledOption).toBeDisabled();
	});

	it('calls onchange when selection changes', async () => {
		const onchange = vi.fn();
		const screen = render(Select, {
			options: mockOptions,
			onchange
		});

		const select = screen.getByRole('combobox');
		// Set the select value directly
		await select.selectOptions('option2');

		expect(onchange).toHaveBeenCalled();
	});

	it('renders with selected value', async () => {
		const screen = render(Select, {
			options: mockOptions,
			value: 'option2'
		});

		const select = screen.getByRole('combobox');
		await expect.element(select).toHaveValue('option2');
	});

	it('has correct accessibility attributes', async () => {
		const screen = render(Select, {
			options: mockOptions,
			label: 'Select Option',
			helperText: 'Please select an option',
			state: 'error',
			errorText: 'Required field'
		});

		const select = screen.getByRole('combobox');
		await expect.element(select).toHaveAttribute('aria-describedby');
		await expect.element(select).toHaveAttribute('aria-invalid', 'true');
	});

	it('renders with custom class', async () => {
		const screen = render(Select, {
			options: mockOptions,
			class: 'custom-select'
		});

		const select = screen.getByRole('combobox');
		await expect.element(select).toHaveClass('custom-select');
	});
});
