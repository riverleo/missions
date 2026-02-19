import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorldCharacterEntity } from '../world-character-entity.svelte';
import { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';
import type { InteractionAction, InteractionTargetId } from '$lib/types';

vi.mock('$lib/hooks', () => ({
	useInteraction: vi.fn(),
}));

vi.mock('$lib/utils/interaction-id', () => ({
	InteractionIdUtils: {
		parse: vi.fn(),
		create: vi.fn(),
	},
}));

describe('tickDequeueInteraction(this: WorldCharacterEntityBehavior)', () => {
	let behavior: WorldCharacterEntityBehavior;
	let mockGetAllInteractionActions: ReturnType<typeof vi.fn>;
	let mockGetNextInteractionAction: ReturnType<typeof vi.fn>;

	beforeEach(async () => {
		const mockWorldCharacterEntity: Partial<WorldCharacterEntity> = {
			id: 'character_world-1_character-1' as any,
			instanceId: 'world-character-1' as any,
			heldItemIds: [],
			worldContext: { entities: {} } as any,
			onBodyAnimationComplete: vi.fn(() => vi.fn()),
		};

		behavior = new WorldCharacterEntityBehavior(mockWorldCharacterEntity as WorldCharacterEntity);
		mockGetAllInteractionActions = vi.fn();
		mockGetNextInteractionAction = vi.fn();

		const { useInteraction } = await import('$lib/hooks');
		vi.mocked(useInteraction).mockReturnValue({
			getAllInteractionActions: mockGetAllInteractionActions,
			getNextInteractionAction: mockGetNextInteractionAction,
		} as any);

		const { InteractionIdUtils } = await import('$lib/utils/interaction-id');
		vi.mocked(InteractionIdUtils.parse).mockReturnValue({
			type: 'item',
			interactionId: 'item-interaction-1' as any,
			interactionActionId: 'item-interaction-action-1' as any,
		});
	});

	it('상호작용 큐 상태가 ready 또는 action-completed가 아니면 다음 단계로 진행한다.', () => {
		behavior.interactionQueue.status = 'enqueuing';
		const result = behavior.tickDequeueInteraction(10);

		expect(result).toBe(false);
		expect(behavior.interactionQueue.currentInteractionTargetId).toBeUndefined();
	});

	it('ready 상태에서 첫 번째 상호작용 대상을 currentInteractionTargetId로 설정하고 action-ready로 전환한다.', () => {
		behavior.interactionQueue.status = 'ready';
		behavior.interactionQueue.interactionTargetIds = [
			'item_item-interaction-1_item-interaction-action-1' as InteractionTargetId,
		];

		const result = behavior.tickDequeueInteraction(10);

		expect(result).toBe(false);
		expect(behavior.interactionQueue.currentInteractionTargetId).toBe(
			'item_item-interaction-1_item-interaction-action-1'
		);
		expect(behavior.interactionQueue.currentInteractionTargetRunningAtTick).toBeUndefined();
		expect(behavior.interactionQueue.status).toBe('action-ready');
	});

	it('ready 상태에서 대상이 없으면 completed로 전환한다.', () => {
		behavior.interactionQueue.status = 'ready';
		behavior.interactionQueue.interactionTargetIds = [];
		behavior.interactionQueue.currentInteractionTargetId =
			'item_item-interaction-1_item-interaction-action-1' as InteractionTargetId;
		behavior.interactionQueue.currentInteractionTargetRunningAtTick = 123;

		behavior.tickDequeueInteraction(10);

		expect(behavior.interactionQueue.currentInteractionTargetId).toBe(
			'item_item-interaction-1_item-interaction-action-1'
		);
		expect(behavior.interactionQueue.currentInteractionTargetRunningAtTick).toBe(123);
		expect(behavior.interactionQueue.status).toBe('completed');
	});

	it('action-completed 상태에서 현재 액션의 next 액션이 있으면 next를 currentInteractionTargetId로 설정한다.', async () => {
		const { InteractionIdUtils } = await import('$lib/utils/interaction-id');

		behavior.interactionQueue.status = 'action-completed';
		behavior.interactionQueue.currentInteractionTargetId =
			'item_item-interaction-1_item-interaction-action-1' as InteractionTargetId;
		behavior.interactionQueue.interactionTargetIds = [
			'item_item-interaction-1_item-interaction-action-1' as InteractionTargetId,
		];

		const currentAction: Partial<InteractionAction> = {
			id: 'item-interaction-action-1' as any,
		};
		const nextAction: Partial<InteractionAction> = {
			id: 'item-interaction-action-2' as any,
		};
		mockGetAllInteractionActions.mockReturnValue([currentAction]);
		mockGetNextInteractionAction.mockReturnValue(nextAction);
		vi.mocked(InteractionIdUtils.create).mockReturnValue(
			'item_item-interaction-1_item-interaction-action-2' as InteractionTargetId
		);

		behavior.tickDequeueInteraction(10);

		expect(behavior.interactionQueue.currentInteractionTargetId).toBe(
			'item_item-interaction-1_item-interaction-action-2'
		);
		expect(behavior.interactionQueue.status).toBe('action-ready');
	});

	it('action-completed 상태에서 next 액션이 없으면 interactionTargetIds의 다음 아이템으로 전환한다.', () => {
		behavior.interactionQueue.status = 'action-completed';
		behavior.interactionQueue.currentInteractionTargetId =
			'item_item-interaction-1_item-interaction-action-1' as InteractionTargetId;
		behavior.interactionQueue.interactionTargetIds = [
			'item_item-interaction-1_item-interaction-action-1' as InteractionTargetId,
			'item_item-interaction-1_item-interaction-action-2' as InteractionTargetId,
		];

		mockGetAllInteractionActions.mockReturnValue([]);
		mockGetNextInteractionAction.mockReturnValue(undefined);

		behavior.tickDequeueInteraction(10);

		expect(behavior.interactionQueue.currentInteractionTargetId).toBe(
			'item_item-interaction-1_item-interaction-action-2'
		);
		expect(behavior.interactionQueue.status).toBe('action-ready');
	});

	it('action-completed 상태에서 다음 대상이 없으면 completed로 종료한다.', () => {
		behavior.interactionQueue.status = 'action-completed';
		behavior.interactionQueue.currentInteractionTargetId =
			'item_item-interaction-1_item-interaction-action-1' as InteractionTargetId;
		behavior.interactionQueue.currentInteractionTargetRunningAtTick = 77;
		behavior.interactionQueue.interactionTargetIds = [
			'item_item-interaction-1_item-interaction-action-1' as InteractionTargetId,
		];

		mockGetAllInteractionActions.mockReturnValue([]);
		mockGetNextInteractionAction.mockReturnValue(undefined);

		behavior.tickDequeueInteraction(10);

		expect(behavior.interactionQueue.currentInteractionTargetId).toBe(
			'item_item-interaction-1_item-interaction-action-1'
		);
		expect(behavior.interactionQueue.currentInteractionTargetRunningAtTick).toBe(77);
		expect(behavior.interactionQueue.status).toBe('completed');
	});
});
