import { connectionService } from './service';
import type { ConnectionState } from './types';

/**
 * Reactive store for connection state management
 */
function createConnectionStore() {
	const state = $state<ConnectionState>({
		status: 'idle',
		health: null,
		testResults: [],
		error: null,
		retryCount: 0,
		maxRetries: 3,
		isRetrying: false,
		lastTestTime: null,
		projectCount: 0
	});

	/**
	 * Run health check and update state
	 */
	async function checkHealth(): Promise<void> {
		if (state.status === 'testing') return; // Prevent concurrent checks

		state.status = 'testing';
		state.error = null;
		state.lastTestTime = new Date();

		try {
			const [health, testResults] = await Promise.all([
				connectionService.getSystemHealth(),
				connectionService.runFullHealthCheck()
			]);

			state.health = health;
			state.testResults = testResults;

			// Update project count if available
			const projectsResult = testResults.find((result) => result.name === 'Projects Query');
			if (projectsResult && projectsResult.status === 'success') {
				const match = projectsResult.message.match(/(\d+) total projects/);
				if (match) {
					state.projectCount = parseInt(match[1], 10);
				}
			}

			// Set overall status based on health
			if (health.overall === 'healthy') {
				state.status = 'connected';
				state.retryCount = 0; // Reset retry count on success
			} else if (health.overall === 'degraded') {
				state.status = 'connected'; // Still connected but with issues
			} else {
				state.status = 'disconnected';
			}
		} catch (error) {
			state.status = 'error';
			state.error = error instanceof Error ? error.message : 'Unknown error occurred';
			state.testResults.push({
				id: Math.random().toString(36).substring(2, 15),
				name: 'Health Check',
				status: 'error',
				message: `❌ Health check failed: ${state.error}`,
				timestamp: new Date()
			});
		}
	}

	/**
	 * Retry connection with exponential backoff
	 */
	async function retryConnection(): Promise<void> {
		if (state.isRetrying || state.retryCount >= state.maxRetries) return;

		state.isRetrying = true;
		state.retryCount++;

		// Exponential backoff delay
		const delay = Math.min(1000 * Math.pow(2, state.retryCount - 1), 10000);
		await new Promise((resolve) => setTimeout(resolve, delay));

		try {
			await checkHealth();
		} finally {
			state.isRetrying = false;
		}
	}

	/**
	 * Manual retry (resets retry count)
	 */
	async function manualRetry(): Promise<void> {
		state.retryCount = 0;
		await retryConnection();
	}

	/**
	 * Reset the store state
	 */
	function reset(): void {
		state.status = 'idle';
		state.health = null;
		state.testResults = [];
		state.error = null;
		state.retryCount = 0;
		state.isRetrying = false;
		state.lastTestTime = null;
		state.projectCount = 0;
	}

	/**
	 * Cleanup method for store - can be called when component unmounts
	 * Alias for reset() for consistency with other stores
	 */
	function cleanup(): void {
		reset();
	}

	// Computed values using $derived
	const statusDisplay = $derived(() => {
		switch (state.status) {
			case 'idle':
				return 'Not Checked';
			case 'testing':
				return 'Testing...';
			case 'connected':
				if (state.health?.overall === 'degraded') {
					return 'Connected ⚠️';
				}
				return 'Connected ✅';
			case 'disconnected':
				return 'Disconnected ❌';
			case 'error':
				return 'Error ❌';
			default:
				return 'Unknown';
		}
	});

	const canRetry = $derived(
		!state.isRetrying && state.retryCount < state.maxRetries && state.status !== 'connected'
	);

	const recentResults = $derived(state.testResults.slice(-3));

	// Return the store API
	return {
		// State (reactive)
		get status() {
			return state.status;
		},
		get health() {
			return state.health;
		},
		get testResults() {
			return state.testResults;
		},
		get error() {
			return state.error;
		},
		get retryCount() {
			return state.retryCount;
		},
		get maxRetries() {
			return state.maxRetries;
		},
		get isRetrying() {
			return state.isRetrying;
		},
		get lastTestTime() {
			return state.lastTestTime;
		},
		get projectCount() {
			return state.projectCount;
		},

		// Computed values
		get statusDisplay() {
			return statusDisplay;
		},
		get canRetry() {
			return canRetry;
		},
		get recentResults() {
			return recentResults;
		},

		// Actions
		checkHealth,
		retryConnection,
		manualRetry,
		reset,
		cleanup
	};
}

// Export singleton store
export const connectionStore = createConnectionStore();
