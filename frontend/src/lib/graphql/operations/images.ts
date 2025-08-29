import type {
	Image,
	ImageConnection,
	ImageCreateInput,
	ImageUpdateInput,
	ImageFilterInput,
	PaginationInput,
	SortInput,
	CreateImageResult,
	UpdateImageResult,
	DeleteResult
} from '../generated';

// Import generated GraphQL documents
import {
	GetImagesDocument,
	GetImageDocument,
	GetImagesByStatusDocument,
	CreateImageDocument,
	UpdateImageDocument,
	DeleteImageDocument
} from '../generated';

// Export GraphQL documents
export const GET_IMAGES = GetImagesDocument;
export const GET_IMAGE = GetImageDocument;
export const GET_IMAGES_BY_STATUS = GetImagesByStatusDocument;
export const CREATE_IMAGE = CreateImageDocument;
export const UPDATE_IMAGE = UpdateImageDocument;
export const DELETE_IMAGE = DeleteImageDocument;

// Re-export types with more descriptive names for legacy compatibility
export type ImageData = Image;
export type PageInfo = ImageConnection['pageInfo'];

// Query result types
export interface GetImagesQuery {
	images: ImageConnection;
}

export interface GetImageQuery {
	image: Image | null;
}

export interface GetImagesByStatusQuery {
	imagesByStatus: Image[];
}

// Mutation result types
export interface CreateImageMutation {
	createImage: CreateImageResult;
}

export interface UpdateImageMutation {
	updateImage: UpdateImageResult;
}

export interface DeleteImageMutation {
	deleteImage: DeleteResult;
}

// Re-export input types
export type { ImageCreateInput, ImageUpdateInput, ImageFilterInput, PaginationInput, SortInput };
