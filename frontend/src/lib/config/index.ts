/**
 * Centralized configuration export
 * This file provides a single point of access for all application configuration
 */

export { env, validateEnv } from './env.js';

/**
 * Application configuration constants
 */
export const config = {
	/**
	 * API configuration
	 */
	api: {
		baseUrl: env.BACKEND_URL,
		graphqlEndpoint: `${env.BACKEND_URL}/graphql`,
		timeout: 5000, // 5 seconds
		retries: 3
	},

	/**
	 * UI configuration
	 */
	ui: {
		pageSize: 20,
		maxFileSize: 10 * 1024 * 1024, // 10MB
		supportedImageTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
		toastDuration: 5000 // 5 seconds
	},

	/**
	 * Feature flags
	 */
	features: {
		enableAdvancedAnnotations: true,
		enableMLPredictions: true,
		enableExportSystem: true
	}
} as const;

// Import env here to ensure it's available
import { env } from './env.js';
