import { get } from 'svelte/store';
import type { PlayerRolledDice } from '$lib/types';
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

export const run =
	({ narrativeNodeStore, playStore }: Params) =>
	(narrativeNodeId: string) => {
		const narrativeNode = get(narrativeNodeStore).data?.[narrativeNodeId];
		if (!narrativeNode) return;

		playStore.set({
			narrativeNode,
			narrativeDiceRoll: undefined,
			selectedNarrativeNodeChoice: undefined,
			playerRolledDice: undefined,
		});
	};

export const roll =
	({ playStore }: Params) =>
	async (): Promise<PlayerRolledDice | undefined> => {
		const { supabase } = useServerPayload();
		const { store: currentUserStore } = useCurrentUser();

		const currentUser = get(currentUserStore);
		const playState = get(playStore);

		const userId = currentUser.data?.user?.id;
		const playerId = currentUser.data?.currentPlayer?.id;
		const narrativeNode = playState.narrativeNode;
		const narrativeDiceRoll = playState.narrativeDiceRoll;

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
			console.error('Failed to roll dice:', error);
			return undefined;
		}

		playStore.update((state) => ({
			...state,
			playerRolledDice: data,
		}));

		return data;
	};

export const next =
	({ narrativeNodeStore, narrativeNodeChoiceStore, narrativeDiceRollStore, playStore }: Params) =>
	() => {
		// TODO: implement
	};

export const done =
	({ playStore }: Params) =>
	() => {
		playStore.set({
			narrativeNode: undefined,
			narrativeDiceRoll: undefined,
			selectedNarrativeNodeChoice: undefined,
			playerRolledDice: undefined,
		});
	};

export const select =
	({ narrativeNodeStore, narrativeNodeChoiceStore, narrativeDiceRollStore, playStore }: Params) =>
	(narrativeNodeChoiceId: string) => {
		// TODO: implement
	};
