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

	console.log('Backend is ready, seeding test data...');

	// Create test projects that are expected by the tests
	const CREATE_PROJECT_MUTATION = `
		mutation CreateProject($name: String!, $description: String!) {
			createProject(name: $name, description: $description) {
				id
				name
				description
			}
		}
	`;

	// Create "Medical Images Dataset" project
	try {
		const medicalResult = await testGraphQLClient
			.mutation(CREATE_PROJECT_MUTATION, {
				name: 'Medical Images Dataset',
				description:
					'A comprehensive dataset of medical imaging data for AI training and research purposes.'
			})
			.toPromise();

		if (medicalResult.error) {
			console.log('Medical project might already exist:', medicalResult.error.message);
		} else {
			console.log('Created Medical Images Dataset project');
		}
	} catch (error) {
		console.log('Error creating Medical project:', error);
	}

	// Create "Vehicle Detection" project
	try {
		const vehicleResult = await testGraphQLClient
			.mutation(CREATE_PROJECT_MUTATION, {
				name: 'Vehicle Detection',
				description:
					'Dataset for training vehicle detection models with various types of vehicles and road conditions.'
			})
			.toPromise();

		if (vehicleResult.error) {
			console.log('Vehicle project might already exist:', vehicleResult.error.message);
		} else {
			console.log('Created Vehicle Detection project');
		}
	} catch (error) {
		console.log('Error creating Vehicle project:', error);
	}

	// Create a few more test projects for variety
	const additionalProjects = [
		{
			name: 'Wildlife Conservation',
			description: 'Tracking and identifying endangered species through camera trap images.'
		},
		{
			name: 'Agricultural Monitoring',
			description: 'Satellite and drone imagery for crop health assessment and yield prediction.'
		}
	];

	for (const project of additionalProjects) {
		try {
			await testGraphQLClient.mutation(CREATE_PROJECT_MUTATION, project).toPromise();
			console.log(`Created ${project.name} project`);
		} catch (error) {
			console.log(`Error creating ${project.name}:`, error);
		}
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

	// Create a few test images using data URLs
	const testImages = [
		'data:image/svg+xml;base64,' +
			btoa(`
			<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
				<rect width="800" height="600" fill="#ff6b6b" />
				<text x="400" y="300" text-anchor="middle" dominant-baseline="middle"
				      font-family="Arial" font-size="24" fill="white">
					Sample Medical Image 1
				</text>
			</svg>
		`),
		'data:image/svg+xml;base64,' +
			btoa(`
			<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
				<rect width="800" height="600" fill="#4ecdc4" />
				<text x="400" y="300" text-anchor="middle" dominant-baseline="middle"
				      font-family="Arial" font-size="24" fill="white">
					Sample Vehicle Image 1
				</text>
			</svg>
		`),
		'data:image/svg+xml;base64,' +
			btoa(`
			<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
				<rect width="800" height="600" fill="#45b7d1" />
				<text x="400" y="300" text-anchor="middle" dominant-baseline="middle"
				      font-family="Arial" font-size="24" fill="white">
					Sample Wildlife Image 1
				</text>
			</svg>
		`)
	];

	for (let i = 0; i < testImages.length; i++) {
		try {
			await testGraphQLClient.mutation(CREATE_IMAGE_MUTATION, { url: testImages[i] }).toPromise();
			console.log(`Created test image ${i + 1}`);
		} catch (error) {
			console.log(`Error creating test image ${i + 1}:`, error);
		}
	}

	console.log('Global setup completed');
}

export default globalSetup;
