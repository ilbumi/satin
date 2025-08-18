import { graphqlClient } from '$lib/core/api/client';
import {
	GET_IMAGE,
	GET_IMAGES,
	CREATE_IMAGE,
	UPDATE_IMAGE,
	DELETE_IMAGE
} from '$lib/core/api/queries';
import type {
	Image,
	ImagePage,
	GetImageQuery,
	GetImagesQuery,
	CreateImageMutation,
	UpdateImageMutation,
	DeleteImageMutation,
	QueryInput
} from '$lib/graphql/generated/graphql';
import type { ImageDetail, ImageSummary, ImageFilters, UpdateImageInput } from './types';

export class ImageService {
	/**
	 * Get a single image by ID
	 */
	async getImage(id: string): Promise<ImageDetail | null> {
		try {
			const result = await graphqlClient.query<GetImageQuery>(GET_IMAGE, { id }).toPromise();

			if (result.error) {
				console.error('Failed to fetch image:', result.error);
				throw new Error(result.error.message);
			}

			const image = result.data?.image;
			if (!image) return null;

			return this.mapImageToDetail(image);
		} catch (error) {
			console.error('ImageService.getImage error:', error);
			throw error;
		}
	}

	/**
	 * Get paginated list of images with filters
	 */
	async getImages(limit = 10, offset = 0, filters?: ImageFilters): Promise<ImagePage> {
		try {
			// Build query input from filters
			const query: QueryInput | undefined = filters
				? {
						stringFilters: [
							...(filters.search
								? [{ field: 'filename', operator: 'CONTAINS' as const, value: filters.search }]
								: []),
							...(filters.status !== 'all'
								? [{ field: 'status', operator: 'EQ' as const, value: filters.status }]
								: []),
							...(filters.projectId
								? [{ field: 'projectId', operator: 'EQ' as const, value: filters.projectId }]
								: []),
							...(filters.mimeType
								? [{ field: 'mimeType', operator: 'EQ' as const, value: filters.mimeType }]
								: [])
						]
					}
				: undefined;

			const result = await graphqlClient
				.query<GetImagesQuery>(GET_IMAGES, { limit, offset, query })
				.toPromise();

			if (result.error) {
				console.error('Failed to fetch images:', result.error);
				throw new Error(result.error.message);
			}

			if (!result.data?.images) {
				throw new Error('No images data received');
			}

			return result.data.images;
		} catch (error) {
			console.error('ImageService.getImages error:', error);
			throw error;
		}
	}

	/**
	 * Add a single image by URL
	 */
	async addImageByUrl(url: string): Promise<ImageDetail> {
		try {
			// Validate URL format
			const validation = this.validateImageUrl(url);
			if (!validation.valid) {
				throw new Error(validation.error);
			}

			// Create image record in GraphQL
			const result = await graphqlClient
				.mutation<CreateImageMutation>(CREATE_IMAGE, { url })
				.toPromise();

			if (result.error) {
				console.error('Failed to create image record:', result.error);
				throw new Error(result.error.message);
			}

			if (!result.data?.createImage) {
				throw new Error('Failed to create image: No data returned');
			}

			return this.mapImageToDetail(result.data.createImage);
		} catch (error) {
			console.error('ImageService.addImageByUrl error:', error);
			throw error;
		}
	}

	/**
	 * Add multiple images by URLs
	 */
	async addImagesByUrl(urls: string[]): Promise<ImageDetail[]> {
		const results: ImageDetail[] = [];
		const errors: string[] = [];

		for (const url of urls) {
			try {
				const result = await this.addImageByUrl(url);
				results.push(result);
			} catch (error) {
				const errorMsg = error instanceof Error ? error.message : 'Add failed';
				errors.push(`${url}: ${errorMsg}`);
			}
		}

		if (errors.length > 0) {
			console.warn('Some image additions failed:', errors);
			// Could throw or handle partial success differently based on requirements
		}

		return results;
	}

