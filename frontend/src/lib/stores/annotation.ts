import { writable, derived } from 'svelte/store';
import type { Annotation, Tag } from '$lib/graphql/generated';

export interface AnnotationWithLocal extends Annotation {
	isSelected?: boolean;
	isDirty?: boolean;
	isTemporary?: boolean;
	tags?: Tag[];
}

interface AnnotationState {
	annotations: AnnotationWithLocal[];
	selectedId: string | null;
	dirtyAnnotations: Set<string>;
	history: AnnotationWithLocal[][];
	historyIndex: number;
	isAutoSaveEnabled: boolean;
	lastSavedAt: Date | null;
}

function createAnnotationStore() {
	const initialState: AnnotationState = {
		annotations: [],
		selectedId: null,
		dirtyAnnotations: new Set(),
		history: [],
		historyIndex: -1,
		isAutoSaveEnabled: true,
		lastSavedAt: null
	};

	const { subscribe, set, update } = writable<AnnotationState>(initialState);

	return {
		subscribe,

		addAnnotation: (annotation: AnnotationWithLocal) => {
			update((state) => {
				const newAnnotations = [...state.annotations, annotation];
				const newHistory = [...state.history.slice(0, state.historyIndex + 1), newAnnotations];

				if (annotation.id && !annotation.isTemporary) {
					state.dirtyAnnotations.add(annotation.id);
				}

				return {
					...state,
					annotations: newAnnotations,
					history: newHistory,
					historyIndex: newHistory.length - 1
				};
			});
		},

		updateAnnotation: (id: string, updates: Partial<AnnotationWithLocal>) => {
			update((state) => {
				const newAnnotations = state.annotations.map((ann) =>
					ann.id === id ? { ...ann, ...updates, isDirty: true } : ann
				);
				const newHistory = [...state.history.slice(0, state.historyIndex + 1), newAnnotations];

				if (!updates.isTemporary) {
					state.dirtyAnnotations.add(id);
				}

				return {
					...state,
					annotations: newAnnotations,
					history: newHistory,
					historyIndex: newHistory.length - 1,
					dirtyAnnotations: new Set(state.dirtyAnnotations)
				};
			});
		},

		deleteAnnotation: (id: string) => {
			update((state) => {
				const newAnnotations = state.annotations.filter((ann) => ann.id !== id);
				const newHistory = [...state.history.slice(0, state.historyIndex + 1), newAnnotations];

				state.dirtyAnnotations.delete(id);

				return {
					...state,
					annotations: newAnnotations,
					selectedId: state.selectedId === id ? null : state.selectedId,
					history: newHistory,
					historyIndex: newHistory.length - 1,
					dirtyAnnotations: new Set(state.dirtyAnnotations)
				};
			});
		},

		selectAnnotation: (id: string | null) => {
			update((state) => ({
				...state,
				selectedId: id,
				annotations: state.annotations.map((ann) => ({
					...ann,
					isSelected: ann.id === id
				}))
			}));
		},

		clearSelection: () => {
			update((state) => ({
				...state,
				selectedId: null,
				annotations: state.annotations.map((ann) => ({
					...ann,
					isSelected: false
				}))
			}));
		},

		undo: () => {
			update((state) => {
				if (state.historyIndex > 0) {
					const newIndex = state.historyIndex - 1;
					return {
						...state,
						annotations: state.history[newIndex],
						historyIndex: newIndex
					};
				}
				return state;
			});
		},

		redo: () => {
			update((state) => {
				if (state.historyIndex < state.history.length - 1) {
					const newIndex = state.historyIndex + 1;
					return {
						...state,
						annotations: state.history[newIndex],
						historyIndex: newIndex
					};
				}
				return state;
			});
		},

		markAsSaved: (annotationIds?: string[]) => {
			update((state) => {
				if (annotationIds) {
					annotationIds.forEach((id) => state.dirtyAnnotations.delete(id));
				} else {
					state.dirtyAnnotations.clear();
				}

				return {
					...state,
					annotations: state.annotations.map((ann) => ({
						...ann,
						isDirty: annotationIds ? !annotationIds.includes(ann.id) && ann.isDirty : false
					})),
					dirtyAnnotations: new Set(state.dirtyAnnotations),
					lastSavedAt: new Date()
				};
			});
		},

		loadAnnotations: (annotations: Annotation[]) => {
			update((state) => {
				const newAnnotations = annotations.map((ann) => ({
					...ann,
					isSelected: false,
					isDirty: false,
					isTemporary: false
				}));

				return {
					...state,
					annotations: newAnnotations,
					dirtyAnnotations: new Set(),
					history: [newAnnotations],
					historyIndex: 0,
					selectedId: null
				};
			});
		},

		clearAll: () => {
			set(initialState);
		},

		toggleAutoSave: () => {
			update((state) => ({
				...state,
				isAutoSaveEnabled: !state.isAutoSaveEnabled
			}));
		}
	};
}

export const annotationStore = createAnnotationStore();

export const selectedAnnotation = derived(
	annotationStore,
	($store) => $store.annotations.find((ann) => ann.id === $store.selectedId) || null
);

export const dirtyAnnotations = derived(annotationStore, ($store) =>
	$store.annotations.filter((ann) => ann.isDirty)
);

export const canUndo = derived(annotationStore, ($store) => $store.historyIndex > 0);

export const canRedo = derived(
	annotationStore,
	($store) => $store.historyIndex < $store.history.length - 1
);
