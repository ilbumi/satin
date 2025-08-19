import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// Resolve the response
	const response = await resolve(event);

	// Add security headers including CSP
	response.headers.set(
		'Content-Security-Policy',
		[
			"default-src 'self'",
			"script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Allow inline scripts for Svelte
			"style-src 'self' 'unsafe-inline'", // Allow inline styles for TailwindCSS
			"img-src 'self' data: https: blob:", // Allow images from various sources
			"font-src 'self' data:", // Allow fonts
			"connect-src 'self' http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:*", // Allow API connections
			"frame-src 'none'", // No iframes allowed
			"object-src 'none'", // No plugins allowed
			"base-uri 'self'", // Restrict base tag
			"form-action 'self'", // Restrict form submissions
			"frame-ancestors 'none'", // Prevent clickjacking
			'upgrade-insecure-requests' // Upgrade HTTP to HTTPS
		].join('; ')
	);

	// Add other security headers
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-XSS-Protection', '1; mode=block');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

	return response;
};
