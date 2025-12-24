import { get, writable } from 'svelte/store';
import type {
	PlayerRolledDice,
	NarrativeNode,
	NarrativeDiceRoll,
	PlayerRolledDiceId,
} from '$lib/types';
import { useCurrentUser } from './use-current-user';

export type AdminMode = 'admin' | 'player';

export interface AdminStoreState {
	mode: AdminMode;
}

export const adminStore = writable<AdminStoreState>({ mode: 'player' });

export function useAdmin() {
	const { store: currentUserStore } = useCurrentUser();

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
			const { data } = get(currentUserStore);
			const { user, currentPlayer } = data;

			if (!user?.id || !currentPlayer?.id) {
				throw new Error('user 또는 currentPlayer가 없습니다');
			}

			return {
				id: crypto.randomUUID() as PlayerRolledDiceId,
				created_at: new Date().toISOString(),
				user_id: user.id,
				player_id: currentPlayer.id,
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
