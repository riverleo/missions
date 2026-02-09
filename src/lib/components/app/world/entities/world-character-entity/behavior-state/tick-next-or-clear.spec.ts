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
	let mockGetOrUndefinedBehaviorAction: ReturnType<typeof vi.fn>;
	let mockGetNextBehaviorAction: ReturnType<typeof vi.fn>;
	const currentTick = 100;

	beforeEach(async () => {
		// Mock WorldCharacterEntity
		mockWorldCharacterEntity = {
			id: 'character-1' as any,
			instanceId: 'world-character-1' as any,
			body: {
				position: vectorUtils.createVector(100, 100),
			} as any,
		};

		// Create behavior instance
		behavior = new WorldCharacterEntityBehavior(mockWorldCharacterEntity as WorldCharacterEntity);

		// Setup useBehavior mock
		mockGetOrUndefinedBehaviorAction = vi.fn();
		mockGetNextBehaviorAction = vi.fn();

		const { useBehavior } = await import('$lib/hooks');
		vi.mocked(useBehavior).mockReturnValue({
			getOrUndefinedBehaviorAction: mockGetOrUndefinedBehaviorAction,
			getNextBehaviorAction: mockGetNextBehaviorAction,
		} as any);

		// Spy on clear and setBehaviorTarget methods
		vi.spyOn(behavior, 'clear');
		vi.spyOn(behavior, 'setBehaviorTarget');
	});

	it('현재 행동 타깃이 없으면 아무것도 하지 않는다', () => {
		// Given: behaviorTargetId가 없음
		behavior.behaviorTargetId = undefined;

		// When
		behavior.tickNextOrClear(currentTick);

		// Then: 아무 동작도 하지 않음
		expect(mockGetOrUndefinedBehaviorAction).not.toHaveBeenCalled();
		expect(behavior.clear).not.toHaveBeenCalled();
	});

	it('현재 행동 액션을 찾을 수 없으면 아무것도 하지 않는다', () => {
		// Given: behaviorTargetId는 있지만 액션을 찾을 수 없음
		behavior.behaviorTargetId = 'behavior-target-1' as any;
		mockGetOrUndefinedBehaviorAction.mockReturnValue(undefined);

		// When
		behavior.tickNextOrClear(currentTick);

		// Then: clear 호출 안 됨
		expect(mockGetOrUndefinedBehaviorAction).toHaveBeenCalledWith(behavior.behaviorTargetId);
		expect(behavior.clear).not.toHaveBeenCalled();
	});

	it('경로를 초기화한다', () => {
		// Given: 현재 행동 액션이 있고 경로가 설정되어 있음
		behavior.behaviorTargetId = 'behavior-target-1' as any;
		behavior.path = [vectorUtils.createVector(150, 100), vectorUtils.createVector(200, 100)];
		const mockCurrentAction: BehaviorAction = { id: 'action-1' } as BehaviorAction;
		mockGetOrUndefinedBehaviorAction.mockReturnValue(mockCurrentAction);
		mockGetNextBehaviorAction.mockReturnValue(undefined);

		// When
		behavior.tickNextOrClear(currentTick);

		// Then: 경로가 비워짐
		expect(behavior.path).toEqual([]);
	});

	it('다음 행동 액션을 조회한다', () => {
		// Given: 현재 행동 액션이 있음
		behavior.behaviorTargetId = 'behavior-target-1' as any;
		const mockCurrentAction: BehaviorAction = { id: 'action-1' } as BehaviorAction;
		mockGetOrUndefinedBehaviorAction.mockReturnValue(mockCurrentAction);
		mockGetNextBehaviorAction.mockReturnValue(undefined);

		// When
		behavior.tickNextOrClear(currentTick);

		// Then: getNextBehaviorAction 호출됨
		expect(mockGetNextBehaviorAction).toHaveBeenCalledWith(mockCurrentAction);
	});

	it('다음 행동 액션이 있으면 모든 상태를 초기화하고 다음 액션으로 전환한다', () => {
		// Given: 다음 행동 액션이 있음
		behavior.behaviorTargetId = 'behavior-target-1' as any;
		behavior.targetEntityId = 'entity-1' as any;
		behavior.interactionTargetId = 'interaction-1' as any;
		const mockCurrentAction: BehaviorAction = { id: 'action-1' } as BehaviorAction;
		const mockNextAction: BehaviorAction = { id: 'action-2' } as BehaviorAction;
		mockGetOrUndefinedBehaviorAction.mockReturnValue(mockCurrentAction);
		mockGetNextBehaviorAction.mockReturnValue(mockNextAction);

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
		behavior.interactionTargetId = 'interaction-1' as any;
		const mockCurrentAction: BehaviorAction = { id: 'action-1' } as BehaviorAction;
		mockGetOrUndefinedBehaviorAction.mockReturnValue(mockCurrentAction);
		mockGetNextBehaviorAction.mockReturnValue(undefined);

		// When
		behavior.tickNextOrClear(currentTick);

		// Then: clear만 호출되고 setBehaviorTarget은 호출 안 됨
		expect(behavior.clear).toHaveBeenCalled();
		expect(behavior.setBehaviorTarget).not.toHaveBeenCalled();
	});
});
