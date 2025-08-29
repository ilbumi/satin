import { gql } from '@urql/svelte';

// Query to fetch active annotations for an image
export const GET_ANNOTATIONS_BY_IMAGE = gql`
	query GetAnnotationsByImage($imageId: String!) {
		annotationsByImage(imageId: $imageId) {
			id
			imageId
			boundingBox {
				x
				y
				width
				height
			}
			tags
			description
			confidence
			source
			createdAt
			updatedAt
		}
	}
`;

// Query to fetch a single annotation by ID
export const GET_ANNOTATION = gql`
	query GetAnnotation($id: String!) {
		annotation(id: $id) {
			id
			imageId
			boundingBox {
				x
				y
				width
				height
			}
			tags
			description
			confidence
			source
			createdAt
			updatedAt
		}
	}
`;

// Mutation to create a new annotation
export const CREATE_ANNOTATION = gql`
	mutation CreateAnnotation($input: AnnotationCreateInput!) {
		createAnnotation(input: $input) {
			__typename
			... on AnnotationSuccessResult {
				data {
					id
					imageId
					boundingBox {
						x
						y
						width
						height
					}
					tags
					description
					confidence
					source
					createdAt
					updatedAt
				}
			}
			... on NotFoundError {
				resource
				id
				message
			}
			... on ValidationError {
				field
				message
			}
			... on OperationError {
				message
				details
			}
		}
	}
`;

// Mutation to update an existing annotation
export const UPDATE_ANNOTATION = gql`
	mutation UpdateAnnotation($id: String!, $input: AnnotationUpdateInput!) {
		updateAnnotation(id: $id, input: $input) {
			__typename
			... on AnnotationSuccessResult {
				data {
					id
					imageId
					boundingBox {
						x
						y
						width
						height
					}
					tags
					description
					confidence
					source
					createdAt
					updatedAt
				}
			}
			... on NotFoundError {
				resource
				id
				message
			}
			... on ValidationError {
				field
				message
			}
			... on OperationError {
				message
				details
			}
		}
	}
`;

// Mutation to delete an annotation
export const DELETE_ANNOTATION = gql`
	mutation DeleteAnnotation($id: String!) {
		deleteAnnotation(id: $id) {
			deleted
			message
		}
	}
`;

// TypeScript types for GraphQL operations
export interface BoundingBoxData {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface AnnotationData {
	id: string;
	imageId: string;
	boundingBox: BoundingBoxData;
	tags: string[];
	description: string;
	confidence?: number;
	source: string;
	createdAt: string;
	updatedAt: string;
}

export interface GetAnnotationsByImageQuery {
	annotationsByImage: AnnotationData[];
}

export interface GetAnnotationQuery {
	annotation: AnnotationData | null;
}

// Error type definitions (same as in images.ts)
export interface ValidationError {
	__typename: 'ValidationError';
	field: string;
	message: string;
}

export interface NotFoundError {
	__typename: 'NotFoundError';
	resource: string;
	id: string;
	message: string;
}

export interface OperationError {
	__typename: 'OperationError';
	message: string;
	details?: string | null;
}

export interface CreateAnnotationMutation {
	createAnnotation:
		| { __typename: 'AnnotationSuccessResult'; data: AnnotationData }
		| { __typename: 'NotFoundError'; resource: string; id: string; message: string }
		| { __typename: 'ValidationError'; field: string; message: string }
		| { __typename: 'OperationError'; message: string; details?: string | null };
}

export interface UpdateAnnotationMutation {
	updateAnnotation:
		| { __typename: 'AnnotationSuccessResult'; data: AnnotationData }
		| { __typename: 'NotFoundError'; resource: string; id: string; message: string }
		| { __typename: 'ValidationError'; field: string; message: string }
		| { __typename: 'OperationError'; message: string; details?: string | null };
}

export interface DeleteAnnotationMutation {
	deleteAnnotation: {
		deleted: boolean;
		message: string;
	};
}

export interface BoundingBoxInput {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface AnnotationCreateInput {
	imageId: string;
	boundingBox: BoundingBoxInput;
	tags?: string[];
	description?: string;
	confidence?: number;
}

export interface AnnotationUpdateInput {
	boundingBox?: BoundingBoxInput;
	tags?: string[];
	description?: string;
	confidence?: number;
}
