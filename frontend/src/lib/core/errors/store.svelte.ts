/**
 * Global error store for centralized error management
 * Handles application-wide errors, notifications, and error recovery
 */

export interface AppError {
	id: string;
	type: 'network' | 'graphql' | 'validation' | 'system' | 'user';
	title: string;
	message: string;
	timestamp: Date;
	source?: string;
	recoverable?: boolean;
	retryAction?: () => void | Promise<void>;
	severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Global error store using Svelte 5 runes
 */
class ErrorStore {
	// Active errors
	errors = $state<AppError[]>([]);

	// Error display state
	showErrors = $state<boolean>(true);
	maxErrors = $state<number>(5);

	// Auto-dismiss timers
	private dismissTimers = new Map<string, number>();

	/**
	 * Add a new error to the store
	 */
	addError(error: Omit<AppError, 'id' | 'timestamp'>): void {
		const appError: AppError = {
			...error,
			id: crypto.randomUUID(),
			timestamp: new Date()
		};

		// Add to errors array
		this.errors = [appError, ...this.errors];

		// Limit number of errors
		if (this.errors.length > this.maxErrors) {
			this.errors = this.errors.slice(0, this.maxErrors);
		}

		// Auto-dismiss non-critical errors after 5 seconds
		if (appError.severity !== 'critical') {
			const timer = (typeof window !== 'undefined' ? window.setTimeout : setTimeout)(() => {
				this.dismissError(appError.id);
			}, 5000) as unknown as number;
			this.dismissTimers.set(appError.id, timer);
		}

		// Log error for debugging
		console.error(`[${appError.type}] ${appError.title}:`, appError.message);
	}

	/**
	 * Dismiss a specific error
	 */
	dismissError(id: string): void {
		this.errors = this.errors.filter((error) => error.id !== id);

		// Clear timer if exists
		const timer = this.dismissTimers.get(id);
		if (timer) {
			(typeof window !== 'undefined' ? window.clearTimeout : clearTimeout)(timer);
			this.dismissTimers.delete(id);
		}
	}

	/**
	 * Clear all errors
	 */
	clearErrors(): void {
		// Clear all timers
		this.dismissTimers.forEach((timer) =>
			(typeof window !== 'undefined' ? window.clearTimeout : clearTimeout)(timer)
		);
		this.dismissTimers.clear();

		// Clear errors
		this.errors = [];
	}

	/**
	 * Add a network error
	 */
	addNetworkError(
		message: string,
		source?: string,
		retryAction?: () => void | Promise<void>
	): void {
		this.addError({
			type: 'network',
			title: 'Network Error',
			message,
			source,
			recoverable: !!retryAction,
			retryAction,
			severity: 'medium'
		});
	}

	/**
	 * Add a GraphQL error
	 */
	addGraphQLError(message: string, source?: string): void {
		this.addError({
			type: 'graphql',
			title: 'API Error',
			message,
			source,
			recoverable: false,
			severity: 'medium'
		});
	}

	/**
	 * Add a validation error
	 */
	addValidationError(message: string, source?: string): void {
		this.addError({
			type: 'validation',
			title: 'Validation Error',
			message,
			source,
			recoverable: false,
			severity: 'low'
		});
	}

	/**
	 * Add a system error
	 */
	addSystemError(message: string, source?: string): void {
		this.addError({
			type: 'system',
			title: 'System Error',
			message,
			source,
			recoverable: false,
			severity: 'high'
		});
	}

	/**
	 * Add a user-friendly error
	 */
	addUserError(title: string, message: string, source?: string): void {
		this.addError({
			type: 'user',
			title,
			message,
			source,
			recoverable: false,
			severity: 'low'
		});
	}

	/**
	 * Toggle error display
	 */
	toggleErrorDisplay(): void {
		this.showErrors = !this.showErrors;
	}

	/**
	 * Get errors by type
	 */
	getErrorsByType(type: AppError['type']): AppError[] {
		return this.errors.filter((error) => error.type === type);
	}

	/**
	 * Get errors by severity
	 */
	getErrorsBySeverity(severity: AppError['severity']): AppError[] {
		return this.errors.filter((error) => error.severity === severity);
	}

	/**
	 * Check if there are any critical errors
	 */
	get hasCriticalErrors(): boolean {
		return this.errors.some((error) => error.severity === 'critical');
	}

	/**
	 * Get the most recent error
	 */
	get latestError(): AppError | null {
		return this.errors[0] || null;
	}

	/**
	 * Cleanup method for store
	 */
	cleanup(): void {
		this.clearErrors();
	}
}

// Export singleton instance
export const errorStore = new ErrorStore();
