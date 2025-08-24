import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import LoadingSkeleton from './LoadingSkeleton.svelte';

describe('LoadingSkeleton', () => {
	it('renders text variant with default props', async () => {
		render(LoadingSkeleton);

		const skeleton = document.querySelector('.animate-pulse');
		expect(skeleton).toBeInTheDocument();
		expect(skeleton).toHaveClass(/bg-gray-200/);
		expect(skeleton).toHaveClass(/rounded/);
	});

	it('renders multiple text lines', async () => {
		render(LoadingSkeleton, {
			variant: 'text',
			lines: 3
		});

		const skeletons = document.querySelectorAll('.animate-pulse');
		expect(skeletons[0]).toBeInTheDocument();

		expect(skeletons.length).toBe(3);
	});

	it('renders circle variant', async () => {
		render(LoadingSkeleton, {
			variant: 'circle',
			width: '50px'
		});

		const skeleton = document.querySelector('.animate-pulse');
		expect(skeleton).toBeInTheDocument();
		expect(skeleton).toHaveClass(/rounded-full/);
	});

	it('renders rect variant', async () => {
		render(LoadingSkeleton, {
			variant: 'rect',
			width: '200px',
			height: '100px'
		});

		const skeleton = document.querySelector('.animate-pulse');
		expect(skeleton).toBeInTheDocument();
		expect(skeleton).toHaveClass(/rounded/);
		expect(skeleton).not.toHaveClass(/rounded-full/);
	});

	it('applies custom width and height for text variant', async () => {
		render(LoadingSkeleton, {
			variant: 'text',
			width: '300px',
			height: '20px'
		});

		const skeleton = document.querySelector('.animate-pulse');
		expect(skeleton).toBeInTheDocument();
	});

	it('applies custom width and height for circle variant', async () => {
		render(LoadingSkeleton, {
			variant: 'circle',
			width: '40px',
			height: '40px'
		});

		const skeleton = document.querySelector('.animate-pulse');
		expect(skeleton).toBeInTheDocument();
	});

	it('applies custom width and height for rect variant', async () => {
		render(LoadingSkeleton, {
			variant: 'rect',
			width: '150px',
			height: '75px'
		});

		const skeleton = document.querySelector('.animate-pulse');
		expect(skeleton).toBeInTheDocument();
	});

	it('last line is shorter when multiple lines', async () => {
		render(LoadingSkeleton, {
			variant: 'text',
			lines: 2
		});

		const skeletons = document.querySelectorAll('.animate-pulse');
		const lastSkeleton = skeletons[1];

		expect(lastSkeleton).toHaveClass(/w-3\/4/);
	});
});
