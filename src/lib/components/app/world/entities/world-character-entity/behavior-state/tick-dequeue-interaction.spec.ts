import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorldCharacterEntity } from '../world-character-entity.svelte';
import { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';
import type { InteractionAction, InteractionTargetId } from '$lib/types';

vi.mock('$lib/hooks', () => ({
	useInteraction: vi.fn(),
	useCharacter: vi.fn(),
}));

vi.mock('$lib/utils/interaction-id', () => ({
	InteractionIdUtils: {
		parse: vi.fn(),
	},
}));

describe('tickDequeueInteraction(this: WorldCharacterEntityBehavior)', () => {
	let behavior: WorldCharacterEntityBehavior;
	let mockGetAllInteractionActions: ReturnType<typeof vi.fn>;
	let mockGetOrUndefinedCharacter: ReturnType<typeof vi.fn>;
	let mockGetOrUndefinedCharacterBody: ReturnType<typeof vi.fn>;
	let mockGetOrUndefinedCharacterBodyStates: ReturnType<typeof vi.fn>;
	let emitBodyAnimationComplete: () => void;

	beforeEach(async () => {
		const listeners = new Set<() => void>();
		emitBodyAnimationComplete = () => {
			for (const listener of listeners) {
				listener();
			}
		};

		const mockWorldCharacterEntity: Partial<WorldCharacterEntity> = {
			id: 'character_world-1_character-1' as any,
			instanceId: 'world-character-1' as any,
			heldItemIds: [],
			worldContext: { entities: {} } as any,
			onBodyAnimationComplete: vi.fn((listener: () => void) => {
				listeners.add(listener);
				return () => listeners.delete(listener);
			}),
		};

		behavior = new WorldCharacterEntityBehavior(mockWorldCharacterEntity as WorldCharacterEntity);

		mockGetAllInteractionActions = vi.fn();
		mockGetOrUndefinedCharacter = vi.fn();
		mockGetOrUndefinedCharacterBody = vi.fn();
		mockGetOrUndefinedCharacterBodyStates = vi.fn();

		const { useInteraction, useCharacter } = await import('$lib/hooks');
		vi.mocked(useInteraction).mockReturnValue({
			getAllInteractionActions: mockGetAllInteractionActions,
		} as any);
		vi.mocked(useCharacter).mockReturnValue({
			getOrUndefinedCharacter: mockGetOrUndefinedCharacter,
			getOrUndefinedCharacterBody: mockGetOrUndefinedCharacterBody,
			getOrUndefinedCharacterBodyStates: mockGetOrUndefinedCharacterBodyStates,
		} as any);

		const { InteractionIdUtils } = await import('$lib/utils/interaction-id');
		vi.mocked(InteractionIdUtils.parse).mockReturnValue({
			type: 'item',
			interactionId: 'item-interaction-1' as any,
			interactionActionId: 'item-interaction-action-1' as any,
		});
	});

	it('상호작용 큐 상태가 준비완료 또는 실행중이 아니면 다음 단계로 진행한다.', () => {
		behavior.interactionQueue.status = 'enqueuing';
		behavior.interactionQueue.interactionTargetIds = [
			'item_item-interaction-1_item-interaction-action-1' as InteractionTargetId,
		];

		const result = behavior.tickDequeueInteraction(10);

		expect(result).toBe(false);
		expect(behavior.interactionQueue.status).toBe('enqueuing');
		expect(behavior.interactionQueue.poppedInteractionTargetId).toBeUndefined();
	});

	it('상호작용 큐 상태가 준비완료면 다음 상호작용 대상을 꺼내 실행중으로 전환한다.', () => {
		behavior.interactionQueue.status = 'ready';
		behavior.interactionQueue.interactionTargetIds = [
			'item_item-interaction-1_item-interaction-action-1' as InteractionTargetId,
		];

		const result = behavior.tickDequeueInteraction(10);

		expect(result).toBe(false);
		expect(behavior.interactionQueue.status).toBe('running');
		expect(behavior.interactionQueue.poppedInteractionTargetId).toBe(
			'item_item-interaction-1_item-interaction-action-1'
		);
		expect(behavior.interactionQueue.poppedAtTick).toBe(10);
	});

	it('상호작용 액션 지속 시간이 0보다 크면, 현재 실행 중인 상호작용 시작 시각(틱) 기준 경과 시간으로 완료를 판정한다.', () => {
		behavior.interactionQueue.status = 'running';
		behavior.interactionQueue.poppedAtTick = 10;
		behavior.interactionQueue.poppedInteractionTargetId =
			'item_item-interaction-1_item-interaction-action-1' as InteractionTargetId;

		const action: Partial<InteractionAction> = {
			id: 'item-interaction-action-1' as any,
			duration_ticks: 3,
			character_body_state_type: 'idle' as any,
		};
		mockGetAllInteractionActions.mockReturnValue([action]);

		const result1 = behavior.tickDequeueInteraction(12);
		expect(result1).toBe(false);
		expect(behavior.interactionQueue.status).toBe('running');

		const result2 = behavior.tickDequeueInteraction(13);
		expect(result2).toBe(false);
		expect(behavior.interactionQueue.status).toBe('completed');
		expect(behavior.interactionQueue.poppedInteractionTargetId).toBeUndefined();
	});

	it('상호작용 액션 지속 시간이 0이고 바디 애니메이션 완료 신호를 받을 수 있는 반복 모드면, 완료 신호를 기다린다.', () => {
		behavior.interactionQueue.status = 'running';
		behavior.interactionQueue.poppedAtTick = 20;
		behavior.interactionQueue.poppedInteractionTargetId =
			'item_item-interaction-1_item-interaction-action-1' as InteractionTargetId;

		const action: Partial<InteractionAction> = {
			id: 'item-interaction-action-1' as any,
			duration_ticks: 0,
			character_body_state_type: 'idle' as any,
		};
		mockGetAllInteractionActions.mockReturnValue([action]);
		mockGetOrUndefinedCharacter.mockReturnValue({ character_body_id: 'body-1' });
		mockGetOrUndefinedCharacterBody.mockReturnValue({ id: 'body-1' });
		mockGetOrUndefinedCharacterBodyStates.mockReturnValue([{ type: 'idle', loop: 'once' }]);

		const result1 = behavior.tickDequeueInteraction(20);
		expect(result1).toBe(false);
		expect(behavior.interactionQueue.status).toBe('running');

		emitBodyAnimationComplete();
		const result2 = behavior.tickDequeueInteraction(21);
		expect(result2).toBe(false);
		expect(behavior.interactionQueue.status).toBe('completed');
	});

	it('상호작용 액션 지속 시간이 0이고 바디 애니메이션 완료 신호를 받을 수 없는 반복 모드면, 1틱 폴백으로 완료 처리한다.', () => {
		behavior.interactionQueue.status = 'running';
		behavior.interactionQueue.poppedAtTick = 30;
		behavior.interactionQueue.poppedInteractionTargetId =
			'item_item-interaction-1_item-interaction-action-1' as InteractionTargetId;

		const action: Partial<InteractionAction> = {
			id: 'item-interaction-action-1' as any,
			duration_ticks: 0,
			character_body_state_type: 'idle' as any,
		};
		mockGetAllInteractionActions.mockReturnValue([action]);
		mockGetOrUndefinedCharacter.mockReturnValue({ character_body_id: 'body-1' });
		mockGetOrUndefinedCharacterBody.mockReturnValue({ id: 'body-1' });
		mockGetOrUndefinedCharacterBodyStates.mockReturnValue([{ type: 'idle', loop: 'loop' }]);
		vi.spyOn(console, 'warn').mockImplementation(() => {});

		const result1 = behavior.tickDequeueInteraction(30);
		expect(result1).toBe(false);
		expect(behavior.interactionQueue.status).toBe('running');

		const result2 = behavior.tickDequeueInteraction(31);
		expect(result2).toBe(false);
		expect(behavior.interactionQueue.status).toBe('completed');
	});

	it('상호작용 액션 전환 또는 큐 완료 시 바디 애니메이션 완료 상태를 초기화한다.', async () => {
		const { InteractionIdUtils } = await import('$lib/utils/interaction-id');

		behavior.interactionQueue.status = 'running';
		behavior.interactionQueue.poppedAtTick = 50;
		behavior.interactionQueue.poppedInteractionTargetId =
			'item_item-interaction-1_item-interaction-action-1' as InteractionTargetId;
		behavior.interactionQueue.interactionTargetIds = [
			'item_item-interaction-1_item-interaction-action-2' as InteractionTargetId,
		];

		const action1: Partial<InteractionAction> = {
			id: 'item-interaction-action-1' as any,
			duration_ticks: 0,
			character_body_state_type: 'idle' as any,
		};
		const action2: Partial<InteractionAction> = {
			id: 'item-interaction-action-2' as any,
			duration_ticks: 0,
			character_body_state_type: 'idle' as any,
		};
		mockGetAllInteractionActions.mockReturnValue([action1, action2]);
		mockGetOrUndefinedCharacter.mockReturnValue({ character_body_id: 'body-1' });
		mockGetOrUndefinedCharacterBody.mockReturnValue({ id: 'body-1' });
		mockGetOrUndefinedCharacterBodyStates.mockReturnValue([{ type: 'idle', loop: 'once' }]);

		vi.mocked(InteractionIdUtils.parse)
			.mockReturnValueOnce({
				type: 'item',
				interactionId: 'item-interaction-1' as any,
				interactionActionId: 'item-interaction-action-1' as any,
			})
			.mockReturnValueOnce({
				type: 'item',
				interactionId: 'item-interaction-1' as any,
				interactionActionId: 'item-interaction-action-2' as any,
			});

		emitBodyAnimationComplete();
		behavior.tickDequeueInteraction(51);

		expect(behavior.interactionQueue.poppedInteractionTargetId).toBe(
			'item_item-interaction-1_item-interaction-action-2'
		);
		expect(behavior.isCurrentInteractionBodyAnimationCompleted()).toBe(false);

		emitBodyAnimationComplete();
		behavior.tickDequeueInteraction(52);
		expect(behavior.interactionQueue.status).toBe('completed');
		expect(behavior.isCurrentInteractionBodyAnimationCompleted()).toBe(false);
	});

	it('clear 이후 늦게 들어온 바디 애니메이션 완료 신호는 무시된다.', () => {
		behavior.interactionQueue.status = 'running';
		behavior.interactionQueue.poppedInteractionTargetId =
			'item_item-interaction-1_item-interaction-action-1' as InteractionTargetId;
		behavior.bodyAnimationCompletedInteractionTargetId =
			'item_item-interaction-1_item-interaction-action-1' as InteractionTargetId;

		behavior.clear();
		emitBodyAnimationComplete();

		expect(behavior.interactionQueue.poppedInteractionTargetId).toBeUndefined();
		expect(behavior.isCurrentInteractionBodyAnimationCompleted()).toBe(false);
	});

	it('상호작용 액션 완료 시 큐 상태만 갱신하고 소지 아이템 상태는 변경하지 않는다.', () => {
		behavior.worldCharacterEntity.heldItemIds = ['item_world-1_item-1_world-item-1' as any];
		behavior.interactionQueue.status = 'running';
		behavior.interactionQueue.poppedAtTick = 10;
		behavior.interactionQueue.poppedInteractionTargetId =
			'item_item-interaction-1_item-interaction-action-1' as InteractionTargetId;

		const action: Partial<InteractionAction> = {
			id: 'item-interaction-action-1' as any,
			duration_ticks: 1,
			character_body_state_type: 'idle' as any,
		};
		mockGetAllInteractionActions.mockReturnValue([action]);

		const result = behavior.tickDequeueInteraction(11);

		expect(result).toBe(false);
		expect(behavior.worldCharacterEntity.heldItemIds).toEqual([
			'item_world-1_item-1_world-item-1'
		]);
		expect(behavior.interactionQueue.status).toBe('completed');
		expect(behavior.interactionQueue.poppedInteractionTargetId).toBeUndefined();
	});

});
