import { gql } from '@urql/svelte';

// Query to fetch paginated images
export const GET_IMAGES = gql`
	query GetImages($pagination: PaginationInput, $filter: ImageFilterInput, $sort: SortInput) {
		images(pagination: $pagination, filter: $filter, sort: $sort) {
			items {
				id
				url
				width
				height
				ext
				status
				createdAt
				updatedAt
			}
			pageInfo {
				hasNextPage
				hasPreviousPage
				totalCount
				startCursor
				endCursor
			}
			totalCount
		}
	}
`;

// Query to fetch a single image by ID
export const GET_IMAGE = gql`
	query GetImage($id: String!) {
		image(id: $id) {
			id
			url
			width
			height
			ext
			status
			createdAt
			updatedAt
		}
	}
`;

// Query to fetch images by status
export const GET_IMAGES_BY_STATUS = gql`
	query ImagesByStatus($statuses: [String!]!) {
		imagesByStatus(statuses: $statuses) {
			id
			url
			width
			height
			ext
			status
			createdAt
			updatedAt
		}
	}
`;

// Mutation to create a new image
export const CREATE_IMAGE = gql`
	mutation CreateImage($input: ImageCreateInput!) {
		createImage(input: $input) {
			__typename
			... on ImageSuccessResult {
				data {
					id
					url
					width
					height
					ext
					status
					createdAt
					updatedAt
				}
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

// Mutation to update an existing image
export const UPDATE_IMAGE = gql`
	mutation UpdateImage($id: String!, $input: ImageUpdateInput!) {
		updateImage(id: $id, input: $input) {
			__typename
			... on ImageSuccessResult {
				data {
					id
					url
					width
					height
					ext
					status
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

// Mutation to delete an image
export const DELETE_IMAGE = gql`
	mutation DeleteImage($id: String!) {
		deleteImage(id: $id) {
			deleted
			message
		}
	}
`;

// TypeScript types for GraphQL operations
export interface ImageData {
	id: string;
	url: string;
	width?: number;
	height?: number;
	ext?: string;
	status: 'NEW' | 'ANNOTATED' | 'NEEDS_REANNOTATION';
	createdAt: string;
	updatedAt: string;
}

export interface PageInfo {
	hasNextPage: boolean;
	hasPreviousPage: boolean;
	totalCount: number;
	startCursor?: string | null;
	endCursor?: string | null;
}

export interface ImageConnection {
	items: ImageData[];
	pageInfo: PageInfo;
	totalCount: number;
}

export interface GetImagesQuery {
	images: ImageConnection;
}

export interface GetImageQuery {
	image: ImageData | null;
}

export interface GetImagesByStatusQuery {
	imagesByStatus: ImageData[];
}

export interface CreateImageMutation {
	createImage:
		| { __typename: 'ImageSuccessResult'; data: ImageData }
		| { __typename: 'ValidationError'; field: string; message: string }
		| { __typename: 'OperationError'; message: string; details?: string | null };
}

export interface UpdateImageMutation {
	updateImage:
		| { __typename: 'ImageSuccessResult'; data: ImageData }
		| { __typename: 'NotFoundError'; resource: string; id: string; message: string }
		| { __typename: 'ValidationError'; field: string; message: string }
		| { __typename: 'OperationError'; message: string; details?: string | null };
}

// Error type definitions
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

export interface DeleteImageMutation {
	deleteImage: {
		deleted: boolean;
		message: string;
	};
}

export interface ImageCreateInput {
	url: string;
}

export interface ImageUpdateInput {
	status?: 'NEW' | 'ANNOTATED' | 'NEEDS_REANNOTATION';
}

// Input types for pagination and filtering
export interface PaginationInput {
	offset?: number;
	limit?: number;
	after?: string | null;
	before?: string | null;
}

export interface ImageFilterInput {
	status?: 'NEW' | 'ANNOTATED' | 'NEEDS_REANNOTATION';
	statuses?: Array<'NEW' | 'ANNOTATED' | 'NEEDS_REANNOTATION'>;
	urlContains?: string;
}

export interface SortInput {
	field: string;
	order: 'ASC' | 'DESC';
}
