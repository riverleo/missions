import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorldCharacterEntity } from '../world-character-entity.svelte';
import { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';
import type { BehaviorAction } from '$lib/types';
import { vectorUtils } from '$lib/utils/vector';

// Mock useBehavior hook
vi.mock('$lib/hooks', () => ({
	useBehavior: vi.fn(),
}));

// Mock BehaviorIdUtils
vi.mock('$lib/utils/behavior-id', () => ({
	BehaviorIdUtils: {
		create: vi.fn((action: BehaviorAction) => `behavior-${action.id}` as any),
	},
}));

describe('tickNextOrClear(this: WorldCharacterEntityBehavior, tick: number)', () => {
	let behavior: WorldCharacterEntityBehavior;
	let mockWorldCharacterEntity: Partial<WorldCharacterEntity>;
	let mockGetBehaviorAction: ReturnType<typeof vi.fn>;
	let mockGetOrUndefinedNextBehaviorAction: ReturnType<typeof vi.fn>;
	const currentTick = 100;

	beforeEach(async () => {
		// Mock WorldCharacterEntity
		mockWorldCharacterEntity = {
			id: 'character-1' as any,
			instanceId: 'world-character-1' as any,
			onBodyAnimationComplete: vi.fn(() => vi.fn()),
			body: {
				position: vectorUtils.createVector(100, 100),
			} as any,
		};

		// Create behavior instance
		behavior = new WorldCharacterEntityBehavior(mockWorldCharacterEntity as WorldCharacterEntity);

		// Setup useBehavior mock
		mockGetBehaviorAction = vi.fn();
		mockGetOrUndefinedNextBehaviorAction = vi.fn();

		const { useBehavior } = await import('$lib/hooks');
		vi.mocked(useBehavior).mockReturnValue({
			getBehaviorAction: mockGetBehaviorAction,
			getOrUndefinedNextBehaviorAction: mockGetOrUndefinedNextBehaviorAction,
		} as any);

		// Spy on clear and setBehaviorTarget methods
		vi.spyOn(behavior, 'clear');
		vi.spyOn(behavior, 'setBehaviorTarget');

		// Set interactionQueue status to completed by default for most tests
		behavior.interactionQueue.status = 'completed';
	});

	it('상호작용 큐가 완료되지 않은 경우 클리어하거나 다음 행동 액션으로 넘어가지 않는다', () => {
		behavior.interactionQueue.status = 'action-running';
		behavior.behaviorTargetId = 'behavior-target-1' as any;

		behavior.tickNextOrClear(currentTick);

		expect(behavior.clear).not.toHaveBeenCalled();
		expect(behavior.setBehaviorTarget).not.toHaveBeenCalled();
	});

	it('현재 행동 타깃이 없으면 초기화하고 로직을 종료한다', () => {
		// Given: behaviorTargetId가 없음
		behavior.behaviorTargetId = undefined;

		// When
		behavior.tickNextOrClear(currentTick);

		// Then: clear 호출되고 다른 동작은 하지 않음
		expect(behavior.clear).toHaveBeenCalled();
		expect(mockGetBehaviorAction).not.toHaveBeenCalled();
	});

	it('현재 행동 액션을 찾을 수 없으면 에러가 발생한다', () => {
		// Given: behaviorTargetId는 있지만 액션을 찾을 수 없음
		behavior.behaviorTargetId = 'behavior-target-1' as any;
		mockGetBehaviorAction.mockImplementation(() => {
			throw new Error('BehaviorAction not found');
		});

		// When & Then: 에러 발생
		expect(() => {
			behavior.tickNextOrClear(currentTick);
		}).toThrow('BehaviorAction not found');
	});

	it('다음 행동 액션이 있으면 모든 상태를 초기화하고 다음 액션으로 전환한다', () => {
		// Given: 다음 행동 액션이 있음
		behavior.behaviorTargetId = 'behavior-target-1' as any;
		behavior.targetEntityId = 'entity-1' as any;
		const mockCurrentAction: BehaviorAction = { id: 'action-1' } as BehaviorAction;
		const mockNextAction: BehaviorAction = { id: 'action-2' } as BehaviorAction;
		mockGetBehaviorAction.mockReturnValue(mockCurrentAction);
		mockGetOrUndefinedNextBehaviorAction.mockReturnValue(mockNextAction);

		// When
		behavior.tickNextOrClear(currentTick);

		// Then: clear 호출되고 다음 액션으로 전환
		expect(behavior.clear).toHaveBeenCalled();
		expect(behavior.setBehaviorTarget).toHaveBeenCalledWith('behavior-action-2', currentTick);
	});

	it('다음 행동 액션이 없으면 모든 상태를 초기화하여 행동을 종료한다', () => {
		// Given: 다음 행동 액션이 없음
		behavior.behaviorTargetId = 'behavior-target-1' as any;
		behavior.targetEntityId = 'entity-1' as any;
		const mockCurrentAction: BehaviorAction = { id: 'action-1' } as BehaviorAction;
		mockGetBehaviorAction.mockReturnValue(mockCurrentAction);
		mockGetOrUndefinedNextBehaviorAction.mockReturnValue(undefined);

		// When
		behavior.tickNextOrClear(currentTick);

		// Then: clear만 호출되고 setBehaviorTarget은 호출 안 됨
		expect(behavior.clear).toHaveBeenCalled();
		expect(behavior.setBehaviorTarget).not.toHaveBeenCalled();
	});
});
