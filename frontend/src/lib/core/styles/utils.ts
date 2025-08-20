/**
 * Styling utilities and constants for consistent component styling
 */

/**
 * Combines class names with proper spacing and deduplication
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
	return classes.filter(Boolean).join(' ');
}

/**
 * Creates a computed class function with base classes and variants
 */
export function createVariantClassFn<T extends Record<string, string>>(
	baseClasses: string,
	variants: T
) {
	return function computeVariantClasses(variant: keyof T, additionalClasses: string = ''): string {
		return cn(baseClasses, variants[variant], additionalClasses);
	};
}

/**
 * Common spacing constants
 */
export const spacing = {
	xs: 'p-2',
	sm: 'p-3',
	md: 'p-4',
	lg: 'p-6',
	xl: 'p-8'
} as const;

/**
 * Common border radius constants
 */
export const radius = {
	none: 'rounded-none',
	sm: 'rounded-sm',
	md: 'rounded-md',
	lg: 'rounded-lg',
	xl: 'rounded-xl',
	full: 'rounded-full'
} as const;

/**
 * Common shadow constants
 */
export const shadow = {
	none: 'shadow-none',
	sm: 'shadow-sm',
	md: 'shadow-md',
	lg: 'shadow-lg',
	xl: 'shadow-xl'
} as const;

/**
 * Common text size constants
 */
export const textSize = {
	xs: 'text-xs',
	sm: 'text-sm',
	base: 'text-base',
	lg: 'text-lg',
	xl: 'text-xl',
	'2xl': 'text-2xl',
	'3xl': 'text-3xl'
} as const;

/**
 * Common color variants for status indicators
 */
export const statusColors = {
	success: {
		text: 'text-green-800',
		bg: 'bg-green-50',
		border: 'border-green-200',
		ring: 'ring-green-600'
	},
	error: {
		text: 'text-red-800',
		bg: 'bg-red-50',
		border: 'border-red-200',
		ring: 'ring-red-600'
	},
	warning: {
		text: 'text-yellow-800',
		bg: 'bg-yellow-50',
		border: 'border-yellow-200',
		ring: 'ring-yellow-600'
	},
	info: {
		text: 'text-blue-800',
		bg: 'bg-blue-50',
		border: 'border-blue-200',
		ring: 'ring-blue-600'
	},
	neutral: {
		text: 'text-gray-800',
		bg: 'bg-gray-50',
		border: 'border-gray-200',
		ring: 'ring-gray-600'
	}
} as const;

/**
 * Common transition classes
 */
export const transition = {
	none: 'transition-none',
	all: 'transition-all',
	colors: 'transition-colors',
	opacity: 'transition-opacity',
	shadow: 'transition-shadow',
	transform: 'transition-transform'
} as const;

/**
 * Focus ring classes for accessibility
 */
export const focusRing = {
	default: 'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
	inset: 'focus:ring-2 focus:ring-inset focus:ring-blue-600',
	none: 'focus:ring-0 focus:outline-none'
} as const;

/**
 * Common button base classes
 */
export const buttonBase = cn(
	'inline-flex items-center justify-center font-medium rounded-md',
	transition.colors,
	focusRing.default,
	'disabled:opacity-50 disabled:cursor-not-allowed'
);

/**
 * Common input base classes
 */
export const inputBase = cn(
	'block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset',
	'placeholder:text-gray-400 sm:text-sm sm:leading-6',
	transition.colors,
	focusRing.inset
);

/**
 * Common card base classes
 */
export const cardBase = cn('rounded-lg overflow-hidden', transition.shadow);

/**
 * Responsive grid classes
 */
export const gridResponsive = {
	cols1: 'grid grid-cols-1',
	cols2: 'grid grid-cols-1 md:grid-cols-2',
	cols3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
	cols4: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
} as const;

/**
 * Common flex utility classes
 */
export const flex = {
	center: 'flex items-center justify-center',
	between: 'flex items-center justify-between',
	start: 'flex items-center justify-start',
	end: 'flex items-center justify-end',
	col: 'flex flex-col',
	colCenter: 'flex flex-col items-center justify-center'
} as const;

/**
 * Screen reader only classes
 */
export const srOnly = 'sr-only';

/**
 * Creates responsive text classes
 */
export function responsiveText(
	mobile: keyof typeof textSize,
	desktop?: keyof typeof textSize
): string {
	if (!desktop) return textSize[mobile];
	return `${textSize[mobile]} md:${textSize[desktop]}`;
}

/**
 * Creates hover state classes
 */
export function hover(classes: string): string {
	return `hover:${classes}`;
}

/**
 * Creates active state classes
 */
export function active(classes: string): string {
	return `active:${classes}`;
}

/**
 * Creates disabled state classes
 */
export function disabled(classes: string): string {
	return `disabled:${classes}`;
}

/**
 * Creates focus state classes
 */
export function focus(classes: string): string {
	return `focus:${classes}`;
}
