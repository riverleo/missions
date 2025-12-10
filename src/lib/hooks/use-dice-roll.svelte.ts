import type { DiceRollInsert } from '$lib/types';
import { useServerPayload } from './use-server-payload.svelte';

let instance: ReturnType<typeof createDiceRollStore> | undefined = undefined;

function createDiceRollStore() {
	const { supabase } = useServerPayload();

	async function create(diceRoll: DiceRollInsert) {
		try {
			const { data, error } = await supabase
				.from('dice_roll')
				.insert(diceRoll)
				.select()
				.single();

			if (error) throw error;

			return data;
		} catch (error) {
			console.error('Failed to create dice_roll:', error);
			throw error;
		}
	}

	async function update(id: string, diceRoll: Partial<DiceRollInsert>) {
		try {
			const { error } = await supabase.from('dice_roll').update(diceRoll).eq('id', id);

			if (error) throw error;
		} catch (error) {
			console.error('Failed to update dice_roll:', error);
			throw error;
		}
	}

	async function remove(id: string) {
		try {
			const { error } = await supabase.from('dice_roll').delete().eq('id', id);

			if (error) throw error;
		} catch (error) {
			console.error('Failed to delete dice_roll:', error);
			throw error;
		}
	}

	return {
		create,
		update,
		remove,
	};
}

export function useDiceRoll() {
	if (!instance) {
		instance = createDiceRollStore();
	}
	return instance;
}
