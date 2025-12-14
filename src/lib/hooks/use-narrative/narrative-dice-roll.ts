import type { NarrativeDiceRollInsert, NarrativeDiceRollUpdate, Supabase } from '$lib/types';
import type { NarrativeStore } from '.';
import { produce } from 'immer';

export const createNarrativeDiceRoll =
	(supabase: Supabase, store: NarrativeStore) => async (narrativeDiceRoll: NarrativeDiceRollInsert) => {
		try {
			const { data, error } = await supabase
				.from('narrative_dice_rolls')
				.insert(narrativeDiceRoll)
				.select()
				.single();

			if (error) throw error;

			store.update((state) =>
				produce(state, (draft) => {
					const narrative = draft.data?.find((n) => n.id === narrativeDiceRoll.narrative_id);
					if (narrative) {
						if (!narrative.narrative_dice_rolls) {
							narrative.narrative_dice_rolls = [];
						}
						narrative.narrative_dice_rolls.push(data);
					}
				})
			);

			return data;
		} catch (error) {
			store.update((state) => ({
				...state,
				error: error instanceof Error ? error : new Error('Unknown error'),
			}));
			throw error;
		}
	};

export const updateNarrativeDiceRoll =
	(supabase: Supabase, store: NarrativeStore) =>
	async (id: string, narrativeDiceRoll: NarrativeDiceRollUpdate) => {
		try {
			const { error } = await supabase
				.from('narrative_dice_rolls')
				.update(narrativeDiceRoll)
				.eq('id', id);

			if (error) throw error;

			store.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						for (const narrative of draft.data) {
							if (narrative.narrative_dice_rolls) {
								const diceRollIndex = narrative.narrative_dice_rolls.findIndex(
									(dr) => dr.id === id
								);
								if (diceRollIndex !== -1) {
									narrative.narrative_dice_rolls[diceRollIndex] = {
										...narrative.narrative_dice_rolls[diceRollIndex],
										...narrativeDiceRoll,
									};
									break;
								}
							}
						}
					}
				})
			);
		} catch (error) {
			store.update((state) => ({
				...state,
				error: error instanceof Error ? error : new Error('Unknown error'),
			}));
			throw error;
		}
	};

export const removeNarrativeDiceRoll =
	(supabase: Supabase, store: NarrativeStore) => async (id: string) => {
		try {
			const { error } = await supabase.from('narrative_dice_rolls').delete().eq('id', id);

			if (error) throw error;

			store.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						for (const narrative of draft.data) {
							if (narrative.narrative_dice_rolls) {
								narrative.narrative_dice_rolls = narrative.narrative_dice_rolls.filter(
									(dr) => dr.id !== id
								);
							}
						}
					}
				})
			);
		} catch (error) {
			store.update((state) => ({
				...state,
				error: error instanceof Error ? error : new Error('Unknown error'),
			}));
			throw error;
		}
	};
