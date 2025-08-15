/**
 * GraphQL query and mutation definitions
 * These will be used by the code generator when we add documents back to the config
 */

// Project queries
export const GET_PROJECT = /* GraphQL */ `
	query GetProject($id: ID!) {
		project(id: $id) {
			id
			name
			description
		}
	}
`;

export const GET_PROJECTS = /* GraphQL */ `
	query GetProjects($limit: Int = 10, $offset: Int = 0, $query: QueryInput) {
		projects(limit: $limit, offset: $offset, query: $query) {
			objects {
				id
				name
				description
			}
			totalCount
			count
			limit
			offset
			hasMore
		}
	}
`;

// Image queries
export const GET_IMAGE = /* GraphQL */ `
	query GetImage($id: ID!) {
		image(id: $id) {
			id
			url
		}
	}
`;

export const GET_IMAGES = /* GraphQL */ `
	query GetImages($limit: Int = 10, $offset: Int = 0, $query: QueryInput) {
		images(limit: $limit, offset: $offset, query: $query) {
			objects {
				id
				url
			}
			totalCount
			count
			limit
			offset
			hasMore
		}
	}
`;

// Task queries
export const GET_TASK = /* GraphQL */ `
	query GetTask($id: ID!) {
		task(id: $id) {
			id
			status
			createdAt
			image {
				id
				url
			}
			project {
				id
				name
				description
			}
			bboxes {
				x
				y
				width
				height
				annotation {
					text
					tags
				}
			}
		}
	}
`;

export const GET_TASKS = /* GraphQL */ `
	query GetTasks($limit: Int = 10, $offset: Int = 0, $query: QueryInput) {
		tasks(limit: $limit, offset: $offset, query: $query) {
			objects {
				id
				status
				createdAt
				image {
					id
					url
				}
				project {
					id
					name
					description
				}
				bboxes {
					x
					y
					width
					height
					annotation {
						text
						tags
					}
				}
			}
			totalCount
			count
			limit
			offset
			hasMore
		}
	}
`;

export const GET_TASK_BY_IMAGE_AND_PROJECT = /* GraphQL */ `
	query GetTaskByImageAndProject($imageId: ID!, $projectId: ID!) {
		taskByImageAndProject(imageId: $imageId, projectId: $projectId) {
			id
			status
			createdAt
			image {
				id
				url
			}
			project {
				id
				name
				description
			}
			bboxes {
				x
				y
				width
				height
				annotation {
					text
					tags
				}
			}
		}
	}
`;

// Project mutations
export const CREATE_PROJECT = /* GraphQL */ `
	mutation CreateProject($name: String!, $description: String!) {
		createProject(name: $name, description: $description) {
			id
			name
			description
		}
	}
`;

export const UPDATE_PROJECT = /* GraphQL */ `
	mutation UpdateProject($id: ID!, $name: String, $description: String) {
		updateProject(id: $id, name: $name, description: $description) {
			id
			name
			description
		}
	}
`;

export const DELETE_PROJECT = /* GraphQL */ `
	mutation DeleteProject($id: ID!) {
		deleteProject(id: $id)
	}
`;

// Image mutations
export const CREATE_IMAGE = /* GraphQL */ `
	mutation CreateImage($url: String!) {
		createImage(url: $url) {
			id
			url
		}
	}
`;

export const UPDATE_IMAGE = /* GraphQL */ `
	mutation UpdateImage($id: ID!, $url: String) {
		updateImage(id: $id, url: $url) {
			id
			url
		}
	}
`;

export const DELETE_IMAGE = /* GraphQL */ `
	mutation DeleteImage($id: ID!) {
		deleteImage(id: $id)
	}
`;

// Task mutations
export const CREATE_TASK = /* GraphQL */ `
	mutation CreateTask(
		$imageId: ID!
		$projectId: ID!
		$bboxes: [BBoxInput!]
		$status: TaskStatus = DRAFT
	) {
		createTask(imageId: $imageId, projectId: $projectId, bboxes: $bboxes, status: $status) {
			id
			status
			createdAt
			image {
				id
				url
			}
			project {
				id
				name
				description
			}
			bboxes {
				x
				y
				width
				height
				annotation {
					text
					tags
				}
			}
		}
	}
`;

export const UPDATE_TASK = /* GraphQL */ `
	mutation UpdateTask(
		$id: ID!
		$imageId: ID
		$projectId: ID
		$bboxes: [BBoxInput!]
		$status: TaskStatus
	) {
		updateTask(
			id: $id
			imageId: $imageId
			projectId: $projectId
			bboxes: $bboxes
			status: $status
		) {
			id
			status
			createdAt
			image {
				id
				url
			}
			project {
				id
				name
				description
			}
			bboxes {
				x
				y
				width
				height
				annotation {
					text
					tags
				}
			}
		}
	}
`;

export const DELETE_TASK = /* GraphQL */ `
	mutation DeleteTask($id: ID!) {
		deleteTask(id: $id)
	}
`;
