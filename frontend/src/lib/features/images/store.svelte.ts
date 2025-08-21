import { imageService } from './service';
import type {
	ImageListState,
	ImageOperations,
	ImageFilters,
	ImageDetail,
	ImageSummary
} from './types';
import { errorStore } from '$lib/core/errors';
import { createOptimisticStore } from '$lib/core/optimistic';
import { createPersistenceManager } from '$lib/core/persistence';
import { localStorageAdapter } from '$lib/core/persistence/adapters/localStorage';

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

	// Optimistic updates store for better UX
	const optimisticImages = createOptimisticStore<ImageSummary>([], (img) => img.id);

	// Persistence for settings (filters, pagination preferences)
	const settingsPersistence = createPersistenceManager<{
		filters: ImageFilters;
		pagination: { limit: number };
	}>('image-store-settings', localStorageAdapter, {
		version: 1,
		debounceMs: 1000,
		ttl: 7 * 24 * 60 * 60 * 1000 // 7 days
	});

	async function fetchImages(): Promise<void> {
		// Cancel any existing fetch operation
		if (currentFetchController) {
			currentFetchController.abort();
		}

		// Create new abort controller for this fetch
		currentFetchController = new AbortController();
		const fetchController = currentFetchController;

		try {
			// Check if operation was cancelled before starting
			if (fetchController.signal.aborted) return;

			state.loading = true;
			state.error = null;

			const result = await imageService.getImages(
				state.pagination.limit,
				state.pagination.offset,
				state.filters
			);

			// Check if operation was cancelled after the async call
			if (fetchController.signal.aborted) return;

			// Map GraphQL images to summaries
			state.images = result.objects.map((image) =>
				imageService.mapImageToSummary(imageService.mapImageToDetail(image))
			);
			state.pagination.totalCount = result.totalCount;
			state.pagination.hasMore = result.hasMore;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to fetch images';
			state.error = errorMessage;
			console.error('Store.fetchImages error:', error);

			// Add to global error store with retry capability
			errorStore.addNetworkError(errorMessage, 'Image Store', () => fetchImages());
		} finally {
			// Only update loading state if this is still the current operation
			if (fetchController === currentFetchController) {
				state.loading = false;
				currentFetchController = null;
			}
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

			// Add images with optimistic updates
			const addPromises = validUrls.map(async (url) => {
				try {
					// Create optimistic summary
					const optimisticSummary: ImageSummary = {
						id: `temp-${Date.now()}-${Math.random()}`,
						filename: url.split('/').pop() || 'image',
						url,
						thumbnailUrl: url,
						status: 'processing',
						uploadedAt: new Date().toISOString(),
						fileSize: 0
					};

					// Use optimistic update
					const result = await optimisticImages.optimisticCreate(optimisticSummary, async () => {
						const detail = await imageService.addImageByUrl(url);
						return imageService.mapImageToSummary(detail);
					});

					// Update main state after successful creation
					state.images = [result, ...state.images.filter((img) => img.id !== optimisticSummary.id)];
					state.pagination.totalCount += 1;

					return imageService.mapImageToDetail(result as ImageSummary); // Convert back to ImageDetail
				} catch (error) {
					console.error('Add image error:', error);
					return null;
				}
			});

			const results = await Promise.all(addPromises);
			return results.filter((result): result is ImageDetail => result !== null);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to add images';
			state.error = errorMessage;
			console.error('Store.addImagesByUrl error:', error);

			// Add to global error store
			errorStore.addGraphQLError(errorMessage, 'Image Upload');
			return [];
		} finally {
			addingState.adding = false;
		}
	}

	async function deleteImage(id: string): Promise<boolean> {
		try {
			state.error = null;

			const imageToDelete = state.images.find((img) => img.id === id);
			if (!imageToDelete) return false;

			// Optimistically remove from UI
			const originalImages = [...state.images];
			const originalTotalCount = state.pagination.totalCount;
			state.images = state.images.filter((img) => img.id !== id);
			state.pagination.totalCount = Math.max(0, state.pagination.totalCount - 1);

			try {
				const success = await imageService.deleteImage(id);
				if (!success) {
					throw new Error('Delete operation failed');
				}
				return true;
			} catch (apiError) {
				// Rollback optimistic changes on failure
				state.images = originalImages;
				state.pagination.totalCount = originalTotalCount;
				throw apiError;
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to delete image';
			state.error = errorMessage;
			console.error('Store.deleteImage error:', error);

			// Add to global error store
			errorStore.addGraphQLError(errorMessage, 'Image Deletion');
			return false;
		}
	}

	function setFilters(filters: Partial<ImageFilters>): void {
		state.filters = { ...state.filters, ...filters };
		state.pagination.offset = 0; // Reset to first page when filtering

		// Persist filter settings
		saveSettings();

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

	// Settings persistence functions
	async function loadSettings(): Promise<void> {
		try {
			const savedSettings = await settingsPersistence.load();
			if (savedSettings) {
				// Restore filters (but don't trigger fetchImages)
				state.filters = { ...state.filters, ...savedSettings.filters };
				// Restore pagination limit
				state.pagination.limit = savedSettings.pagination.limit;
			}
		} catch (error) {
			console.warn('Failed to load image store settings:', error);
		}
	}

	async function saveSettings(): Promise<void> {
		try {
			await settingsPersistence.save({
				filters: state.filters,
				pagination: { limit: state.pagination.limit }
			});
		} catch (error) {
			console.warn('Failed to save image store settings:', error);
		}
	}

	function cleanup(): void {
		// Clear any pending search timeout
		if (searchTimeout) {
			clearTimeout(searchTimeout);
			searchTimeout = null;
		}

		// Cancel any pending fetch operations
		if (currentFetchController) {
			currentFetchController.abort();
			currentFetchController = null;
		}

		// Clean up optimistic updates
		optimisticImages.cleanup();

		// Reset all state to initial values
		state.images = [];
		state.loading = false;
		state.error = null;
		state.pagination = {
			limit: 20,
			offset: 0,
			totalCount: 0,
			hasMore: false
		};
		state.filters = {
			search: '',
			status: 'all',
			projectId: undefined
		};

		// Reset adding state
		addingState.adding = false;
	}

	// Search functionality with debouncing
	let searchTimeout: number | null = null;

	// Race condition protection
	let currentFetchController: AbortController | null = null;

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
		deleteImage,
		setFilters,
		setPage,
		refetch
	};

	// Initialize settings on store creation
	loadSettings();

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

		// Optimistic updates state
		get hasPendingUpdates() {
			return optimisticImages.hasPending;
		},
		get pendingUpdateIds() {
			return optimisticImages.pendingIds;
		},

		// Operations
		...operations,

		// Additional helpers
		searchImages,
		nextPage,
		prevPage,
		clearError,
		cleanup,

		// Settings persistence
		loadSettings,
		saveSettings
	};
}

export const imageStore = createImageStore();
