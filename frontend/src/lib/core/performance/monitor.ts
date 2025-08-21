/**
 * Performance monitoring utilities for tracking application performance
 */

export interface PerformanceMetric {
	name: string;
	value: number;
	timestamp: number;
	type: 'navigation' | 'paint' | 'interaction' | 'custom';
	metadata?: Record<string, unknown>;
}

export interface BundleMetric {
	chunkName: string;
	size: number;
	loadTime: number;
	cacheHit: boolean;
}

export interface ComponentMetric {
	componentName: string;
	renderTime: number;
	mountTime: number;
	rerenderCount: number;
	lastRenderTimestamp: number;
}

export interface PerformanceReport {
	navigation: {
		domContentLoaded: number;
		firstPaint: number;
		firstContentfulPaint: number;
		largestContentfulPaint: number;
		cumulativeLayoutShift: number;
		firstInputDelay: number;
	};
	bundles: BundleMetric[];
	components: ComponentMetric[];
	memory: {
		used: number;
		total: number;
		limit: number;
	};
	customMetrics: PerformanceMetric[];
}

class PerformanceMonitor {
	private metrics: PerformanceMetric[] = [];
	private bundleMetrics: BundleMetric[] = [];
	private componentMetrics = new Map<string, ComponentMetric>();
	private observer?: PerformanceObserver;
	private enabled = false;

	constructor() {
		if (typeof window !== 'undefined' && 'performance' in window) {
			this.enabled = true;
			this.setupPerformanceObserver();
			this.trackNavigationMetrics();
		}
	}

	private setupPerformanceObserver() {
		if (!this.enabled || !window.PerformanceObserver) return;

		this.observer = new PerformanceObserver((list) => {
			for (const entry of list.getEntries()) {
				this.processPerformanceEntry(entry);
			}
		});

		// Observe various performance entry types
		try {
			this.observer.observe({ entryTypes: ['navigation', 'paint', 'measure', 'resource'] });
		} catch (error) {
			console.warn('Performance Observer setup failed:', error);
		}
	}

	private processPerformanceEntry(entry: PerformanceEntry) {
		switch (entry.entryType) {
			case 'navigation':
				this.processNavigationEntry(entry as PerformanceNavigationTiming);
				break;
			case 'paint':
				this.processPaintEntry(entry);
				break;
			case 'resource':
				this.processResourceEntry(entry as PerformanceResourceTiming);
				break;
			case 'measure':
				this.processMeasureEntry(entry);
				break;
		}
	}

	private processNavigationEntry(entry: PerformanceNavigationTiming) {
		this.addMetric(
			'domContentLoaded',
			entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
			'navigation'
		);
		this.addMetric('domComplete', entry.domComplete - entry.navigationStart, 'navigation');
		this.addMetric('loadComplete', entry.loadEventEnd - entry.navigationStart, 'navigation');
	}

	private processPaintEntry(entry: PerformanceEntry) {
		this.addMetric(entry.name, entry.startTime, 'paint');
	}

	private processResourceEntry(entry: PerformanceResourceTiming) {
		// Track bundle loading performance
		if (
			entry.name.includes('.js') &&
			(entry.name.includes('chunk') || entry.name.includes('vendor'))
		) {
			const chunkName = this.extractChunkName(entry.name);
			const bundleMetric: BundleMetric = {
				chunkName,
				size: entry.transferSize || 0,
				loadTime: entry.responseEnd - entry.requestStart,
				cacheHit: entry.transferSize === 0
			};
			this.bundleMetrics.push(bundleMetric);
		}
	}

	private processMeasureEntry(entry: PerformanceEntry) {
		// Process custom measurements
		if (entry.name.startsWith('component:')) {
			this.processComponentMeasure(entry);
		} else {
			this.addMetric(entry.name, entry.duration, 'custom');
		}
	}

