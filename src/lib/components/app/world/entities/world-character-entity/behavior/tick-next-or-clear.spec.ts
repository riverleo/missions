import { Fixture } from '$lib/hooks/fixture';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { WorldCharacterEntity } from '../world-character-entity.svelte';
import type createForTickNextOrClear from '$lib/hooks/fixture/world-character-entity/create-for-tick-next-or-clear';

const CURRENT_TICK = 100;

describe('tickNextOrClear(tick: number)', () => {
	let entity: WorldCharacterEntity;
	let currentBehaviorTargetId: string;
	let nextBehaviorTargetId: string;

	beforeEach(() => {
		const fixture: ReturnType<typeof createForTickNextOrClear> =
			Fixture.worldCharacterEntity.createForTickNextOrClear();
		entity = fixture.entity;
		currentBehaviorTargetId = fixture.currentBehaviorTargetId;
		nextBehaviorTargetId = fixture.nextBehaviorTargetId;
		entity.behavior.interactionQueue.status = 'completed';
	});

	afterEach(() => {
		Fixture.reset();
	});

	it('상호작용 큐가 완료되지 않은 경우 클리어하거나 다음 행동 액션으로 넘어가지 않는다.', () => {
		entity.behavior.interactionQueue.status = 'action-running';
		entity.behavior.behaviorTargetId = currentBehaviorTargetId as never;

		entity.behavior.tickNextOrClear(CURRENT_TICK);

		expect(entity.behavior.behaviorTargetId).toBe(currentBehaviorTargetId);
	});

	it('현재 행동 대상이 없으면 초기화하고 로직을 종료한다.', () => {
		entity.behavior.behaviorTargetId = undefined;
		entity.behavior.targetEntityId = 'item_dummy_dummy_dummy' as never;
		entity.behavior.path = [{ x: 1, y: 1 } as never];

		entity.behavior.tickNextOrClear(CURRENT_TICK);

		expect(entity.behavior.behaviorTargetId).toBeUndefined();
		expect(entity.behavior.targetEntityId).toBeUndefined();
		expect(entity.behavior.path).toEqual([]);
		expect(entity.behavior.interactionQueue.status).toBe('enqueuing');
	});

	it('현재 행동 액션을 찾을 수 없으면 에러가 발생한다.', () => {
		entity.behavior.behaviorTargetId = 'need_invalid_invalid' as never;

		expect(() => entity.behavior.tickNextOrClear(CURRENT_TICK)).toThrow();
	});

	it('다음 행동 액션이 있으면 모든 상태를 초기화하고 다음 액션으로 전환한다.', () => {
		entity.behavior.behaviorTargetId = currentBehaviorTargetId as never;
		entity.behavior.targetEntityId = 'item_dummy_dummy_dummy' as never;
		entity.behavior.path = [{ x: 1, y: 1 } as never];

		entity.behavior.tickNextOrClear(CURRENT_TICK);

		expect(entity.behavior.behaviorTargetId).toBe(nextBehaviorTargetId);
		expect(entity.behavior.behaviorTargetStartTick).toBe(CURRENT_TICK);
		expect(entity.behavior.targetEntityId).toBeUndefined();
		expect(entity.behavior.path).toEqual([]);
		expect(entity.behavior.interactionQueue.status).toBe('enqueuing');
	});

	it('다음 행동 액션이 없으면 모든 상태를 초기화하여 행동을 종료한다.', () => {
		entity.behavior.behaviorTargetId = nextBehaviorTargetId as never;
		entity.behavior.targetEntityId = 'item_dummy_dummy_dummy' as never;
		entity.behavior.path = [{ x: 1, y: 1 } as never];

		entity.behavior.tickNextOrClear(CURRENT_TICK);

		expect(entity.behavior.behaviorTargetId).toBeUndefined();
		expect(entity.behavior.targetEntityId).toBeUndefined();
		expect(entity.behavior.path).toEqual([]);
		expect(entity.behavior.interactionQueue.status).toBe('enqueuing');
	});
});
