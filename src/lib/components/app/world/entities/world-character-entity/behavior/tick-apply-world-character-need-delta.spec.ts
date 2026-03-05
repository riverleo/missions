import { Fixture } from '$lib/hooks/fixture';
import { useCharacter } from '$lib/hooks';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
	addTickDecreaseNeedsWorldCharacterNeedDelta,
	addWorldCharacterNeedDelta,
	createWorldCharacterNeedDelta,
} from '../world-character-need-delta';
import type createForTickAction from '$lib/hooks/fixture/world-character-entity/create-for-tick-action-once-item-use';
import type { WorldCharacterEntity } from '../world-character-entity.svelte';

describe('tickApplyWorldCharacterNeedDelta(worldCharacterNeedDelta: WorldCharacterNeedDelta)', () => {
	let fixture: ReturnType<typeof createForTickAction>;
	let entity: WorldCharacterEntity;

	beforeEach(() => {
		fixture = Fixture.worldCharacterEntity.createForTickActionOnceItemUse();
		entity = fixture.entity;
	});

	afterEach(() => {
		Fixture.reset();
	});

	it('같은 틱에서 동일 need delta가 여러 번 입력되면 누적한 뒤 1회 반영한다.', () => {
		const worldCharacterNeedDelta = createWorldCharacterNeedDelta();
		const need = entity.needs[fixture.needId]!;
		const before = need.value;

		addWorldCharacterNeedDelta(worldCharacterNeedDelta, fixture.needId, 2);
		addWorldCharacterNeedDelta(worldCharacterNeedDelta, fixture.needId, 3);

		entity.behavior.tickApplyWorldCharacterNeedDelta(worldCharacterNeedDelta);

		expect(need.value).toBe(before + 5);
	});

	it('need 값은 일괄 반영 시 최소/최대 범위를 벗어나지 않는다.', () => {
		const worldCharacterNeedDelta = createWorldCharacterNeedDelta();
		const need = entity.needs[fixture.needId]!;
		const needData = useCharacter().getNeed(fixture.needId);

		need.value = needData.max_value - 1;
		addWorldCharacterNeedDelta(worldCharacterNeedDelta, fixture.needId, 1000);
		entity.behavior.tickApplyWorldCharacterNeedDelta(worldCharacterNeedDelta);
		expect(need.value).toBe(needData.max_value);

		const worldCharacterNeedDelta2 = createWorldCharacterNeedDelta();
		addWorldCharacterNeedDelta(worldCharacterNeedDelta2, fixture.needId, -1000);
		entity.behavior.tickApplyWorldCharacterNeedDelta(worldCharacterNeedDelta2);
		expect(need.value).toBe(0);
	});

	it('item_use action-running 중에는 tick-decrease-needs delta 입력을 무시한다.', () => {
		const worldCharacterNeedDelta = createWorldCharacterNeedDelta();
		const need = entity.needs[fixture.needId]!;
		const before = need.value;

		entity.behavior.interactionQueue.status = 'action-running';
		entity.behavior.interactionQueue.currentInteractionTargetId = fixture.matchingTargetId;

		addWorldCharacterNeedDelta(worldCharacterNeedDelta, fixture.needId, 2);
		addTickDecreaseNeedsWorldCharacterNeedDelta(worldCharacterNeedDelta, fixture.needId, 10);
		entity.behavior.tickApplyWorldCharacterNeedDelta(worldCharacterNeedDelta);

		expect(need.value).toBe(before + 2);
	});

	it('같은 틱에 동일 need의 상승 delta가 있으면 tick-decrease-needs delta를 무시한다.', () => {
		const worldCharacterNeedDelta = createWorldCharacterNeedDelta();
		const need = entity.needs[fixture.needId]!;
		const before = need.value;

		addWorldCharacterNeedDelta(worldCharacterNeedDelta, fixture.needId, 3);
		addTickDecreaseNeedsWorldCharacterNeedDelta(worldCharacterNeedDelta, fixture.needId, 10);
		entity.behavior.tickApplyWorldCharacterNeedDelta(worldCharacterNeedDelta);

		expect(need.value).toBe(before + 3);
	});
});
