import { imageService } from './service';
import type { ImageListState, ImageOperations, ImageFilters, ImageDetail } from './types';

function createImageStore() {
	const state = $state<ImageListState>({
		images: [],
		loading: false,
		error: null,
		pagination: {
			limit: 12,
			offset: 0,
			totalCount: 0,
			hasMore: false
		},
		filters: {
			search: '',
			status: 'all'
		}
	});

	// Adding state
	const addingState = $state<{
		adding: boolean;
	}>({
		adding: false
	});

	// Upload state
	const uploadState = $state<{
		uploading: boolean;
		uploads: Array<{ id: string; progress: number; status: string }>;
	}>({
		uploading: false,
		uploads: []
	});

	async function fetchImages(): Promise<void> {
		try {
			state.loading = true;
			state.error = null;

			const result = await imageService.getImages(
				state.pagination.limit,
				state.pagination.offset,
				state.filters
			);

			// Map GraphQL images to summaries
			state.images = result.objects.map((image) =>
				imageService.mapImageToSummary(imageService.mapImageToDetail(image))
			);
			state.pagination.totalCount = result.totalCount;
			state.pagination.hasMore = result.hasMore;
		} catch (error) {
			state.error = error instanceof Error ? error.message : 'Failed to fetch images';
			console.error('Store.fetchImages error:', error);
		} finally {
			state.loading = false;
		}
	}

	async function addImagesByUrl(urls: string[]): Promise<ImageDetail[]> {
		try {
			addingState.adding = true;
			state.error = null;

			// Validate URLs first
			const validUrls: string[] = [];
			const errors: string[] = [];

			for (const url of urls) {
				const validation = imageService.validateImageUrl(url);
				if (validation.valid) {
					validUrls.push(url.trim());
				} else {
					errors.push(`${url}: ${validation.error}`);
				}
			}

			if (errors.length > 0) {
				state.error = errors.join('\n');
			}

			if (validUrls.length === 0) {
				return [];
			}

			// Add images by URL
			const addPromises = validUrls.map(async (url) => {
				try {
					const result = await imageService.addImageByUrl(url);

					// Add to images list optimistically
					const summary = imageService.mapImageToSummary(result);
					state.images.unshift(summary);
					state.pagination.totalCount += 1;

					return result;
				} catch (error) {
					console.error('Add image error:', error);
					return null;
				}
			});

			const results = await Promise.all(addPromises);
			return results.filter((result): result is ImageDetail => result !== null);
		} catch (error) {
			state.error = error instanceof Error ? error.message : 'Failed to add images';
			console.error('Store.addImagesByUrl error:', error);
			return [];
		} finally {
			addingState.adding = false;
		}
	}

	async function uploadImages(files: File[]): Promise<ImageDetail[]> {
		try {
			uploadState.uploading = true;
			state.error = null;

			const results: ImageDetail[] = [];
			const errors: string[] = [];

			for (const file of files) {
				try {
					// Validate file first
					const validation = imageService.validateImageFile(file);
					if (!validation.valid) {
						errors.push(`${file.name}: ${validation.error}`);
						continue;
					}

					// Upload the file
					const result = await imageService.uploadImage(file);

					// Add to images list optimistically
					const summary = imageService.mapImageToSummary(result);
					state.images.unshift(summary);
					state.pagination.totalCount += 1;

					results.push(result);
				} catch (error) {
					const errorMsg = error instanceof Error ? error.message : 'Upload failed';
					errors.push(`${file.name}: ${errorMsg}`);
				}
			}

			if (errors.length > 0) {
				state.error = errors.join('\n');
			}

			return results;
		} catch (error) {
			state.error = error instanceof Error ? error.message : 'Failed to upload images';
			console.error('Store.uploadImages error:', error);
			return [];
		} finally {
			uploadState.uploading = false;
		}
	}

	async function deleteImage(id: string): Promise<boolean> {
		try {
			state.error = null;
			const success = await imageService.deleteImage(id);

			if (success) {
				// Remove from the list
				state.images = state.images.filter((img) => img.id !== id);
				state.pagination.totalCount -= 1;
			}

			return success;
		} catch (error) {
			state.error = error instanceof Error ? error.message : 'Failed to delete image';
			console.error('Store.deleteImage error:', error);
			return false;
		}
	}

	function setFilters(filters: Partial<ImageFilters>): void {
		state.filters = { ...state.filters, ...filters };
		state.pagination.offset = 0; // Reset to first page when filtering
		fetchImages();
	}

	function setPage(offset: number): void {
		state.pagination.offset = offset;
		fetchImages();
	}

	function nextPage(): void {
		if (state.pagination.hasMore) {
			setPage(state.pagination.offset + state.pagination.limit);
		}
	}

	function prevPage(): void {
		if (state.pagination.offset > 0) {
			setPage(Math.max(0, state.pagination.offset - state.pagination.limit));
		}
	}

	async function refetch(): Promise<void> {
		await fetchImages();
	}

	function clearError(): void {
		state.error = null;
	}

	// Search functionality with debouncing
	let searchTimeout: number | null = null;

	function searchImages(query: string): void {
		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}

		searchTimeout = window.setTimeout(() => {
			setFilters({ search: query });
		}, 300);
	}

	// Filter helpers
	const filteredImages = $derived(() => {
		let filtered = [...state.images];

		// Client-side filtering for immediate feedback
		if (state.filters.search) {
			const query = state.filters.search.toLowerCase();
			filtered = filtered.filter(
				(img) =>
					img.filename.toLowerCase().includes(query) ||
					img.projectName?.toLowerCase().includes(query)
			);
		}

		return filtered;
	});

	const imageStats = $derived(() => {
		const total = state.images.length;
		const byStatus = state.images.reduce(
			(acc, img) => {
				acc[img.status] = (acc[img.status] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>
		);

		return {
			total,
			ready: byStatus.ready || 0,
			annotated: byStatus.annotated || 0,
			pending: byStatus.pending || 0,
			processing: byStatus.processing || 0,
			error: byStatus.error || 0
		};
	});

	const operations: ImageOperations = {
		fetchImages,
		addImagesByUrl,
		uploadImages,
		deleteImage,
		setFilters,
		setPage,
		refetch
	};

	return {
		// State getters
		get images() {
			return filteredImages;
		},
		get allImages() {
			return state.images;
		},
		get loading() {
			return state.loading;
		},
		get error() {
			return state.error;
		},
		get pagination() {
			return state.pagination;
		},
		get filters() {
			return state.filters;
		},
		get stats() {
			return imageStats;
		},

		// Adding state
		get adding() {
			return addingState.adding;
		},

		// Upload state
		get uploading() {
			return uploadState.uploading;
		},
		get uploads() {
			return uploadState.uploads;
		},

		// Operations
		...operations,

		// Additional helpers
		searchImages,
		nextPage,
		prevPage,
		clearError
	};
}

export const imageStore = createImageStore();
