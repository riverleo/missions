import { useCharacter } from '$lib/hooks';
import { get } from 'svelte/store';
import type { WorldCharacterEntity } from './world-character-entity.svelte';

/**
 * # 욕구 감소 처리
 *
 * 캐릭터의 모든 욕구를 tick마다 감소시킵니다.
 * decrease_per_tick과 decay_multiplier를 곱한 값만큼 감소하며,
 * 최소값 0으로 제한됩니다.
 *
 * @param tick - 현재 게임 틱 번호
 *
 * ## 명세
 * - [x] 모든 욕구를 순회하며 감소 처리한다.
 * - [x] 욕구 정보가 없으면 에러가 발생한다.
 * - [x] 캐릭터 욕구가 없으면 에러가 발생한다.
 * - [x] decrease_per_tick과 decay_multiplier를 곱하여 감소량을 계산한다.
 * - [x] 욕구 값은 최소 0으로 제한된다.
 */
export default function tickDecreaseNeeds(this: WorldCharacterEntity, tick: number): void {
	const { getNeed, getCharacterNeed } = useCharacter();

	for (const worldCharacterNeed of Object.values(this.needs)) {
		const need = getNeed(worldCharacterNeed.need_id);
		const characterNeed = getCharacterNeed(
			worldCharacterNeed.character_id,
			worldCharacterNeed.need_id
		);

		const decreaseAmount = need.decrease_per_tick * characterNeed.decay_multiplier;
		worldCharacterNeed.value = Math.max(0, worldCharacterNeed.value - decreaseAmount);
	}
}
