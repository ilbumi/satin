import { writable, derived } from 'svelte/store';

export enum ToolType {
	SELECT = 'SELECT',
	BOUNDING_BOX = 'BOUNDING_BOX',
	PAN = 'PAN'
}

interface ToolState {
	currentTool: ToolType;
	isDrawing: boolean;
	drawStartPoint: { x: number; y: number } | null;
	drawEndPoint: { x: number; y: number } | null;
	strokeColor: string;
	strokeWidth: number;
	fillColor: string;
	opacity: number;
	showAnnotations: boolean;
	showLabels: boolean;
	showConfidenceScores: boolean;
}

function createToolStore() {
	const initialState: ToolState = {
		currentTool: ToolType.SELECT,
		isDrawing: false,
		drawStartPoint: null,
		drawEndPoint: null,
		strokeColor: '#3B82F6',
		strokeWidth: 2,
		fillColor: 'rgba(59, 130, 246, 0.2)',
		opacity: 1,
		showAnnotations: true,
		showLabels: true,
		showConfidenceScores: false
	};

	const { subscribe, set, update } = writable<ToolState>(initialState);

	return {
		subscribe,

		selectTool: (tool: ToolType) => {
			update((state) => ({
				...state,
				currentTool: tool,
				isDrawing: false,
				drawStartPoint: null,
				drawEndPoint: null
			}));
		},

		startDrawing: (x: number, y: number) => {
			update((state) => ({
				...state,
				isDrawing: true,
				drawStartPoint: { x, y },
				drawEndPoint: { x, y }
			}));
		},

		updateDrawing: (x: number, y: number) => {
			update((state) => {
				if (!state.isDrawing || !state.drawStartPoint) return state;

				return {
					...state,
					drawEndPoint: { x, y }
				};
			});
		},

		endDrawing: () => {
			update((state) => ({
				...state,
				isDrawing: false
			}));
		},

		cancelDrawing: () => {
			update((state) => ({
				...state,
				isDrawing: false,
				drawStartPoint: null,
				drawEndPoint: null
			}));
		},

		setStrokeColor: (color: string) => {
			update((state) => ({
				...state,
				strokeColor: color
			}));
		},

		setStrokeWidth: (width: number) => {
			update((state) => ({
				...state,
				strokeWidth: width
			}));
		},

		setFillColor: (color: string) => {
			update((state) => ({
				...state,
				fillColor: color
			}));
		},

		setOpacity: (opacity: number) => {
			update((state) => ({
				...state,
				opacity: Math.max(0, Math.min(1, opacity))
			}));
		},

		toggleAnnotations: () => {
			update((state) => ({
				...state,
				showAnnotations: !state.showAnnotations
			}));
		},

		toggleLabels: () => {
			update((state) => ({
				...state,
				showLabels: !state.showLabels
			}));
		},

		toggleConfidenceScores: () => {
			update((state) => ({
				...state,
				showConfidenceScores: !state.showConfidenceScores
			}));
		},

		reset: () => {
			set(initialState);
		}
	};
}

export const toolStore = createToolStore();

export const currentDrawingRect = derived(toolStore, ($store) => {
	if (!$store.drawStartPoint || !$store.drawEndPoint) return null;

	const x = Math.min($store.drawStartPoint.x, $store.drawEndPoint.x);
	const y = Math.min($store.drawStartPoint.y, $store.drawEndPoint.y);
	const width = Math.abs($store.drawEndPoint.x - $store.drawStartPoint.x);
	const height = Math.abs($store.drawEndPoint.y - $store.drawStartPoint.y);

	return { x, y, width, height };
});

export const isDrawingMode = derived(
	toolStore,
	($store) => $store.currentTool === ToolType.BOUNDING_BOX
);

export const isSelectionMode = derived(
	toolStore,
	($store) => $store.currentTool === ToolType.SELECT
);

export const isPanMode = derived(toolStore, ($store) => $store.currentTool === ToolType.PAN);