	private processComponentMeasure(entry: PerformanceEntry) {
		const componentName = entry.name.replace('component:', '');
		const existing = this.componentMetrics.get(componentName);

		if (existing) {
			existing.rerenderCount++;
			existing.lastRenderTimestamp = entry.startTime;
			if (entry.name.includes('render')) {
				existing.renderTime = entry.duration;
			}
		} else {
			this.componentMetrics.set(componentName, {
				componentName,
				renderTime: entry.duration,
				mountTime: entry.duration,
				rerenderCount: 1,
				lastRenderTimestamp: entry.startTime
			});
		}
	}

	private extractChunkName(url: string): string {
		const parts = url.split('/');
		const filename = parts[parts.length - 1];
		return filename.split('-')[0] || filename;
	}

	private trackNavigationMetrics() {
		if (!this.enabled) return;

		// Wait for page load to collect navigation metrics
		window.addEventListener('load', () => {
			setTimeout(() => {
				this.collectNavigationTimings();
			}, 100);
		});
	}

	private collectNavigationTimings() {
		if (!performance.getEntriesByType) return;

		const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
		const paints = performance.getEntriesByType('paint');

		if (navigation) {
			this.addMetric('navigationStart', navigation.navigationStart, 'navigation');
			this.addMetric(
				'domInteractive',
				navigation.domInteractive - navigation.navigationStart,
				'navigation'
			);
		}

		paints.forEach((paint) => {
			this.addMetric(paint.name, paint.startTime, 'paint');
		});
	}

	public addMetric(
		name: string,
		value: number,
		type: PerformanceMetric['type'],
		metadata?: Record<string, unknown>
	) {
		this.metrics.push({
			name,
			value,
			timestamp: Date.now(),
			type,
			metadata
		});
	}

	public startMeasure(name: string) {
		if (!this.enabled) return;
		performance.mark(`${name}-start`);
	}

	public endMeasure(name: string) {
		if (!this.enabled) return;
		performance.mark(`${name}-end`);
		performance.measure(name, `${name}-start`, `${name}-end`);
	}

	public measureComponent(componentName: string, fn: () => void) {
		if (!this.enabled) {
			fn();
			return;
		}

		this.startMeasure(`component:${componentName}:render`);
		fn();
		this.endMeasure(`component:${componentName}:render`);
	}

	public getMemoryUsage() {
		if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
			const memory = (
				performance as {
					memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number };
				}
			).memory;
			return {
				used: memory.usedJSHeapSize,
				total: memory.totalJSHeapSize,
				limit: memory.jsHeapSizeLimit
			};
		}
		return { used: 0, total: 0, limit: 0 };
	}

	public generateReport(): PerformanceReport {
		const memory = this.getMemoryUsage();

		// Extract navigation metrics
		const navigationMetrics = this.metrics.filter(
			(m) => m.type === 'navigation' || m.type === 'paint'
		);
		const navigation = {
			domContentLoaded: this.getMetricValue(navigationMetrics, 'domContentLoaded'),
			firstPaint: this.getMetricValue(navigationMetrics, 'first-paint'),
			firstContentfulPaint: this.getMetricValue(navigationMetrics, 'first-contentful-paint'),
			largestContentfulPaint: 0, // Will be populated by observer
			cumulativeLayoutShift: 0, // Will be populated by observer
			firstInputDelay: 0 // Will be populated by observer
		};

		return {
			navigation,
			bundles: [...this.bundleMetrics],
			components: Array.from(this.componentMetrics.values()),
			memory,
			customMetrics: this.metrics.filter((m) => m.type === 'custom')
		};
	}

	private getMetricValue(metrics: PerformanceMetric[], name: string): number {
		const metric = metrics.find((m) => m.name === name);
		return metric ? metric.value : 0;
	}

	public getTopSlowComponents(limit = 5): ComponentMetric[] {
		return Array.from(this.componentMetrics.values())
			.sort((a, b) => b.renderTime - a.renderTime)
			.slice(0, limit);
	}

	public getLargestBundles(limit = 5): BundleMetric[] {
		return this.bundleMetrics.sort((a, b) => b.size - a.size).slice(0, limit);
	}

	public getSlowestBundles(limit = 5): BundleMetric[] {
		return this.bundleMetrics.sort((a, b) => b.loadTime - a.loadTime).slice(0, limit);
	}

	public clear() {
		this.metrics = [];
		this.bundleMetrics = [];
		this.componentMetrics.clear();
	}

	public destroy() {
		if (this.observer) {
			this.observer.disconnect();
			this.observer = undefined;
		}
		this.clear();
		this.enabled = false;
	}
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Svelte-specific performance utilities
export function measureSvelteComponent<T extends Record<string, unknown>>(
	componentName: string,
	component: T
): T {
	if (!performanceMonitor) return component;

	// Wrap component methods to measure performance
	const wrappedComponent = { ...component };

	// Track mount/unmount if methods exist
	if ('onMount' in wrappedComponent && typeof wrappedComponent.onMount === 'function') {
		const originalOnMount = wrappedComponent.onMount;
		wrappedComponent.onMount = (...args: unknown[]) => {
			performanceMonitor.measureComponent(`${componentName}:mount`, () => {
				originalOnMount.apply(wrappedComponent, args);
			});
		};
	}

	return wrappedComponent;
}

