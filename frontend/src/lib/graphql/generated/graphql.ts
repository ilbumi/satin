export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = {
	[_ in K]?: never;
};
export type Incremental<T> =
	| T
	| { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
	ID: { input: string; output: string };
	String: { input: string; output: string };
	Boolean: { input: boolean; output: boolean };
	Int: { input: number; output: number };
	Float: { input: number; output: number };
	DateTime: { input: string; output: string };
	JSON: { input: unknown; output: unknown };
};

export type Annotation = {
	__typename?: 'Annotation';
	/** List of tags */
	tags?: Maybe<Array<Scalars['String']['output']>>;
	/** Text annotation */
	text?: Maybe<Scalars['String']['output']>;
};

export type AnnotationInput = {
	/** List of tags */
	tags?: InputMaybe<Array<Scalars['String']['input']>>;
	/** Text annotation */
	text?: InputMaybe<Scalars['String']['input']>;
};

export type BBox = {
	__typename?: 'BBox';
	/** Annotation for the bounding box */
	annotation: Annotation;
	/** Height of the bounding box */
	height: Scalars['Float']['output'];
	/** Width of the bounding box */
	width: Scalars['Float']['output'];
	/** X coordinate of the bounding box */
	x: Scalars['Float']['output'];
	/** Y coordinate of the bounding box */
	y: Scalars['Float']['output'];
};

export type BBoxInput = {
	/** Annotation for the bounding box */
	annotation: AnnotationInput;
	/** Height of the bounding box */
	height: Scalars['Float']['input'];
	/** Width of the bounding box */
	width: Scalars['Float']['input'];
	/** X coordinate of the bounding box */
	x: Scalars['Float']['input'];
	/** Y coordinate of the bounding box */
	y: Scalars['Float']['input'];
};

export type Image = {
	__typename?: 'Image';
	/** Unique identifier for the image */
	id: Scalars['String']['output'];
	/** URL of the image */
	url: Scalars['String']['output'];
};

export type ImagePage = {
	__typename?: 'ImagePage';
	count: Scalars['Int']['output'];
	hasMore: Scalars['Boolean']['output'];
	limit: Scalars['Int']['output'];
	objects: Array<Image>;
	offset: Scalars['Int']['output'];
	totalCount: Scalars['Int']['output'];
};

export type ListFilterInput = {
	field: Scalars['String']['input'];
	operator: ListFilterOperatorEnum;
	value: Scalars['JSON']['input'];
};

export type ListFilterOperatorEnum =
	| 'CONTAINS'
	| 'CONTAINS_ALL'
	| 'CONTAINS_ANY'
	| 'SIZE_EQ'
	| 'SIZE_GT'
	| 'SIZE_LT';

export type Mutation = {
	__typename?: 'Mutation';
	createImage: Image;
	createProject: Project;
	createTask: Task;
	deleteImage: Scalars['Boolean']['output'];
	deleteProject: Scalars['Boolean']['output'];
	deleteTask: Scalars['Boolean']['output'];
	updateImage?: Maybe<Image>;
	updateProject?: Maybe<Project>;
	updateTask?: Maybe<Task>;
};

export type MutationCreateImageArgs = {
	url: Scalars['String']['input'];
};

export type MutationCreateProjectArgs = {
	description: Scalars['String']['input'];
	name: Scalars['String']['input'];
};

export type MutationCreateTaskArgs = {
	bboxes?: InputMaybe<Array<BBoxInput>>;
	imageId: Scalars['ID']['input'];
	projectId: Scalars['ID']['input'];
	status?: TaskStatus;
};

export type MutationDeleteImageArgs = {
	id: Scalars['ID']['input'];
};

export type MutationDeleteProjectArgs = {
	id: Scalars['ID']['input'];
};

export type MutationDeleteTaskArgs = {
	id: Scalars['ID']['input'];
};

export type MutationUpdateImageArgs = {
	id: Scalars['ID']['input'];
	url?: InputMaybe<Scalars['String']['input']>;
};

export type MutationUpdateProjectArgs = {
	description?: InputMaybe<Scalars['String']['input']>;
	id: Scalars['ID']['input'];
	name?: InputMaybe<Scalars['String']['input']>;
};

