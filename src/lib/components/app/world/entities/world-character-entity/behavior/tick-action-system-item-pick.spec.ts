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
	let fixture: ReturnType<typeof createForTickActionSystemItemPick>;
	let entity: WorldCharacterEntity;
	let targetItemEntity: WorldItemEntity;
	let systemItemPickTargetId: InteractionTargetId;
	let nonSystemTargetId: InteractionTargetId;

	beforeEach(() => {
		fixture = Fixture.worldCharacterEntity.createForTickActionSystemItemPick();
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
		// 1) 시스템 아이템 줍기 실행 대상이 있어도 큐 상태를 비실행 상태로 둔다.
		entity.behavior.interactionQueue.status = 'ready';
		entity.behavior.interactionQueue.currentInteractionTargetId = systemItemPickTargetId;

		// 2) 시스템 아이템 줍기 틱을 실행한다.
		const result = entity.behavior.tickActionSystemItemPick(START_TICK);

		// 3) 대상 상태가 아니므로 아무 작업도 하지 않는다.
		expect(result).toBe(false);
		expect(entity.behavior.interactionQueue.status).toBe('ready');
	});

	it('현재 상호작용 대상이 없으면 아무 작업도 하지 않는다.', () => {
		// 1) 실행 가능한 큐 상태에서 현재 상호작용 대상을 비운다.
		entity.behavior.interactionQueue.status = 'action-ready';
		entity.behavior.interactionQueue.currentInteractionTargetId = undefined;

		// 2) 시스템 아이템 줍기 틱을 실행한다.
		const result = entity.behavior.tickActionSystemItemPick(START_TICK);

		// 3) 현재 대상이 없으므로 실행 시작 시점을 기록하지 않는다.
		expect(result).toBe(false);
		expect(entity.behavior.interactionQueue.currentInteractionTargetRunningAtTick).toBeUndefined();
	});

	it('현재 상호작용이 아이템 줍기 시스템 상호작용이 아니면 아무 작업도 하지 않는다.', () => {
		// 1) action-ready 상태에서 비시스템 상호작용 대상을 지정한다.
		entity.behavior.interactionQueue.status = 'action-ready';
		entity.behavior.interactionQueue.currentInteractionTargetId = nonSystemTargetId;

		// 2) 시스템 아이템 줍기 틱을 실행한다.
		const result = entity.behavior.tickActionSystemItemPick(START_TICK);

		// 3) 시스템 상호작용이 아니므로 상태를 유지한다.
		expect(result).toBe(false);
		expect(entity.behavior.interactionQueue.status).toBe('action-ready');
	});

	it('액션 준비 상태에서 시작 조건이 충족되면 실행 시작 틱을 기록하고 액션 실행 중으로 전환한다.', () => {
		// 1) action-ready 상태에서 시스템 아이템 줍기 대상을 지정한다.
		entity.behavior.interactionQueue.status = 'action-ready';
		entity.behavior.interactionQueue.currentInteractionTargetId = systemItemPickTargetId;

		// 2) 시스템 아이템 줍기 틱을 실행한다.
		entity.behavior.tickActionSystemItemPick(START_TICK);

		// 3) 시작 조건 충족 시 실행 시작 틱이 기록되고 action-running으로 전환된다.
		expect(entity.behavior.interactionQueue.status).toBe('action-running');
		expect(entity.behavior.interactionQueue.currentInteractionTargetRunningAtTick).toBe(START_TICK);
	});

	it('액션 준비 상태에서 시작 조건이 충족되지 않으면 실행을 시작하지 않는다.', () => {
		// 1) action-ready 상태에서 대상 아이템을 캐릭터로부터 멀리 배치한다.
		entity.behavior.interactionQueue.status = 'action-ready';
		entity.behavior.interactionQueue.currentInteractionTargetId = systemItemPickTargetId;
		targetItemEntity.x = entity.x + 1000;
		targetItemEntity.y = entity.y + 1000;

		// 2) 시스템 아이템 줍기 틱을 실행한다.
		entity.behavior.tickActionSystemItemPick(START_TICK);

		// 3) 시작 조건 미충족이면 상태를 유지한다.
		expect(entity.behavior.interactionQueue.status).toBe('action-ready');
		expect(entity.behavior.interactionQueue.currentInteractionTargetRunningAtTick).toBeUndefined();
	});

	it('액션 실행 중 상태에서 액션 지속 시간 경과 시 액션 완료로 전환한다.', () => {
		// 1) action-running 상태와 실행 시작 틱을 설정한다.
		entity.behavior.interactionQueue.status = 'action-running';
		entity.behavior.interactionQueue.currentInteractionTargetId = systemItemPickTargetId;
		entity.behavior.interactionQueue.currentInteractionTargetRunningAtTick = START_TICK;

		// 2) 지속 시간이 아직 부족한 시점에서는 상태가 유지되어야 한다.
		entity.behavior.tickActionSystemItemPick(fixture.runningTick);
		expect(entity.behavior.interactionQueue.status).toBe('action-running');

		// 3) 지속 시간이 경과한 시점에서 action-completed로 전환된다.
		entity.behavior.tickActionSystemItemPick(fixture.completedTick);
		expect(entity.behavior.interactionQueue.status).toBe('action-completed');
	});

	it('액션 지속 시간이 0 이하이면 최소 1틱으로 보정해 완료를 판정한다.', () => {
		// 1) action-running 상태와 실행 시작 틱을 설정한다.
		entity.behavior.interactionQueue.status = 'action-running';
		entity.behavior.interactionQueue.currentInteractionTargetId = systemItemPickTargetId;
		entity.behavior.interactionQueue.currentInteractionTargetRunningAtTick = START_TICK;
		const { interactionActionId: currentInteractionActionId } =
			InteractionIdUtils.parse(systemItemPickTargetId);
		const action = useInteraction()
			.getAllInteractionActions()
			.find((a) => a.id === currentInteractionActionId)!;

		// 2) 지속 시간을 0으로 설정해 최소 1틱 보정 케이스를 만든다.
		action.duration_ticks = 0;

		// 3) 시작 틱에는 아직 완료되지 않아야 한다.
		entity.behavior.tickActionSystemItemPick(fixture.completedTick - 1);
		expect(entity.behavior.interactionQueue.status).toBe('action-running');

		// 4) 다음 틱에서 완료로 전환된다.
		entity.behavior.tickActionSystemItemPick(fixture.completedTick);
		expect(entity.behavior.interactionQueue.status).toBe('action-completed');
	});

	it('완료 시 아이템 소유/월드 상태를 반영하고 큐 상태를 액션 완료로 전환한다.', () => {
		// 1) action-running 상태와 실행 시작 틱을 설정한다.
		entity.behavior.interactionQueue.status = 'action-running';
		entity.behavior.interactionQueue.currentInteractionTargetId = systemItemPickTargetId;
		entity.behavior.interactionQueue.currentInteractionTargetRunningAtTick = START_TICK;

		// 2) 완료 시점 틱을 실행한다.
		entity.behavior.tickActionSystemItemPick(fixture.completedTick);

		// 3) 아이템 소유/월드 반영과 큐 상태 전환을 검증한다.
		const worldItem = useWorld().getWorldItem(targetItemEntity.instanceId);
		expect(entity.behavior.interactionQueue.status).toBe('action-completed');
		expect(worldItem.world_character_id).toBe(entity.instanceId);
		expect(entity.heldItemIds).toContain(targetItemEntity.id);
		expect(entity.worldContext.entities[targetItemEntity.id]).toBeUndefined();
	});
});
