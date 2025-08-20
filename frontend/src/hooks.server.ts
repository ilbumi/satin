import type { Handle } from '@sveltejs/kit';
import { dev } from '$app/environment';

// Generate a nonce for CSP in production
function generateNonce(): string {
	if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
		const array = new Uint8Array(16);
		crypto.getRandomValues(array);
		return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
	}
	// Fallback for environments without crypto API
	return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export const handle: Handle = async ({ event, resolve }) => {
	// Generate a nonce for this request
	const nonce = generateNonce();

	// Store nonce in locals for use in templates
	event.locals.nonce = nonce;

	// Resolve the response
	const response = await resolve(event);

	// Build CSP policy based on environment
	const cspDirectives = [
		"default-src 'self'",
		dev
			? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" // Development: allow inline scripts
			: `script-src 'self' 'nonce-${nonce}'`, // Production: use nonce
		"style-src 'self' 'unsafe-inline'", // Allow inline styles for TailwindCSS (always needed)
		"img-src 'self' data: https: blob:", // Allow images from various sources
		"font-src 'self' data:", // Allow fonts
		dev
			? "connect-src 'self' http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:*" // Development
			: "connect-src 'self' https:", // Production: only HTTPS connections
		"frame-src 'none'", // No iframes allowed
		"object-src 'none'", // No plugins allowed
		"base-uri 'self'", // Restrict base tag
		"form-action 'self'", // Restrict form submissions
		"frame-ancestors 'none'", // Prevent clickjacking
		"worker-src 'self'", // Restrict web workers
		"manifest-src 'self'", // Restrict manifest files
		"media-src 'self'" // Restrict media sources
	];

	// Add upgrade-insecure-requests only in production
	if (!dev) {
		cspDirectives.push('upgrade-insecure-requests');
	}

	response.headers.set('Content-Security-Policy', cspDirectives.join('; '));

	// Add other security headers
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-XSS-Protection', '1; mode=block');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set(
		'Permissions-Policy',
		'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=()'
	);

	// Add HSTS header in production
	if (!dev) {
		response.headers.set(
			'Strict-Transport-Security',
			'max-age=31536000; includeSubDomains; preload'
		);
	}

	// Add additional security headers
	response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
	response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
	response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
	response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');

	return response;
};