export type MutationUpdateTaskArgs = {
	bboxes?: InputMaybe<Array<BBoxInput>>;
	id: Scalars['ID']['input'];
	imageId?: InputMaybe<Scalars['ID']['input']>;
	projectId?: InputMaybe<Scalars['ID']['input']>;
	status?: InputMaybe<TaskStatus>;
};

export type NumberFilterInput = {
	field: Scalars['String']['input'];
	operator: NumberFilterOperatorEnum;
	value: Scalars['JSON']['input'];
};

export type NumberFilterOperatorEnum = 'EQ' | 'GT' | 'GTE' | 'IN' | 'LT' | 'LTE' | 'NE' | 'NIN';

export type Project = {
	__typename?: 'Project';
	/** Description of the project */
	description: Scalars['String']['output'];
	/** Unique identifier for the project */
	id: Scalars['String']['output'];
	/** Name of the project */
	name: Scalars['String']['output'];
};

export type ProjectPage = {
	__typename?: 'ProjectPage';
	count: Scalars['Int']['output'];
	hasMore: Scalars['Boolean']['output'];
	limit: Scalars['Int']['output'];
	objects: Array<Project>;
	offset: Scalars['Int']['output'];
	totalCount: Scalars['Int']['output'];
};

export type Query = {
	__typename?: 'Query';
	image?: Maybe<Image>;
	images: ImagePage;
	project?: Maybe<Project>;
	projects: ProjectPage;
	task?: Maybe<Task>;
	taskByImageAndProject?: Maybe<Task>;
	tasks: TaskPage;
};

export type QueryImageArgs = {
	id: Scalars['ID']['input'];
};

export type QueryImagesArgs = {
	limit?: Scalars['Int']['input'];
	offset?: Scalars['Int']['input'];
	query?: InputMaybe<QueryInput>;
};

export type QueryProjectArgs = {
	id: Scalars['ID']['input'];
};

export type QueryProjectsArgs = {
	limit?: Scalars['Int']['input'];
	offset?: Scalars['Int']['input'];
	query?: InputMaybe<QueryInput>;
};

export type QueryTaskArgs = {
	id: Scalars['ID']['input'];
};

export type QueryTaskByImageAndProjectArgs = {
	imageId: Scalars['ID']['input'];
	projectId: Scalars['ID']['input'];
};

export type QueryTasksArgs = {
	limit?: Scalars['Int']['input'];
	offset?: Scalars['Int']['input'];
	query?: InputMaybe<QueryInput>;
};

export type QueryInput = {
	limit?: Scalars['Int']['input'];
	listFilters?: Array<ListFilterInput>;
	numberFilters?: Array<NumberFilterInput>;
	offset?: Scalars['Int']['input'];
	sorts?: Array<SortInput>;
	stringFilters?: Array<StringFilterInput>;
};

export type SortDirectionEnum = 'ASC' | 'DESC';

export type SortInput = {
	direction?: SortDirectionEnum;
	field: Scalars['String']['input'];
};

export type StringFilterInput = {
	field: Scalars['String']['input'];
	operator: StringFilterOperatorEnum;
	value: Scalars['JSON']['input'];
};

export type StringFilterOperatorEnum =
	| 'CONTAINS'
	| 'ENDS_WITH'
	| 'EQ'
	| 'IN'
	| 'NE'
	| 'NIN'
	| 'REGEX'
	| 'STARTS_WITH';

export type Task = {
	__typename?: 'Task';
	/** List of bounding boxes */
	bboxes: Array<BBox>;
	/** Creation timestamp */
	createdAt: Scalars['DateTime']['output'];
	/** Unique identifier for the task */
	id: Scalars['String']['output'];
	/** Image associated with the task */
	image: Image;
	/** Project the task belongs to */
	project: Project;
	/** Status of the task */
	status: TaskStatus;
};

export type TaskPage = {
	__typename?: 'TaskPage';
	count: Scalars['Int']['output'];
	hasMore: Scalars['Boolean']['output'];
	limit: Scalars['Int']['output'];
	objects: Array<Task>;
	offset: Scalars['Int']['output'];
	totalCount: Scalars['Int']['output'];
};

