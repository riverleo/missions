import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorldCharacterEntity } from '../world-character-entity.svelte';
import { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';
import tickActionSystemItemPick, {
	applyCompletedSystemItemPick,
	canStartSystemItemPick,
} from './tick-action-system-item-pick';

vi.mock('$lib/hooks', () => ({
	useWorld: vi.fn(),
	useInteraction: vi.fn(),
}));

vi.mock('$lib/utils/entity-id', () => ({
	EntityIdUtils: {
		not: vi.fn((type: string, id: string | undefined) => !id?.startsWith(`${type}_`)),
		instanceId: vi.fn((id: string) => id.split('_')[2] ?? id),
	},
}));

vi.mock('$lib/utils/interaction-id', () => ({
	InteractionIdUtils: {
		parse: vi.fn(),
	},
}));

describe('tick-action-system-item-pick', () => {
	let behavior: WorldCharacterEntityBehavior;
	let mockGetOrUndefinedWorldItem: ReturnType<typeof vi.fn>;
	let mockUpdateWorldItem: ReturnType<typeof vi.fn>;
	let mockGetInteraction: ReturnType<typeof vi.fn>;
	let mockGetAllInteractionActions: ReturnType<typeof vi.fn>;

	beforeEach(async () => {
		const mockWorldCharacterEntity: Partial<WorldCharacterEntity> = {
			id: 'character_world-1_character-1' as any,
			instanceId: 'world-character-1' as any,
			x: 0,
			y: 0,
			body: { position: { x: 0, y: 0 } } as any,
			heldItemIds: [],
			worldContext: { entities: {} } as any,
			onBodyAnimationComplete: vi.fn(),
		};

		behavior = new WorldCharacterEntityBehavior(mockWorldCharacterEntity as WorldCharacterEntity);
		mockGetOrUndefinedWorldItem = vi.fn();
		mockUpdateWorldItem = vi.fn();
		mockGetInteraction = vi.fn();
		mockGetAllInteractionActions = vi.fn();

		const { useWorld, useInteraction } = await import('$lib/hooks');
		vi.mocked(useWorld).mockReturnValue({
			getOrUndefinedWorldItem: mockGetOrUndefinedWorldItem,
			updateWorldItem: mockUpdateWorldItem,
		} as any);
		vi.mocked(useInteraction).mockReturnValue({
			getInteraction: mockGetInteraction,
			getAllInteractionActions: mockGetAllInteractionActions,
		} as any);

		const { InteractionIdUtils } = await import('$lib/utils/interaction-id');
		vi.mocked(InteractionIdUtils.parse).mockReturnValue({
			type: 'item',
			interactionId: 'item-interaction-1' as any,
			interactionActionId: 'item-interaction-action-1' as any,
		});
	});

	it('path가 비어 있으면 item_pick 시작 가능하다.', () => {
		behavior.targetEntityId = 'item_item-source-1_world-item-1' as any;
		behavior.path = [];

		expect(canStartSystemItemPick(behavior)).toBe(true);
	});

	it('path가 있고 거리도 멀면 item_pick 시작 불가하다.', () => {
		const targetEntityId = 'item_item-source-1_world-item-1' as any;
		behavior.targetEntityId = targetEntityId;
		behavior.path = [{ x: 10, y: 10 } as any];
		(behavior.worldCharacterEntity as any).x = 0;
		(behavior.worldCharacterEntity as any).y = 0;
		(behavior.worldCharacterEntity as any).body.position = { x: 0, y: 0 };
		(behavior.worldCharacterEntity.worldContext as any).entities[targetEntityId] = {
			x: 100,
			y: 100,
			body: { position: { x: 100, y: 100 } },
		};

		expect(canStartSystemItemPick(behavior)).toBe(false);
	});

	it('item_pick 완료 시 world_character_id와 heldItemIds를 동기화하고 엔티티를 제거한다.', () => {
		const targetEntityId = 'item_item-source-1_world-item-1' as any;
		behavior.targetEntityId = targetEntityId;

		const removeFromWorld = vi.fn();
		(behavior.worldCharacterEntity.worldContext as any).entities[targetEntityId] = {
			removeFromWorld,
		};

		mockGetOrUndefinedWorldItem.mockReturnValue({
			id: 'world-item-1',
			world_character_id: null,
		});

		applyCompletedSystemItemPick(behavior);

		expect(mockUpdateWorldItem).toHaveBeenCalledWith('world-item-1', {
			world_character_id: 'world-character-1',
		});
		expect(behavior.worldCharacterEntity.heldItemIds).toContain('item_item-source-1_world-item-1');
		expect(removeFromWorld).toHaveBeenCalled();
	});

	it('상태가 action-ready/action-running이 아니면 item_pick tick은 아무 작업도 하지 않는다.', () => {
		behavior.interactionQueue.status = 'ready';
		const result = tickActionSystemItemPick.call(behavior, 10);

		expect(result).toBe(false);
		expect(behavior.interactionQueue.currentInteractionTargetRunningAtTick).toBeUndefined();
	});

	it('item_pick 시작 조건을 충족하면 action-ready에서 action-running으로 전환하고 시작 시각을 기록한다.', () => {
		const targetEntityId = 'item_item-source-1_world-item-1' as any;
		behavior.targetEntityId = targetEntityId;
		behavior.path = [];
		behavior.interactionQueue.status = 'action-ready';
		behavior.interactionQueue.currentInteractionTargetId =
			'item_item-interaction-1_item-interaction-action-1' as any;
		behavior.interactionQueue.currentInteractionTargetRunningAtTick = undefined;

		mockGetInteraction.mockReturnValue({ system_interaction_type: 'item_pick' });
		mockGetAllInteractionActions.mockReturnValue([
			{
				id: 'item-interaction-action-1',
				duration_ticks: 1,
			},
		]);
		mockGetOrUndefinedWorldItem.mockReturnValue({
			id: 'world-item-1',
			world_character_id: null,
		});
		(behavior.worldCharacterEntity.worldContext as any).entities[targetEntityId] = {
			removeFromWorld: vi.fn(),
		};

		const result = tickActionSystemItemPick.call(behavior, 10);
		expect(result).toBe(false);
		expect(behavior.interactionQueue.currentInteractionTargetRunningAtTick).toBe(10);
		expect(behavior.interactionQueue.status).toBe('action-running');
	});

	it('action-running에서 duration_ticks 완료 시 action-completed로 전환한다.', () => {
		const targetEntityId = 'item_item-source-1_world-item-1' as any;
		behavior.targetEntityId = targetEntityId;
		behavior.path = [];
		behavior.interactionQueue.status = 'action-running';
		behavior.interactionQueue.currentInteractionTargetId =
			'item_item-interaction-1_item-interaction-action-1' as any;
		behavior.interactionQueue.currentInteractionTargetRunningAtTick = 10;

		mockGetInteraction.mockReturnValue({ system_interaction_type: 'item_pick' });
		mockGetAllInteractionActions.mockReturnValue([
			{
				id: 'item-interaction-action-1',
				duration_ticks: 1,
			},
		]);
		mockGetOrUndefinedWorldItem.mockReturnValue({
			id: 'world-item-1',
			world_character_id: null,
		});
		(behavior.worldCharacterEntity.worldContext as any).entities[targetEntityId] = {
			removeFromWorld: vi.fn(),
		};

		tickActionSystemItemPick.call(behavior, 11);
		expect(behavior.interactionQueue.status).toBe('action-completed');
	});

	it('action-running에서 duration_ticks<=0이면 최소 1틱으로 보정해 완료를 판정한다.', () => {
		const targetEntityId = 'item_item-source-1_world-item-1' as any;
		behavior.targetEntityId = targetEntityId;
		behavior.path = [];
		behavior.interactionQueue.status = 'action-running';
		behavior.interactionQueue.currentInteractionTargetId =
			'item_item-interaction-1_item-interaction-action-1' as any;
		behavior.interactionQueue.currentInteractionTargetRunningAtTick = 10;

		mockGetInteraction.mockReturnValue({ system_interaction_type: 'item_pick' });
		mockGetAllInteractionActions.mockReturnValue([
			{
				id: 'item-interaction-action-1',
				duration_ticks: 0,
			},
		]);
		mockGetOrUndefinedWorldItem.mockReturnValue({
			id: 'world-item-1',
			world_character_id: null,
		});
		(behavior.worldCharacterEntity.worldContext as any).entities[targetEntityId] = {
			removeFromWorld: vi.fn(),
		};

		tickActionSystemItemPick.call(behavior, 10);
		expect(behavior.interactionQueue.status).toBe('action-running');
		tickActionSystemItemPick.call(behavior, 11);
		expect(behavior.interactionQueue.status).toBe('action-completed');
	});
});
