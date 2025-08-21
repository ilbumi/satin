/**
 * Environment variable configuration
 * Handles environment variables from the project root .env file
 */

import { browser } from '$app/environment';

/**
 * Get environment variable with type safety
 * Safe for SSR using SvelteKit's browser detection
 */
function getEnvVar(key: keyof ImportMetaEnv, defaultValue?: string): string {
	// In SvelteKit, import.meta.env is available both client and server side
	const value = import.meta.env?.[key];

	if (!value && !defaultValue) {
		// During SSR, just use defaults instead of throwing
		if (!browser) {
			console.warn(`Environment variable ${key} not available during SSR, using default`);
		}
		return defaultValue || '';
	}

	return value || defaultValue!;
}

/**
 * Environment configuration object
 * Safe for SSR by providing fallbacks
 */
export const env = {
	/**
	 * Backend API URL
	 * Default: http://localhost:8000
	 */
	BACKEND_URL: getEnvVar('VITE_BACKEND_URL', 'http://localhost:8000'),

	/**
	 * Check if we're in development mode
	 */
	isDevelopment: import.meta.env?.DEV ?? true,

	/**
	 * Check if we're in production mode
	 */
	isProduction: import.meta.env?.PROD ?? false,

	/**
	 * Check if we're running tests
	 */
	isTest: import.meta.env?.MODE === 'test'
} as const;

/**
 * Validate that all required environment variables are present
 */
export function validateEnv(): void {
	try {
		// Access the env property to trigger validation
		const url = env.BACKEND_URL;

		// Only log in development, not in tests, and only in browser
		const isVitest = import.meta.env?.VITEST ?? false;
		const isTestEnv = import.meta.env?.NODE_ENV === 'test';

		if (env.isDevelopment && !isVitest && !isTestEnv && browser) {
			console.log(`Environment validated. Backend URL: ${url}`);
		}
	} catch (error) {
		console.error('Environment validation failed:', error);
		throw error;
	}
}
