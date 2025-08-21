/**
 * Performance monitoring and analysis system
 *
 * This module provides comprehensive performance monitoring for the Satin application,
 * including bundle analysis, component performance tracking, and navigation metrics.
 */

import {
	performanceMonitor as _performanceMonitor,
	bundleAnalyzer as _bundleAnalyzer,
	measureSvelteComponent,
	type PerformanceMetric,
	type BundleMetric,
	type ComponentMetric,
	type PerformanceReport
} from './monitor';

export {
	measureSvelteComponent,
	type PerformanceMetric,
	type BundleMetric,
	type ComponentMetric,
	type PerformanceReport
};

export const performanceMonitor = _performanceMonitor;
export const bundleAnalyzer = _bundleAnalyzer;

// Performance utilities
export function initializePerformanceTracking() {
	// Performance tracking is automatically initialized when the module loads
	// This function is here for explicit initialization if needed
	if (typeof window !== 'undefined') {
		console.debug('Performance monitoring initialized');
	}
}

// Global performance helpers
export function measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
	const start = performance.now();
	return fn().finally(() => {
		const duration = performance.now() - start;
		_performanceMonitor.addMetric(name, duration, 'custom');
	});
}

export function measureSync<T>(name: string, fn: () => T): T {
	const start = performance.now();
	try {
		return fn();
	} finally {
		const duration = performance.now() - start;
		_performanceMonitor.addMetric(name, duration, 'custom');
	}
}
