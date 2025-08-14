// GraphQL API types
export interface GraphQLResponse<T> {
	data?: T;
	errors?: Array<{
		message: string;
		locations?: Array<{ line: number; column: number }>;
		path?: string[];
	}>;
}

export interface GraphQLVariables {
	[key: string]: unknown;
}

// Query response types
export interface GetProjectsResponse {
	projects: {
		objects: Array<{
			id: string;
			name: string;
			description: string;
		}>;
		count: number;
		limit: number;
		offset: number;
	};
}

export interface GetImagesResponse {
	images: {
		objects: Array<{
			id: string;
			url: string;
		}>;
		count: number;
		limit: number;
		offset: number;
	};
}

export interface GetTasksResponse {
	tasks: {
		objects: Array<{
			id: string;
			image: { id: string; url: string };
			project: { id: string; name: string; description: string };
			bboxes: Array<{
				x: number;
				y: number;
				width: number;
				height: number;
				annotation: {
					text?: string;
					tags?: string[];
				};
			}>;
			status: string;
			createdAt: string;
		}>;
		count: number;
		limit: number;
		offset: number;
	};
}

// Mutation response types
export interface CreateProjectResponse {
	createProject: {
		id: string;
		name: string;
		description: string;
	};
}

export interface UpdateProjectResponse {
	updateProject: {
		id: string;
		name: string;
		description: string;
	};
}

export interface DeleteProjectResponse {
	deleteProject: {
		success: boolean;
	};
}

export interface CreateTaskResponse {
	createTask: {
		id: string;
		image: { id: string; url: string };
		project: { id: string; name: string; description: string };
		bboxes: Array<{
			x: number;
			y: number;
			width: number;
			height: number;
			annotation: {
				text?: string;
				tags?: string[];
			};
		}>;
		status: string;
		createdAt: string;
	};
}

export interface UpdateTaskResponse {
	updateTask: {
		id: string;
		image: { id: string; url: string };
		project: { id: string; name: string; description: string };
		bboxes: Array<{
			x: number;
			y: number;
			width: number;
			height: number;
			annotation: {
				text?: string;
				tags?: string[];
			};
		}>;
		status: string;
		createdAt: string;
	};
}

// Request variable types
export interface PaginationVariables {
	limit?: number;
	offset?: number;
}

export interface CreateProjectVariables {
	name: string;
	description: string;
}

export interface UpdateProjectVariables {
	id: string;
	name: string;
	description: string;
}

export interface DeleteProjectVariables {
	id: string;
}

export interface CreateTaskVariables {
	imageId: string;
	projectId: string;
	bboxes: Array<{
		x: number;
		y: number;
		width: number;
		height: number;
		annotation: {
			text?: string;
			tags?: string[];
		};
	}>;
	status: string;
}

export interface UpdateTaskVariables {
	id: string;
	bboxes: Array<{
		x: number;
		y: number;
		width: number;
		height: number;
		annotation: {
			text?: string;
			tags?: string[];
		};
	}>;
}

export interface GetTaskByImageAndProjectVariables {
	imageId: string;
	projectId: string;
}
