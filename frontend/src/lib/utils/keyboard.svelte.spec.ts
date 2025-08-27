import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';

// Mock the goto function
vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

import {
	KeyboardManager,
	keyboardManager,
	setupNavigationShortcuts,
	cleanupNavigationShortcuts
} from './keyboard';
import { goto } from '$app/navigation';

const mockGoto = vi.mocked(goto);

describe('KeyboardManager', () => {
	let manager: KeyboardManager;

	beforeEach(() => {
		manager = new KeyboardManager();
		mockGoto.mockClear();
	});

	afterEach(() => {
		manager.stopListening();
		vi.restoreAllMocks();
	});

	it('creates manager with empty shortcuts', () => {
		expect(manager).toBeInstanceOf(KeyboardManager);
	});

	it('adds shortcut', () => {
		const action = vi.fn();
		manager.addShortcut({
			key: 'a',
			action
		});

		// Test the shortcut was added by triggering it
		manager.startListening();

		const event = new KeyboardEvent('keydown', {
			key: 'a',
			ctrlKey: false,
			metaKey: false,
			altKey: false,
			shiftKey: false
		});

		document.dispatchEvent(event);
		expect(action).toHaveBeenCalled();
	});

	it('removes shortcut', () => {
		const action = vi.fn();
		manager.addShortcut({
			key: 'a',
			action
		});

		manager.removeShortcut('a');
		manager.startListening();

		const event = new KeyboardEvent('keydown', { key: 'a' });
		document.dispatchEvent(event);

		expect(action).not.toHaveBeenCalled();
	});

	it('starts and stops listening', () => {
		const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
		const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

		manager.startListening();
		expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

		manager.stopListening();
		expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
	});

	it('does not add duplicate listeners', () => {
		const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

		manager.startListening();
		manager.startListening();

		expect(addEventListenerSpy).toHaveBeenCalledTimes(1);
	});

	it('handles ctrl key modifier', () => {
		const action = vi.fn();
		manager.addShortcut({
			key: 'a',
			ctrlKey: true,
			action
		});

		manager.startListening();

		// Should not trigger without ctrl
		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
		expect(action).not.toHaveBeenCalled();

		// Should trigger with ctrl
		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', ctrlKey: true }));
		expect(action).toHaveBeenCalled();
	});

	it('handles meta key modifier', () => {
		const action = vi.fn();
		manager.addShortcut({
			key: 'a',
			metaKey: true,
			action
		});

		manager.startListening();

		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', metaKey: true }));
		expect(action).toHaveBeenCalled();
	});

	it('handles alt key modifier', () => {
		const action = vi.fn();
		manager.addShortcut({
			key: 'a',
			altKey: true,
			action
		});

		manager.startListening();

		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', altKey: true }));
		expect(action).toHaveBeenCalled();
	});

	it('handles shift key modifier', () => {
		const action = vi.fn();
		manager.addShortcut({
			key: 'a',
			shiftKey: true,
			action
		});

		manager.startListening();

		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', shiftKey: true }));
		expect(action).toHaveBeenCalled();
	});

	it('ignores shortcuts when typing in input fields', () => {
		const action = vi.fn();
		manager.addShortcut({
			key: 'a',
			action
		});

		manager.startListening();

		// Create input element
		const input = document.createElement('input');
		document.body.appendChild(input);

		const event = new KeyboardEvent('keydown', {
			key: 'a',
			bubbles: true
		});

		Object.defineProperty(event, 'target', {
			value: input,
			writable: false
		});

		document.dispatchEvent(event);
		expect(action).not.toHaveBeenCalled();

		document.body.removeChild(input);
	});

	it('ignores shortcuts when typing in textarea', () => {
		const action = vi.fn();
		manager.addShortcut({
			key: 'a',
			action
		});

		manager.startListening();

		const textarea = document.createElement('textarea');
		document.body.appendChild(textarea);

		const event = new KeyboardEvent('keydown', {
			key: 'a',
			bubbles: true
		});

		Object.defineProperty(event, 'target', {
			value: textarea,
			writable: false
		});

		document.dispatchEvent(event);
		expect(action).not.toHaveBeenCalled();

		document.body.removeChild(textarea);
	});

	it('prevents default behavior when shortcut is triggered', () => {
		const action = vi.fn();
		manager.addShortcut({
			key: 'a',
			action
		});

		manager.startListening();

		const event = new KeyboardEvent('keydown', { key: 'a' });
		const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

		document.dispatchEvent(event);

		expect(preventDefaultSpy).toHaveBeenCalled();
		expect(action).toHaveBeenCalled();
	});

	it('is case insensitive for key matching', () => {
		const action = vi.fn();
		manager.addShortcut({
			key: 'A',
			action
		});

		manager.startListening();

		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
		expect(action).toHaveBeenCalled();
	});
});

describe('Global keyboard manager and navigation shortcuts', () => {
	beforeEach(() => {
		mockGoto.mockClear();
	});

	afterEach(() => {
		cleanupNavigationShortcuts();
	});

	it('uses global keyboard manager instance', () => {
		expect(keyboardManager).toBeInstanceOf(KeyboardManager);
	});

	it('sets up navigation shortcuts', () => {
		setupNavigationShortcuts();

		// Test Ctrl+1 for home
		document.dispatchEvent(
			new KeyboardEvent('keydown', {
				key: '1',
				ctrlKey: true
			})
		);
		expect(mockGoto).toHaveBeenCalledWith('/');

		mockGoto.mockClear();

		// Test Ctrl+2 for images
		document.dispatchEvent(
			new KeyboardEvent('keydown', {
				key: '2',
				ctrlKey: true
			})
		);
		expect(mockGoto).toHaveBeenCalledWith('/images');
	});

	it('cleans up navigation shortcuts', () => {
		setupNavigationShortcuts();
		cleanupNavigationShortcuts();

		// Shortcuts should no longer work
		document.dispatchEvent(
			new KeyboardEvent('keydown', {
				key: '1',
				ctrlKey: true
			})
		);
		expect(mockGoto).not.toHaveBeenCalled();
	});
});