// Bundle analysis utilities
export class BundleAnalyzer {
	private static instance: BundleAnalyzer;
	private chunks = new Map<string, { name: string; size: number; loadTime: number }>();

	static getInstance() {
		if (!BundleAnalyzer.instance) {
			BundleAnalyzer.instance = new BundleAnalyzer();
		}
		return BundleAnalyzer.instance;
	}

	recordChunkLoad(name: string, size: number, loadTime: number) {
		this.chunks.set(name, { name, size, loadTime });
	}

	getChunkAnalysis() {
		const chunks = Array.from(this.chunks.values());
		const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
		const averageLoadTime =
			chunks.reduce((sum, chunk) => sum + chunk.loadTime, 0) / chunks.length || 0;

		return {
			chunks,
			totalSize,
			averageLoadTime,
			chunkCount: chunks.length,
			largestChunk: chunks.reduce((max, chunk) => (chunk.size > max.size ? chunk : max), chunks[0]),
			slowestChunk: chunks.reduce(
				(max, chunk) => (chunk.loadTime > max.loadTime ? chunk : max),
				chunks[0]
			)
		};
	}

	generateSizeReport() {
		const analysis = this.getChunkAnalysis();
		return {
			summary: {
				totalBundleSize: analysis.totalSize,
				chunkCount: analysis.chunkCount,
				averageChunkSize: analysis.totalSize / analysis.chunkCount || 0,
				largestChunk: analysis.largestChunk?.name,
				largestChunkSize: analysis.largestChunk?.size || 0
			},
			recommendations: this.generateRecommendations(analysis)
		};
	}

	private generateRecommendations(analysis: ReturnType<BundleAnalyzer['getChunkAnalysis']>) {
		const recommendations = [];

		// Large chunk recommendations
		if (analysis.largestChunk && analysis.largestChunk.size > 500 * 1024) {
			// 500KB
			recommendations.push({
				type: 'chunk-size',
				message: `Consider splitting ${analysis.largestChunk.name} (${Math.round(analysis.largestChunk.size / 1024)}KB) into smaller chunks`,
				severity: 'warning'
			});
		}

		// Too many chunks
		if (analysis.chunkCount > 20) {
			recommendations.push({
				type: 'chunk-count',
				message: `High number of chunks (${analysis.chunkCount}) may cause waterfall loading issues`,
				severity: 'info'
			});
		}

		// Slow loading chunks
		if (analysis.slowestChunk && analysis.slowestChunk.loadTime > 1000) {
			recommendations.push({
				type: 'load-time',
				message: `${analysis.slowestChunk.name} is loading slowly (${Math.round(analysis.slowestChunk.loadTime)}ms)`,
				severity: 'warning'
			});
		}

		return recommendations;
	}
}

export const bundleAnalyzer = BundleAnalyzer.getInstance();
