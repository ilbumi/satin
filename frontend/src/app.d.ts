// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

// Environment variable types for Vite
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface ImportMetaEnv {
	readonly VITE_BACKEND_URL: string;
}

export {};
