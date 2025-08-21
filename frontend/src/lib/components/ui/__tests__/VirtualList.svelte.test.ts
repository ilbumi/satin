import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/svelte';
import VirtualList from '../VirtualList.svelte';

interface TestItem {
	id: string;
	name: string;
}

describe('VirtualList', () => {
	let testItems: TestItem[];
	let defaultProps: {
		items: TestItem[];
		itemHeight: number;
		containerHeight: number;
		keyExtractor: (item: TestItem, index: number) => string;
		children: ReturnType<typeof vi.fn>;
	};

	beforeEach(() => {
		testItems = Array.from({ length: 100 }, (_, i) => ({
			id: `item-${i}`,
			name: `Item ${i}`
		}));

		defaultProps = {
			items: testItems.slice(0, 10),
			itemHeight: 50,
			containerHeight: 300,
			keyExtractor: (item: TestItem, _index: number) => item.id,
			children: vi.fn()
		};

		// Mock ResizeObserver
		globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
			observe: vi.fn(),
			disconnect: vi.fn(),
			unobserve: vi.fn()
		}));

		// Mock scrollTo methods
		window.HTMLElement.prototype.scrollTo = vi.fn();
		window.HTMLElement.prototype.addEventListener = vi.fn();
		window.HTMLElement.prototype.removeEventListener = vi.fn();
	});

	describe('rendering', () => {
		it('should render virtual list container', () => {
			const { container } = render(VirtualList<TestItem>, { props: defaultProps });
			const virtualContainer = container.querySelector('.virtual-list-container');
			expect(virtualContainer).toBeInTheDocument();
		});

		it('should apply correct container height', () => {
			const { container } = render(VirtualList<TestItem>, {
				props: { ...defaultProps, containerHeight: 400 }
			});
			const virtualContainer = container.querySelector('.virtual-list-container') as HTMLElement;
			expect(virtualContainer.style.height).toBe('400px');
		});

		it('should render scroller with correct total height', () => {
			const items = testItems.slice(0, 20); // 20 items
			const itemHeight = 50;

			const { container } = render(VirtualList<TestItem>, {
				props: { ...defaultProps, items, itemHeight }
			});

			const totalHeightContainer = container.querySelector('div[style*="height: 1000px"]');
			expect(totalHeightContainer).toBeInTheDocument();
		});
	});

	describe('virtualization', () => {
		it('should only render visible items plus overscan', () => {
			const items = testItems.slice(0, 50); // 50 items
			const itemHeight = 50;
			const containerHeight = 300; // Can show 6 items
			const overscan = 3;

			render(VirtualList<TestItem>, {
				props: {
					...defaultProps,
					items,
					itemHeight,
					containerHeight,
					overscan
				}
			});

			// Should render visible items (6) + overscan before (3) + overscan after (3)
			// But limited by actual item count at the beginning
			expect(defaultProps.children).toHaveBeenCalled();
		});

		it('should handle empty items array', () => {
			const { container } = render(VirtualList<TestItem>, {
				props: { ...defaultProps, items: [] }
			});

			const virtualContainer = container.querySelector('.virtual-list-container');
			expect(virtualContainer).toBeInTheDocument();

			// Total height should be 0
			const totalHeightContainer = container.querySelector('div[style*="height: 0px"]');
			expect(totalHeightContainer).toBeInTheDocument();
		});

		it('should handle single item', () => {
			const singleItem = [testItems[0]];
			const { container } = render(VirtualList<TestItem>, {
				props: { ...defaultProps, items: singleItem }
			});

			// Total height should be 1 * itemHeight = 50px
			const totalHeightContainer = container.querySelector('div[style*="height: 50px"]');
			expect(totalHeightContainer).toBeInTheDocument();
		});
	});

	describe('props', () => {
		it('should use provided keyExtractor function', () => {
			const mockKeyExtractor = vi.fn((item: TestItem, index: number) => `key-${item.id}-${index}`);

			render(VirtualList<TestItem>, {
				props: { ...defaultProps, keyExtractor: mockKeyExtractor }
			});

			// keyExtractor should be called for visible items
			expect(mockKeyExtractor).toHaveBeenCalled();
		});

		it('should use provided children render function', () => {
			const mockChildren = vi.fn();

			render(VirtualList<TestItem>, {
				props: { ...defaultProps, children: mockChildren }
			});

			// children function should be called for visible items
			expect(mockChildren).toHaveBeenCalled();
		});

		it('should handle different item heights', () => {
			const customItemHeight = 100;
			const items = testItems.slice(0, 10);
			const expectedTotalHeight = items.length * customItemHeight; // 1000px

			const { container } = render(VirtualList<TestItem>, {
				props: { ...defaultProps, items, itemHeight: customItemHeight }
			});

			const totalHeightContainer = container.querySelector(
				`div[style*="height: ${expectedTotalHeight}px"]`
			);
			expect(totalHeightContainer).toBeInTheDocument();
		});

		it('should handle custom overscan value', () => {
			const customOverscan = 10;

			render(VirtualList<TestItem>, {
				props: { ...defaultProps, overscan: customOverscan }
			});

			// Component should render without errors
			expect(defaultProps.children).toHaveBeenCalled();
		});
	});

	describe('scroll behavior', () => {
		it('should handle scroll events', () => {
			const { container } = render(VirtualList<TestItem>, { props: defaultProps });

			const scroller = container.querySelector('.virtual-list-scroller') as HTMLElement;
			expect(scroller).toBeInTheDocument();

			// Simulate scroll event
			const scrollEvent = new Event('scroll');
			scroller.dispatchEvent(scrollEvent);

			// Should not throw error
			expect(scroller).toBeInTheDocument();
		});

		it('should position items correctly', () => {
			const items = testItems.slice(0, 10);
			const itemHeight = 50;

			const { container } = render(VirtualList<TestItem>, {
				props: { ...defaultProps, items, itemHeight }
			});

			// Check if virtual list items have correct positioning
			const virtualItems = container.querySelectorAll('.virtual-list-item');

			// Should have some items rendered
			expect(virtualItems.length).toBeGreaterThan(0);

			// Items should have absolute positioning
			virtualItems.forEach((item) => {
				const style = (item as HTMLElement).style;
				expect(style.position).toBe('absolute');
				expect(style.width).toBe('100%');
				expect(style.height).toBe(`${itemHeight}px`);
			});
		});
	});

	describe('accessibility', () => {
		it('should maintain proper DOM structure for screen readers', () => {
			const { container } = render(VirtualList<TestItem>, { props: defaultProps });

			const virtualContainer = container.querySelector('.virtual-list-container');
			const scroller = container.querySelector('.virtual-list-scroller');

			expect(virtualContainer).toBeInTheDocument();
			expect(scroller).toBeInTheDocument();
			expect(scroller?.parentElement).toBe(virtualContainer);
		});

		it('should preserve item order in DOM', () => {
			const items = testItems.slice(0, 5);

			render(VirtualList<TestItem>, {
				props: { ...defaultProps, items }
			});

			// Children should be called in order for visible items
			expect(defaultProps.children).toHaveBeenCalled();
		});
	});

	describe('cleanup', () => {
		it('should clean up event listeners on unmount', () => {
			const removeEventListenerSpy = vi.spyOn(window.HTMLElement.prototype, 'removeEventListener');

			const { unmount } = render(VirtualList<TestItem>, { props: defaultProps });

			unmount();

			// Should call removeEventListener for scroll event
			expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
		});
	});
});
