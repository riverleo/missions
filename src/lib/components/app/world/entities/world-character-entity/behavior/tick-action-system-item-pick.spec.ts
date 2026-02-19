import { Fixture } from '$lib/hooks/fixture';
import { useInteraction, useWorld } from '$lib/hooks';
import { InteractionIdUtils } from '$lib/utils/interaction-id';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { InteractionTargetId } from '$lib/types';
import type { WorldCharacterEntity } from '../world-character-entity.svelte';
import type { WorldItemEntity } from '../../world-item-entity';
import type createForTickActionSystemItemPick from '$lib/hooks/fixture/world-character-entity/create-for-tick-action-system-item-pick';

const START_TICK = 10;

describe('tickActionSystemItemPick(tick: number)', () => {
	let entity: WorldCharacterEntity;
	let targetItemEntity: WorldItemEntity;
	let systemItemPickTargetId: InteractionTargetId;
	let nonSystemTargetId: InteractionTargetId;

	beforeEach(() => {
		const fixture: ReturnType<typeof createForTickActionSystemItemPick> =
			Fixture.worldCharacterEntity.createForTickActionSystemItemPick();
		entity = fixture.entity;
		targetItemEntity = fixture.targetItemEntity;
		systemItemPickTargetId = fixture.systemItemPickTargetId;
		nonSystemTargetId = fixture.nonSystemTargetId;
		entity.behavior.targetEntityId = targetItemEntity.id;
	});

	afterEach(() => {
		Fixture.reset();
	});

it('상호작용 큐가 액션 준비 또는 액션 실행 중이 아니면 아무 작업도 하지 않는다.', () => {
		entity.behavior.interactionQueue.status = 'ready';
		entity.behavior.interactionQueue.currentInteractionTargetId = systemItemPickTargetId;

		const result = entity.behavior.tickActionSystemItemPick(START_TICK);

		expect(result).toBe(false);
		expect(entity.behavior.interactionQueue.status).toBe('ready');
	});

it('현재 상호작용 대상이 없으면 아무 작업도 하지 않는다.', () => {
		entity.behavior.interactionQueue.status = 'action-ready';
		entity.behavior.interactionQueue.currentInteractionTargetId = undefined;

		const result = entity.behavior.tickActionSystemItemPick(START_TICK);

		expect(result).toBe(false);
		expect(entity.behavior.interactionQueue.currentInteractionTargetRunningAtTick).toBeUndefined();
	});

it('현재 상호작용이 아이템 줍기 시스템 상호작용이 아니면 아무 작업도 하지 않는다.', () => {
		entity.behavior.interactionQueue.status = 'action-ready';
		entity.behavior.interactionQueue.currentInteractionTargetId = nonSystemTargetId;

		const result = entity.behavior.tickActionSystemItemPick(START_TICK);

		expect(result).toBe(false);
		expect(entity.behavior.interactionQueue.status).toBe('action-ready');
	});

it('액션 준비 상태에서 시작 조건이 충족되면 실행 시작 틱을 기록하고 액션 실행 중으로 전환한다.', () => {
		entity.behavior.interactionQueue.status = 'action-ready';
		entity.behavior.interactionQueue.currentInteractionTargetId = systemItemPickTargetId;

		entity.behavior.tickActionSystemItemPick(START_TICK);

		expect(entity.behavior.interactionQueue.status).toBe('action-running');
		expect(entity.behavior.interactionQueue.currentInteractionTargetRunningAtTick).toBe(START_TICK);
	});

it('액션 준비 상태에서 시작 조건이 충족되지 않으면 실행을 시작하지 않는다.', () => {
		entity.behavior.interactionQueue.status = 'action-ready';
		entity.behavior.interactionQueue.currentInteractionTargetId = systemItemPickTargetId;
		targetItemEntity.x = entity.x + 1000;
		targetItemEntity.y = entity.y + 1000;

		entity.behavior.tickActionSystemItemPick(START_TICK);

		expect(entity.behavior.interactionQueue.status).toBe('action-ready');
		expect(entity.behavior.interactionQueue.currentInteractionTargetRunningAtTick).toBeUndefined();
	});

it('액션 실행 중 상태에서 액션 지속 시간 경과 시 액션 완료로 전환한다.', () => {
		entity.behavior.interactionQueue.status = 'action-running';
		entity.behavior.interactionQueue.currentInteractionTargetId = systemItemPickTargetId;
		entity.behavior.interactionQueue.currentInteractionTargetRunningAtTick = START_TICK;

		entity.behavior.tickActionSystemItemPick(START_TICK + 1);

		expect(entity.behavior.interactionQueue.status).toBe('action-completed');
	});

it('액션 지속 시간이 0 이하이면 최소 1틱으로 보정해 완료를 판정한다.', () => {
		entity.behavior.interactionQueue.status = 'action-running';
		entity.behavior.interactionQueue.currentInteractionTargetId = systemItemPickTargetId;
		entity.behavior.interactionQueue.currentInteractionTargetRunningAtTick = START_TICK;
		const { interactionActionId: currentActionId } = InteractionIdUtils.parse(systemItemPickTargetId);
		const action = useInteraction()
			.getAllInteractionActions()
			.find((a) => a.id === currentActionId);
		if (!action) throw new Error('interaction action not found');
		action.duration_ticks = 0;

		entity.behavior.tickActionSystemItemPick(START_TICK);
		expect(entity.behavior.interactionQueue.status).toBe('action-running');
		entity.behavior.tickActionSystemItemPick(START_TICK + 1);
		expect(entity.behavior.interactionQueue.status).toBe('action-completed');
	});

	it('완료 시 아이템 소유/월드 상태를 반영하고 큐 상태를 액션 완료로 전환한다.', () => {
		entity.behavior.interactionQueue.status = 'action-running';
		entity.behavior.interactionQueue.currentInteractionTargetId = systemItemPickTargetId;
		entity.behavior.interactionQueue.currentInteractionTargetRunningAtTick = START_TICK;

		entity.behavior.tickActionSystemItemPick(START_TICK + 1);

		const worldItem = useWorld().getWorldItem(targetItemEntity.instanceId);
		expect(entity.behavior.interactionQueue.status).toBe('action-completed');
		expect(worldItem.world_character_id).toBe(entity.instanceId);
		expect(entity.heldItemIds).toContain(targetItemEntity.id);
		expect(entity.worldContext.entities[targetItemEntity.id]).toBeUndefined();
	});
});
