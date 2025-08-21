import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/svelte';

// Mock SvelteKit modules for server tests
vi.mock('$app/environment', () => ({
	browser: false,
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

// Mock KeyboardEvent for server-side tests
class MockKeyboardEvent {
	key: string;
	ctrlKey: boolean;
	metaKey: boolean;
	shiftKey: boolean;
	altKey: boolean;
	type: string;

	constructor(type: string, eventInitDict: KeyboardEventInit = {}) {
		this.type = type;
		this.key = eventInitDict.key || '';
		this.ctrlKey = eventInitDict.ctrlKey || false;
		this.metaKey = eventInitDict.metaKey || false;
		this.shiftKey = eventInitDict.shiftKey || false;
		this.altKey = eventInitDict.altKey || false;
	}
}

// Mock PointerEvent for server-side tests
class MockPointerEvent {
	type: string;
	pointerId: number;
	clientX: number;
	clientY: number;
	button: number;
	ctrlKey: boolean;
	shiftKey: boolean;
	altKey: boolean;
	metaKey: boolean;

	constructor(type: string, eventInitDict: PointerEventInit = {}) {
		this.type = type;
		this.pointerId = eventInitDict.pointerId || 1;
		this.clientX = eventInitDict.clientX || 0;
		this.clientY = eventInitDict.clientY || 0;
		this.button = eventInitDict.button || 0;
		this.ctrlKey = eventInitDict.ctrlKey || false;
		this.shiftKey = eventInitDict.shiftKey || false;
		this.altKey = eventInitDict.altKey || false;
		this.metaKey = eventInitDict.metaKey || false;
	}
}

global.KeyboardEvent = MockKeyboardEvent as unknown as typeof KeyboardEvent;
global.PointerEvent = MockPointerEvent as unknown as typeof PointerEvent;

afterEach(() => {
	cleanup();
});
