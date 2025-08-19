import type { Image, ImagePage } from '$lib/graphql/generated/graphql';

// Extended image interface with additional metadata
export interface ImageDetail extends Image {
	filename: string;
	fileSize: number;
	mimeType: string;
	dimensions?: {
		width: number;
		height: number;
	};
	metadata?: {
		uploadedAt: string;
		updatedAt?: string;
		projectId?: string;
		projectName?: string;
		status: ImageStatus;
		annotations?: number; // Count of annotations
	};
	// Thumbnail and preview URLs
	thumbnailUrl?: string;
	previewUrl?: string;
}

export type ImageStatus = 'pending' | 'processing' | 'ready' | 'annotated' | 'error';

export interface ImageSummary {
	id: string;
	filename: string;
	url: string; // Add url property to match GraphQL Image type
	thumbnailUrl?: string;
	status: ImageStatus;
	uploadedAt: string;
	fileSize: number;
	dimensions?: string; // e.g., "1920x1080"
	projectName?: string;
}

export interface ImageFilters {
	search: string;
	status: ImageStatus | 'all';
	projectId?: string;
	mimeType?: string;
	uploadedAfter?: string;
	uploadedBefore?: string;
}

export interface ImageListState {
	images: ImageSummary[];
	loading: boolean;
	error: string | null;
	pagination: {
		limit: number;
		offset: number;
		totalCount: number;
		hasMore: boolean;
	};
	filters: ImageFilters;
}

export interface ImageOperations {
	fetchImages: () => Promise<void>;
	addImagesByUrl: (urls: string[]) => Promise<ImageDetail[]>;
	deleteImage: (id: string) => Promise<boolean>;
	setFilters: (filters: Partial<ImageFilters>) => void;
	setPage: (offset: number) => void;
	refetch: () => Promise<void>;
}

export interface CreateImageInput {
	url: string;
	projectId?: string;
}

export interface UpdateImageInput {
	id: string;
	filename?: string;
	projectId?: string;
	status?: ImageStatus;
}

// Re-export GraphQL types for convenience
export type { Image, ImagePage };
