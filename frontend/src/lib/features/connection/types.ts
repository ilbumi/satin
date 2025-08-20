/**
 * Connection feature types
 */

export interface TestResult {
	id: string;
	name: string;
	status: 'success' | 'error' | 'warning';
	message: string;
	timestamp: Date;
}

export interface ConnectionHealth {
	overall: 'healthy' | 'degraded' | 'unhealthy';
	backend: boolean;
	database: boolean;
	lastCheck: Date | null;
}

export interface ConnectionState {
	status: 'idle' | 'testing' | 'connected' | 'disconnected' | 'error';
	health: ConnectionHealth | null;
	testResults: TestResult[];
	error: string | null;
	retryCount: number;
	maxRetries: number;
	isRetrying: boolean;
	lastTestTime: Date | null;
	projectCount: number;
}

// Projects endpoint response type
export interface ProjectsEndpointResponse {
	projects: {
		totalCount: number;
		count: number;
		hasMore: boolean;
		objects: Array<{ id: string; name: string; description: string }>;
	};
}

export interface ConnectionService {
	testConnection(): Promise<{ success: boolean; details?: string; error?: Error }>;
	testProjectsEndpoint(): Promise<{
		success: boolean;
		data?: ProjectsEndpointResponse;
		error?: Error;
	}>;
	getSystemHealth(): Promise<ConnectionHealth>;
	runFullHealthCheck(): Promise<TestResult[]>;
}
