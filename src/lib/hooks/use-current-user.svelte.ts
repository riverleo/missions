import { writable, type Readable } from 'svelte/store';
import type { FetchState, ServerPayload, UserRole } from '$lib/types';
import type { User } from '@supabase/supabase-js';

export interface UserState {
	user: User | undefined;
	role: UserRole | undefined;
}

export function useCurrentUser({ supabase, user: serverUser }: ServerPayload) {
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
			}

			// user가 없으면 빈 상태로 반환
			if (!user) {
				store.set({
					status: 'success',
					data: {
						user: undefined,
						role: undefined,
					},
					error: undefined,
				});
				return;
			}

			// user_roles 정보 가져오기 (전체 row)
			const { data: role } = await supabase
				.from('user_roles')
				.select('*')
				.eq('user_id', user.id)
				.maybeSingle();

			store.set({
				status: 'success',
				data: {
					user: user,
					role: role ?? undefined,
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
