import { describe, it, expect, beforeEach } from 'vitest';
import { env, validateEnv, config } from './index.js';

describe('Configuration', () => {
	beforeEach(() => {
		// Reset environment to default values
		Object.assign(import.meta.env, {
			VITE_BACKEND_URL: 'http://localhost:8000'
		});
	});

	describe('env', () => {
		it('should have required environment variables', () => {
			expect(env.BACKEND_URL).toBe('http://localhost:8000');
			expect(typeof env.isDevelopment).toBe('boolean');
			expect(typeof env.isProduction).toBe('boolean');
			expect(typeof env.isTest).toBe('boolean');
		});

		it('should use default BACKEND_URL when not set', () => {
			Object.assign(import.meta.env, { VITE_BACKEND_URL: undefined as unknown as string });
			expect(env.BACKEND_URL).toBe('http://localhost:8000');
		});
	});

	describe('validateEnv', () => {
		it('should not throw when environment is valid', () => {
			expect(() => validateEnv()).not.toThrow();
		});
	});

	describe('config', () => {
		it('should have api configuration', () => {
			expect(config.api.baseUrl).toBe('http://localhost:8000');
			expect(config.api.graphqlEndpoint).toBe('http://localhost:8000/graphql');
			expect(config.api.timeout).toBe(5000);
			expect(config.api.retries).toBe(3);
		});

		it('should have ui configuration', () => {
			expect(config.ui.pageSize).toBe(20);
			expect(config.ui.maxFileSize).toBe(10 * 1024 * 1024);
			expect(config.ui.supportedImageTypes).toEqual(['image/jpeg', 'image/png', 'image/webp']);
			expect(config.ui.toastDuration).toBe(5000);
		});

		it('should have feature flags', () => {
			expect(config.features.enableAdvancedAnnotations).toBe(true);
			expect(config.features.enableMLPredictions).toBe(true);
			expect(config.features.enableExportSystem).toBe(true);
		});
	});
});