export type TaskStatus = 'DRAFT' | 'FINISHED' | 'REVIEWED';

export type GetProjectQueryVariables = Exact<{
	id: Scalars['ID']['input'];
}>;

export type GetProjectQuery = {
	__typename?: 'Query';
	project?: { __typename?: 'Project'; id: string; name: string; description: string } | null;
};

export type GetProjectsQueryVariables = Exact<{
	limit?: InputMaybe<Scalars['Int']['input']>;
	offset?: InputMaybe<Scalars['Int']['input']>;
	query?: InputMaybe<QueryInput>;
}>;

export type GetProjectsQuery = {
	__typename?: 'Query';
	projects: {
		__typename?: 'ProjectPage';
		totalCount: number;
		count: number;
		limit: number;
		offset: number;
		hasMore: boolean;
		objects: Array<{ __typename?: 'Project'; id: string; name: string; description: string }>;
	};
};

export type GetImageQueryVariables = Exact<{
	id: Scalars['ID']['input'];
}>;

export type GetImageQuery = {
	__typename?: 'Query';
	image?: { __typename?: 'Image'; id: string; url: string } | null;
};

export type GetImagesQueryVariables = Exact<{
	limit?: InputMaybe<Scalars['Int']['input']>;
	offset?: InputMaybe<Scalars['Int']['input']>;
	query?: InputMaybe<QueryInput>;
}>;

export type GetImagesQuery = {
	__typename?: 'Query';
	images: {
		__typename?: 'ImagePage';
		totalCount: number;
		count: number;
		limit: number;
		offset: number;
		hasMore: boolean;
		objects: Array<{ __typename?: 'Image'; id: string; url: string }>;
	};
};

export type GetTaskQueryVariables = Exact<{
	id: Scalars['ID']['input'];
}>;

export type GetTaskQuery = {
	__typename?: 'Query';
	task?: {
		__typename?: 'Task';
		id: string;
		status: TaskStatus;
		createdAt: string;
		image: { __typename?: 'Image'; id: string; url: string };
		project: { __typename?: 'Project'; id: string; name: string; description: string };
		bboxes: Array<{
			__typename?: 'BBox';
			x: number;
			y: number;
			width: number;
			height: number;
			annotation: { __typename?: 'Annotation'; text?: string | null; tags?: Array<string> | null };
		}>;
	} | null;
};

export type GetTasksQueryVariables = Exact<{
	limit?: InputMaybe<Scalars['Int']['input']>;
	offset?: InputMaybe<Scalars['Int']['input']>;
	query?: InputMaybe<QueryInput>;
}>;

export type GetTasksQuery = {
	__typename?: 'Query';
	tasks: {
		__typename?: 'TaskPage';
		totalCount: number;
		count: number;
		limit: number;
		offset: number;
		hasMore: boolean;
		objects: Array<{
			__typename?: 'Task';
			id: string;
			status: TaskStatus;
			createdAt: string;
			image: { __typename?: 'Image'; id: string; url: string };
			project: { __typename?: 'Project'; id: string; name: string; description: string };
			bboxes: Array<{
				__typename?: 'BBox';
				x: number;
				y: number;
				width: number;
				height: number;
				annotation: {
					__typename?: 'Annotation';
					text?: string | null;
					tags?: Array<string> | null;
				};
			}>;
		}>;
	};
};

export type GetTaskByImageAndProjectQueryVariables = Exact<{
	imageId: Scalars['ID']['input'];
	projectId: Scalars['ID']['input'];
}>;

export type GetTaskByImageAndProjectQuery = {
	__typename?: 'Query';
	taskByImageAndProject?: {
		__typename?: 'Task';
		id: string;
		status: TaskStatus;
		createdAt: string;
		image: { __typename?: 'Image'; id: string; url: string };
		project: { __typename?: 'Project'; id: string; name: string; description: string };
		bboxes: Array<{
			__typename?: 'BBox';
			x: number;
			y: number;
			width: number;
			height: number;
			annotation: { __typename?: 'Annotation'; text?: string | null; tags?: Array<string> | null };
		}>;
	} | null;
};

export type CreateProjectMutationVariables = Exact<{
	name: Scalars['String']['input'];
	description: Scalars['String']['input'];
}>;

