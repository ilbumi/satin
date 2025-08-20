import { testConnectionDetailed, api } from '$lib/core/api';
import type {
	ConnectionService,
	ConnectionHealth,
	TestResult,
	ProjectsEndpointResponse
} from './types';

/**
 * Service for handling backend connection testing and monitoring
 */
class ConnectionServiceImpl implements ConnectionService {
	/**
	 * Test basic connection to the backend
	 */
	async testConnection(): Promise<{ success: boolean; details?: string; error?: Error }> {
		try {
			return await testConnectionDetailed();
		} catch (error) {
			return {
				success: false,
				details: 'Unexpected error during connection test',
				error: error instanceof Error ? error : new Error('Unknown error')
			};
		}
	}

	/**
	 * Test the projects endpoint specifically
	 */
	async testProjectsEndpoint(): Promise<{
		success: boolean;
		data?: ProjectsEndpointResponse;
		error?: Error;
	}> {
		try {
			const result = await api.projects.getProjects(10, 0);
			if (result.error) {
				return {
					success: false,
					error: new Error(result.error.message)
				};
			}
			return {
				success: true,
				data: result.data
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error : new Error('Unknown error')
			};
		}
	}

	/**
	 * Get overall system health status
	 */
	async getSystemHealth(): Promise<ConnectionHealth> {
		const connectionResult = await this.testConnection();
		const projectsResult = await this.testProjectsEndpoint();

		const backend = connectionResult.success;
		const database = projectsResult.success;

		let overall: ConnectionHealth['overall'] = 'healthy';
		if (!backend && !database) {
			overall = 'unhealthy';
		} else if (!backend || !database) {
			overall = 'degraded';
		}

		return {
			overall,
			backend,
			database,
			lastCheck: new Date()
		};
	}

	/**
	 * Run comprehensive health check with detailed results
	 */
	async runFullHealthCheck(): Promise<TestResult[]> {
		const results: TestResult[] = [];
		const testId = () => Math.random().toString(36).substring(2, 15);

		// Skip tests in test environment
		if (import.meta.env.VITEST || import.meta.env.NODE_ENV === 'test') {
			results.push({
				id: testId(),
				name: 'Test Environment Check',
				status: 'warning',
				message: '🧪 Skipped API calls in test environment',
				timestamp: new Date()
			});
			return results;
		}

		// Test 1: Basic connection
		try {
			const connectionResult = await this.testConnection();
			results.push({
				id: testId(),
				name: 'Backend Connection',
				status: connectionResult.success ? 'success' : 'error',
				message: connectionResult.success
					? '✅ Backend connection successful'
					: `❌ Connection failed: ${connectionResult.details || 'Unknown error'}`,
				timestamp: new Date()
			});

			// Only continue with other tests if basic connection succeeded
			if (!connectionResult.success) {
				throw new Error('Basic connection failed');
			}
		} catch (error) {
			results.push({
				id: testId(),
				name: 'Backend Connection',
				status: 'error',
				message: `❌ Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
				timestamp: new Date()
			});
			return results; // Stop here if connection failed
		}

		// Test 2: Projects endpoint
		try {
			const projectsResult = await this.testProjectsEndpoint();
			if (projectsResult.success && projectsResult.data) {
				const totalCount = projectsResult.data.projects?.totalCount || 0;
				results.push({
					id: testId(),
					name: 'Projects Query',
					status: 'success',
					message: `✅ Projects query successful: ${totalCount} total projects`,
					timestamp: new Date()
				});
			} else {
				results.push({
					id: testId(),
					name: 'Projects Query',
					status: 'error',
					message: `❌ Projects query failed: ${projectsResult.error?.message || 'Unknown error'}`,
					timestamp: new Date()
				});
			}
		} catch (error) {
			results.push({
				id: testId(),
				name: 'Projects Query',
				status: 'error',
				message: `❌ Projects query error: ${error instanceof Error ? error.message : 'Unknown error'}`,
				timestamp: new Date()
			});
		}

		// Test 3: Images endpoint
		try {
			const imagesResult = await api.images.getImages(5, 0);
			if (imagesResult.error) {
				results.push({
					id: testId(),
					name: 'Images Query',
					status: 'error',
					message: `❌ Images query failed: ${imagesResult.error.message}`,
					timestamp: new Date()
				});
			} else {
				const totalCount = imagesResult.data?.images?.totalCount || 0;
				results.push({
					id: testId(),
					name: 'Images Query',
					status: 'success',
					message: `✅ Images query successful: ${totalCount} total images`,
					timestamp: new Date()
				});
			}
		} catch (error) {
			results.push({
				id: testId(),
				name: 'Images Query',
				status: 'error',
				message: `❌ Images query error: ${error instanceof Error ? error.message : 'Unknown error'}`,
				timestamp: new Date()
			});
		}

		// Test 4: Tasks endpoint
		try {
			const tasksResult = await api.tasks.getTasks(5, 0);
			if (tasksResult.error) {
				results.push({
					id: testId(),
					name: 'Tasks Query',
					status: 'error',
					message: `❌ Tasks query failed: ${tasksResult.error.message}`,
					timestamp: new Date()
				});
			} else {
				const totalCount = tasksResult.data?.tasks?.totalCount || 0;
				results.push({
					id: testId(),
					name: 'Tasks Query',
					status: 'success',
					message: `✅ Tasks query successful: ${totalCount} total tasks`,
					timestamp: new Date()
				});
			}
		} catch (error) {
			results.push({
				id: testId(),
				name: 'Tasks Query',
				status: 'error',
				message: `❌ Tasks query error: ${error instanceof Error ? error.message : 'Unknown error'}`,
				timestamp: new Date()
			});
		}

		return results;
	}
}

// Export singleton instance
export const connectionService = new ConnectionServiceImpl();
