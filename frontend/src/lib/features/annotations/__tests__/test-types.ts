import type { AnyVariables } from '@urql/core';
import type { DocumentNode } from 'graphql';
import type { Mock } from 'vitest';

/**
 * Type definitions for test mocks to improve type safety
 */

export interface MockOperationResult<T = unknown> {
	data?: T;
	error?: {
		message: string;
		networkError?: unknown;
		graphQLErrors?: Array<{
			message: string;
			locations: unknown[];
			path: unknown[];
			extensions: Record<string, unknown>;
		}>;
	};
	operation: {
		key: number;
		query: DocumentNode;
		variables: AnyVariables;
		kind: string;
		context: unknown;
	};
	stale: boolean;
	hasNext: boolean;
}

export interface MockPromisableResult<T = unknown> {
	toPromise: () => Promise<MockOperationResult<T>>;
}

export interface MockGraphQLClient {
	query: Mock;
	mutation: Mock;
}

export interface MockPointerEvent {
	point: { x: number; y: number };
	target: unknown;
	event?: PointerEvent;
}

export interface MockKonvaStage {
	x: Mock;
	y: Mock;
	scaleX: Mock;
	scaleY: Mock;
	width: Mock;
	height: Mock;
	getPointerPosition: Mock;
	on: Mock;
	off: Mock;
	draw: Mock;
	add: Mock;
	scale: Mock;
	position: Mock;
	getStage: Mock;
	container: Mock;
}

export interface MockKonvaLayer {
	add: Mock;
	remove: Mock;
	removeChildren: Mock;
	draw: Mock;
	batchDraw: Mock;
	findOne: Mock;
	find: Mock;
	destroyChildren: Mock;
	listening: Mock;
	visible: Mock;
}

export interface MockKonvaRect {
	x: Mock;
	y: Mock;
	width: Mock;
	height: Mock;
	fill: Mock;
	stroke: Mock;
	strokeWidth: Mock;
	listening: Mock;
	visible: Mock;
	on: Mock;
	off: Mock;
	setAttrs: Mock;
	attrs: Record<string, unknown>;
	destroy: Mock;
}
