/**
 * Debug logging utility
 * Provides conditional logging that only appears in development mode
 */

import { env } from '../../config/env';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Debug logger that only logs in development mode
 */
export const debugLogger = {
	/**
	 * Log debug messages (only in development)
	 */
	debug: (...args: unknown[]): void => {
		if (env.isDevelopment) {
			console.log(...args);
		}
	},

	/**
	 * Log info messages (only in development)
	 */
	info: (...args: unknown[]): void => {
		if (env.isDevelopment) {
			console.info(...args);
		}
	},

	/**
	 * Log warning messages (only in development)
	 */
	warn: (...args: unknown[]): void => {
		if (env.isDevelopment) {
			console.warn(...args);
		}
	},

	/**
	 * Log error messages (always logged, but with additional info in development)
	 */
	error: (...args: unknown[]): void => {
		if (env.isDevelopment) {
			console.error(...args);
		} else {
			// In production, log errors but without potentially sensitive details
			console.error('Application error occurred');
		}
	}
};

/**
 * Convenience function for debug logging
 * @param message - The message to log
 * @param data - Optional data to log alongside the message
 */
export const debugLog = (message: string, ...data: unknown[]): void => {
	debugLogger.debug(message, ...data);
};

/**
 * Log with specific level
 * @param level - Log level
 * @param message - Message to log
 * @param data - Optional data
 */
export const logWithLevel = (level: LogLevel, message: string, ...data: unknown[]): void => {
	debugLogger[level](message, ...data);
};
