/* eslint-disable @typescript-eslint/no-unused-vars */
import { cacheExchange } from '@urql/exchange-graphcache';
import { GetImagesDocument, GetAnnotationsByImageDocument } from './generated';
import schema from './introspection.json';

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
					// Update GetImages query cache
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					cache.updateQuery({ query: GetImagesDocument }, (data: any) => {
						if (!data || !data.images) return data;

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

					// Remove from GetImages query cache
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					cache.updateQuery({ query: GetImagesDocument }, (data: any) => {
						if (!data || !data.images) return data;

						return {
							...data,
							images: {
								...data.images,
								items: data.images.items.filter(
									(image: Record<string, unknown>) => image.id !== imageId
								),
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

					// Update all GetAnnotationsByImage queries to remove this annotation
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					cache.updateQuery({ query: GetAnnotationsByImageDocument }, (data: any) => {
						if (!data) return data;

						// Check all imageId variations in the cache
						const updatedData = { ...data };
						if (data.annotationsByImage) {
							updatedData.annotationsByImage = data.annotationsByImage.filter(
								(ann: Record<string, unknown>) => ann.id !== annotationId
							);
						}
						return updatedData;
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
