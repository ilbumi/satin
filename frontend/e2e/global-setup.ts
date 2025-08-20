import { testGraphQLClient } from './utils/graphql-client';

/**
 * Global setup function that runs once before all tests
 * Seeds the database with initial test data
 */
async function globalSetup() {
	console.log('Running global setup...');

	// Wait for backend to be ready
	let backendReady = false;
	const maxAttempts = 30;

	for (let i = 0; i < maxAttempts; i++) {
		try {
			const result = await testGraphQLClient.query('{ __typename }', {}).toPromise();
			if (!result.error && result.data?.__typename === 'Query') {
				backendReady = true;
				break;
			}
		} catch {
			// Continue trying
		}
		await new Promise((resolve) => setTimeout(resolve, 1000));
	}

	if (!backendReady) {
		throw new Error('Backend did not become ready within 30 seconds');
	}

	console.log('Backend is ready, testing database connectivity...');

	// Test database connectivity by trying to create a project
	const CREATE_PROJECT_MUTATION = `
		mutation CreateProject($name: String!, $description: String!) {
			createProject(name: $name, description: $description) {
				id
				name
				description
			}
		}
	`;

	// Test database connectivity with a simple project creation
	try {
		const testResult = await testGraphQLClient
			.mutation(CREATE_PROJECT_MUTATION, {
				name: `DB-Test-${Date.now()}`,
				description: 'Database connectivity test'
			})
			.toPromise();

		if (testResult.error) {
			throw new Error(`Database error: ${testResult.error.message}`);
		}
		console.log('Database connectivity verified');
	} catch (error) {
		console.error('Fatal: Database is not accessible:', error);
		throw new Error('Database setup failed - cannot run tests without database connection');
	}

	console.log('Seeding initial test data...');

	// Create "Medical Images Dataset" project with unique name
	const medicalResult = await testGraphQLClient
		.mutation(CREATE_PROJECT_MUTATION, {
			name: `Medical Images Dataset-${Date.now()}`,
			description:
				'A comprehensive dataset of medical imaging data for AI training and research purposes.'
		})
		.toPromise();

	if (medicalResult.error) {
		throw new Error(`Failed to create Medical project: ${medicalResult.error.message}`);
	}
	console.log('Created Medical Images Dataset project');

	// Add small delay to avoid rate limiting
	await new Promise((resolve) => setTimeout(resolve, 200));

	// Create "Vehicle Detection" project with unique name
	const vehicleResult = await testGraphQLClient
		.mutation(CREATE_PROJECT_MUTATION, {
			name: `Vehicle Detection-${Date.now()}`,
			description:
				'Dataset for training vehicle detection models with various types of vehicles and road conditions.'
		})
		.toPromise();

	if (vehicleResult.error) {
		throw new Error(`Failed to create Vehicle project: ${vehicleResult.error.message}`);
	}
	console.log('Created Vehicle Detection project');

	// Create a few more test projects for variety with unique names
	const additionalProjects = [
		{
			name: `Wildlife Conservation-${Date.now()}`,
			description: 'Tracking and identifying endangered species through camera trap images.'
		},
		{
			name: `Agricultural Monitoring-${Date.now()}`,
			description: 'Satellite and drone imagery for crop health assessment and yield prediction.'
		}
	];

	for (const project of additionalProjects) {
		// Add delay between project creations to avoid rate limiting
		await new Promise((resolve) => setTimeout(resolve, 200));

		const result = await testGraphQLClient.mutation(CREATE_PROJECT_MUTATION, project).toPromise();
		if (result.error) {
			throw new Error(`Failed to create ${project.name}: ${result.error.message}`);
		}
		console.log(`Created ${project.name} project`);
	}

	// Create test images
	const CREATE_IMAGE_MUTATION = `
		mutation CreateImage($url: String!) {
			createImage(url: $url) {
				id
				url
			}
		}
	`;

	// Create a few test images using data URLs with unique timestamps
	const timestamp = Date.now();
	const testImages = [
		'data:image/svg+xml;base64,' +
			btoa(`<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
				<rect width="800" height="600" fill="#ff6b6b" />
				<text x="400" y="300" text-anchor="middle" dominant-baseline="middle"
				      font-family="Arial" font-size="24" fill="white">
					Sample Medical Image 1 - ${timestamp}
				</text>
			</svg>`),
		'data:image/svg+xml;base64,' +
			btoa(`<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
				<rect width="800" height="600" fill="#4ecdc4" />
				<text x="400" y="300" text-anchor="middle" dominant-baseline="middle"
				      font-family="Arial" font-size="24" fill="white">
					Sample Vehicle Image 1 - ${timestamp}
				</text>
			</svg>`)
	];

	for (let i = 0; i < testImages.length; i++) {
		const result = await testGraphQLClient
			.mutation(CREATE_IMAGE_MUTATION, { url: testImages[i] })
			.toPromise();
		if (result.error) {
			throw new Error(`Failed to create test image ${i + 1}: ${result.error.message}`);
		}
		console.log(`Created test image ${i + 1}`);
	}

	console.log('Global setup completed');
}

export default globalSetup;
