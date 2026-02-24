import { useCharacter } from '$lib/hooks';
import type { WorldCharacterEntity } from './world-character-entity.svelte';
import type { WorldCharacterNeedDelta } from './world-character-need-delta';
import { addTickDecreaseNeedsWorldCharacterNeedDelta } from './world-character-need-delta';

/**
 * # 욕구 감소 처리
 *
 * 캐릭터의 모든 욕구 감소 입력을 tick마다 수집합니다.
 * decrease_per_tick과 decay_multiplier를 곱한 값을
 * `WorldCharacterNeedDelta`에 누적합니다.
 *
 * @param tick - 현재 게임 틱 번호
 *
 * ## 명세
 * - [x] 모든 욕구를 순회하며 감소 처리한다.
 * - [x] 욕구 정보가 없으면 에러가 발생한다.
 * - [x] 캐릭터 욕구가 없으면 에러가 발생한다.
 * - [x] decrease_per_tick과 decay_multiplier를 곱하여 감소량을 계산한다.
 * - [x] 계산된 감소량을 WorldCharacterNeedDelta에 기록한다.
 */
export default function tickDecreaseNeeds(
	this: WorldCharacterEntity,
	tick: number,
	worldCharacterNeedDelta: WorldCharacterNeedDelta
): void {
	const { getNeed, getCharacterNeed } = useCharacter();

	for (const worldCharacterNeed of Object.values(this.needs)) {
		const need = getNeed(worldCharacterNeed.need_id);
		const characterNeed = getCharacterNeed(
			worldCharacterNeed.character_id,
			worldCharacterNeed.need_id
		);

		const decreaseAmount = need.decrease_per_tick * characterNeed.decay_multiplier;
		addTickDecreaseNeedsWorldCharacterNeedDelta(
			worldCharacterNeedDelta,
			worldCharacterNeed.need_id,
			decreaseAmount
		);
	}
}
