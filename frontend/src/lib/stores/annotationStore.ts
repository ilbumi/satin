
import { writable } from 'svelte/store';
import { v4 as uuidv4 } from 'uuid';

interface BoundingBox {
	id: string;
	x: number;
	y: number;
	width: number;
	height: number;
	label: string;
	isSelected: boolean;
}

interface AnnotationState {
	currentTool: 'select' | 'bbox';
	imageUrl: string;
	annotations: BoundingBox[];
	selectedAnnotationId: string | null;
}

const demoImageUrl =
	'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=800&h=600&fit=crop';

function createAnnotationStore() {
	const { subscribe, update } = writable<AnnotationState>({
		currentTool: 'select',
		imageUrl: '',
		annotations: [],
		selectedAnnotationId: null
	});

	return {
		subscribe,
		setTool: (tool: 'select' | 'bbox') =>
			update((state) => {
				if (tool === 'bbox') {
					state.selectedAnnotationId = null;
					state.annotations = state.annotations.map((ann) => ({ ...ann, isSelected: false }));
				}
				return { ...state, currentTool: tool };
			}),
		setImageUrl: (url: string) =>
			update((state) => ({ ...state, imageUrl: url, annotations: [], selectedAnnotationId: null })),
		createAnnotation: (bbox: Omit<BoundingBox, 'id' | 'isSelected'>) =>
			update((state) => {
				const newAnnotation: BoundingBox = {
					...bbox,
					id: uuidv4(),
					isSelected: false
				};
				return { ...state, annotations: [...state.annotations, newAnnotation] };
			}),
		selectAnnotation: (id: string) =>
			update((state) => {
				const selectedId = state.selectedAnnotationId === id ? null : id;
				return {
					...state,
					selectedAnnotationId: selectedId,
					annotations: state.annotations.map((ann) => ({
						...ann,
						isSelected: ann.id === selectedId
					}))
				};
			}),
		deleteAnnotation: (id: string) =>
			update((state) => ({
				...state,
				annotations: state.annotations.filter((ann) => ann.id !== id),
				selectedAnnotationId: state.selectedAnnotationId === id ? null : state.selectedAnnotationId
			})),
		updateAnnotation: (id: string, updates: Partial<BoundingBox>) =>
			update((state) => ({
				...state,
				annotations: state.annotations.map((ann) =>
					ann.id === id ? { ...ann, ...updates } : ann
				)
			})),
		loadDemoImage: () =>
			update((state) => ({
				...state,
				imageUrl: demoImageUrl,
				annotations: [
					{
						id: uuidv4(),
						x: 0.2,
						y: 0.3,
						width: 0.3,
						height: 0.4,
						label: 'Dog',
						isSelected: false
					},
					{
						id: uuidv4(),
						x: 0.6,
						y: 0.1,
						width: 0.25,
						height: 0.35,
						label: 'Cat',
						isSelected: false
					}
				]
			}))
	};
}

export const annotationStore = createAnnotationStore();
