import { describe, it, expect } from 'vitest';
import { render } from '$lib/test-utils';
import Spinner from '../Spinner.svelte';

describe('Spinner', () => {
	it('renders with default props', () => {
		const { container } = render(Spinner);

		const spinner = container.querySelector('svg');
		expect(spinner).toBeVisible();
		expect(spinner).toHaveClass('animate-spin');
		expect(spinner).toHaveClass('h-6 w-6'); // medium size
		expect(spinner).toHaveClass('text-blue-600'); // default color
	});

	it('renders different sizes correctly', () => {
		const { container: xs } = render(Spinner, { size: 'xs' });
		expect(xs.querySelector('svg')).toHaveClass('h-3 w-3');

		const { container: sm } = render(Spinner, { size: 'sm' });
		expect(sm.querySelector('svg')).toHaveClass('h-4 w-4');

		const { container: md } = render(Spinner, { size: 'md' });
		expect(md.querySelector('svg')).toHaveClass('h-6 w-6');

		const { container: lg } = render(Spinner, { size: 'lg' });
		expect(lg.querySelector('svg')).toHaveClass('h-8 w-8');

		const { container: xl } = render(Spinner, { size: 'xl' });
		expect(xl.querySelector('svg')).toHaveClass('h-12 w-12');
	});

	it('renders with custom color', () => {
		const { container } = render(Spinner, { color: 'text-red-500' });

		const spinner = container.querySelector('svg');
		expect(spinner).toHaveClass('text-red-500');
	});

	it('renders with custom class', () => {
		const { container } = render(Spinner, { class: 'custom-spinner' });

		const spinner = container.querySelector('svg');
		expect(spinner).toHaveClass('custom-spinner');
	});

	it('has correct accessibility attributes', () => {
		const { container } = render(Spinner, { ariaLabel: 'Custom loading message' });

		const spinner = container.querySelector('svg');
		expect(spinner).toHaveAttribute('aria-label', 'Custom loading message');
		expect(spinner).toHaveAttribute('role', 'status');
	});

	it('has default aria-label', () => {
		const { container } = render(Spinner);

		const spinner = container.querySelector('svg');
		expect(spinner).toHaveAttribute('aria-label', 'Loading');
	});

	it('has spinning animation', () => {
		const { container } = render(Spinner);

		const spinner = container.querySelector('svg');
		expect(spinner).toHaveClass('animate-spin');
	});
});
