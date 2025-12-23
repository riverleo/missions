import { get } from 'svelte/store';
import type {
	NarrativeDiceRoll,
	NarrativeNode,
	PlayerRolledDice,
	NarrativeNodeId,
	NarrativeNodeChoiceId,
	NarrativeDiceRollId,
} from '$lib/types';
import type {
	NarrativeStore,
	NarrativeNodeStore,
	NarrativeDiceRollStore,
	NarrativeNodeChoiceStore,
	PlayStore,
} from '.';
import { useCurrentUser } from '../use-current-user';
import { useServerPayload } from '../use-server-payload.svelte';
import { useAdmin } from '../use-admin';

interface Params {
	narrativeStore: NarrativeStore;
	narrativeNodeStore: NarrativeNodeStore;
	narrativeNodeChoiceStore: NarrativeNodeChoiceStore;
	narrativeDiceRollStore: NarrativeDiceRollStore;
	playStore: PlayStore;
}

export interface PlayStoreState {
	narrativeNode?: NarrativeNode; // 값이 있을 경우 대화 화면(`NarrativeNodePlay`) 표시
	narrativeDiceRoll?: NarrativeDiceRoll; // 값이 있을 경우 주사위 굴림 화면(`NarrativeDiceRollPlay`) 표시
	playerRolledDice?: PlayerRolledDice; // 값이 있을 경우 주사위 굴림 화면(`NarrativeDiceRollPlay`)에 결과 표시
}

/**
 * 내러티브 노드 시작
 * - 지정한 노드로 `playStore`를 초기화하고 플레이를 시작함
 * - `narrativeDiceRoll`, `playerRolledDice`는 초기화됨
 */
export const run = (params: Params) => (narrativeNodeId: string) => {
	const { narrativeNodeStore, playStore } = params;

	const narrativeNode = get(narrativeNodeStore).data?.[narrativeNodeId as NarrativeNodeId];
	if (!narrativeNode) return;

	playStore.set({
		narrativeNode,
		narrativeDiceRoll: undefined,
		playerRolledDice: undefined,
	});
};

/**
 * 주사위 굴리기
 * - DB에 `player_rolled_dices` 레코드 생성 (`value`는 DB 트리거가 자동 생성)
 * - 결과를 `playStore.playerRolledDice`에 저장
 * - `narrativeDiceRoll`이 설정되어 있어야 호출 가능
 * - 어드민 모드에서는 DB 저장 없이 로컬에서 랜덤 값 생성
 */
export const roll = (params: Params) => {
	const { playStore } = params;

	// `useServerPayload`, `useCurrentUser`, `useAdmin`은 `getContext`를 사용하므로 컴포넌트 초기화 시점에만 호출 가능
	// async 함수 내부에서 호출하면 `lifecycle_outside_component` 에러 발생
	const { supabase } = useServerPayload();
	const { store: currentUserStore } = useCurrentUser();
	const { store: adminStore, mock } = useAdmin();

	return async (): Promise<PlayerRolledDice | undefined> => {
		const { data } = get(currentUserStore);
		const { user, currentPlayer } = data;
		const { narrativeNode, narrativeDiceRoll } = get(playStore);
		const { mode } = get(adminStore);

		if (!user?.id || !currentPlayer?.id || !narrativeNode || !narrativeDiceRoll) {
			console.warn('Missing required data:', { user, currentPlayer, narrativeNode, narrativeDiceRoll });
			return;
		}

		let playerRolledDice: PlayerRolledDice | undefined;

		// 어드민 모드: DB 저장 없이 로컬에서 랜덤 값 생성
		if (mode === 'admin') {
			playerRolledDice = mock.playerRolledDice({ narrativeNode, narrativeDiceRoll });
		} else {
			const { data, error } = await supabase
				.from('player_rolled_dices')
				.insert({
					user_id: user.id,
					player_id: currentPlayer.id,
					narrative_id: narrativeNode.narrative_id,
					narrative_node_id: narrativeNode.id,
					narrative_dice_roll_id: narrativeDiceRoll.id,
				})
				.select()
				.single<PlayerRolledDice>();

			if (error) {
				console.error('Error inserting player_rolled_dice:', error);
				return;
			}

			playerRolledDice = data;
		}

		playStore.update((state) => ({
			...state,
			playerRolledDice,
		}));

		return playerRolledDice;
	};
};