	/**
	 * Update image metadata
	 */
	async updateImage(data: UpdateImageInput): Promise<ImageDetail | null> {
		try {
			const result = await graphqlClient
				.mutation<UpdateImageMutation>(UPDATE_IMAGE, data)
				.toPromise();

			if (result.error) {
				console.error('Failed to update image:', result.error);
				throw new Error(result.error.message);
			}

			if (!result.data?.updateImage) {
				return null;
			}

			return this.mapImageToDetail(result.data.updateImage);
		} catch (error) {
			console.error('ImageService.updateImage error:', error);
			throw error;
		}
	}

	/**
	 * Delete an image
	 */
	async deleteImage(id: string): Promise<boolean> {
		try {
			const result = await graphqlClient
				.mutation<DeleteImageMutation>(DELETE_IMAGE, { id })
				.toPromise();

			if (result.error) {
				console.error('Failed to delete image:', result.error);
				throw new Error(result.error.message);
			}

			return result.data?.deleteImage || false;
		} catch (error) {
			console.error('ImageService.deleteImage error:', error);
			throw error;
		}
	}

	/**
	 * Validate image URL
	 */
	validateImageUrl(url: string): { valid: boolean; error?: string } {
		if (!url.trim()) {
			return { valid: false, error: 'URL is required' };
		}

		try {
			const urlObj = new URL(url);
			if (!['http:', 'https:'].includes(urlObj.protocol)) {
				return { valid: false, error: 'URL must use HTTP or HTTPS protocol' };
			}
			return { valid: true };
		} catch {
			return { valid: false, error: 'Invalid URL format' };
		}
	}

	/**
	 * Generate thumbnail URL
	 */
	generateThumbnailUrl(imageUrl: string, width = 200, height = 200): string {
		// This would integrate with your image processing service
		return `${imageUrl}?w=${width}&h=${height}&fit=crop`;
	}

	/**
	 * Generate preview URL
	 */
	generatePreviewUrl(imageUrl: string, width = 800): string {
		return `${imageUrl}?w=${width}&fit=scale`;
	}

	/**
	 * Map GraphQL Image to ImageDetail
	 */
	mapImageToDetail(image: Image): ImageDetail {
		// Extract filename from URL
		const urlParts = image.url.split('/');
		const filename = urlParts[urlParts.length - 1] || 'unknown';

		return {
			...image,
			filename,
			fileSize: 0, // Would need to be fetched or stored separately
			mimeType: 'image/jpeg', // Default - would need proper detection
			thumbnailUrl: this.generateThumbnailUrl(image.url),
			previewUrl: this.generatePreviewUrl(image.url)
		};
	}

	/**
	 * Map ImageDetail to ImageSummary for list views
	 */
	mapImageToSummary(image: ImageDetail): ImageSummary {
		return {
			id: image.id,
			filename: image.filename,
			thumbnailUrl: image.thumbnailUrl,
			status: image.metadata?.status || 'ready',
			uploadedAt: image.metadata?.uploadedAt || new Date().toISOString(),
			fileSize: image.fileSize,
			dimensions: image.dimensions
				? `${image.dimensions.width}x${image.dimensions.height}`
				: undefined,
			projectName: image.metadata?.projectName
		};
	}

	/**
	 * Validate image file for upload
	 */
	validateImageFile(file: File): { valid: boolean; error?: string } {
		const maxSize = 10 * 1024 * 1024; // 10MB
		const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

		if (!allowedTypes.includes(file.type)) {
			return {
				valid: false,
				error: 'File type not supported. Please use JPEG, PNG, GIF, or WebP.'
			};
		}

		if (file.size > maxSize) {
			return { valid: false, error: 'File size too large. Maximum size is 10MB.' };
		}

		return { valid: true };
	}

	/**
	 * Upload image file
	 */
	async uploadImage(file: File): Promise<ImageDetail> {
		const validation = this.validateImageFile(file);
		if (!validation.valid) {
			throw new Error(validation.error);
		}

		const formData = new FormData();
		formData.append('file', file);

		const response = await fetch('/api/images/upload', {
			method: 'POST',
			body: formData
		});

		if (!response.ok) {
			throw new Error(response.statusText || 'Upload failed');
		}

		const imageData = await response.json();
		return this.mapImageToDetail(imageData);
	}

	/**
	 * Format file size for display
	 */
	formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 Bytes';

		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));

		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}
}

export const imageService = new ImageService();
