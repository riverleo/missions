import type { SupabaseClient, User } from '@supabase/supabase-js';

export type FetchStatus = 'idle' | 'loading' | 'success' | 'error';

export interface FetchState<T> {
	status: FetchStatus;
	data: T | undefined;
	error: Error | undefined;
}

export interface ServerPayload {
	supabase: SupabaseClient;
	user: User | undefined;
}
