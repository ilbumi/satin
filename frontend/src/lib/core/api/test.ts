/**
 * Test utilities for GraphQL connectivity
 */

import { testConnection, api } from './index';

/**
 * Run all connectivity tests
 */
export async function runConnectivityTests(): Promise<void> {
	console.log('🧪 Running GraphQL connectivity tests...');

	// Test 1: Basic connection
	console.log('1. Testing basic connection...');
	try {
		const connected = await testConnection();
		if (connected) {
			console.log('✅ Basic connection successful');
		} else {
			console.log('❌ Basic connection failed');
			return;
		}
	} catch (error) {
		console.log('❌ Basic connection error:', error);
		return;
	}

	// Test 2: Projects query
	console.log('2. Testing projects query...');
	try {
		const result = await api.projects.getProjects(5, 0);
		if (result.error) {
			console.log('❌ Projects query failed:', result.error.message);
		} else {
			console.log('✅ Projects query successful:', {
				count: result.data?.projects?.count || 0,
				totalCount: result.data?.projects?.totalCount || 0
			});
		}
	} catch (error) {
		console.log('❌ Projects query error:', error);
	}

	// Test 3: Images query
	console.log('3. Testing images query...');
	try {
		const result = await api.images.getImages(5, 0);
		if (result.error) {
			console.log('❌ Images query failed:', result.error.message);
		} else {
			console.log('✅ Images query successful:', {
				count: result.data?.images?.count || 0,
				totalCount: result.data?.images?.totalCount || 0
			});
		}
	} catch (error) {
		console.log('❌ Images query error:', error);
	}

	// Test 4: Tasks query
	console.log('4. Testing tasks query...');
	try {
		const result = await api.tasks.getTasks(5, 0);
		if (result.error) {
			console.log('❌ Tasks query failed:', result.error.message);
		} else {
			console.log('✅ Tasks query successful:', {
				count: result.data?.tasks?.count || 0,
				totalCount: result.data?.tasks?.totalCount || 0
			});
		}
	} catch (error) {
		console.log('❌ Tasks query error:', error);
	}

	console.log('🏁 GraphQL connectivity tests completed!');
}

/**
 * Test individual query
 */
export async function testQuery(queryName: string): Promise<void> {
	switch (queryName) {
		case 'projects': {
			const projectsResult = await api.projects.getProjects();
			console.log('Projects result:', projectsResult);
			break;
		}
		case 'images': {
			const imagesResult = await api.images.getImages();
			console.log('Images result:', imagesResult);
			break;
		}
		case 'tasks': {
			const tasksResult = await api.tasks.getTasks();
			console.log('Tasks result:', tasksResult);
			break;
		}
		default:
			console.log('Unknown query:', queryName);
	}
}
