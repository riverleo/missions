import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { Database } from './supabase.generated';
import type { ConditionBehaviorId, NeedBehaviorId } from './supabase';

export type Brand<T, B extends string> = T & { readonly __brand: B };

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

export interface BulkChanges<T> {
	origin: T[];
	current: T[];
	created: Omit<T, 'id'>[];
	updated: T[];
	deleted: string[];
}

export type Supabase = SupabaseClient<Database>;

export interface AppPayload {
	supabase: Supabase;
	user?: User;
}

// Runtime-only behavior ID: "{behaviorType}_{behaviorId}"
export type BehaviorId = `need_${NeedBehaviorId}` | `condition_${ConditionBehaviorId}`;
export type BehaviorType = 'need' | 'condition';
