import { writable, derived } from 'svelte/store';

export enum ImageStatus {
	NEW = 'NEW',
	ANNOTATED = 'ANNOTATED',
	NEEDS_REANNOTATION = 'NEEDS_REANNOTATION'
}

interface ImageState {
	id: string | null;
	url: string | null;
	width: number;
	height: number;
	status: ImageStatus;
	isLoading: boolean;
	error: string | null;
	naturalWidth: number;
	naturalHeight: number;
	scale: number;
	offsetX: number;
	offsetY: number;
}

function createImageStore() {
	const initialState: ImageState = {
		id: null,
		url: null,
		width: 800,
		height: 600,
		status: ImageStatus.NEW,
		isLoading: false,
		error: null,
		naturalWidth: 0,
		naturalHeight: 0,
		scale: 1,
		offsetX: 0,
		offsetY: 0
	};

	const { subscribe, set, update } = writable<ImageState>(initialState);

	return {
		subscribe,

		loadImage: async (id: string, url: string) => {
			update((state) => ({
				...state,
				isLoading: true,
				error: null,
				id,
				url
			}));

			try {
				const img = new Image();
				img.crossOrigin = 'anonymous';

				await new Promise<void>((resolve, reject) => {
					img.onload = () => resolve();
					img.onerror = () => reject(new Error('Failed to load image'));
					img.src = url;
				});

				update((state) => ({
					...state,
					isLoading: false,
					naturalWidth: img.naturalWidth,
					naturalHeight: img.naturalHeight,
					width: img.naturalWidth,
					height: img.naturalHeight,
					scale: 1,
					offsetX: 0,
					offsetY: 0
				}));
			} catch (error) {
				update((state) => ({
					...state,
					isLoading: false,
					error: error instanceof Error ? error.message : 'Failed to load image'
				}));
			}
		},

		updateStatus: (status: ImageStatus) => {
			update((state) => ({
				...state,
				status
			}));
		},

		setScale: (scale: number) => {
			update((state) => ({
				...state,
				scale: Math.max(0.1, Math.min(5, scale))
			}));
		},

		zoomIn: () => {
			update((state) => ({
				...state,
				scale: Math.min(5, state.scale * 1.2)
			}));
		},

		zoomOut: () => {
			update((state) => ({
				...state,
				scale: Math.max(0.1, state.scale / 1.2)
			}));
		},

		resetZoom: () => {
			update((state) => ({
				...state,
				scale: 1,
				offsetX: 0,
				offsetY: 0
			}));
		},

		pan: (deltaX: number, deltaY: number) => {
			update((state) => ({
				...state,
				offsetX: state.offsetX + deltaX,
				offsetY: state.offsetY + deltaY
			}));
		},

		fitToScreen: (containerWidth: number, containerHeight: number) => {
			update((state) => {
				if (!state.naturalWidth || !state.naturalHeight) return state;

				const scaleX = containerWidth / state.naturalWidth;
				const scaleY = containerHeight / state.naturalHeight;
				const scale = Math.min(scaleX, scaleY, 1);

				return {
					...state,
					scale,
					offsetX: (containerWidth - state.naturalWidth * scale) / 2,
					offsetY: (containerHeight - state.naturalHeight * scale) / 2
				};
			});
		},

		clear: () => {
			set(initialState);
		}
	};
}

export const imageStore = createImageStore();

export const imageTransform = derived(imageStore, ($store) => ({
	x: $store.offsetX,
	y: $store.offsetY,
	scaleX: $store.scale,
	scaleY: $store.scale
}));

export const isImageLoaded = derived(
	imageStore,
	($store) => !$store.isLoading && $store.url !== null && $store.error === null
);
