import { useCharacter } from '$lib/hooks';
import { get } from 'svelte/store';
import type { WorldCharacterEntity } from './world-character-entity.svelte';

/**
 * 캐릭터의 욕구를 tick마다 감소시킵니다.
 */
export default function tickDecreaseNeeds(this: WorldCharacterEntity, tick: number): void {
	// 모든 needs를 decrease_per_tick * multiplier만큼 감소
	const { needStore, characterNeedStore } = useCharacter();
	const needs = get(needStore).data;
	const characterNeeds = get(characterNeedStore).data;

	for (const worldCharacterNeed of Object.values(this.needs)) {
		const need = needs[worldCharacterNeed.need_id];
		if (!need) continue;

		// character_needs에서 multiplier 찾기 (character_id + need_id로 조회)
		const characterNeed = Object.values(characterNeeds).find(
			(cn) =>
				cn.character_id === worldCharacterNeed.character_id &&
				cn.need_id === worldCharacterNeed.need_id
		);
		if (!characterNeed) continue;

		const decreaseAmount = need.decrease_per_tick * characterNeed.decay_multiplier;
		worldCharacterNeed.value = Math.max(0, worldCharacterNeed.value - decreaseAmount);
	}
}
