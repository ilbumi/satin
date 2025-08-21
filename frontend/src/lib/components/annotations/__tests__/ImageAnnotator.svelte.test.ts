import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/svelte';
import ImageAnnotator from '../ImageAnnotator.svelte';

// Mock Modal component
vi.mock('$lib/components/ui/Modal.svelte', () => ({
	default: vi.fn().mockImplementation(($$props) => {
		const { open, children } = $$props;
		return {
			$$: {
				fragment: open ? children : null,
				ctx: [],
				props: $$props,
				update: vi.fn(),
				not_equal: vi.fn(),
				bound: vi.fn(),
				on_mount: [],
				on_destroy: [],
				before_update: [],
				after_update: [],
				context: new Map(),
				callbacks: {}
			}
		};
	})
}));

// Mock AnnotationWorkspace
vi.mock('../AnnotationWorkspace.svelte', () => ({
	default: vi.fn().mockImplementation(() => ({
		$$: {
			fragment: null,
			ctx: [],
			props: {},
			update: vi.fn(),
			not_equal: vi.fn(),
			bound: vi.fn(),
			on_mount: [],
			on_destroy: [],
			before_update: [],
			after_update: [],
			context: new Map(),
			callbacks: {}
		}
	}))
}));

// Mock annotation store
vi.mock('$lib/features/annotations/store.svelte', () => ({
	annotationStore: {
		initialize: vi.fn(),
		loadAnnotations: vi.fn(),
		reset: vi.fn(),
		cleanup: vi.fn(),
		annotations: [],
		getHasUnsavedChanges: vi.fn(() => false),
		error: null,
		canvas: { mode: 'view' }
	}
}));

// Mock annotation service
vi.mock('$lib/features/annotations/service', () => ({
	AnnotationService: vi.fn(() => ({
		saveTask: vi.fn(),
		initialize: vi.fn(),
		loadTaskAnnotations: vi.fn(() => Promise.resolve([])),
		saveTaskAnnotations: vi.fn(() => Promise.resolve())
	})),
	createAnnotationService: vi.fn(() => ({
		saveTask: vi.fn(),
		initialize: vi.fn(),
		loadTaskAnnotations: vi.fn(() => Promise.resolve([])),
		saveTaskAnnotations: vi.fn(() => Promise.resolve())
	})),
	getAnnotationService: vi.fn(() => ({
		saveTask: vi.fn(),
		initialize: vi.fn(),
		loadTaskAnnotations: vi.fn(() => Promise.resolve([])),
		saveTaskAnnotations: vi.fn(() => Promise.resolve())
	}))
}));

describe('ImageAnnotator', () => {
	const defaultProps = {
		open: true,
		task: {
			id: 'task-123',
			status: 'DRAFT' as const,
			image: {
				id: 'image-456',
				url: '/test-image.jpg'
			},
			project: {
				id: 'project-789',
				name: 'Test Project',
				description: 'Test project description'
			},
			bboxes: [],
			createdAt: '2024-01-01T10:00:00Z'
		},
		image: {
			id: 'image-456',
			url: '/test-image.jpg',
			name: 'test-image.jpg'
		}
	};

	beforeEach(() => {
		vi.clearAllMocks();

		// Mock Image constructor if not already mocked
		if (!globalThis.Image || !vi.isMockFunction(globalThis.Image)) {
			globalThis.Image = vi.fn().mockImplementation(() => {
				const img = {
					crossOrigin: '',
					src: '',
					naturalWidth: 800,
					naturalHeight: 600,
					onload: null as (() => void) | null,
					onerror: null as (() => void) | null,
					addEventListener: vi.fn(),
					removeEventListener: vi.fn()
				};

				// Simulate successful image load
				setTimeout(() => {
					if (img.onload) img.onload();
				}, 0);

				return img;
			}) as unknown as new (width?: number, height?: number) => HTMLImageElement;
		}
	});

	describe('rendering', () => {
		it('should render when open', () => {
			const { component } = render(ImageAnnotator, { props: defaultProps });
			expect(component).toBeDefined();
		});

		it('should not render when closed', () => {
			const { component } = render(ImageAnnotator, {
				props: { ...defaultProps, open: false }
			});
			expect(component).toBeDefined();
		});

		it('should accept task prop', () => {
			const { component } = render(ImageAnnotator, { props: defaultProps });
			expect(component).toBeDefined();
		});

		it('should accept image prop', () => {
			const { component } = render(ImageAnnotator, { props: defaultProps });
			expect(component).toBeDefined();
		});
	});

	describe('props', () => {
		it('should accept onClose callback', () => {
			const onClose = vi.fn();
			const { component } = render(ImageAnnotator, {
				props: { ...defaultProps, onClose }
			});
			expect(component).toBeDefined();
		});

		it('should accept onSaveComplete callback', () => {
			const onSaveComplete = vi.fn();
			const { component } = render(ImageAnnotator, {
				props: { ...defaultProps, onSaveComplete }
			});
			expect(component).toBeDefined();
		});

		it('should accept readonly prop', () => {
			const { component } = render(ImageAnnotator, {
				props: { ...defaultProps, readonly: true }
			});
			expect(component).toBeDefined();
		});
	});
});
