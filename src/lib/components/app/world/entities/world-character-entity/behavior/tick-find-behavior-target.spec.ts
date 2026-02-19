import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorldCharacterEntity } from '../world-character-entity.svelte';
import { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';
import type { Behavior, BehaviorAction } from '$lib/types';
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

describe('tickFindBehaviorTarget(this: WorldCharacterEntityBehavior, tick: number)', () => {
	let behavior: WorldCharacterEntityBehavior;
	let mockWorldCharacterEntity: Partial<WorldCharacterEntity>;
	let mockGetAllBehaviorsByPriority: ReturnType<typeof vi.fn>;
	let mockGetRootBehaviorAction: ReturnType<typeof vi.fn>;
	const currentTick = 100;

	beforeEach(async () => {
		// Mock WorldCharacterEntity
		mockWorldCharacterEntity = {
			id: 'character-1' as any,
			instanceId: 'world-character-1' as any,
			onBodyAnimationComplete: vi.fn(() => vi.fn()),
		};

		// Create behavior instance
		behavior = new WorldCharacterEntityBehavior(mockWorldCharacterEntity as WorldCharacterEntity);

		// Setup useBehavior mock
		mockGetAllBehaviorsByPriority = vi.fn();
		mockGetRootBehaviorAction = vi.fn();

		const { useBehavior } = await import('$lib/hooks');
		vi.mocked(useBehavior).mockReturnValue({
			getAllBehaviorsByPriority: mockGetAllBehaviorsByPriority,
			getRootBehaviorAction: mockGetRootBehaviorAction,
		} as any);

		// Spy on clear method
		vi.spyOn(behavior, 'clear');
	});

	it('우선 순위에 따라 정렬된 행동 목록은 매 틱마다 갱신된다', () => {
		// Given: 여러 번 호출될 때마다 다른 행동 목록
		const mockBehaviors1: Behavior[] = [{ id: 'behavior-1' } as Behavior];
		const mockBehaviors2: Behavior[] = [{ id: 'behavior-2' } as Behavior];
		const mockRootAction: BehaviorAction = { id: 'action-1' } as BehaviorAction;

		mockGetAllBehaviorsByPriority.mockReturnValueOnce(mockBehaviors1);
		mockGetRootBehaviorAction.mockReturnValue(mockRootAction);

		// When: 첫 번째 호출
		behavior.tickFindBehaviorTarget(currentTick);

		// Then: 첫 번째 행동 목록으로 갱신됨
		expect(behavior.behaviors).toBe(mockBehaviors1);

		// Given: 두 번째 틱에서 다른 행동 목록
		mockGetAllBehaviorsByPriority.mockReturnValueOnce(mockBehaviors2);
		behavior.behaviorTargetId = undefined; // 새로운 행동 선택을 위해 초기화

		// When: 두 번째 호출
		behavior.tickFindBehaviorTarget(currentTick + 1);

		// Then: 두 번째 행동 목록으로 갱신됨
		expect(behavior.behaviors).toBe(mockBehaviors2);
	});

	describe('진행중인 행동 타깃이 있는 경우', () => {
		beforeEach(() => {
			behavior.behaviorTargetId = 'existing-behavior-target' as any;
		});

		it('아무것도 하지 않고 계속 진행한다', () => {
			// Given: behaviorTargetId가 이미 설정됨
			const initialBehaviorTargetId = behavior.behaviorTargetId;

			// When
			const result = behavior.tickFindBehaviorTarget(currentTick);

			// Then: 상태 변경 없음, false 반환 (계속 진행)
			expect(result).toBe(false);
			expect(behavior.behaviorTargetId).toBe(initialBehaviorTargetId);
			expect(behavior.clear).not.toHaveBeenCalled();
		});
	});

	describe('진행중인 행동 타깃이 없는 경우', () => {
		beforeEach(() => {
			behavior.behaviorTargetId = undefined;
		});

		it('모든 상태를 초기화한다', () => {
			// Given: 기존 상태가 남아있음
			behavior.path = [vectorUtils.createVector(10, 20)];
			behavior.targetEntityId = 'entity-1' as any;

			const mockBehaviors: Behavior[] = [{ id: 'behavior-1' } as Behavior];
			const mockRootAction: BehaviorAction = { id: 'action-1' } as BehaviorAction;
			mockGetAllBehaviorsByPriority.mockReturnValue(mockBehaviors);
			mockGetRootBehaviorAction.mockReturnValue(mockRootAction);

			// When
			behavior.tickFindBehaviorTarget(currentTick);

			// Then: clear() 호출됨
			expect(behavior.clear).toHaveBeenCalledOnce();
		});

		it('행동 목록의 첫번째를 새로운 행동 타깃으로 설정한다', () => {
			// Given: 여러 행동이 있음
			const mockBehaviors: Behavior[] = [
				{ id: 'behavior-1', behaviorType: 'need' } as Behavior,
				{ id: 'behavior-2', behaviorType: 'condition' } as Behavior,
			];
			const mockRootAction: BehaviorAction = {
				id: 'action-1',
				behaviorType: 'need',
			} as BehaviorAction;
			mockGetAllBehaviorsByPriority.mockReturnValue(mockBehaviors);
			mockGetRootBehaviorAction.mockReturnValue(mockRootAction);

			// When
			behavior.tickFindBehaviorTarget(currentTick);

			// Then: 첫 번째 행동의 root action으로 behaviorTargetId 설정됨
			expect(mockGetRootBehaviorAction).toHaveBeenCalledWith(mockBehaviors[0]);
			expect(behavior.behaviorTargetId).toBe('behavior-action-1');
		});

		it('루트 액션이 설정될 때 행동 타깃 시작 틱을 현재 틱(useCurrent().getTick())으로 설정한다', () => {
			// Given
			const mockBehaviors: Behavior[] = [{ id: 'behavior-1' } as Behavior];
			const mockRootAction: BehaviorAction = { id: 'action-1' } as BehaviorAction;
			mockGetAllBehaviorsByPriority.mockReturnValue(mockBehaviors);
			mockGetRootBehaviorAction.mockReturnValue(mockRootAction);

			// When
			behavior.tickFindBehaviorTarget(currentTick);

			// Then
			expect(behavior.behaviorTargetStartTick).toBe(currentTick);
		});

		it('새로 지정할 행동에 루트 액션이 없는 경우 에러가 발생한다', () => {
			// Given: root action이 없음
			const mockBehaviors: Behavior[] = [{ id: 'behavior-1' } as Behavior];
			mockGetAllBehaviorsByPriority.mockReturnValue(mockBehaviors);
			mockGetRootBehaviorAction.mockReturnValue(undefined);

			// When & Then: 에러 발생
			expect(() => {
				behavior.tickFindBehaviorTarget(currentTick);
			}).toThrow();
		});

		it('행동 타깃이 지정되었다면 다음 단계로 진행한다', () => {
			// Given: 유효한 행동과 root action
			const mockBehaviors: Behavior[] = [{ id: 'behavior-1' } as Behavior];
			const mockRootAction: BehaviorAction = { id: 'action-1' } as BehaviorAction;
			mockGetAllBehaviorsByPriority.mockReturnValue(mockBehaviors);
			mockGetRootBehaviorAction.mockReturnValue(mockRootAction);

			// When
			const result = behavior.tickFindBehaviorTarget(currentTick);

			// Then: false 반환 (다음 단계로 진행)
			expect(result).toBe(false);
			expect(behavior.behaviorTargetId).toBeDefined();
		});
	});

	it('초기화는 현재 행동 타깃이 없을 때만 호출된다', () => {
		// Given: behaviorTargetId가 있는 경우
		behavior.behaviorTargetId = 'existing-behavior-target' as any;

		// When
		behavior.tickFindBehaviorTarget(currentTick);

		// Then: clear() 호출 안 됨
		expect(behavior.clear).not.toHaveBeenCalled();

		// Given: behaviorTargetId가 없는 경우
		behavior.behaviorTargetId = undefined;
		const mockBehaviors: Behavior[] = [{ id: 'behavior-1' } as Behavior];
		const mockRootAction: BehaviorAction = { id: 'action-1' } as BehaviorAction;
		mockGetAllBehaviorsByPriority.mockReturnValue(mockBehaviors);
		mockGetRootBehaviorAction.mockReturnValue(mockRootAction);
		vi.clearAllMocks();
		vi.spyOn(behavior, 'clear');

		// When
		behavior.tickFindBehaviorTarget(currentTick);

		// Then: clear() 호출됨
		expect(behavior.clear).toHaveBeenCalledOnce();
	});

	it('새로운 행동 타깃을 찾을 수 없을 경우 중단 후 처음으로 돌아간다', () => {
		// Given: 빈 행동 목록
		behavior.behaviorTargetId = undefined;
		mockGetAllBehaviorsByPriority.mockReturnValue([]);

		// When
		const result = behavior.tickFindBehaviorTarget(currentTick);

		// Then: true 반환 (중단 후 처음)
		expect(result).toBe(true);
		expect(mockGetRootBehaviorAction).not.toHaveBeenCalled();
	});
});
