import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import LoadingSpinner from './LoadingSpinner.svelte';

describe('LoadingSpinner', () => {
	it('renders spinner with default props', async () => {
		render(LoadingSpinner);

		const spinner = document.querySelector('svg');
		expect(spinner).toBeInTheDocument();
		expect(spinner).toHaveClass(/animate-spin/);
		expect(spinner).toHaveClass(/h-6/);
		expect(spinner).toHaveClass(/w-6/);
		expect(spinner).toHaveClass(/text-blue-600/);
	});

	it('applies small size classes', async () => {
		render(LoadingSpinner, {
			size: 'sm'
		});

		const spinner = document.querySelector('svg');
		expect(spinner).toHaveClass(/h-4/);
		expect(spinner).toHaveClass(/w-4/);
	});

	it('applies medium size classes', async () => {
		render(LoadingSpinner, {
			size: 'md'
		});

		const spinner = document.querySelector('svg');
		expect(spinner).toHaveClass(/h-6/);
		expect(spinner).toHaveClass(/w-6/);
	});

	it('applies large size classes', async () => {
		render(LoadingSpinner, {
			size: 'lg'
		});

		const spinner = document.querySelector('svg');
		expect(spinner).toHaveClass(/h-8/);
		expect(spinner).toHaveClass(/w-8/);
	});

	it('applies blue color classes', async () => {
		render(LoadingSpinner, {
			color: 'blue'
		});

		const spinner = document.querySelector('svg');
		expect(spinner).toHaveClass(/text-blue-600/);
	});

	it('applies gray color classes', async () => {
		render(LoadingSpinner, {
			color: 'gray'
		});

		const spinner = document.querySelector('svg');
		expect(spinner).toHaveClass(/text-gray-600/);
	});

	it('applies white color classes', async () => {
		render(LoadingSpinner, {
			color: 'white'
		});

		const spinner = document.querySelector('svg');
		expect(spinner).toHaveClass(/text-white/);
	});

	it('has correct SVG structure', async () => {
		render(LoadingSpinner);

		const svg = document.querySelector('svg');
		const circle = document.querySelector('circle');
		const path = document.querySelector('path');

		expect(circle).toBeInTheDocument();
		expect(path).toBeInTheDocument();
		expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
	});
});
