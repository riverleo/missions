import { writable, type Readable } from 'svelte/store';
import type { Database } from '$lib/types/supabase';
import type { FetchState, LayoutPayload } from '$lib/types/fetch';
import type { User } from '@supabase/supabase-js';

type UserRole = Database['public']['Tables']['user_roles']['Row'];

export interface UserState {
	user: User | undefined;
	role: UserRole | undefined;
}

export function useCurrentUser({ supabase, user: serverUser }: LayoutPayload) {
	const store = writable<FetchState<UserState>>({
		status: 'idle',
		data: undefined,
		error: undefined,
	});

	let initialized = false;

	async function fetchUser() {
		if (initialized) return;

		initialized = true;

		store.update((state) => ({ ...state, status: 'loading' }));

		try {
			let user: User | null = null;

			// 서버에서 전달받은 user가 있으면 사용
			if (serverUser) {
				user = serverUser;
			} else {
				// 세션 확인
				const {
					data: { user: fetchedUser },
				} = await supabase.auth.getUser();

				user = fetchedUser;

				// 세션이 없을 때만 익명 유저 생성
				if (!user) {
					const { data: authData, error: signInError } = await supabase.auth.signInAnonymously();

					if (signInError) throw signInError;

					user = authData.user;
				}
			}

			// user가 없으면 에러
			if (!user) throw new Error('Failed to get user');

			// user_roles 정보 가져오기 (전체 row)
			const { data: userRoleData } = await supabase
				.from('user_roles')
				.select('*')
				.eq('user_id', user.id)
				.maybeSingle();

			store.set({
				status: 'success',
				data: {
					user: user ?? undefined,
					role: userRoleData ?? undefined,
				},
				error: undefined,
			});
		} catch (error) {
			store.set({
				status: 'error',
				data: undefined,
				error: error instanceof Error ? error : new Error('Unknown error'),
			});
		}
	}

	// 초기 fetch 실행
	fetchUser();

	return store as Readable<FetchState<UserState>>;
}
