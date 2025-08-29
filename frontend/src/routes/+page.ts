import { redirect } from '@sveltejs/kit';

export async function load() {
	// Redirect root path to images page
	throw redirect(302, '/images');
}
