import { Fixture } from '$lib/hooks/fixture';
import { useCharacter } from '$lib/hooks';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { WorldCharacterEntity } from '../world-character-entity.svelte';
import type createForTickAction from '$lib/hooks/fixture/world-character-entity/create-for-tick-action-once-item-use';

describe('tickActionOnceItemUse(tick: number)', () => {
	let fixture: ReturnType<typeof createForTickAction>;
	let entity: WorldCharacterEntity;

	beforeEach(() => {
		fixture = Fixture.worldCharacterEntity.createForTickActionOnceItemUse();
		entity = fixture.entity;
	});

	afterEach(() => {
		Fixture.reset();
	});

	it('behavior.currentInteractionTargetId를 기준으로 자기가 실행할 액션이 아닌 경우 스킵한다.', () => {
		entity.behavior.interactionQueue.status = 'action-ready';
		entity.behavior.interactionQueue.currentInteractionTargetId = fixture.nonMatchingTargetId;

		const result = entity.behavior.tickActionOnceItemUse(0);

		expect(result).toBe(false);
		expect(entity.behavior.interactionQueue.status).toBe('action-ready');
	});

	it('action-ready 상태에서 현재 대상 아이템을 들고 있지 않으면 실행을 시작하지 않는다.', () => {
		// 1) item_use 대상은 맞지만 현재 대상 아이템을 들고 있지 않은 상태로 둔다.
		entity.behavior.interactionQueue.status = 'action-ready';
		entity.behavior.interactionQueue.currentInteractionTargetId = fixture.matchingTargetId;
		entity.behavior.targetEntityId = fixture.holdingTargetEntityId;
		entity.heldItemIds = [];

		// 2) 틱을 실행한다.
		entity.behavior.tickActionOnceItemUse(fixture.startTick);

		// 3) 시작 조건 불충족이면 상태를 유지한다.
		expect(entity.behavior.interactionQueue.status).toBe('action-ready');
		expect(entity.behavior.interactionQueue.currentInteractionTargetRunningAtTick).toBeUndefined();
	});

	it('action-ready 상태에서 현재 대상 아이템을 들고 있으면 action-running으로 전환된다.', () => {
		// 1) item_use 대상을 지정하고 현재 대상 아이템을 들고 있는 상태를 만든다.
		entity.behavior.interactionQueue.status = 'action-ready';
		entity.behavior.interactionQueue.currentInteractionTargetId = fixture.matchingTargetId;
		entity.behavior.targetEntityId = fixture.holdingTargetEntityId;

		// 2) 시작 틱을 실행한다.
		entity.behavior.tickActionOnceItemUse(fixture.startTick);

		// 3) 실행 시작 틱이 기록되고 action-running으로 전환된다.
		expect(entity.behavior.interactionQueue.status).toBe('action-running');
		expect(entity.behavior.interactionQueue.currentInteractionTargetRunningAtTick).toBe(
			fixture.startTick
		);
	});

	it('action-running 동안 아이템 사용 충족 조건 값이 틱마다 증가한다.', () => {
		// 1) action-running 상태와 실행 시작 틱을 설정한다.
		entity.behavior.interactionQueue.status = 'action-running';
		entity.behavior.interactionQueue.currentInteractionTargetId = fixture.matchingTargetId;
		entity.behavior.interactionQueue.currentInteractionTargetRunningAtTick = fixture.startTick;
		const need = entity.needs[fixture.needId]!;
		const before = need.value;

		// 2) 실행 틱을 한 번 진행한다.
		entity.behavior.tickActionOnceItemUse(fixture.runningTick);

		// 3) 증가량이 increase_per_tick 만큼 반영된다.
		expect(need.value).toBe(before + fixture.increasePerTick);
		expect(entity.behavior.interactionQueue.status).toBe('action-running');
	});

	it('욕구는 최대치를 넘겨서 증가하지 않는다.', () => {
		// 1) action-running 상태에서 욕구를 최대치 직전 값으로 설정한다.
		entity.behavior.interactionQueue.status = 'action-running';
		entity.behavior.interactionQueue.currentInteractionTargetId = fixture.matchingTargetId;
		entity.behavior.interactionQueue.currentInteractionTargetRunningAtTick = fixture.startTick;
		const needData = useCharacter().getNeed(fixture.needId);
		const need = entity.needs[fixture.needId]!;
		need.value = needData.max_value - 1;

		// 2) 실행 틱을 진행한다.
		entity.behavior.tickActionOnceItemUse(fixture.runningTick);

		// 3) 최대치를 초과하지 않고 clamp 된다.
		expect(need.value).toBe(needData.max_value);
	});

	it('action-running 상태에서 duration_ticks 경과 시 action-completed로 전환된다.', () => {
		// 1) action-running 상태와 실행 시작 틱을 설정한다.
		entity.behavior.interactionQueue.status = 'action-running';
		entity.behavior.interactionQueue.currentInteractionTargetId = fixture.matchingTargetId;
		entity.behavior.interactionQueue.currentInteractionTargetRunningAtTick = fixture.startTick;

		// 2) duration_ticks 미경과 시점은 running 유지, 경과 시점은 completed 전환을 확인한다.
		entity.behavior.tickActionOnceItemUse(fixture.runningTick);
		expect(entity.behavior.interactionQueue.status).toBe('action-running');

		entity.behavior.tickActionOnceItemUse(fixture.completedTick);
		expect(entity.behavior.interactionQueue.status).toBe('action-completed');
	});

	it('액션 실행 완료 시 소지 아이템에서 현재 대상을 제거한다.', () => {
		// 1) action-running 상태와 완료 시점 조건을 만든다.
		entity.behavior.interactionQueue.status = 'action-running';
		entity.behavior.interactionQueue.currentInteractionTargetId = fixture.matchingTargetId;
		entity.behavior.interactionQueue.currentInteractionTargetRunningAtTick = fixture.startTick;
		entity.behavior.targetEntityId = fixture.holdingTargetEntityId;
		expect(entity.heldItemIds).toContain(fixture.holdingTargetEntityId);

		// 2) 완료 시점 틱을 실행한다.
		entity.behavior.tickActionOnceItemUse(fixture.completedTick);

		// 3) 완료 후 소지 목록에서 대상 아이템이 제거된다.
		expect(entity.behavior.interactionQueue.status).toBe('action-completed');
		expect(entity.heldItemIds).not.toContain(fixture.holdingTargetEntityId);
	});
});
