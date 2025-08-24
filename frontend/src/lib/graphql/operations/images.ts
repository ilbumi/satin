import { gql } from '@urql/svelte';

// Query to fetch all images
export const GET_IMAGES = gql`
	query GetImages {
		images {
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

// Mutation to create a new image
export const CREATE_IMAGE = gql`
	mutation CreateImage($input: ImageCreateInput!) {
		createImage(input: $input) {
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

// Mutation to update an existing image
export const UPDATE_IMAGE = gql`
	mutation UpdateImage($id: String!, $input: ImageUpdateInput!) {
		updateImage(id: $id, input: $input) {
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

// Mutation to delete an image
export const DELETE_IMAGE = gql`
	mutation DeleteImage($id: String!) {
		deleteImage(id: $id)
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

export interface GetImagesQuery {
	images: ImageData[];
}

export interface GetImageQuery {
	image: ImageData | null;
}

export interface CreateImageMutation {
	createImage: ImageData;
}

export interface UpdateImageMutation {
	updateImage: ImageData | null;
}

export interface DeleteImageMutation {
	deleteImage: boolean;
}

export interface ImageCreateInput {
	url: string;
}

export interface ImageUpdateInput {
	status?: 'NEW' | 'ANNOTATED' | 'NEEDS_REANNOTATION';
}
