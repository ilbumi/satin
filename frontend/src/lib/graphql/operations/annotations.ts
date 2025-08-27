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

// Mutation to update an existing annotation
export const UPDATE_ANNOTATION = gql`
	mutation UpdateAnnotation($id: String!, $input: AnnotationUpdateInput!) {
		updateAnnotation(id: $id, input: $input) {
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

// Mutation to delete an annotation
export const DELETE_ANNOTATION = gql`
	mutation DeleteAnnotation($id: String!) {
		deleteAnnotation(id: $id)
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

export interface CreateAnnotationMutation {
	createAnnotation: AnnotationData | null;
}

export interface UpdateAnnotationMutation {
	updateAnnotation: AnnotationData | null;
}

export interface DeleteAnnotationMutation {
	deleteAnnotation: boolean;
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
