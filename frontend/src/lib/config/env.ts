/**
 * Environment variable configuration
 * Handles environment variables from the project root .env file
 */

/**
 * Get environment variable with type safety
 */
function getEnvVar(key: keyof ImportMetaEnv, defaultValue?: string): string {
	const value = import.meta.env[key];

	if (!value && !defaultValue) {
		throw new Error(`Missing required environment variable: ${key}`);
	}

	return value || defaultValue!;
}

/**
 * Environment configuration object
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
	isDevelopment: import.meta.env.DEV,

	/**
	 * Check if we're in production mode
	 */
	isProduction: import.meta.env.PROD,

	/**
	 * Check if we're running tests
	 */
	isTest: import.meta.env.MODE === 'test'
} as const;

/**
 * Validate that all required environment variables are present
 */
export function validateEnv(): void {
	try {
		// Access the env property to trigger validation
		const url = env.BACKEND_URL;
		// Only log in development, not in tests
		if (!import.meta.env.VITEST && import.meta.env.NODE_ENV !== 'test') {
			console.log(`Environment validated. Backend URL: ${url}`);
		}
	} catch (error) {
		console.error('Environment validation failed:', error);
		throw error;
	}
}
