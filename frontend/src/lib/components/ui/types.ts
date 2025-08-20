/**
 * Type definitions for UI components
 */

// Button types
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
	variant?: ButtonVariant;
	size?: ButtonSize;
	disabled?: boolean;
	loading?: boolean;
	type?: 'button' | 'submit' | 'reset';
	onclick?: (event: MouseEvent) => void;
	class?: string;
	children?: import('svelte').Snippet;
}

// Input types
export type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
export type InputState = 'default' | 'error' | 'success';

export interface InputProps {
	value?: string;
	type?: InputType;
	placeholder?: string;
	label?: string;
	helperText?: string;
	errorText?: string;
	state?: InputState;
	disabled?: boolean;
	readonly?: boolean;
	required?: boolean;
	maxlength?: number;
	minlength?: number;
	id?: string;
	name?: string;
	autocomplete?: string;
	class?: string;
	oninput?: (event: Event) => void;
	onchange?: (event: Event) => void;
	onfocus?: (event: FocusEvent) => void;
	onblur?: (event: FocusEvent) => void;
}

// Select types
export type SelectState = 'default' | 'error' | 'success';

export interface SelectOption {
	value: string;
	label: string;
	disabled?: boolean;
}

export interface SelectProps {
	value?: string;
	options: SelectOption[];
	placeholder?: string;
	label?: string;
	helperText?: string;
	errorText?: string;
	state?: SelectState;
	disabled?: boolean;
	required?: boolean;
	id?: string;
	name?: string;
	class?: string;
	onchange?: (event: Event) => void;
	onfocus?: (event: FocusEvent) => void;
	onblur?: (event: FocusEvent) => void;
}

// Modal types
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ModalProps {
	open?: boolean;
	size?: ModalSize;
	closeOnBackdrop?: boolean;
	closeOnEscape?: boolean;
	title?: string;
	class?: string;
	onclose?: () => void;
	children?: import('svelte').Snippet;
}

// Toast types
export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition =
	| 'top-right'
	| 'top-left'
	| 'bottom-right'
	| 'bottom-left'
	| 'top-center'
	| 'bottom-center';

export interface ToastProps {
	type?: ToastType;
	title?: string;
	message: string;
	duration?: number;
	position?: ToastPosition;
	dismissible?: boolean;
	onclose?: () => void;
}

// Spinner types
export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

export interface SpinnerProps {
	size?: SpinnerSize;
	color?: string;
	class?: string;
}

// Card types
export type CardVariant = 'default' | 'outlined' | 'elevated';

export interface CardProps {
	variant?: CardVariant;
	padding?: boolean;
	class?: string;
	children?: import('svelte').Snippet;
}
