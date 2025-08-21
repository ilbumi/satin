import { afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/svelte';

// Mock SvelteKit modules for client tests
vi.mock('$app/environment', () => ({
	browser: true,
	dev: true,
	building: false,
	version: '1.0.0'
}));

vi.mock('$app/navigation', () => ({
	beforeNavigate: vi.fn(),
	afterNavigate: vi.fn(),
	goto: vi.fn(),
	invalidate: vi.fn(),
	invalidateAll: vi.fn(),
	preloadData: vi.fn(),
	preloadCode: vi.fn(),
	onNavigate: vi.fn(),
	pushState: vi.fn(),
	replaceState: vi.fn()
}));

vi.mock('$app/state', () => ({
	page: {
		url: new URL('http://localhost:5173/'),
		params: {},
		route: { id: null },
		data: {},
		form: null,
		state: {}
	}
}));

vi.mock('$app/stores', () => ({
	page: {
		subscribe: vi.fn(() => vi.fn()),
		set: vi.fn(),
		update: vi.fn()
	},
	navigating: {
		subscribe: vi.fn(() => vi.fn()),
		set: vi.fn(),
		update: vi.fn()
	},
	updated: {
		subscribe: vi.fn(() => vi.fn()),
		set: vi.fn(),
		update: vi.fn()
	}
}));

// Make vi globally available
(globalThis as unknown as { vi: typeof vi }).vi = vi;

// Mock Image constructor for browser tests that need it
if (typeof globalThis.Image === 'undefined') {
	globalThis.Image = vi.fn(() => {
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

		// Simulate successful image load after a short delay
		setTimeout(() => {
			if (img.onload) {
				img.onload();
			}
		}, 0);

		return img;
	}) as unknown as () => HTMLImageElement;
}

beforeAll(() => {
	// Mock console methods to suppress warnings and logs in tests
	const originalError = console.error;
	const originalWarn = console.warn;
	const originalLog = console.log;

	vi.spyOn(console, 'error').mockImplementation((...args) => {
		// Only suppress service-related errors in test scenarios, allow test errors through
		const message = args[0]?.toString() || '';
		if (
			message.includes('Store.') ||
			message.includes('Service.') ||
			(message.includes('Failed to fetch') && !message.includes('toPromise')) ||
			message.includes('GraphQL Error') ||
			message.includes('Network error occurred')
		) {
			return; // Suppress
		}
		originalError(...args); // Allow through
	});

	vi.spyOn(console, 'warn').mockImplementation((...args) => {
		const message = args[0]?.toString() || '';
		if (message.includes('Some image additions failed')) {
			return; // Suppress
		}
		originalWarn(...args); // Allow through
	});

	vi.spyOn(console, 'log').mockImplementation((...args) => {
		const message = args[0]?.toString() || '';
		if (
			message.includes('Environment validated') ||
			message.includes('🧪 Running GraphQL') ||
			message.includes('Navigate to')
		) {
			return; // Suppress
		}
		originalLog(...args); // Allow through
	});
});

afterEach(() => {
	cleanup();
});
