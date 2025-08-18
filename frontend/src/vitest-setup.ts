import { beforeAll, afterEach, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/svelte';
import { server } from './mocks/server';

// Make vi globally available
(globalThis as unknown as { vi: typeof vi }).vi = vi;

beforeAll(() => server.listen());
afterEach(() => {
	server.resetHandlers();
	cleanup();
});
afterAll(() => server.close());
