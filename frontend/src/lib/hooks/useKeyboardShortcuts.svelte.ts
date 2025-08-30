export interface KeyboardShortcut {
	key: string;
	metaKey?: boolean;
	ctrlKey?: boolean;
	shiftKey?: boolean;
	altKey?: boolean;
	action: () => void;
	description?: string;
	disabled?: () => boolean;
}

/**
 * Custom hook for managing keyboard shortcuts
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
	const handleKeydown = (event: KeyboardEvent) => {
		// Don't trigger shortcuts when typing in inputs
		if (
			event.target instanceof HTMLInputElement ||
			event.target instanceof HTMLTextAreaElement ||
			event.target instanceof HTMLSelectElement ||
			(event.target as HTMLElement)?.contentEditable === 'true'
		) {
			return;
		}

		for (const shortcut of shortcuts) {
			if (shortcut.disabled?.()) {
				continue;
			}

			const keyMatches = event.key === shortcut.key || event.code === shortcut.key;
			const metaMatches = !!shortcut.metaKey === event.metaKey;
			const ctrlMatches = !!shortcut.ctrlKey === event.ctrlKey;
			const shiftMatches = !!shortcut.shiftKey === event.shiftKey;
			const altMatches = !!shortcut.altKey === event.altKey;

			if (keyMatches && metaMatches && ctrlMatches && shiftMatches && altMatches) {
				event.preventDefault();
				shortcut.action();
				return;
			}
		}
	};

	$effect(() => {
		document.addEventListener('keydown', handleKeydown);

		return () => {
			document.removeEventListener('keydown', handleKeydown);
		};
	});

	// Helper to get shortcut descriptions for help UI
	return {
		getShortcuts() {
			return shortcuts.filter((s) => s.description && !s.disabled?.());
		},

		formatShortcut(shortcut: KeyboardShortcut) {
			const parts: string[] = [];
			if (shortcut.metaKey) parts.push('Cmd');
			if (shortcut.ctrlKey) parts.push('Ctrl');
			if (shortcut.shiftKey) parts.push('Shift');
			if (shortcut.altKey) parts.push('Alt');
			parts.push(shortcut.key);
			return parts.join(' + ');
		}
	};
}

/**
 * Common keyboard shortcuts for annotation tools
 */
export function createAnnotationShortcuts(actions: {
	delete?: () => void;
	escape?: () => void;
	save?: () => void;
	undo?: () => void;
	redo?: () => void;
}) {
	const shortcuts: KeyboardShortcut[] = [];

	if (actions.delete) {
		shortcuts.push({
			key: 'Delete',
			action: actions.delete,
			description: 'Delete selected annotation'
		});
		shortcuts.push({
			key: 'Backspace',
			action: actions.delete,
			description: 'Delete selected annotation'
		});
	}

	if (actions.escape) {
		shortcuts.push({
			key: 'Escape',
			action: actions.escape,
			description: 'Cancel current action'
		});
	}

	if (actions.save) {
		shortcuts.push({
			key: 's',
			ctrlKey: true,
			action: actions.save,
			description: 'Save annotations'
		});
		shortcuts.push({
			key: 's',
			metaKey: true,
			action: actions.save,
			description: 'Save annotations'
		});
	}

	if (actions.undo) {
		shortcuts.push({
			key: 'z',
			ctrlKey: true,
			action: actions.undo,
			description: 'Undo last action'
		});
		shortcuts.push({
			key: 'z',
			metaKey: true,
			action: actions.undo,
			description: 'Undo last action'
		});
	}

	if (actions.redo) {
		shortcuts.push({
			key: 'z',
			ctrlKey: true,
			shiftKey: true,
			action: actions.redo,
			description: 'Redo last action'
		});
		shortcuts.push({
			key: 'z',
			metaKey: true,
			shiftKey: true,
			action: actions.redo,
			description: 'Redo last action'
		});
	}

	return shortcuts;
}
