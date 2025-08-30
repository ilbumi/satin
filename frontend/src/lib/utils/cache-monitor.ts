import { browser } from '$app/environment';

export class CacheMonitor {
	private static requestCount = 0;
	private static cacheHits = 0;

	static onRequest() {
		if (!browser) return;
		this.requestCount++;
		console.log(`GraphQL Request #${this.requestCount}`);
	}

	static onCacheHit() {
		if (!browser) return;
		this.cacheHits++;
		console.log(`Cache Hit! (${this.cacheHits} hits of ${this.requestCount} requests)`);
	}

	static getStats() {
		return {
			requests: this.requestCount,
			cacheHits: this.cacheHits,
			cacheHitRate: this.requestCount > 0 ? (this.cacheHits / this.requestCount) * 100 : 0
		};
	}

	static logStats() {
		if (!browser) return;
		const stats = this.getStats();
		console.log(
			`📊 Cache Stats: ${stats.cacheHits}/${stats.requests} hits (${stats.cacheHitRate.toFixed(1)}%)`
		);
	}
}

// Add to global object for easy access in dev tools
if (browser) {
	(window as unknown as Record<string, unknown>).cacheMonitor = CacheMonitor;
}
