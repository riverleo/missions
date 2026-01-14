// ============================================================
// Brand Utility - Type-safe ID branding
// ============================================================
export type Brand<T, B extends string> = T & { readonly __brand: B };

// ============================================================
// Fetch State Types
// ============================================================
export type FetchStatus = 'idle' | 'loading' | 'success' | 'error';

export interface FetchState<T> {
	status: FetchStatus;
	data: T;
	error?: Error;
}

export interface RecordFetchState<K extends string, T> {
	status: FetchStatus;
	data: Record<K, T>;
	error?: Error;
}

// ============================================================
// Bulk Changes Type
// ============================================================
export interface BulkChanges<T> {
	origin: T[];
	current: T[];
	created: Omit<T, 'id'>[];
	updated: T[];
	deleted: string[];
}
