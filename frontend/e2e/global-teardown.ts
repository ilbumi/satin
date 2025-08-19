import { testGraphQLClient } from './utils/graphql-client';

/**
 * Global teardown function that runs once after all tests
 * Cleans up test data from the database
 */
async function globalTeardown() {
	console.log('Running global teardown...');

	// Query for all projects
	const GET_PROJECTS_QUERY = `
		query GetProjects {
			projects(limit: 100, offset: 0) {
				objects {
					id
					name
				}
			}
		}
	`;

	// Query for all images
	const GET_IMAGES_QUERY = `
		query GetImages {
			images(limit: 100, offset: 0) {
				objects {
					id
					url
				}
			}
		}
	`;

	const DELETE_PROJECT_MUTATION = `
		mutation DeleteProject($id: ID!) {
			deleteProject(id: $id)
		}
	`;

	const DELETE_IMAGE_MUTATION = `
		mutation DeleteImage($id: ID!) {
			deleteImage(id: $id)
		}
	`;

	try {
		// Clean up images first (especially any with invalid URLs)
		try {
			const imageResult = await testGraphQLClient.query(GET_IMAGES_QUERY, {}).toPromise();

			if (!imageResult.error && imageResult.data?.images?.objects) {
				const images = imageResult.data.images.objects;
				console.log(`Found ${images.length} images to clean up`);

				for (const image of images) {
					try {
						await testGraphQLClient.mutation(DELETE_IMAGE_MUTATION, { id: image.id }).toPromise();
						console.log(`Deleted image: ${image.id}`);
					} catch (error) {
						console.log(`Error deleting image ${image.id}:`, error);
					}
				}
			}
		} catch (error) {
			console.log('Error cleaning up images (some may have invalid URLs):', error);
		}

		// Get all projects
		const result = await testGraphQLClient.query(GET_PROJECTS_QUERY, {}).toPromise();

		if (!result.error && result.data?.projects?.objects) {
			const projects = result.data.projects.objects;
			console.log(`Found ${projects.length} projects to clean up`);

			// Delete each project
			for (const project of projects) {
				try {
					await testGraphQLClient.mutation(DELETE_PROJECT_MUTATION, { id: project.id }).toPromise();
					console.log(`Deleted project: ${project.name}`);
				} catch (error) {
					console.log(`Error deleting project ${project.name}:`, error);
				}
			}
		}
	} catch (error) {
		console.log('Error during teardown:', error);
	}

	console.log('Global teardown completed');
}

export default globalTeardown;
