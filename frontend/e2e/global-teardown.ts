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

	// Query for all tasks
	const GET_TASKS_QUERY = `
		query GetTasks {
			tasks(limit: 100, offset: 0) {
				objects {
					id
					status
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

	const DELETE_TASK_MUTATION = `
		mutation DeleteTask($id: ID!) {
			deleteTask(id: $id)
		}
	`;

	try {
		// Clean up tasks first (they reference images and projects)
		try {
			const taskResult = await testGraphQLClient.query(GET_TASKS_QUERY, {}).toPromise();

			if (!taskResult.error && taskResult.data?.tasks?.objects) {
				const tasks = taskResult.data.tasks.objects;
				console.log(`Found ${tasks.length} tasks to clean up`);

				for (const task of tasks) {
					try {
						await testGraphQLClient.mutation(DELETE_TASK_MUTATION, { id: task.id }).toPromise();
						console.log(`Deleted task: ${task.id}`);
					} catch (error) {
						console.log(`Error deleting task ${task.id}:`, error);
					}
				}
			}
		} catch (error) {
			console.log('Error cleaning up tasks:', error);
		}

		// Clean up images second (after tasks are removed)
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

		// Get all projects last (after tasks are removed)
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
