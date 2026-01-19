import { writable, get, derived, type Readable } from 'svelte/store';
import { browser } from '$app/environment';
import type { Player, UserRole, PlayerScenario, PlayerId } from '$lib/types';
import type { User } from '@supabase/supabase-js';
import { useApp } from './use-app.svelte';
import { usePlayer } from './use-player';

let instance: ReturnType<typeof createCurrentStore> | undefined = undefined;

function createCurrentStore() {
	const { supabase, user: serverUser } = useApp();

	const userStore = writable<User | undefined>(undefined);
	const roleStore = writable<UserRole | undefined>(undefined);

	const { store: playerStore, playerScenarioStore } = usePlayer();

	// 선택된 플레이어 ID
	const playerIdStore = writable<PlayerId | undefined>(undefined);

	// playerStore가 성공 상태가 되면 자동으로 첫 번째 플레이어 선택
	playerStore.subscribe(($store) => {
		if ($store.status === 'success') {
			const players = Object.values($store.data);
			if (players.length > 0 && get(playerIdStore) === undefined) {
				playerIdStore.set(players[0]!.id);
			}
		}
	});

	// 선택된 플레이어
	const player = derived([playerStore, playerIdStore], ([$playerStore, $selectedPlayerId]) => {
		if (!$selectedPlayerId) return undefined;
		return $playerStore.data[$selectedPlayerId];
	});

	// 현재 활성화된 PlayerScenario (현재 player의 status가 'in_progress'인 것)
	const playerScenario = derived(
		[player, playerScenarioStore],
		([$player, $playerScenarioStore]) => {
			if (!$player) return undefined;
			const playerScenarios = Object.values($playerScenarioStore.data);
			return playerScenarios.find(
				(ps) => ps.player_id === $player.id && ps.status === 'in_progress'
			);
		}
	);

	// 틱 스토어 (playerScenario의 current_tick으로 초기화)
	const tickStore = writable<number>(0);

	// playerScenario가 변경되면 tickStore 초기화
	playerScenario.subscribe(($playerScenario) => {
		if ($playerScenario) {
			tickStore.set($playerScenario.current_tick);
			startTick();
		}
	});

	let initialized = false;

	function init() {
		if (initialized) return;
		initialized = true;
		fetchUser();
	}

	async function fetchUser() {
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
				userStore.set(undefined);
				roleStore.set(undefined);
				return;
			}

			userStore.set(user);

			// user_roles 정보 가져오기
			const { data: role } = await supabase
				.from('user_roles')
				.select('*')
				.eq('user_id', user.id)
				.maybeSingle();

			roleStore.set((role ?? undefined) as UserRole | undefined);
		} catch (error) {
			console.error('Failed to fetch user:', error);
			userStore.set(undefined);
			roleStore.set(undefined);
		}
	}

	// 틱 인터벌 ID (틱 시스템 제어용)
	let tickIntervalId: ReturnType<typeof setInterval> | undefined;

	/**
	 * 틱 시스템 시작 (1초마다 current_tick 증가)
	 */
	function startTick() {
		// 이미 실행 중이면 중복 방지
		if (tickIntervalId !== undefined) {
			return;
		}

		tickIntervalId = setInterval(() => {
			tickStore.update((tick) => tick + 1);
		}, 1000); // 1초마다
	}

	/**
	 * 틱 시스템 중지
	 */
	function stopTick() {
		if (tickIntervalId !== undefined) {
			clearInterval(tickIntervalId);
			tickIntervalId = undefined;
		}
	}

	/**
	 * 플레이어 선택
	 */
	function selectPlayer(playerId: PlayerId) {
		playerIdStore.set(playerId);
	}

	/**
	 * 틱 값 설정 (테스트 또는 복원용)
	 */
	function setTick(tick: number) {
		tickStore.set(tick);
	}

	return {
		user: userStore as Readable<User | undefined>,
		role: roleStore as Readable<UserRole | undefined>,
		player: player as Readable<Player | undefined>,
		playerScenario: playerScenario as Readable<PlayerScenario | undefined>,
		tick: tickStore as Readable<number>,
		init,
		stopTick,
		selectPlayer,
		setTick,
	};
}

export function useCurrent() {
	if (!instance) {
		instance = createCurrentStore();
	}
	return instance!;
}
