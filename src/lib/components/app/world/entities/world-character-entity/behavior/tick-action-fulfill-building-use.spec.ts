import { Fixture } from '$lib/hooks/fixture';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { WorldCharacterEntity } from '../world-character-entity.svelte';
import type createForTickAction from '$lib/hooks/fixture/world-character-entity/create-for-tick-action-fulfill-building-use';

describe('tickActionFulfillBuildingUse(tick: number)', () => {
	let fixture: ReturnType<typeof createForTickAction>;
	let entity: WorldCharacterEntity;

	beforeEach(() => {
		fixture = Fixture.worldCharacterEntity.createForTickActionFulfillBuildingUse();
		entity = fixture.entity;
	});

	afterEach(() => {
		Fixture.reset();
	});

	it('behavior.currentInteractionTargetId를 기준으로 자기가 실행할 액션이 아닌 경우 스킵한다.', () => {
		entity.behavior.interactionQueue.status = 'action-ready';
		entity.behavior.interactionQueue.currentInteractionTargetId = fixture.nonMatchingTargetId;

		const result = entity.behavior.tickActionFulfillBuildingUse(0);

		expect(result).toBe(false);
		expect(entity.behavior.interactionQueue.status).toBe('action-ready');
	});
});
