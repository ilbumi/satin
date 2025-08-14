// UI state types
export interface LoadingState {
	isLoading: boolean;
	error?: string | null;
}

export interface AsyncState<T> extends LoadingState {
	data?: T;
}

// Modal types
export interface ModalState {
	show: boolean;
	title?: string;
	onClose: () => void;
}

export interface ConfirmModalState extends ModalState {
	message: string;
	confirmText?: string;
	cancelText?: string;
	isLoading?: boolean;
	error?: string | null;
	onConfirm: () => void;
	onCancel: () => void;
}

// Form types
export interface FormState<T> {
	data: T;
	errors: Partial<Record<keyof T, string>>;
	isSubmitting: boolean;
	isDirty: boolean;
}

export interface FormFieldProps {
	label: string;
	id: string;
	type?: 'text' | 'email' | 'password' | 'textarea' | 'url';
	placeholder?: string;
	required?: boolean;
	disabled?: boolean;
	error?: string;
}

// Notification types
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
	id: string;
	type: NotificationType;
	title: string;
	message?: string;
	timeout?: number;
}

// Layout types
export type ViewMode = 'grid' | 'list';
export type SortDirection = 'asc' | 'desc';

export interface PaginationState {
	currentPage: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}

export interface SortState<T> {
	field: keyof T;
	direction: SortDirection;
}

// Canvas types for annotation
export interface CanvasState {
	isDrawing: boolean;
	currentTool: 'select' | 'draw' | 'pan';
	scale: number;
	offset: { x: number; y: number };
}

export interface DrawingState {
	startX: number;
	startY: number;
	currentX: number;
	currentY: number;
	isActive: boolean;
}

// Component prop types
export interface ButtonProps {
	variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
	size?: 'small' | 'medium' | 'large';
	disabled?: boolean;
	loading?: boolean;
	type?: 'button' | 'submit' | 'reset';
}

export interface SpinnerProps {
	size?: 'small' | 'medium' | 'large';
	color?: 'primary' | 'white' | 'current';
}

export interface ErrorProps {
	variant?: 'inline' | 'banner' | 'page';
	showIcon?: boolean;
}
