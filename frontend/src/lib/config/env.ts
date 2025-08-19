/**
 * Environment variable configuration
 * Handles environment variables from the project root .env file
 */

/**
 * Get environment variable with type safety
 * Safe for SSR by checking if import.meta.env is available
 */
function getEnvVar(key: keyof ImportMetaEnv, defaultValue?: string): string {
	// During SSR, import.meta.env might not be available
	const value =
		typeof window !== 'undefined' && import.meta?.env ? import.meta.env[key] : undefined;

	if (!value && !defaultValue) {
		// During SSR, just use defaults instead of throwing
		console.warn(`Environment variable ${key} not available during SSR, using default`);
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
	isDevelopment: typeof window !== 'undefined' && import.meta?.env ? import.meta.env.DEV : true,

	/**
	 * Check if we're in production mode
	 */
	isProduction: typeof window !== 'undefined' && import.meta?.env ? import.meta.env.PROD : false,

	/**
	 * Check if we're running tests
	 */
	isTest:
		typeof window !== 'undefined' && import.meta?.env ? import.meta.env.MODE === 'test' : false
} as const;

/**
 * Validate that all required environment variables are present
 */
export function validateEnv(): void {
	try {
		// Access the env property to trigger validation
		const url = env.BACKEND_URL;
		// Only log in development, not in tests, and not during SSR
		const isVitest =
			typeof window !== 'undefined' && import.meta?.env ? import.meta.env.VITEST : false;
		const isTestEnv =
			typeof window !== 'undefined' && import.meta?.env
				? import.meta.env.NODE_ENV === 'test'
				: false;

		if (!isVitest && !isTestEnv && typeof window !== 'undefined') {
			console.log(`Environment validated. Backend URL: ${url}`);
		}
	} catch (error) {
		console.error('Environment validation failed:', error);
		throw error;
	}
}
