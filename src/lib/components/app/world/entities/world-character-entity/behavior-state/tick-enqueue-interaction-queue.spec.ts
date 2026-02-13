import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorldCharacterEntity } from '../world-character-entity.svelte';
import { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';
import type {
	InteractionTargetId,
	Interaction,
	InteractionAction,
	InteractionId,
} from '$lib/types';

// Mock hooks
vi.mock('$lib/hooks', () => ({
	useInteraction: vi.fn(),
}));

// Mock InteractionIdUtils
vi.mock('$lib/utils/interaction-id', () => ({
	InteractionIdUtils: {
		parse: vi.fn(),
		create: vi.fn(),
	},
}));

describe('tickEnqueueInteractionQueue(tick: number)', () => {
	let behavior: WorldCharacterEntityBehavior;
	let mockWorldCharacterEntity: Partial<WorldCharacterEntity>;
	let mockGetInteraction: ReturnType<typeof vi.fn>;
	let mockGetRootInteractionAction: ReturnType<typeof vi.fn>;

	beforeEach(async () => {
		mockWorldCharacterEntity = {
			id: 'character_world-1_world-character-1' as any,
			instanceId: 'world-character-1' as any,
			onBodyAnimationComplete: vi.fn(() => vi.fn()),
		};

		behavior = new WorldCharacterEntityBehavior(mockWorldCharacterEntity as WorldCharacterEntity);

		mockGetInteraction = vi.fn();
		mockGetRootInteractionAction = vi.fn();

		const { useInteraction } = await import('$lib/hooks');
		vi.mocked(useInteraction).mockReturnValue({
			getInteraction: mockGetInteraction,
			getRootInteractionAction: mockGetRootInteractionAction,
		} as any);
	});

	it("상호작용 큐 상태가 '준비완료', '액션 실행중', '액션 완료' 또는 '완료'면 다음 단계로 진행한다.", () => {
		behavior.interactionQueue.status = 'ready';
		const result = behavior.tickEnqueueInteractionQueue(0);

		expect(result).toBe(false);
		expect(behavior.interactionQueue.interactionTargetIds).toHaveLength(0);

		behavior.interactionQueue.status = 'action-running';
		const result2 = behavior.tickEnqueueInteractionQueue(0);

		expect(result2).toBe(false);
		expect(behavior.interactionQueue.interactionTargetIds).toHaveLength(0);

		behavior.interactionQueue.status = 'action-completed';
		const result3 = behavior.tickEnqueueInteractionQueue(0);

		expect(result3).toBe(false);
		expect(behavior.interactionQueue.interactionTargetIds).toHaveLength(0);

		behavior.interactionQueue.status = 'completed';
		const result4 = behavior.tickEnqueueInteractionQueue(0);

		expect(result4).toBe(false);
		expect(behavior.interactionQueue.interactionTargetIds).toHaveLength(0);
	});

	it("핵심 상호작용 대상이 없으면 상태를 '완료'로 변경하고 다음 단계로 진행한다.", () => {
		behavior.interactionQueue.status = 'enqueuing';
		behavior.interactionQueue.coreInteractionTargetId = undefined;
		behavior.targetEntityId = 'item_world-1_world-item-1' as any;

		const result = behavior.tickEnqueueInteractionQueue(0);

		expect(result).toBe(false);
		expect(behavior.interactionQueue.status).toBe('completed');
	});

	it("타깃 엔티티가 없으면 상태를 '완료'로 변경하고 다음 단계로 진행한다.", () => {
		behavior.interactionQueue.status = 'enqueuing';
		behavior.interactionQueue.coreInteractionTargetId =
			'item_item-interaction-1_item-interaction-action-1' as InteractionTargetId;
		behavior.targetEntityId = undefined;

		const result = behavior.tickEnqueueInteractionQueue(0);

		expect(result).toBe(false);
		expect(behavior.interactionQueue.status).toBe('completed');
	});

	it('핵심 상호작용 대상을 파싱하여 상호작용을 가져온다.', async () => {
		const { InteractionIdUtils } = await import('$lib/utils/interaction-id');

		behavior.interactionQueue.status = 'enqueuing';
		behavior.interactionQueue.coreInteractionTargetId =
			'item_item-interaction-1_item-interaction-action-1' as InteractionTargetId;
		behavior.targetEntityId = 'item_world-1_world-item-1' as any;

		vi.mocked(InteractionIdUtils.parse).mockReturnValue({
			type: 'item',
			interactionId: 'item-interaction-1' as InteractionId,
			interactionActionId: 'item-interaction-action-1' as any,
		});

		const mockInteraction: Partial<Interaction> = {
			id: 'item-interaction-1' as any,
			once_interaction_type: null,
		};

		mockGetInteraction.mockReturnValue(mockInteraction);

		vi.mocked(InteractionIdUtils.create).mockReturnValue(
			'item_item-interaction-1_item-interaction-action-1' as InteractionTargetId
		);

		behavior.tickEnqueueInteractionQueue(0);

		expect(InteractionIdUtils.parse).toHaveBeenCalledWith(
			'item_item-interaction-1_item-interaction-action-1'
		);
		expect(mockGetInteraction).toHaveBeenCalledWith('item-interaction-1');
	});

	it("핵심 상호작용이 '아이템 사용'인 경우 '아이템 줍기' 시스템 상호작용의 시작 액션을 먼저 추가한다.", async () => {
		const { InteractionIdUtils } = await import('$lib/utils/interaction-id');

		behavior.interactionQueue.status = 'enqueuing';
		behavior.interactionQueue.coreInteractionTargetId =
			'item_item-interaction-1_item-interaction-action-1' as InteractionTargetId;
		behavior.targetEntityId = 'item_world-1_world-item-1' as any;

		vi.mocked(InteractionIdUtils.parse).mockReturnValue({
			type: 'item',
			interactionId: 'item-interaction-1' as InteractionId,
			interactionActionId: 'item-interaction-action-1' as any,
		});

		const mockCoreInteraction: Partial<Interaction> = {
			id: 'item-interaction-1' as any,
			once_interaction_type: 'item_use',
		};

		const mockPickRootAction: Partial<InteractionAction> = {
			id: 'item-interaction-action-pick' as any,
		};

		mockGetInteraction.mockReturnValue(mockCoreInteraction);
		mockGetRootInteractionAction.mockReturnValue(mockPickRootAction);

		vi.mocked(InteractionIdUtils.create).mockReturnValue(
			'item_item-interaction-pick_item-interaction-action-pick' as InteractionTargetId
		);

		behavior.tickEnqueueInteractionQueue(0);

		expect(mockGetRootInteractionAction).toHaveBeenCalledWith(
			'item_world-1_world-item-1',
			'item_pick'
		);
		expect(behavior.interactionQueue.interactionTargetIds[0]).toBe(
			'item_item-interaction-pick_item-interaction-action-pick'
		);
	});

	it('핵심 상호작용 대상을 상호작용 대상 목록에 추가한다.', async () => {
		const { InteractionIdUtils } = await import('$lib/utils/interaction-id');

		behavior.interactionQueue.status = 'enqueuing';
		behavior.interactionQueue.coreInteractionTargetId =
			'item_item-interaction-1_item-interaction-action-1' as InteractionTargetId;
		behavior.targetEntityId = 'item_world-1_world-item-1' as any;

		vi.mocked(InteractionIdUtils.parse).mockReturnValue({
			type: 'item',
			interactionId: 'item-interaction-1' as InteractionId,
			interactionActionId: 'item-interaction-action-1' as any,
		});

		const mockInteraction: Partial<Interaction> = {
			id: 'item-interaction-1' as any,
			once_interaction_type: null,
		};

		mockGetInteraction.mockReturnValue(mockInteraction);

		behavior.tickEnqueueInteractionQueue(0);

		expect(behavior.interactionQueue.interactionTargetIds).toContain(
			'item_item-interaction-1_item-interaction-action-1'
		);
	});

	it("상태를 '준비완료'로 변경한다.", async () => {
		const { InteractionIdUtils } = await import('$lib/utils/interaction-id');

		behavior.interactionQueue.status = 'enqueuing';
		behavior.interactionQueue.coreInteractionTargetId =
			'item_item-interaction-1_item-interaction-action-1' as InteractionTargetId;
		behavior.targetEntityId = 'item_world-1_world-item-1' as any;

		vi.mocked(InteractionIdUtils.parse).mockReturnValue({
			type: 'item',
			interactionId: 'item-interaction-1' as InteractionId,
			interactionActionId: 'item-interaction-action-1' as any,
		});

		const mockInteraction: Partial<Interaction> = {
			id: 'item-interaction-1' as any,
			once_interaction_type: null,
		};

		mockGetInteraction.mockReturnValue(mockInteraction);

		behavior.tickEnqueueInteractionQueue(0);

		expect(behavior.interactionQueue.status).toBe('ready');
	});

	it('항상 false를 반환하여 다음 단계로 진행한다.', async () => {
		const { InteractionIdUtils } = await import('$lib/utils/interaction-id');

		behavior.interactionQueue.status = 'enqueuing';
		behavior.interactionQueue.coreInteractionTargetId =
			'item_item-interaction-1_item-interaction-action-1' as InteractionTargetId;
		behavior.targetEntityId = 'item_world-1_world-item-1' as any;

		vi.mocked(InteractionIdUtils.parse).mockReturnValue({
			type: 'item',
			interactionId: 'item-interaction-1' as InteractionId,
			interactionActionId: 'item-interaction-action-1' as any,
		});

		const mockInteraction: Partial<Interaction> = {
			id: 'item-interaction-1' as any,
			once_interaction_type: null,
		};

		mockGetInteraction.mockReturnValue(mockInteraction);

		const result = behavior.tickEnqueueInteractionQueue(0);

		expect(result).toBe(false);
	});
});