export type CreateProjectMutation = {
	__typename?: 'Mutation';
	createProject: { __typename?: 'Project'; id: string; name: string; description: string };
};

export type UpdateProjectMutationVariables = Exact<{
	id: Scalars['ID']['input'];
	name?: InputMaybe<Scalars['String']['input']>;
	description?: InputMaybe<Scalars['String']['input']>;
}>;

export type UpdateProjectMutation = {
	__typename?: 'Mutation';
	updateProject?: { __typename?: 'Project'; id: string; name: string; description: string } | null;
};

export type DeleteProjectMutationVariables = Exact<{
	id: Scalars['ID']['input'];
}>;

export type DeleteProjectMutation = { __typename?: 'Mutation'; deleteProject: boolean };

export type CreateImageMutationVariables = Exact<{
	url: Scalars['String']['input'];
}>;

export type CreateImageMutation = {
	__typename?: 'Mutation';
	createImage: { __typename?: 'Image'; id: string; url: string };
};

export type UpdateImageMutationVariables = Exact<{
	id: Scalars['ID']['input'];
	url?: InputMaybe<Scalars['String']['input']>;
}>;

export type UpdateImageMutation = {
	__typename?: 'Mutation';
	updateImage?: { __typename?: 'Image'; id: string; url: string } | null;
};

export type DeleteImageMutationVariables = Exact<{
	id: Scalars['ID']['input'];
}>;

export type DeleteImageMutation = { __typename?: 'Mutation'; deleteImage: boolean };

export type CreateTaskMutationVariables = Exact<{
	imageId: Scalars['ID']['input'];
	projectId: Scalars['ID']['input'];
	bboxes?: InputMaybe<Array<BBoxInput> | BBoxInput>;
	status?: InputMaybe<TaskStatus>;
}>;

export type CreateTaskMutation = {
	__typename?: 'Mutation';
	createTask: {
		__typename?: 'Task';
		id: string;
		status: TaskStatus;
		createdAt: string;
		image: { __typename?: 'Image'; id: string; url: string };
		project: { __typename?: 'Project'; id: string; name: string; description: string };
		bboxes: Array<{
			__typename?: 'BBox';
			x: number;
			y: number;
			width: number;
			height: number;
			annotation: { __typename?: 'Annotation'; text?: string | null; tags?: Array<string> | null };
		}>;
	};
};

export type UpdateTaskMutationVariables = Exact<{
	id: Scalars['ID']['input'];
	imageId?: InputMaybe<Scalars['ID']['input']>;
	projectId?: InputMaybe<Scalars['ID']['input']>;
	bboxes?: InputMaybe<Array<BBoxInput> | BBoxInput>;
	status?: InputMaybe<TaskStatus>;
}>;

export type UpdateTaskMutation = {
	__typename?: 'Mutation';
	updateTask?: {
		__typename?: 'Task';
		id: string;
		status: TaskStatus;
		createdAt: string;
		image: { __typename?: 'Image'; id: string; url: string };
		project: { __typename?: 'Project'; id: string; name: string; description: string };
		bboxes: Array<{
			__typename?: 'BBox';
			x: number;
			y: number;
			width: number;
			height: number;
			annotation: { __typename?: 'Annotation'; text?: string | null; tags?: Array<string> | null };
		}>;
	} | null;
};

export type DeleteTaskMutationVariables = Exact<{
	id: Scalars['ID']['input'];
}>;

export type DeleteTaskMutation = { __typename?: 'Mutation'; deleteTask: boolean };

