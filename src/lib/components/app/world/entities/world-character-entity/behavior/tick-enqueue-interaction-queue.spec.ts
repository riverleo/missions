import { Fixture } from '$lib/hooks/fixture';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { WorldCharacterEntity } from '../world-character-entity.svelte';
import type { InteractionTargetId } from '$lib/types';
import type { WorldItemEntity } from '../../world-item-entity';
import type createForTickEnqueueInteractionQueue from '$lib/hooks/fixture/world-character-entity/create-for-tick-enqueue-interaction-queue';

describe('tickEnqueueInteractionQueue(tick: number)', () => {
	let entity: WorldCharacterEntity;
	let targetItemEntity: WorldItemEntity;
	let coreInteractionTargetId: InteractionTargetId;
	let systemItemPickTargetId: InteractionTargetId;

	beforeEach(() => {
		const fixture: ReturnType<typeof createForTickEnqueueInteractionQueue> =
			Fixture.worldCharacterEntity.createForTickEnqueueInteractionQueue();
		entity = fixture.entity;
		targetItemEntity = fixture.targetItemEntity;
		coreInteractionTargetId = fixture.coreInteractionTargetId;
		systemItemPickTargetId = fixture.systemItemPickTargetId;
	});

	afterEach(() => {
		Fixture.reset();
	});

	it("상호작용 큐 상태가 '준비중'이 아니면 스킵하고 다음 단계로 진행한다.", () => {
		entity.behavior.interactionQueue.status = 'ready';

		const result = entity.behavior.tickEnqueueInteractionQueue(0);

		expect(result).toBe(false);
		expect(entity.behavior.interactionQueue.interactionTargetIds).toEqual([]);
	});

	it("핵심 상호작용 대상이 없으면 상태를 '완료'로 변경하고 다음 단계로 진행한다.", () => {
		entity.behavior.interactionQueue.status = 'enqueuing';
		entity.behavior.targetEntityId = targetItemEntity.id;
		entity.behavior.interactionQueue.coreInteractionTargetId = undefined;

		entity.behavior.tickEnqueueInteractionQueue(0);

		expect(entity.behavior.interactionQueue.status).toBe('completed');
	});

	it("타깃 엔티티가 없으면 상태를 '완료'로 변경하고 다음 단계로 진행한다.", () => {
		entity.behavior.interactionQueue.status = 'enqueuing';
		entity.behavior.targetEntityId = undefined;
		entity.behavior.interactionQueue.coreInteractionTargetId = coreInteractionTargetId;

		entity.behavior.tickEnqueueInteractionQueue(0);

		expect(entity.behavior.interactionQueue.status).toBe('completed');
	});

	it("핵심 상호작용이 '아이템 사용'인 경우 '아이템 줍기' 시작 액션을 먼저 추가한다.", () => {
		entity.behavior.interactionQueue.status = 'enqueuing';
		entity.behavior.targetEntityId = targetItemEntity.id;
		entity.behavior.interactionQueue.coreInteractionTargetId = coreInteractionTargetId;

		entity.behavior.tickEnqueueInteractionQueue(0);

		expect(entity.behavior.interactionQueue.interactionTargetIds[0]).toBe(systemItemPickTargetId);
		expect(entity.behavior.interactionQueue.interactionTargetIds[1]).toBe(coreInteractionTargetId);
		expect(entity.behavior.interactionQueue.status).toBe('ready');
	});

	it('핵심 상호작용 대상을 상호작용 대상 목록에 추가하고 상태를 준비완료로 변경한다.', () => {
		entity.behavior.interactionQueue.status = 'enqueuing';
		entity.behavior.targetEntityId = targetItemEntity.id;
		entity.behavior.interactionQueue.coreInteractionTargetId = systemItemPickTargetId;

		entity.behavior.tickEnqueueInteractionQueue(0);

		expect(entity.behavior.interactionQueue.interactionTargetIds).toEqual([systemItemPickTargetId]);
		expect(entity.behavior.interactionQueue.status).toBe('ready');
	});

	it('항상 false를 반환하여 다음 단계로 진행한다.', () => {
		entity.behavior.interactionQueue.status = 'enqueuing';
		entity.behavior.targetEntityId = targetItemEntity.id;
		entity.behavior.interactionQueue.coreInteractionTargetId = systemItemPickTargetId;

		const result = entity.behavior.tickEnqueueInteractionQueue(0);

		expect(result).toBe(false);
	});
});