/**
 * 다음 단계로 진행
 * - `choice` 타입: `narrativeNodeChoiceId` 필수, 선택지의 주사위 굴림 ID 사용
 * - `text` 타입: 노드의 주사위 굴림 ID 사용
 *
 * 동작 흐름:
 * 1. 이미 주사위 굴림이 완료된 경우 → 성공/실패에 따라 다음 노드로 `run`
 * 2. 주사위 굴림 ID가 없으면 → 대화 종료
 * 3. `difficulty_class`가 0이면 → 바로 성공 노드로 `run`
 * 4. 그 외 → 주사위 굴림 UI 표시 (`narrativeDiceRoll` 설정)
 */
export const next = (params: Params) => (narrativeNodeChoiceId?: string) => {
	const { narrativeNodeChoiceStore, narrativeDiceRollStore, playStore } = params;

	const { narrativeDiceRoll, playerRolledDice, narrativeNode } = get(playStore);

	if (!narrativeNode) return;

	// 1. 이미 주사위 굴림이 완료된 상태 → 결과에 따라 다음 노드로 이동
	if (narrativeDiceRoll && playerRolledDice && playerRolledDice.value !== null) {
		const success = playerRolledDice.value >= narrativeDiceRoll.difficulty_class;
		const nextNarrativeNodeId = success
			? narrativeDiceRoll.success_narrative_node_id
			: narrativeDiceRoll.failure_narrative_node_id;

		if (nextNarrativeNodeId) {
			run(params)(nextNarrativeNodeId);
		} else {
			done(params)();
		}
		return;
	}

	const { data: narrativeNodeChoices } = get(narrativeNodeChoiceStore);
	// 2. 주사위 굴림 ID 확인
	let narrativeDiceRollId: string | null = null;

	if (narrativeNode.type === 'choice' && narrativeNodeChoiceId) {
		const narrativeNodeChoice = narrativeNodeChoices[narrativeNodeChoiceId as NarrativeNodeChoiceId];

		narrativeDiceRollId = narrativeNodeChoice?.narrative_dice_roll_id ?? null;
	} else if (narrativeNode.type === 'text') {
		narrativeDiceRollId = narrativeNode.narrative_dice_roll_id;
	}

	// 주사위 굴림이 없으면 대화 종료
	if (!narrativeDiceRollId) {
		return done(params)();
	}

	const { data: narrativeDiceRolls } = get(narrativeDiceRollStore);
	const newNarrativeDiceRoll = narrativeDiceRolls[narrativeDiceRollId as NarrativeDiceRollId];

	if (!newNarrativeDiceRoll) {
		console.warn('narrativeDiceRoll not found:', narrativeDiceRollId);
		return done(params)();
	}

	// 3. `difficulty_class`가 0이면 주사위 굴릴 필요 없이 바로 성공 노드로 이동
	if (newNarrativeDiceRoll.difficulty_class === 0) {
		const nextNarrativeNodeId = newNarrativeDiceRoll.success_narrative_node_id;

		if (nextNarrativeNodeId) {
			run(params)(nextNarrativeNodeId);
		} else {
			done(params)();
		}
		return;
	}

	// 4. 주사위 굴림 UI 표시
	playStore.update((state) => ({
		...state,
		narrativeDiceRoll: newNarrativeDiceRoll,
	}));
};

/**
 * 내러티브 플레이 종료
 * - `playStore`를 초기화하여 플레이 화면을 닫음
 */
export const done = (params: Params) => () => {
	const { playStore } = params;
	playStore.set({});
};