import type { IntrospectionQuery } from 'graphql';
export default {
	__schema: {
		queryType: {
			name: 'Query',
			kind: 'OBJECT'
		},
		mutationType: {
			name: 'Mutation',
			kind: 'OBJECT'
		},
		subscriptionType: null,
		types: [
			{
				kind: 'OBJECT',
				name: 'Annotation',
				fields: [
					{
						name: 'tags',
						type: {
							kind: 'LIST',
							ofType: {
								kind: 'NON_NULL',
								ofType: {
									kind: 'SCALAR',
									name: 'Any'
								}
							}
						},
						args: []
					},
					{
						name: 'text',
						type: {
							kind: 'SCALAR',
							name: 'Any'
						},
						args: []
					}
				],
				interfaces: []
			},
			{
				kind: 'OBJECT',
				name: 'BBox',
				fields: [
					{
						name: 'annotation',
						type: {
							kind: 'NON_NULL',
							ofType: {
								kind: 'OBJECT',
								name: 'Annotation',
								ofType: null
							}
						},
						args: []
					},
					{
						name: 'height',
						type: {
							kind: 'NON_NULL',
							ofType: {
								kind: 'SCALAR',
								name: 'Any'
							}
						},
						args: []
					},
					{
						name: 'width',
						type: {
							kind: 'NON_NULL',
							ofType: {
								kind: 'SCALAR',
								name: 'Any'
							}
						},
						args: []
					},
					{
						name: 'x',
						type: {
							kind: 'NON_NULL',
							ofType: {
								kind: 'SCALAR',
								name: 'Any'
							}
						},
						args: []
					},
					{
						name: 'y',
						type: {
							kind: 'NON_NULL',
							ofType: {
								kind: 'SCALAR',
								name: 'Any'
							}
						},
						args: []
					}
				],
				interfaces: []
			},
			{
				kind: 'OBJECT',
				name: 'Image',
				fields: [
					{
						name: 'id',
						type: {
							kind: 'NON_NULL',
							ofType: {
								kind: 'SCALAR',
								name: 'Any'
							}
						},
						args: []
					},
					{
						name: 'url',
						type: {
							kind: 'NON_NULL',
							ofType: {
								kind: 'SCALAR',
								name: 'Any'
							}
						},
						args: []
					}
				],
				interfaces: []
			},
			{
				kind: 'OBJECT',
				name: 'ImagePage',
				fields: [
					{
						name: 'count',
						type: {
							kind: 'NON_NULL',
							ofType: {
								kind: 'SCALAR',
								name: 'Any'
							}
						},
						args: []
					},
					{
						name: 'hasMore',
						type: {
							kind: 'NON_NULL',
							ofType: {
								kind: 'SCALAR',
								name: 'Any'
							}
						},
						args: []
					},
					{
						name: 'limit',
						type: {
							kind: 'NON_NULL',
							ofType: {
								kind: 'SCALAR',
								name: 'Any'
							}
						},
						args: []
					},
					{
						name: 'objects',
						type: {
							kind: 'NON_NULL',
							ofType: {
								kind: 'LIST',
								ofType: {
									kind: 'NON_NULL',
									ofType: {
										kind: 'OBJECT',
										name: 'Image',
										ofType: null
									}
								}
							}
						},
						args: []
					},
					{
						name: 'offset',
						type: {
							kind: 'NON_NULL',
							ofType: {
								kind: 'SCALAR',
								name: 'Any'
							}
						},
						args: []
					},
					{
						name: 'totalCount',
						type: {
							kind: 'NON_NULL',
							ofType: {
								kind: 'SCALAR',
								name: 'Any'
							}
						},
						args: []
					}
				],
				interfaces: []
			},
			{
				kind: 'OBJECT',
				name: 'Mutation',
				fields: [
					{
						name: 'createImage',
						type: {
							kind: 'NON_NULL',
							ofType: {
								kind: 'OBJECT',
								name: 'Image',
								ofType: null
							}
						},
						args: [
							{
								name: 'url',
								type: {
									kind: 'NON_NULL',
									ofType: {
										kind: 'SCALAR',
										name: 'Any'
									}
								}
							}
						]
					},
					{
						name: 'createProject',
						type: {
							kind: 'NON_NULL',
							ofType: {
								kind: 'OBJECT',
								name: 'Project',
								ofType: null
							}
						},
						args: [
							{
								name: 'description',
								type: {
									kind: 'NON_NULL',
									ofType: {
										kind: 'SCALAR',
										name: 'Any'
									}
								}
							},
							{
								name: 'name',
								type: {
									kind: 'NON_NULL',
									ofType: {
										kind: 'SCALAR',
										name: 'Any'
									}
								}
							}
						]
					},
					{
						name: 'createTask',
						type: {
							kind: 'NON_NULL',
							ofType: {
								kind: 'OBJECT',
								name: 'Task',
								ofType: null
							}
						},
						args: [
							{
								name: 'bboxes',
								type: {
									kind: 'LIST',
									ofType: {
										kind: 'NON_NULL',
										ofType: {
											kind: 'SCALAR',
											name: 'Any'
										}
									}
								}
							},
							{
								name: 'imageId',
								type: {
									kind: 'NON_NULL',
									ofType: {
										kind: 'SCALAR',
										name: 'Any'
									}
								}
							},
							{
								name: 'projectId',
								type: {
									kind: 'NON_NULL',
									ofType: {
										kind: 'SCALAR',
										name: 'Any'
									}
								}
							},
							{
								name: 'status',
								type: {
									kind: 'NON_NULL',
									ofType: {
										kind: 'SCALAR',
										name: 'Any'
									}
								}
							}
						]
					},
					{
						name: 'deleteImage',
						type: {
							kind: 'NON_NULL',
							ofType: {
								kind: 'SCALAR',
								name: 'Any'
							}
						},
						args: [
							{
								name: 'id',
								type: {
									kind: 'NON_NULL',
									ofType: {
										kind: 'SCALAR',
										name: 'Any'
									}
								}
							}
						]
					},
					{
						name: 'deleteProject',
						type: {
							kind: 'NON_NULL',
							ofType: {
								kind: 'SCALAR',
								name: 'Any'
							}
						},
						args: [
							{
								name: 'id',
								type: {
									kind: 'NON_NULL',
									ofType: {
										kind: 'SCALAR',
										name: 'Any'
									}
								}
							}
						]
					},
					{
						name: 'deleteTask',
						type: {
							kind: 'NON_NULL',
							ofType: {
								kind: 'SCALAR',
								name: 'Any'
							}
						},
						args: [
							{
								name: 'id',
								type: {
									kind: 'NON_NULL',
									ofType: {
										kind: 'SCALAR',
										name: 'Any'
									}
								}
							}
						]
					},
					{
						name: 'updateImage',
						type: {
							kind: 'OBJECT',
							name: 'Image',
							ofType: null
						},
						args: [
							{
								name: 'id',
								type: {
									kind: 'NON_NULL',
									ofType: {
										kind: 'SCALAR',
										name: 'Any'
									}
								}
							},
							{
								name: 'url',
								type: {
									kind: 'SCALAR',
									name: 'Any'
								}
							}
						]
					},
					{
						name: 'updateProject',
						type: {
							kind: 'OBJECT',
							name: 'Project',
							ofType: null
						},
						args: [
							{
								name: 'description',
								type: {
									kind: 'SCALAR',
									name: 'Any'
								}
							},
							{
								name: 'id',
								type: {
									kind: 'NON_NULL',
									ofType: {
										kind: 'SCALAR',
										name: 'Any'
									}
								}
							},
							{
								name: 'name',
								type: {
									kind: 'SCALAR',
									name: 'Any'
								}
							}
						]
					},
					{
						name: 'updateTask',
						type: {
							kind: 'OBJECT',
							name: 'Task',
							ofType: null
						},
						args: [
							{
								name: 'bboxes',
								type: {
									kind: 'LIST',
									ofType: {
										kind: 'NON_NULL',
										ofType: {
											kind: 'SCALAR',
											name: 'Any'
										}
									}
								}
							},
							{
								name: 'id',
								type: {
									kind: 'NON_NULL',
									ofType: {
										kind: 'SCALAR',
										name: 'Any'
									}
								}
							},
							{
								name: 'imageId',
								type: {
									kind: 'SCALAR',
									name: 'Any'
								}
							},
							{
								name: 'projectId',
								type: {
									kind: 'SCALAR',
									name: 'Any'
								}
							},
							{
								name: 'status',
								type: {
									kind: 'SCALAR',
									name: 'Any'
								}
							}
						]
					}
				],
				interfaces: []
			},
			{
				kind: 'OBJECT',
				name: 'Project',
				fields: [
					{
						name: 'description',
						type: {
							kind: 'NON_NULL',
							ofType: {
								kind: 'SCALAR',
								name: 'Any'
							}
						},
						args: []
					},
					{
						name: 'id',
						type: {
							kind: 'NON_NULL',
							ofType: {
								kind: 'SCALAR',
								name: 'Any'
							}
						},
						args: []
					},
					{
						name: 'name',
						type: {
							kind: 'NON_NULL',
							ofType: {
								kind: 'SCALAR',
								name: 'Any'
							}
						},
						args: []
					}
				],
				interfaces: []
			},
			{
				kind: 'OBJECT',
				name: 'ProjectPage',
				fields: [
					{
						name: 'count',
						type: {
							kind: 'NON_NULL',
							ofType: {
								kind: 'SCALAR',
								name: 'Any'
							}
						},
						args: []
					},
					{
						name: 'hasMore',
						type: {
							kind: 'NON_NULL',
							ofType: {
								kind: 'SCALAR',
								name: 'Any'
							}
						},
						args: []
					},
					{
						name: 'limit',
						type: {
							kind: 'NON_NULL',
							ofType: {
								kind: 'SCALAR',
								name: 'Any'
							}
						},
						args: []
					},
					{
						name: 'objects',
						type: {
							kind: 'NON_NULL',
							ofType: {
								kind: 'LIST',
								ofType: {
									kind: 'NON_NULL',
									ofType: {
										kind: 'OBJECT',
										name: 'Project',
										ofType: null
									}
								}
							}
						},
						args: []
					},
					{
						name: 'offset',
						type: {
							kind: 'NON_NULL',
							ofType: {
								kind: 'SCALAR',
								name: 'Any'
							}
						},
						args: []
					},
					{
						name: 'totalCount',
						type: {
							kind: 'NON_NULL',
							ofType: {
								kind: 'SCALAR',
								name: 'Any'
							}
						},
						args: []
					}
				],
				interfaces: []
			},
			{
				kind: 'OBJECT',
				name: 'Query',
				fields: [
					{
						name: 'image',
						type: {
							kind: 'OBJECT',
							name: 'Image',
							ofType: null
						},
						args: [
							{
								name: 'id',
								type: {
									kind: 'NON_NULL',
									ofType: {
										kind: 'SCALAR',
										name: 'Any'
									}
								}
							}
						]
					},
					{
						name: 'images',
						type: {
							kind: 'NON_NULL',
							ofType: {
								kind: 'OBJECT',
								name: 'ImagePage',
								ofType: null
							}
						},
						args: [
							{
								name: 'limit',
								type: {
									kind: 'NON_NULL',
									ofType: {
										kind: 'SCALAR',
										name: 'Any'
									}
								}
							},
							{
								name: 'offset',
								type: {
									kind: 'NON_NULL',
									ofType: {
										kind: 'SCALAR',
										name: 'Any'
									}
								}
							},
							{
								name: 'query',
								type: {
									kind: 'SCALAR',
									name: 'Any'
								}
							}
						]
					},
					{
						name: 'project',
						type: {
							kind: 'OBJECT',
							name: 'Project',
							ofType: null
						},
						args: [
							{
								name: 'id',
								type: {
									kind: 'NON_NULL',
									ofType: {
										kind: 'SCALAR',
										name: 'Any'
									}
								}
							}
						]
					},
					{
						name: 'projects',
						type: {
							kind: 'NON_NULL',
							ofType: {
								kind: 'OBJECT',
								name: 'ProjectPage',
								ofType: null
							}
						},
						args: [
							{
								name: 'limit',
								type: {
									kind: 'NON_NULL',
									ofType: {
										kind: 'SCALAR',
										name: 'Any'
									}
								}
							},
							{
								name: 'offset',
								type: {
									kind: 'NON_NULL',
									ofType: {
										kind: 'SCALAR',
										name: 'Any'
									}
								}
							},
							{
								name: 'query',
								type: {
									kind: 'SCALAR',
									name: 'Any'
								}
							}
						]
					},
					{
						name: 'task',
						type: {
							kind: 'OBJECT',
							name: 'Task',
							ofType: null
						},
						args: [
							{
								name: 'id',
								type: {
									kind: 'NON_NULL',
									ofType: {
										kind: 'SCALAR',
										name: 'Any'
									}
								}
							}
						]
					},
					{
						name: 'taskByImageAndProject',
						type: {
							kind: 'OBJECT',
							name: 'Task',
							ofType: null
						},
						args: [
							{
								name: 'imageId',
								type: {
									kind: 'NON_NULL',
									ofType: {
										kind: 'SCALAR',
										name: 'Any'
									}
								}
							},
							{
								name: 'projectId',
								type: {
									kind: 'NON_NULL',
									ofType: {
										kind: 'SCALAR',
										name: 'Any'
									}
								}
							}
						]
					},
					{
						name: 'tasks',
						type: {
							kind: 'NON_NULL',
							ofType: {
								kind: 'OBJECT',
								name: 'TaskPage',
								ofType: null
							}
						},
						args: [
							{
								name: 'limit',
								type: {
									kind: 'NON_NULL',
									ofType: {
										kind: 'SCALAR',
										name: 'Any'
									}
								}
							},
							{
								name: 'offset',
								type: {
									kind: 'NON_NULL',
									ofType: {
										kind: 'SCALAR',
										name: 'Any'
									}
								}
							},
							{
								name: 'query',
								type: {
									kind: 'SCALAR',
									name: 'Any'
								}
							}
						]
					}
				],
				interfaces: []
			},
			{
				kind: 'OBJECT',
				name: 'Task',
				fields: [
					{
						name: 'bboxes',
						type: {
							kind: 'NON_NULL',
							ofType: {
								kind: 'LIST',
								ofType: {
									kind: 'NON_NULL',
									ofType: {
										kind: 'OBJECT',
										name: 'BBox',
										ofType: null
									}
								}
							}
						},
						args: []
					},
					{
						name: 'createdAt',
						type: {
							kind: 'NON_NULL',
							ofType: {
								kind: 'SCALAR',
								name: 'Any'
							}
						},
						args: []
					},
					{
						name: 'id',
						type: {
							kind: 'NON_NULL',
							ofType: {
								kind: 'SCALAR',
								name: 'Any'
							}
						},
						args: []
					},
					{
						name: 'image',
						type: {
							kind: 'NON_NULL',
							ofType: {
								kind: 'OBJECT',
								name: 'Image',
								ofType: null
							}
						},
						args: []
					},
					{
						name: 'project',
						type: {
							kind: 'NON_NULL',
							ofType: {
								kind: 'OBJECT',
								name: 'Project',
								ofType: null
							}
						},
						args: []
					},
					{
						name: 'status',
						type: {
							kind: 'NON_NULL',
							ofType: {
								kind: 'SCALAR',
								name: 'Any'
							}
						},
						args: []
					}
				],
				interfaces: []
			},
			{
				kind: 'OBJECT',
				name: 'TaskPage',
				fields: [
					{
						name: 'count',
						type: {
							kind: 'NON_NULL',
							ofType: {
								kind: 'SCALAR',
								name: 'Any'
							}
						},
						args: []
					},
					{
						name: 'hasMore',
						type: {
							kind: 'NON_NULL',
							ofType: {
								kind: 'SCALAR',
								name: 'Any'
							}
						},
						args: []
					},
					{
						name: 'limit',
						type: {
							kind: 'NON_NULL',
							ofType: {
								kind: 'SCALAR',
								name: 'Any'
							}
						},
						args: []
					},
					{
						name: 'objects',
						type: {
							kind: 'NON_NULL',
							ofType: {
								kind: 'LIST',
								ofType: {
									kind: 'NON_NULL',
									ofType: {
										kind: 'OBJECT',
										name: 'Task',
										ofType: null
									}
								}
							}
						},
						args: []
					},
					{
						name: 'offset',
						type: {
							kind: 'NON_NULL',
							ofType: {
								kind: 'SCALAR',
								name: 'Any'
							}
						},
						args: []
					},
					{
						name: 'totalCount',
						type: {
							kind: 'NON_NULL',
							ofType: {
								kind: 'SCALAR',
								name: 'Any'
							}
						},
						args: []
					}
				],
				interfaces: []
			},
			{
				kind: 'SCALAR',
				name: 'Any'
			}
		],
		directives: []
	}
} as unknown as IntrospectionQuery;
