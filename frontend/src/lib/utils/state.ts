import { browser } from '$app/environment';

/**
 * Creates a debounced version of a setter function
 * @param setter - The setter function to debounce
 * @param delay - The delay in milliseconds
 * @returns A debounced setter function and a cancel function
 */
export function createDebounced<T>(
	setter: (value: T) => void,
	delay: number
): {
	set: (value: T) => void;
	cancel: () => void;
} {
	let timeoutId: ReturnType<typeof setTimeout> | null = null;

	const set = (value: T) => {
		if (timeoutId) {
			clearTimeout(timeoutId);
		}
		timeoutId = setTimeout(() => {
			setter(value);
			timeoutId = null;
		}, delay);
	};

	const cancel = () => {
		if (timeoutId) {
			clearTimeout(timeoutId);
			timeoutId = null;
		}
	};

	return { set, cancel };
}

/**
 * Creates a state that persists to localStorage
 * @param key - The localStorage key
 * @param defaultValue - The default value if nothing is stored
 * @returns An object with get, set, and subscribe methods
 */
export function createLocalStorage<T>(key: string, defaultValue: T) {
	let value = $state(defaultValue);

	// Initialize from localStorage on first access (only in browser)
	if (browser) {
		try {
			const stored = localStorage.getItem(key);
			if (stored !== null) {
				value = JSON.parse(stored);
			}
		} catch {
			// Ignore parsing errors, use default value
		}
	}

	// Update localStorage when value changes
	$effect(() => {
		if (browser) {
			try {
				localStorage.setItem(key, JSON.stringify(value));
			} catch {
				// Ignore storage errors (e.g., quota exceeded)
			}
		}
	});

	return {
		get value() {
			return value;
		},
		set value(newValue: T) {
			value = newValue;
		}
	};
}

/**
 * Creates shared state that can be accessed from multiple components
 * This is a factory function for creating module-level state
 */
export function createSharedState<T>(initialValue: T) {
	let state = $state(initialValue);

	return {
		get value() {
			return state;
		},
		set value(newValue: T) {
			state = newValue;
		},
		update(updater: (current: T) => T) {
			state = updater(state);
		}
	};
}

/**
 * Utility for managing async operations state
 */
export type AsyncState<T, E = Error> =
	| { status: 'idle' }
	| { status: 'loading' }
	| { status: 'success'; data: T }
	| { status: 'error'; error: E };

export function createAsyncState<T, E = Error>(
	initialState: AsyncState<T, E> = { status: 'idle' }
) {
	let state = $state<AsyncState<T, E>>(initialState);

	return {
		get state() {
			return state;
		},
		setLoading() {
			state = { status: 'loading' };
		},
		setSuccess(data: T) {
			state = { status: 'success', data };
		},
		setError(error: E) {
			state = { status: 'error', error };
		},
		reset() {
			state = { status: 'idle' };
		},
		// Derived properties
		get isLoading() {
			return state.status === 'loading';
		},
		get isSuccess() {
			return state.status === 'success';
		},
		get isError() {
			return state.status === 'error';
		},
		get data() {
			return state.status === 'success' ? state.data : undefined;
		},
		get error() {
			return state.status === 'error' ? state.error : undefined;
		}
	};
}
