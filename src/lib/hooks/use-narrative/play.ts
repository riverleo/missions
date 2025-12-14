import { get } from 'svelte/store';
import type { NarrativeDiceRoll, NarrativeNode, PlayerRolledDice } from '$lib/types';
import type {
	NarrativeStore,
	NarrativeNodeStore,
	NarrativeDiceRollStore,
	NarrativeNodeChoiceStore,
	PlayStore,
} from '.';
import { useCurrentUser } from '../use-current-user';
import { useServerPayload } from '../use-server-payload.svelte';

interface Params {
	narrativeStore: NarrativeStore;
	narrativeNodeStore: NarrativeNodeStore;
	narrativeNodeChoiceStore: NarrativeNodeChoiceStore;
	narrativeDiceRollStore: NarrativeDiceRollStore;
	playStore: PlayStore;
}

export interface PlayStoreState {
	narrativeNode?: NarrativeNode; // 값이 있을 경우 대화 화면(NarrativeNodePlay) 표시
	narrativeDiceRoll?: NarrativeDiceRoll; // 값이 있을 경우 주사위 굴림 화면(NarrativeDiceRollPlay) 표시
	playerRolledDice?: PlayerRolledDice; // 값이 있을 경우 주사위 굴림 화면(NarrativeDiceRollPlay)에 결과 표시
}

/**
 * 내러티브 노드 플레이 시작
 * - 지정한 노드로 playStore를 초기화하고 플레이를 시작함
 * - narrativeDiceRoll, playerRolledDice는 초기화됨
 */
export const run =
	({ narrativeNodeStore, playStore }: Params) =>
	(narrativeNodeId: string) => {
		const narrativeNode = get(narrativeNodeStore).data?.[narrativeNodeId];
		if (!narrativeNode) return;

		playStore.set({
			narrativeNode,
			narrativeDiceRoll: undefined,
		});
	};

/**
 * 주사위 굴리기
 * - DB에 player_rolled_dices 레코드 생성 (value는 DB 트리거가 자동 생성)
 * - 결과를 playStore.playerRolledDice에 저장
 * - narrativeDiceRoll이 설정되어 있어야 호출 가능
 */
export const roll = ({ playStore }: Params) => {
	const { supabase } = useServerPayload();
	const { store: currentUserStore } = useCurrentUser();

	return async (): Promise<PlayerRolledDice | undefined> => {
		const currentUser = get(currentUserStore);
		const playStoreState = get(playStore);

		const userId = currentUser.data?.user?.id;
		const playerId = currentUser.data?.currentPlayer?.id;
		const narrativeNode = playStoreState.narrativeNode;
		const narrativeDiceRoll = playStoreState.narrativeDiceRoll;

		if (!userId || !playerId || !narrativeNode || !narrativeDiceRoll) {
			return undefined;
		}

		const { data, error } = await supabase
			.from('player_rolled_dices')
			.insert({
				user_id: userId,
				player_id: playerId,
				narrative_id: narrativeNode.narrative_id,
				narrative_node_id: narrativeNode.id,
				narrative_dice_roll_id: narrativeDiceRoll.id,
			})
			.select()
			.single();

		if (error) {
			return undefined;
		}

		playStore.update((state) => ({
			...state,
			playerRolledDice: data,
		}));

		return data;
	};
};

/**
 * 다음 단계로 진행
 * - choice 노드: narrativeNodeChoiceId 필수, 선택지의 dice roll 확인
 * - text 노드: 노드의 dice roll 확인
 *
 * 동작 흐름:
 * 1. 이미 dice roll이 완료된 경우 → 성공/실패에 따라 다음 노드로 run
 * 2. dice roll ID가 없으면 → 대화 종료
 * 3. difficulty_class가 0이면 → 바로 성공 노드로 run
 * 4. 그 외 → dice roll UI 표시 (narrativeDiceRoll 설정)
 */
export const next =
	({
		narrativeStore,
		narrativeNodeStore,
		narrativeNodeChoiceStore,
		narrativeDiceRollStore,
		playStore,
	}: Params) =>
	(narrativeNodeChoiceId?: string) => {
		const playStoreState = get(playStore);
		const narrativeNode = playStoreState.narrativeNode;

		if (!narrativeNode) return;

		const { narrativeDiceRoll, playerRolledDice } = playStoreState;

		// 1. 이미 dice roll이 완료된 상태 → 결과에 따라 다음 노드로 이동
		if (narrativeDiceRoll && playerRolledDice && playerRolledDice.value !== null) {
			const isSuccess = playerRolledDice.value >= narrativeDiceRoll.difficulty_class;
			const nextNarrativeNodeId = isSuccess
				? narrativeDiceRoll.success_narrative_node_id
				: narrativeDiceRoll.failure_narrative_node_id;

			if (nextNarrativeNodeId) {
				run({
					narrativeStore,
					narrativeNodeStore,
					narrativeNodeChoiceStore,
					narrativeDiceRollStore,
					playStore,
				})(nextNarrativeNodeId);
			} else {
				playStore.set({});
			}
			return;
		}

		// 2. dice roll ID 확인
		let narrativeDiceRollId: string | null = null;

		if (narrativeNode.type === 'choice' && narrativeNodeChoiceId) {
			const narrativeNodeChoice = get(narrativeNodeChoiceStore).data[narrativeNodeChoiceId];
			narrativeDiceRollId = narrativeNodeChoice?.narrative_dice_roll_id ?? null;
		} else if (narrativeNode.type === 'text') {
			narrativeDiceRollId = narrativeNode.narrative_dice_roll_id;
		}

		// dice roll이 없으면 대화 종료
		if (!narrativeDiceRollId) {
			playStore.set({});
			return;
		}

		const newNarrativeDiceRoll = get(narrativeDiceRollStore).data[narrativeDiceRollId];

		// 3. difficulty_class가 0이면 주사위 굴릴 필요 없이 바로 성공 노드로 이동
		if (newNarrativeDiceRoll.difficulty_class === 0) {
			const nextNarrativeNodeId = newNarrativeDiceRoll.success_narrative_node_id;

			if (nextNarrativeNodeId) {
				run({
					narrativeStore,
					narrativeNodeStore,
					narrativeNodeChoiceStore,
					narrativeDiceRollStore,
					playStore,
				})(nextNarrativeNodeId);
			} else {
				playStore.set({});
			}
			return;
		}

		// 4. dice roll UI 표시
		playStore.update((state) => ({
			...state,
			narrativeDiceRoll: newNarrativeDiceRoll,
		}));
	};

/**
 * 내러티브 플레이 종료
 * - playStore를 초기화하여 플레이 화면을 닫음
 */
export const done =
	({ playStore }: Params) =>
	() =>
		playStore.set({});
