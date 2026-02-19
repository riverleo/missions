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
		// 1) 상호작용 큐를 준비중이 아닌 상태로 둔다.
		entity.behavior.interactionQueue.status = 'ready';

		// 2) 상호작용 큐 구성 틱을 실행한다.
		const result = entity.behavior.tickEnqueueInteractionQueue(0);

		// 3) 큐를 구성하지 않고 다음 단계로 진행한다.
		expect(result).toBe(false);
		expect(entity.behavior.interactionQueue.interactionTargetIds).toEqual([]);
	});

	it("핵심 상호작용 대상이 없으면 상태를 '완료'로 변경하고 다음 단계로 진행한다.", () => {
		// 1) 준비중 상태에서 핵심 상호작용 대상을 비운다.
		entity.behavior.interactionQueue.status = 'enqueuing';
		entity.behavior.targetEntityId = targetItemEntity.id;
		entity.behavior.interactionQueue.coreInteractionTargetId = undefined;

		// 2) 상호작용 큐 구성 틱을 실행한다.
		entity.behavior.tickEnqueueInteractionQueue(0);

		// 3) 구성할 핵심 대상이 없으므로 완료로 전환한다.
		expect(entity.behavior.interactionQueue.status).toBe('completed');
	});

	it("타깃 엔티티가 없으면 상태를 '완료'로 변경하고 다음 단계로 진행한다.", () => {
		// 1) 준비중 상태에서 타깃 엔티티를 비운다.
		entity.behavior.interactionQueue.status = 'enqueuing';
		entity.behavior.targetEntityId = undefined;
		entity.behavior.interactionQueue.coreInteractionTargetId = coreInteractionTargetId;

		// 2) 상호작용 큐 구성 틱을 실행한다.
		entity.behavior.tickEnqueueInteractionQueue(0);

		// 3) 타깃이 없으므로 큐 구성을 종료한다.
		expect(entity.behavior.interactionQueue.status).toBe('completed');
	});

	it("핵심 상호작용이 '아이템 사용'인 경우 '아이템 줍기' 시작 액션을 먼저 추가한다.", () => {
		// 1) 준비중 상태에서 아이템 사용 핵심 상호작용을 지정한다.
		entity.behavior.interactionQueue.status = 'enqueuing';
		entity.behavior.targetEntityId = targetItemEntity.id;
		entity.behavior.interactionQueue.coreInteractionTargetId = coreInteractionTargetId;

		// 2) 상호작용 큐 구성 틱을 실행한다.
		entity.behavior.tickEnqueueInteractionQueue(0);

		// 3) 시스템 아이템 줍기 액션이 선행되고 핵심 상호작용이 뒤에 추가된다.
		expect(entity.behavior.interactionQueue.interactionTargetIds[0]).toBe(systemItemPickTargetId);
		expect(entity.behavior.interactionQueue.interactionTargetIds[1]).toBe(coreInteractionTargetId);
		expect(entity.behavior.interactionQueue.status).toBe('ready');
	});

	it('핵심 상호작용 대상을 상호작용 대상 목록에 추가하고 상태를 준비완료로 변경한다.', () => {
		// 1) 준비중 상태에서 일반 핵심 상호작용을 지정한다.
		entity.behavior.interactionQueue.status = 'enqueuing';
		entity.behavior.targetEntityId = targetItemEntity.id;
		entity.behavior.interactionQueue.coreInteractionTargetId = systemItemPickTargetId;

		// 2) 상호작용 큐 구성 틱을 실행한다.
		entity.behavior.tickEnqueueInteractionQueue(0);

		// 3) 핵심 상호작용만 큐에 적재되고 상태가 준비완료가 된다.
		expect(entity.behavior.interactionQueue.interactionTargetIds).toEqual([systemItemPickTargetId]);
		expect(entity.behavior.interactionQueue.status).toBe('ready');
	});

	it('항상 false를 반환하여 다음 단계로 진행한다.', () => {
		// 1) 큐 구성 가능한 상태를 준비한다.
		entity.behavior.interactionQueue.status = 'enqueuing';
		entity.behavior.targetEntityId = targetItemEntity.id;
		entity.behavior.interactionQueue.coreInteractionTargetId = systemItemPickTargetId;

		// 2) 상호작용 큐 구성 틱의 반환값을 확인한다.
		const result = entity.behavior.tickEnqueueInteractionQueue(0);

		// 3) 현재 단계는 다음 틱 프로세스 진행을 위해 false를 반환한다.
		expect(result).toBe(false);
	});
});
