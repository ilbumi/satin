import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/svelte';

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
