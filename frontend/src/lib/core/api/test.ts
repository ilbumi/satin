/**
 * Test utilities for GraphQL connectivity
 */

import { testConnection, api } from './index';
import { env } from '$lib/config';

/**
 * Run all connectivity tests
 */
export async function runConnectivityTests(): Promise<void> {
	// Skip connectivity tests in test environment
	if (import.meta.env.VITEST || import.meta.env.NODE_ENV === 'test') {
		return;
	}

	if (env.isDevelopment) {
		console.log('🧪 Running GraphQL connectivity tests...');
	}

	// Test 1: Basic connection
	if (env.isDevelopment) {
		console.log('1. Testing basic connection...');
	}
	try {
		const connected = await testConnection();
		if (connected) {
			if (env.isDevelopment) {
				console.log('✅ Basic connection successful');
			}
		} else {
			if (env.isDevelopment) {
				console.log('❌ Basic connection failed');
			}
			return;
		}
	} catch (error) {
		if (env.isDevelopment) {
			console.log('❌ Basic connection error:', error);
		}
		return;
	}

	// Test 2: Projects query
	if (env.isDevelopment) {
		console.log('2. Testing projects query...');
	}
	try {
		const result = await api.projects.getProjects(5, 0);
		if (result.error) {
			if (env.isDevelopment) {
				console.log('❌ Projects query failed:', result.error.message);
			}
		} else {
			if (env.isDevelopment) {
				console.log('✅ Projects query successful:', {
					count: result.data?.projects?.count || 0,
					totalCount: result.data?.projects?.totalCount || 0
				});
			}
		}
	} catch (error) {
		if (env.isDevelopment) {
			console.log('❌ Projects query error:', error);
		}
	}

	// Test 3: Images query
	if (env.isDevelopment) {
		console.log('3. Testing images query...');
	}
	try {
		const result = await api.images.getImages(5, 0);
		if (result.error) {
			if (env.isDevelopment) {
				console.log('❌ Images query failed:', result.error.message);
			}
		} else {
			if (env.isDevelopment) {
				console.log('✅ Images query successful:', {
					count: result.data?.images?.count || 0,
					totalCount: result.data?.images?.totalCount || 0
				});
			}
		}
	} catch (error) {
		if (env.isDevelopment) {
			console.log('❌ Images query error:', error);
		}
	}

	// Test 4: Tasks query
	if (env.isDevelopment) {
		console.log('4. Testing tasks query...');
	}
	try {
		const result = await api.tasks.getTasks(5, 0);
		if (result.error) {
			if (env.isDevelopment) {
				console.log('❌ Tasks query failed:', result.error.message);
			}
		} else {
			if (env.isDevelopment) {
				console.log('✅ Tasks query successful:', {
					count: result.data?.tasks?.count || 0,
					totalCount: result.data?.tasks?.totalCount || 0
				});
			}
		}
	} catch (error) {
		if (env.isDevelopment) {
			console.log('❌ Tasks query error:', error);
		}
	}

	if (env.isDevelopment) {
		console.log('🏁 GraphQL connectivity tests completed!');
	}
}

/**
 * Test individual query
 */
export async function testQuery(queryName: string): Promise<void> {
	switch (queryName) {
		case 'projects': {
			const projectsResult = await api.projects.getProjects();
			if (env.isDevelopment) {
				console.log('Projects result:', projectsResult);
			}
			break;
		}
		case 'images': {
			const imagesResult = await api.images.getImages();
			if (env.isDevelopment) {
				console.log('Images result:', imagesResult);
			}
			break;
		}
		case 'tasks': {
			const tasksResult = await api.tasks.getTasks();
			if (env.isDevelopment) {
				console.log('Tasks result:', tasksResult);
			}
			break;
		}
		default:
			if (env.isDevelopment) {
				console.log('Unknown query:', queryName);
			}
	}
}
