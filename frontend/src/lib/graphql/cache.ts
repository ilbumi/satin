/* eslint-disable @typescript-eslint/no-unused-vars */
import { cacheExchange } from '@urql/exchange-graphcache';
import { GetImagesDocument, GetAnnotationsByImageDocument } from './generated';
import schema from './introspection.json';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CacheInstance = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueryDocument = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DataUpdater = (data: any) => any;

// Utility for efficient pagination-aware cache updates
function updatePaginatedQuery(
	cache: CacheInstance,
	queryDocument: QueryDocument,
	updater: DataUpdater,
	variables?: Record<string, unknown>
) {
	// Update specific query if variables provided
	if (variables) {
		cache.updateQuery({ query: queryDocument, variables }, updater);
	}

	// Also update queries without variables (affects pagination)
	cache.updateQuery({ query: queryDocument }, updater);
}

export const graphcacheExchange = cacheExchange({
	// Pass schema for deterministic fragment matching
	schema,

	// Configure cache keys for entities
	keys: {
		Image: (data) => data.id as string,
		Annotation: (data) => data.id as string,
		BoundingBox: () => null, // Value object - embed in parent annotation
		DeleteResult: () => null, // DeleteResult doesn't have an ID
		ImageConnection: () => null, // Pagination wrapper doesn't need caching
		AnnotationConnection: () => null // Pagination wrapper doesn't need caching
	},

	// Configure cache updates for mutations
	updates: {
		Mutation: {
			// Image mutations
			createImage: (result, _args, cache) => {
				const createResult = (result as Record<string, unknown>).createImage as Record<
					string,
					unknown
				>;

				if (createResult.__typename === 'ImageSuccessResult' && createResult.data) {
					// Update all GetImages queries using pagination-aware utility
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					updatePaginatedQuery(cache, GetImagesDocument, (data: any) => {
						if (!data?.images) return data;

						return {
							...data,
							images: {
								...data.images,
								items: [createResult.data, ...data.images.items],
								totalCount: data.images.totalCount + 1
							}
						};
					});
				}
			},

			updateImage: (_result, _args, _cache, _info) => {
				// Cache automatically updates the entity due to normalized caching
				// No manual update needed - URQL will update all references to this Image
			},

			deleteImage: (result, args, cache, _info) => {
				const deleteResult = (result as Record<string, unknown>).deleteImage as Record<
					string,
					unknown
				>;

				if (deleteResult.deleted) {
					const imageId = (args as { id: string }).id;

					// Update all GetImages queries using pagination-aware utility
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					updatePaginatedQuery(cache, GetImagesDocument, (data: any) => {
						if (!data?.images?.items) return data;

						const filteredItems = [];
						for (const image of data.images.items) {
							if (image.id !== imageId) {
								filteredItems.push(image);
							}
						}

						return {
							...data,
							images: {
								...data.images,
								items: filteredItems,
								totalCount: Math.max(0, data.images.totalCount - 1)
							}
						};
					});

					// Invalidate the specific image query
					cache.invalidate({ __typename: 'Image', id: imageId });
				}
			},

			// Annotation mutations
			createAnnotation: (result, args, cache, _info) => {
				const createResult = (result as Record<string, unknown>).createAnnotation as Record<
					string,
					unknown
				>;

				if (createResult.__typename === 'AnnotationSuccessResult' && createResult.data) {
					const annotation = createResult.data as Record<string, unknown>;

					// Update GetAnnotationsByImage query cache
					cache.updateQuery(
						{
							query: GetAnnotationsByImageDocument,
							variables: { imageId: annotation.imageId as string }
						},
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						(data: any) => {
							if (!data || !data.annotationsByImage) return data;

							return {
								...data,
								annotationsByImage: [...data.annotationsByImage, annotation]
							};
						}
					);
				}
			},

			updateAnnotation: (_result, _args, _cache, _info) => {
				// Cache automatically updates the entity due to normalized caching
				// No manual update needed - URQL will update all references to this Annotation
			},

			deleteAnnotation: (result, args, cache, _info) => {
				const deleteResult = (result as Record<string, unknown>).deleteAnnotation as Record<
					string,
					unknown
				>;

				if (deleteResult.deleted) {
					const annotationId = (args as { id: string }).id;

					// Remove the annotation from cache immediately
					cache.invalidate({ __typename: 'Annotation', id: annotationId });

					// More efficient annotation removal - single pass through array
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					cache.updateQuery({ query: GetAnnotationsByImageDocument }, (data: any) => {
						if (!data?.annotationsByImage) return data;

						const filteredAnnotations = [];
						for (const annotation of data.annotationsByImage) {
							if (annotation.id !== annotationId) {
								filteredAnnotations.push(annotation);
							}
						}

						return {
							...data,
							annotationsByImage: filteredAnnotations
						};
					});
				}
			}
		}
	},

	// Configure optimistic updates (simplified for now)
	optimistic: {
		// Temporarily disabled createAnnotation optimistic updates
		// to fix boundingBox conversion issues
		// createAnnotation: (args, cache, info) => {
		// 	const { input } = args as { input: any };
		// 	// Return optimistic annotation data
		// 	return {
		// 		__typename: 'AnnotationSuccessResult',
		// 		success: true,
		// 		message: 'Creating annotation...',
		// 		data: {
		// 			__typename: 'Annotation',
		// 			id: `temp-${Date.now()}`, // Temporary ID
		// 			imageId: input.imageId,
		// 			description: input.description || '',
		// 			tags: input.tags || [],
		// 			confidence: input.confidence,
		// 			source: input.source || 'USER',
		// 			boundingBox: input.boundingBox,
		// 			createdAt: new Date().toISOString(),
		// 			updatedAt: new Date().toISOString()
		// 		}
		// 	};
		// },

		updateImage: (args, _cache, _info) => {
			const { id, input } = args as { id: string; input: Record<string, unknown> };

			return {
				__typename: 'ImageSuccessResult',
				success: true,
				message: 'Updating image...',
				data: {
					__typename: 'Image',
					id,
					// Basic optimistic update - will be corrected by actual response
					status: input.status,
					updatedAt: new Date().toISOString()
				}
			};
		}
	}

	// For now, we'll rely on in-memory cache only
	// Persistent storage will be added in Phase 2
});
