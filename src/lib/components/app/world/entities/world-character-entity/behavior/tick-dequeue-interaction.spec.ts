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
		// 1) dequeue 대상이 아닌 상태를 만든다.
		entity.behavior.interactionQueue.status = 'enqueuing';

		// 2) dequeue 틱을 실행한다.
		const result = entity.behavior.tickDequeueInteraction(0);

		// 3) 현재 상호작용 대상을 선택하지 않고 다음 단계로 진행한다.
		expect(result).toBe(false);
		expect(entity.behavior.interactionQueue.currentInteractionTargetId).toBeUndefined();
	});

	it('ready 상태면 첫 번째 타깃을 currentInteractionTargetId로 설정하고 action-ready로 전환한다.', () => {
		// 1) ready 상태에서 상호작용 대상 목록을 준비한다.
		entity.behavior.interactionQueue.status = 'ready';
		entity.behavior.interactionQueue.interactionTargetIds = [firstInteractionTargetId];

		// 2) dequeue 틱을 실행한다.
		entity.behavior.tickDequeueInteraction(0);

		// 3) 첫 대상이 현재 상호작용 대상으로 선택되고 액션 준비 상태가 된다.
		expect(entity.behavior.interactionQueue.currentInteractionTargetId).toBe(
			firstInteractionTargetId
		);
		expect(entity.behavior.interactionQueue.currentInteractionTargetRunningAtTick).toBeUndefined();
		expect(entity.behavior.interactionQueue.status).toBe('action-ready');
	});

	it('action-completed 상태면 현재 타깃의 next 액션을 우선 탐색한다.', () => {
		// 1) 현재 타깃이 완료된 상태를 만든다.
		entity.behavior.interactionQueue.status = 'action-completed';
		entity.behavior.interactionQueue.interactionTargetIds = [firstInteractionTargetId];
		entity.behavior.interactionQueue.currentInteractionTargetId = firstInteractionTargetId;

		// 2) dequeue 틱을 실행한다.
		entity.behavior.tickDequeueInteraction(0);

		// 3) 현재 타깃의 next 액션이 우선 선택된다.
		expect(entity.behavior.interactionQueue.currentInteractionTargetId).toBe(
			secondInteractionTargetId
		);
		expect(entity.behavior.interactionQueue.status).toBe('action-ready');
	});

	it('next 액션이 없으면 interactionTargetIds에서 현재 타깃의 다음 인덱스를 탐색한다.', () => {
		// 1) next 액션이 없는 타깃 순서를 준비한다.
		entity.behavior.interactionQueue.status = 'action-completed';
		entity.behavior.interactionQueue.interactionTargetIds = [
			secondInteractionTargetId,
			firstInteractionTargetId,
		];
		entity.behavior.interactionQueue.currentInteractionTargetId = secondInteractionTargetId;

		// 2) dequeue 틱을 실행한다.
		entity.behavior.tickDequeueInteraction(0);

		// 3) 목록 기준 다음 인덱스 타깃이 선택된다.
		expect(entity.behavior.interactionQueue.currentInteractionTargetId).toBe(
			firstInteractionTargetId
		);
		expect(entity.behavior.interactionQueue.status).toBe('action-ready');
	});

	it('다음 타깃이 없으면 완료로 전환하고 진행한다.', () => {
		// 1) 현재 타깃 뒤에 진행할 대상이 없는 상태를 만든다.
		entity.behavior.interactionQueue.status = 'action-completed';
		entity.behavior.interactionQueue.interactionTargetIds = [secondInteractionTargetId];
		entity.behavior.interactionQueue.currentInteractionTargetId = secondInteractionTargetId;

		// 2) dequeue 틱을 실행한다.
		entity.behavior.tickDequeueInteraction(0);

		// 3) 더 이상 진행할 타깃이 없으므로 큐를 완료 처리한다.
		expect(entity.behavior.interactionQueue.status).toBe('completed');
	});
});
