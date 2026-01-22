import { get, writable } from 'svelte/store';
import type {
	PlayerRolledDice,
	NarrativeNode,
	NarrativeDiceRoll,
	PlayerRolledDiceId,
} from '$lib/types';
import type { AdminMode, AdminStoreState } from '$lib/types/hooks';
import { useCurrent } from './use-current';

export const adminStore = writable<AdminStoreState>({ mode: 'player' });

export function useAdmin() {
	const current = useCurrent();

	const setMode = (mode: AdminMode) => {
		adminStore.set({ mode });
	};

	const mock = {
		playerRolledDice: ({
			narrativeNode,
			narrativeDiceRoll,
		}: {
			narrativeNode: NarrativeNode;
			narrativeDiceRoll: NarrativeDiceRoll;
		}): PlayerRolledDice => {
			const user = get(current.user);
			const player = get(current.player);

			if (!user?.id || !player?.id) {
				throw new Error('user 또는 player가 없습니다');
			}

			return {
				id: crypto.randomUUID() as PlayerRolledDiceId,
				created_at: new Date().toISOString(),
				user_id: user.id,
				player_id: player.id,
				narrative_id: narrativeNode.narrative_id,
				narrative_node_id: narrativeNode.id,
				narrative_dice_roll_id: narrativeDiceRoll.id,
				dice_id: null,
				narrative_node_choice_id: null,
				player_quest_branch_id: null,
				player_quest_id: null,
				scenario_id: null,
				quest_branch_id: null,
				quest_id: null,
				value: Math.floor(Math.random() * 20) + 1, // 1-20 (d20)
			} as PlayerRolledDice;
		},
	};

	return {
		store: adminStore,
		setMode,
		mock,
	};
}
