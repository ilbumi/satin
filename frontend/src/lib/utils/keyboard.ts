import { goto } from '$app/navigation';

interface KeyboardShortcut {
	key: string;
	ctrlKey?: boolean;
	metaKey?: boolean;
	altKey?: boolean;
	shiftKey?: boolean;
	action: () => void;
}

export class KeyboardManager {
	private shortcuts: KeyboardShortcut[] = [];
	private isListening = false;

	constructor() {
		this.handleKeyDown = this.handleKeyDown.bind(this);
	}

	addShortcut(shortcut: KeyboardShortcut) {
		this.shortcuts.push(shortcut);
	}

	removeShortcut(key: string) {
		this.shortcuts = this.shortcuts.filter((s) => s.key !== key);
	}

	startListening() {
		if (!this.isListening) {
			document.addEventListener('keydown', this.handleKeyDown);
			this.isListening = true;
		}
	}

	stopListening() {
		if (this.isListening) {
			document.removeEventListener('keydown', this.handleKeyDown);
			this.isListening = false;
		}
	}

	private handleKeyDown(event: KeyboardEvent) {
		// Don't trigger shortcuts when typing in input fields
		const target = event.target as HTMLElement;
		if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
			return;
		}

		const shortcut = this.shortcuts.find((s) => {
			return (
				s.key.toLowerCase() === event.key.toLowerCase() &&
				!!s.ctrlKey === event.ctrlKey &&
				!!s.metaKey === event.metaKey &&
				!!s.altKey === event.altKey &&
				!!s.shiftKey === event.shiftKey
			);
		});

		if (shortcut) {
			event.preventDefault();
			shortcut.action();
		}
	}
}

// Global keyboard manager instance
export const keyboardManager = new KeyboardManager();

// Navigation shortcuts
export function setupNavigationShortcuts() {
	keyboardManager.addShortcut({
		key: '1',
		ctrlKey: true,
		action: () => goto('/')
	});

	keyboardManager.addShortcut({
		key: '1',
		metaKey: true,
		action: () => goto('/')
	});

	keyboardManager.addShortcut({
		key: '2',
		ctrlKey: true,
		action: () => goto('/images')
	});

	keyboardManager.addShortcut({
		key: '2',
		metaKey: true,
		action: () => goto('/images')
	});

	keyboardManager.addShortcut({
		key: '3',
		ctrlKey: true,
		action: () => goto('/annotate')
	});

	keyboardManager.addShortcut({
		key: '3',
		metaKey: true,
		action: () => goto('/annotate')
	});

	keyboardManager.addShortcut({
		key: '4',
		ctrlKey: true,
		action: () => goto('/export')
	});

	keyboardManager.addShortcut({
		key: '4',
		metaKey: true,
		action: () => goto('/export')
	});

	keyboardManager.startListening();
}

export function cleanupNavigationShortcuts() {
	keyboardManager.stopListening();
}
