import { Fixture } from '$lib/hooks/fixture';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { WorldCharacterEntity } from '../world-character-entity.svelte';
import type { InteractionTargetId } from '$lib/types';
import type createForTickDequeueInteraction from '$lib/hooks/fixture/world-character-entity/create-for-tick-dequeue-interaction';

describe('tickDequeueInteraction(tick: number)', () => {
	let entity: WorldCharacterEntity;
	let firstInteractionTargetId: InteractionTargetId;
	let secondInteractionTargetId: InteractionTargetId;

	beforeEach(() => {
		const fixture: ReturnType<typeof createForTickDequeueInteraction> =
			Fixture.worldCharacterEntity.createForTickDequeueInteraction();
		entity = fixture.entity;
		firstInteractionTargetId = fixture.firstInteractionTargetId;
		secondInteractionTargetId = fixture.secondInteractionTargetId;
	});

	afterEach(() => {
		Fixture.reset();
	});

	it('상호작용 큐 상태가 ready 또는 action-completed가 아니면 아무 작업도 하지 않는다.', () => {
		entity.behavior.interactionQueue.status = 'enqueuing';

		const result = entity.behavior.tickDequeueInteraction(0);

		expect(result).toBe(false);
		expect(entity.behavior.interactionQueue.currentInteractionTargetId).toBeUndefined();
	});

	it('ready 상태면 첫 번째 타깃을 currentInteractionTargetId로 설정하고 action-ready로 전환한다.', () => {
		entity.behavior.interactionQueue.status = 'ready';
		entity.behavior.interactionQueue.interactionTargetIds = [firstInteractionTargetId];

		entity.behavior.tickDequeueInteraction(0);

		expect(entity.behavior.interactionQueue.currentInteractionTargetId).toBe(
			firstInteractionTargetId
		);
		expect(entity.behavior.interactionQueue.currentInteractionTargetRunningAtTick).toBeUndefined();
		expect(entity.behavior.interactionQueue.status).toBe('action-ready');
	});

	it('action-completed 상태면 현재 타깃의 next 액션을 우선 탐색한다.', () => {
		entity.behavior.interactionQueue.status = 'action-completed';
		entity.behavior.interactionQueue.interactionTargetIds = [firstInteractionTargetId];
		entity.behavior.interactionQueue.currentInteractionTargetId = firstInteractionTargetId;

		entity.behavior.tickDequeueInteraction(0);

		expect(entity.behavior.interactionQueue.currentInteractionTargetId).toBe(
			secondInteractionTargetId
		);
		expect(entity.behavior.interactionQueue.status).toBe('action-ready');
	});

	it('next 액션이 없으면 interactionTargetIds에서 현재 타깃의 다음 인덱스를 탐색한다.', () => {
		entity.behavior.interactionQueue.status = 'action-completed';
		entity.behavior.interactionQueue.interactionTargetIds = [
			secondInteractionTargetId,
			firstInteractionTargetId,
		];
		entity.behavior.interactionQueue.currentInteractionTargetId = secondInteractionTargetId;

		entity.behavior.tickDequeueInteraction(0);

		expect(entity.behavior.interactionQueue.currentInteractionTargetId).toBe(
			firstInteractionTargetId
		);
		expect(entity.behavior.interactionQueue.status).toBe('action-ready');
	});

	it('다음 타깃이 없으면 완료로 전환하고 진행한다.', () => {
		entity.behavior.interactionQueue.status = 'action-completed';
		entity.behavior.interactionQueue.interactionTargetIds = [secondInteractionTargetId];
		entity.behavior.interactionQueue.currentInteractionTargetId = secondInteractionTargetId;

		entity.behavior.tickDequeueInteraction(0);

		expect(entity.behavior.interactionQueue.status).toBe('completed');
	});
});
