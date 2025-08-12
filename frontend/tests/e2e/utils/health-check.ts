/**
 * Health check utilities for ensuring services are ready before running tests
 */

interface HealthCheckOptions {
	maxRetries?: number;
	retryDelay?: number;
	timeout?: number;
}

interface ServiceStatus {
	name: string;
	url: string;
	healthy: boolean;
	error?: string;
	responseTime?: number;
}

/**
 * Check if a URL is responding
 */
async function checkUrl(url: string, timeout = 5000): Promise<{ healthy: boolean; error?: string; responseTime: number }> {
	const startTime = Date.now();

	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeout);

		const response = await fetch(url, {
			signal: controller.signal,
			method: 'GET'
		});

		clearTimeout(timeoutId);
		const responseTime = Date.now() - startTime;

		if (response.ok) {
			return { healthy: true, responseTime };
		} else {
			return {
				healthy: false,
				error: `HTTP ${response.status}: ${response.statusText}`,
				responseTime
			};
		}
	} catch (error) {
		const responseTime = Date.now() - startTime;
		return {
			healthy: false,
			error: error instanceof Error ? error.message : 'Unknown error',
			responseTime
		};
	}
}

/**
 * Check if GraphQL endpoint is responding with a schema introspection query
 */
async function checkGraphQL(url: string, timeout = 5000): Promise<{ healthy: boolean; error?: string; responseTime: number }> {
	const startTime = Date.now();

	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeout);

		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				query: '{ __schema { types { name } } }'
			}),
			signal: controller.signal
		});

		clearTimeout(timeoutId);
		const responseTime = Date.now() - startTime;

		if (response.ok) {
			const data = await response.json();
			if (data.data && data.data.__schema && data.data.__schema.types) {
				return { healthy: true, responseTime };
			} else {
				return {
					healthy: false,
					error: 'GraphQL schema introspection failed',
					responseTime
				};
			}
		} else {
			return {
				healthy: false,
				error: `HTTP ${response.status}: ${response.statusText}`,
				responseTime
			};
		}
	} catch (error) {
		const responseTime = Date.now() - startTime;
		return {
			healthy: false,
			error: error instanceof Error ? error.message : 'Unknown error',
			responseTime
		};
	}
}

/**
 * Wait for a service to become healthy with retry logic
 */
async function waitForService(
	name: string,
	checkFunction: () => Promise<{ healthy: boolean; error?: string; responseTime: number }>,
	options: HealthCheckOptions = {}
): Promise<ServiceStatus> {
	const { maxRetries = 30, retryDelay = 2000, timeout = 5000 } = options;

	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		console.log(`Checking ${name} (attempt ${attempt}/${maxRetries})...`);

		const result = await checkFunction();

		if (result.healthy) {
			console.log(`✅ ${name} is healthy (${result.responseTime}ms)`);
			return {
				name,
				url: '',
				healthy: true,
				responseTime: result.responseTime
			};
		}

		console.log(`❌ ${name} not ready: ${result.error} (${result.responseTime}ms)`);

		if (attempt < maxRetries) {
			console.log(`⏳ Waiting ${retryDelay}ms before retry...`);
			await new Promise(resolve => setTimeout(resolve, retryDelay));
		}
	}

	return {
		name,
		url: '',
		healthy: false,
		error: `Service did not become healthy after ${maxRetries} attempts`
	};
}

/**
 * Check health of backend API endpoint
 */
export async function checkBackendHealth(baseUrl = 'http://localhost:8000', options?: HealthCheckOptions): Promise<ServiceStatus> {
	const healthUrl = `${baseUrl}/health`;

	return waitForService(
		'Backend Health',
		() => checkUrl(healthUrl, options?.timeout),
		options
	);
}

/**
 * Check health of GraphQL endpoint
 */
export async function checkGraphQLHealth(baseUrl = 'http://localhost:8000', options?: HealthCheckOptions): Promise<ServiceStatus> {
	const graphqlUrl = `${baseUrl}/graphql`;

	return waitForService(
		'GraphQL Endpoint',
		() => checkGraphQL(graphqlUrl, options?.timeout),
		options
	);
}

/**
 * Check health of frontend application
 */
export async function checkFrontendHealth(baseUrl = 'http://localhost:5173', options?: HealthCheckOptions): Promise<ServiceStatus> {
	return waitForService(
		'Frontend Application',
		() => checkUrl(baseUrl, options?.timeout),
		options
	);
}

/**
 * Check all services and return their status
 */
export async function checkAllServices(
	backendUrl = 'http://localhost:8000',
	frontendUrl = 'http://localhost:5173',
	options?: HealthCheckOptions
): Promise<ServiceStatus[]> {
	console.log('🔍 Checking all services...');

	const results = await Promise.all([
		checkBackendHealth(backendUrl, options),
		checkGraphQLHealth(backendUrl, options),
		checkFrontendHealth(frontendUrl, options)
	]);

	const allHealthy = results.every(result => result.healthy);

	if (allHealthy) {
		console.log('🎉 All services are healthy!');
	} else {
		console.log('❌ Some services are not healthy:');
		results.filter(result => !result.healthy).forEach(result => {
			console.log(`  - ${result.name}: ${result.error}`);
		});
	}

	return results;
}

/**
 * Validate that all required services are running before tests
 * Throws an error if any service is not healthy
 */
export async function validateTestEnvironment(
	backendUrl = 'http://localhost:8000',
	frontendUrl = 'http://localhost:5173',
	options?: HealthCheckOptions
): Promise<void> {
	const results = await checkAllServices(backendUrl, frontendUrl, options);

	const unhealthyServices = results.filter(result => !result.healthy);

	if (unhealthyServices.length > 0) {
		const errorMessage = `Test environment validation failed. Unhealthy services:\n${
			unhealthyServices.map(service => `- ${service.name}: ${service.error}`).join('\n')
		}`;

		throw new Error(errorMessage);
	}
}
