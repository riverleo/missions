import { writable, get, type Readable } from 'svelte/store';
import { produce } from 'immer';
import type { FetchState, Player, PlayerInsert, UserRole } from '$lib/types';
import type { User } from '@supabase/supabase-js';
import { useServerPayload } from './use-server-payload.svelte';

export interface UserState {
	user?: User;
	role?: UserRole;
	players: Player[];
	currentPlayer?: Player;
}

let instance: ReturnType<typeof createCurrentUserStore> | undefined = undefined;

function createCurrentUserStore() {
	const { supabase, user: serverUser } = useServerPayload();
	const store = writable<FetchState<UserState>>({
		status: 'idle',
		data: { user: undefined, role: undefined, players: [], currentPlayer: undefined },
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
						players: [],
						currentPlayer: undefined,
					},
					error: undefined,
				});
				return;
			}

			// user_roles와 players 정보 가져오기
			const [{ data: role }, { data: players }] = await Promise.all([
				supabase.from('user_roles').select('*').eq('user_id', user.id).maybeSingle(),
				supabase
					.from('players')
					.select('*')
					.eq('user_id', user.id)
					.order('created_at', { ascending: true }),
			]);

			const playerList = (players ?? []) as Player[];

			store.set({
				status: 'success',
				data: {
					user: user,
					role: (role ?? undefined) as UserRole | undefined,
					players: playerList,
					currentPlayer: playerList[0],
				},
				error: undefined,
			});
		} catch (error) {
			store.set({
				status: 'error',
				data: { user: undefined, role: undefined, players: [], currentPlayer: undefined },
				error: error instanceof Error ? error : new Error('Unknown error'),
			});
		}
	}

	async function createPlayer(player: PlayerInsert) {
		const { data, error } = await supabase
			.from('players')
			.insert({ ...player })
			.select()
			.single<Player>();

		if (error) throw error;

		store.update((state) =>
			produce(state, (draft) => {
				if (draft.data) {
					draft.data.players.push(data);
					if (!draft.data.currentPlayer) {
						draft.data.currentPlayer = data;
					}
				}
			})
		);

		return data;
	}

	function selectPlayer(playerId: string) {
		store.update((state) =>
			produce(state, (draft) => {
				if (draft.data) {
					const player = draft.data.players.find((p) => p.id === playerId);
					if (player) {
						draft.data.currentPlayer = player;
					}
				}
			})
		);
	}

	// 초기 fetch 실행
	fetchUser();

	return {
		store: store as Readable<FetchState<UserState>>,
		createPlayer,
		selectPlayer,
	};
}

export function useCurrentUser() {
	if (!instance) {
		instance = createCurrentUserStore();
	}
	return instance;
}
