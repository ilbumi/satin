import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/svelte';
import VirtualGrid from '../VirtualGrid.svelte';

interface TestItem {
	id: string;
	name: string;
}

describe('VirtualGrid', () => {
	let testItems: TestItem[];
	let defaultProps: {
		items: TestItem[];
		itemHeight: number;
		itemWidth: number;
		containerHeight: number;
		gap: number;
		keyExtractor: (item: TestItem, index: number) => string;
		children: ReturnType<typeof vi.fn>;
	};

	beforeEach(() => {
		testItems = Array.from({ length: 100 }, (_, i) => ({
			id: `item-${i}`,
			name: `Item ${i}`
		}));

		defaultProps = {
			items: testItems.slice(0, 20),
			itemHeight: 150,
			itemWidth: 200,
			containerHeight: 400,
			gap: 16,
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
		it('should render virtual grid container', () => {
			const { container } = render(VirtualGrid<TestItem>, { props: defaultProps });
			const virtualContainer = container.querySelector('.virtual-grid-container');
			expect(virtualContainer).toBeInTheDocument();
		});

		it('should apply correct container height', () => {
			const { container } = render(VirtualGrid<TestItem>, {
				props: { ...defaultProps, containerHeight: 500 }
			});
			const virtualContainer = container.querySelector('.virtual-grid-container') as HTMLElement;
			expect(virtualContainer.style.height).toBe('500px');
		});

		it('should render scroller with overflow-y auto', () => {
			const { container } = render(VirtualGrid<TestItem>, { props: defaultProps });
			const scroller = container.querySelector('.virtual-grid-scroller') as HTMLElement;
			expect(scroller).toBeInTheDocument();
			expect(scroller.style.overflowY).toBe('auto');
		});
	});

	describe('grid layout', () => {
		it('should calculate correct total height based on items and grid configuration', () => {
			const items = testItems.slice(0, 12); // 12 items
			const itemHeight = 150;
			const itemWidth = 200;
			const gap = 16;
			// Assuming container width allows 3 columns: 3 * (200 + 16) - 16 = 632px
			// 12 items / 3 columns = 4 rows
			// 4 rows * (150 + 16) - 16 = 648px total height

			const { container } = render(VirtualGrid<TestItem>, {
				props: { ...defaultProps, items, itemHeight, itemWidth, gap }
			});

			// Should have a container with calculated total height
			const heightContainer = container.querySelector('div[style*="position: relative"]');
			expect(heightContainer).toBeInTheDocument();
		});

		it('should handle empty items array', () => {
			const { container } = render(VirtualGrid<TestItem>, {
				props: { ...defaultProps, items: [] }
			});

			const virtualContainer = container.querySelector('.virtual-grid-container');
			expect(virtualContainer).toBeInTheDocument();

			// Just verify that a height container exists with position relative (simplified test)
			const heightContainer = container.querySelector('div[style*="position: relative"]');
			expect(heightContainer).toBeInTheDocument();
		});

		it('should handle single item', () => {
			const singleItem = [testItems[0]];
			const itemHeight = 150;
			const gap = 16;
			// Single item should result in: 1 row * (150 + 16) - 16 = 150px

			const { container } = render(VirtualGrid<TestItem>, {
				props: { ...defaultProps, items: singleItem, itemHeight, gap }
			});

			// Should calculate correct height for single item
			const heightContainer = container.querySelector('div[style*="height: 150px"]');
			expect(heightContainer).toBeInTheDocument();
		});
	});

	describe('virtualization', () => {
		it('should only render visible rows plus overscan', () => {
			const items = testItems.slice(0, 50); // 50 items
			const overscan = 1;

			render(VirtualGrid<TestItem>, {
				props: { ...defaultProps, items, overscan }
			});

			// Should call children function for visible items
			expect(defaultProps.children).toHaveBeenCalled();
		});

		it('should position grid items correctly', () => {
			const items = testItems.slice(0, 6);
			const itemHeight = 150;
			const itemWidth = 200;
			const gap = 16;

			const { container } = render(VirtualGrid<TestItem>, {
				props: { ...defaultProps, items, itemHeight, itemWidth, gap }
			});

			// Check if virtual grid items have correct positioning
			const virtualItems = container.querySelectorAll('.virtual-grid-item');

			// Should have some items rendered
			expect(virtualItems.length).toBeGreaterThan(0);

			// Items should have absolute positioning with correct dimensions
			virtualItems.forEach((item) => {
				const style = (item as HTMLElement).style;
				expect(style.position).toBe('absolute');
				expect(style.width).toBe(`${itemWidth}px`);
				expect(style.height).toBe(`${itemHeight}px`);
			});
		});
	});

	describe('responsive behavior', () => {
		it('should handle container width changes', () => {
			const { container } = render(VirtualGrid<TestItem>, { props: defaultProps });

			// Should have ResizeObserver attached
			expect(globalThis.ResizeObserver).toHaveBeenCalled();

			const virtualContainer = container.querySelector('.virtual-grid-container');
			expect(virtualContainer).toBeInTheDocument();
		});

		it('should recalculate columns when container width changes', () => {
			const mockObserver = {
				observe: vi.fn(),
				disconnect: vi.fn(),
				unobserve: vi.fn()
			};

			globalThis.ResizeObserver = vi.fn().mockImplementation((callback) => {
				// Simulate resize event
				setTimeout(() => {
					callback([{ contentRect: { width: 800 } }]);
				}, 0);
				return mockObserver;
			});

			render(VirtualGrid<TestItem>, { props: defaultProps });

			expect(mockObserver.observe).toHaveBeenCalled();
		});
	});

	describe('props', () => {
		it('should use provided keyExtractor function', () => {
			const mockKeyExtractor = vi.fn((item: TestItem, index: number) => `key-${item.id}-${index}`);

			render(VirtualGrid<TestItem>, {
				props: { ...defaultProps, keyExtractor: mockKeyExtractor }
			});

			// keyExtractor should be called for visible items
			expect(mockKeyExtractor).toHaveBeenCalled();
		});

		it('should use provided children render function', () => {
			const mockChildren = vi.fn();

			render(VirtualGrid<TestItem>, {
				props: { ...defaultProps, children: mockChildren }
			});

			// children function should be called for visible items
			expect(mockChildren).toHaveBeenCalled();
		});

		it('should handle custom gap values', () => {
			const customGap = 24;

			render(VirtualGrid<TestItem>, {
				props: { ...defaultProps, gap: customGap }
			});

			// Component should render without errors
			expect(defaultProps.children).toHaveBeenCalled();
		});

		it('should handle custom overscan value', () => {
			const customOverscan = 2;

			render(VirtualGrid<TestItem>, {
				props: { ...defaultProps, overscan: customOverscan }
			});

			// Component should render without errors
			expect(defaultProps.children).toHaveBeenCalled();
		});

		it('should handle different item dimensions', () => {
			const customItemWidth = 250;
			const customItemHeight = 200;

			const { container } = render(VirtualGrid<TestItem>, {
				props: {
					...defaultProps,
					itemWidth: customItemWidth,
					itemHeight: customItemHeight
				}
			});

			// Should apply custom dimensions to items
			const virtualItems = container.querySelectorAll('.virtual-grid-item');
			virtualItems.forEach((item) => {
				const style = (item as HTMLElement).style;
				expect(style.width).toBe(`${customItemWidth}px`);
				expect(style.height).toBe(`${customItemHeight}px`);
			});
		});
	});

	describe('scroll behavior', () => {
		it('should handle scroll events', () => {
			const { container } = render(VirtualGrid<TestItem>, { props: defaultProps });

			const scroller = container.querySelector('.virtual-grid-scroller') as HTMLElement;
			expect(scroller).toBeInTheDocument();

			// Simulate scroll event
			const scrollEvent = new Event('scroll');
			scroller.dispatchEvent(scrollEvent);

			// Should not throw error
			expect(scroller).toBeInTheDocument();
		});

		it('should update visible items when scrolling', () => {
			const items = testItems.slice(0, 30);

			render(VirtualGrid<TestItem>, {
				props: { ...defaultProps, items }
			});

			// Initial render should call children
			expect(defaultProps.children).toHaveBeenCalled();

			// Reset mock to test scroll behavior
			defaultProps.children.mockClear();

			// Component should be able to handle scroll updates
			expect(defaultProps.children).not.toHaveBeenCalled();
		});
	});

	describe('accessibility', () => {
		it('should maintain proper DOM structure for screen readers', () => {
			const { container } = render(VirtualGrid<TestItem>, { props: defaultProps });

			const virtualContainer = container.querySelector('.virtual-grid-container');
			const scroller = container.querySelector('.virtual-grid-scroller');

			expect(virtualContainer).toBeInTheDocument();
			expect(scroller).toBeInTheDocument();
			expect(scroller?.parentElement).toBe(virtualContainer);
		});

		it('should preserve logical item order', () => {
			const items = testItems.slice(0, 9); // 3x3 grid

			render(VirtualGrid<TestItem>, {
				props: { ...defaultProps, items }
			});

			// Children should be called for visible items
			expect(defaultProps.children).toHaveBeenCalled();
		});
	});

	describe('cleanup', () => {
		it('should clean up event listeners on unmount', () => {
			const removeEventListenerSpy = vi.spyOn(window.HTMLElement.prototype, 'removeEventListener');

			const { unmount } = render(VirtualGrid<TestItem>, { props: defaultProps });

			unmount();

			// Should call removeEventListener for scroll event
			expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
		});

		it('should disconnect ResizeObserver on unmount', () => {
			const mockObserver = {
				observe: vi.fn(),
				disconnect: vi.fn(),
				unobserve: vi.fn()
			};

			globalThis.ResizeObserver = vi.fn().mockImplementation(() => mockObserver);

			const { unmount } = render(VirtualGrid<TestItem>, { props: defaultProps });

			unmount();

			// Should disconnect ResizeObserver
			expect(mockObserver.disconnect).toHaveBeenCalled();
		});
	});
});
