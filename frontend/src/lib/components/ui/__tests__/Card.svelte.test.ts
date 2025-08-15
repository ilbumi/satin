import { describe, it, expect } from 'vitest';
import { render } from '$lib/test-utils';
import TestCard from './TestCard.svelte';

describe('Card', () => {
	it('renders with default props', async () => {
		const screen = render(TestCard, {
			content: 'Card content'
		});

		const card = screen.container.firstChild as Element;
		await expect.element(card).toHaveClass('rounded-lg');
		await expect.element(card).toHaveClass('bg-white');
		await expect.element(card).toHaveClass('shadow-sm'); // default variant
		await expect.element(screen.getByText('Card content')).toBeVisible();
	});

	it('renders different variants correctly', async () => {
		const defaultCard = render(TestCard, {
			variant: 'default',
			content: 'Default card'
		});
		await expect
			.element(defaultCard.container.firstChild as Element)
			.toHaveClass('shadow-sm ring-1 ring-gray-200');

		const borderedCard = render(TestCard, {
			variant: 'bordered',
			content: 'Bordered card'
		});
		await expect
			.element(borderedCard.container.firstChild as Element)
			.toHaveClass('border border-gray-200');

		const elevatedCard = render(TestCard, {
			variant: 'elevated',
			content: 'Elevated card'
		});
		await expect
			.element(elevatedCard.container.firstChild as Element)
			.toHaveClass('shadow-lg ring-1 ring-black ring-opacity-5');
	});

	it('renders with header', async () => {
		const screen = render(TestCard, {
			headerContent: 'Card Header',
			content: 'Card content'
		});

		await expect.element(screen.getByText('Card Header')).toBeVisible();
		await expect.element(screen.getByText('Card content')).toBeVisible();
	});

	it('renders with footer', async () => {
		const screen = render(TestCard, {
			footerContent: 'Card Footer',
			content: 'Card content'
		});

		await expect.element(screen.getByText('Card Footer')).toBeVisible();
		await expect.element(screen.getByText('Card content')).toBeVisible();
	});

	it('renders with both header and footer', async () => {
		const screen = render(TestCard, {
			headerContent: 'Card Header',
			footerContent: 'Card Footer',
			content: 'Card content'
		});

		await expect.element(screen.getByText('Card Header')).toBeVisible();
		await expect.element(screen.getByText('Card content')).toBeVisible();
		await expect.element(screen.getByText('Card Footer')).toBeVisible();
	});

	it('renders with custom class', async () => {
		const screen = render(TestCard, {
			class: 'custom-card',
			content: 'Card content'
		});

		const card = screen.container.firstChild as Element;
		await expect.element(card).toHaveClass('custom-card');
	});

	it('has correct structure with header', async () => {
		const screen = render(TestCard, {
			headerContent: 'Header',
			content: 'Content'
		});

		const card = screen.container.firstChild as Element;
		const header = card?.querySelector('.border-b.border-gray-200.bg-gray-50.px-6.py-4');
		const body = card?.querySelector('.px-6.py-4');

		expect(header).not.toBeNull();
		expect(body).not.toBeNull();
	});

	it('has correct structure with footer', async () => {
		const screen = render(TestCard, {
			footerContent: 'Footer',
			content: 'Content'
		});

		const card = screen.container.firstChild as Element;
		const body = card?.querySelector('.px-6.py-4');
		const footer = card?.querySelector('.border-t.border-gray-200.bg-gray-50.px-6.py-3');

		expect(body).not.toBeNull();
		expect(footer).not.toBeNull();
	});

	it('applies overflow hidden for proper border radius', async () => {
		const screen = render(TestCard, {
			content: 'Content'
		});

		const card = screen.container.firstChild as Element;
		await expect.element(card).toHaveClass('overflow-hidden');
	});
});
