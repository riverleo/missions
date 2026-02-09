import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorldCharacterEntity } from '../world-character-entity.svelte';
import { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';
import type { BehaviorAction, EntitySourceId, ItemId } from '$lib/types';
import { vectorUtils } from '$lib/utils/vector';
import type { Entity } from '../../entity.svelte';

// Mock hooks
vi.mock('$lib/hooks', () => ({
	useBehavior: vi.fn(),
	useWorld: vi.fn(),
	useInteraction: vi.fn(),
}));

// Mock EntityIdUtils
vi.mock('$lib/utils/entity-id', () => ({
	EntityIdUtils: {
		instanceId: vi.fn((id: any) => id),
	},
}));

// Mock constants
vi.mock('$lib/constants', () => ({
	TARGET_ARRIVAL_DISTANCE: 50,
}));

// Mock vectorUtils.sortByDistance
vi.mock('$lib/utils/vector', async () => {
	const actual = await vi.importActual<typeof import('$lib/utils/vector')>('$lib/utils/vector');
	return {
		...actual,
		vectorUtils: {
			...actual.vectorUtils,
			sortByDistance: vi.fn((source: any, entities: any[]) => {
				// Sort by actual distance
				return entities.slice().sort((a, b) => {
					const distA = Math.sqrt(
						Math.pow(a.body.position.x - source.body.position.x, 2) +
							Math.pow(a.body.position.y - source.body.position.y, 2)
					);
					const distB = Math.sqrt(
						Math.pow(b.body.position.x - source.body.position.x, 2) +
							Math.pow(b.body.position.y - source.body.position.y, 2)
					);
					return distA - distB;
				});
			}),
		},
	};
});

describe('tickFindAndGo(this: WorldCharacterEntityBehavior, tick: number)', () => {
	let behavior: WorldCharacterEntityBehavior;
	let mockWorldCharacterEntity: Partial<WorldCharacterEntity>;
	let mockGetBehaviorAction: ReturnType<typeof vi.fn>;
	let mockSearchEntitySources: ReturnType<typeof vi.fn>;
	let mockGetEntitySourceId: ReturnType<typeof vi.fn>;
	let mockGetWorldItem: ReturnType<typeof vi.fn>;
	let mockGetInteractionByBehaviorAction: ReturnType<typeof vi.fn>;
	let mockPathfinder: any;
	const currentTick = 100;

	beforeEach(async () => {
		// Mock pathfinder
		mockPathfinder = {
			findPath: vi.fn().mockReturnValue([]),
		};

		// Mock WorldCharacterEntity
		mockWorldCharacterEntity = {
			id: 'character-1' as any,
			instanceId: 'world-character-1' as any,
			body: {
				position: vectorUtils.createVector(100, 100),
			} as any,
			worldContext: {
				entities: {},
				pathfinder: mockPathfinder,
			} as any,
			heldItemIds: [],
		};

		// Create behavior instance
		behavior = new WorldCharacterEntityBehavior(mockWorldCharacterEntity as WorldCharacterEntity);

		// Setup hooks mocks
		mockGetBehaviorAction = vi.fn();
		mockSearchEntitySources = vi.fn();
		mockGetEntitySourceId = vi.fn();
		mockGetWorldItem = vi.fn();
		mockGetInteractionByBehaviorAction = vi.fn();

		const { useBehavior, useWorld, useInteraction } = await import('$lib/hooks');
		vi.mocked(useBehavior).mockReturnValue({
			getBehaviorAction: mockGetBehaviorAction,
			searchEntitySources: mockSearchEntitySources,
		} as any);
		vi.mocked(useWorld).mockReturnValue({
			getEntitySourceId: mockGetEntitySourceId,
			getWorldItem: mockGetWorldItem,
		} as any);
		vi.mocked(useInteraction).mockReturnValue({
			getInteractionByBehaviorAction: mockGetInteractionByBehaviorAction,
		} as any);

		// Spy on clear method
		vi.spyOn(behavior, 'clear');
	});

	it('인터렉션이 진행 중이면 계속 진행한다', () => {
		// Given: 인터렉션이 진행 중
		behavior.interactionTargetId = 'interaction-1' as any;

		// When
		const result = behavior.tickFindAndGo(currentTick);

		// Then: false 반환 (계속 진행)
		expect(result).toBe(false);
		expect(mockGetBehaviorAction).not.toHaveBeenCalled();
	});

	it('현재 행동 타깃이 없으면 계속 진행한다', () => {
		// Given: 행동 타깃이 없음
		behavior.behaviorTargetId = undefined;

		// When
		const result = behavior.tickFindAndGo(currentTick);

		// Then: false 반환 (계속 진행)
		expect(result).toBe(false);
		expect(mockGetBehaviorAction).not.toHaveBeenCalled();
	});

	it('행동 타입이 idle이면 계속 진행한다', () => {
		// Given: idle 타입 행동
		behavior.behaviorTargetId = 'behavior-target-1' as any;
		const mockBehaviorAction: BehaviorAction = {
			id: 'action-1',
			type: 'idle',
		} as BehaviorAction;
		mockGetBehaviorAction.mockReturnValue(mockBehaviorAction);

		// When
		const result = behavior.tickFindAndGo(currentTick);

		// Then: false 반환 (계속 진행)
		expect(result).toBe(false);
	});

	describe('타겟 엔티티가 있는 경우', () => {
		beforeEach(() => {
			behavior.behaviorTargetId = 'behavior-target-1' as any;
			behavior.targetEntityId = 'entity-1' as any;
			mockGetBehaviorAction.mockReturnValue({
				id: 'action-1',
				type: 'system-item-pick',
			} as BehaviorAction);
		});

		it('타겟 엔티티를 찾을 수 없으면 중단한다', () => {
			// Given: 타겟 엔티티가 entities에 없음
			mockWorldCharacterEntity.worldContext!.entities = {};

			// When
			const result = behavior.tickFindAndGo(currentTick);

			// Then: true 반환 (중단)
			expect(result).toBe(true);
		});

		it('도착 범위 내이면 경로를 초기화하고 계속 진행한다', () => {
			// Given: 도착 범위 내 (거리 < 50)
			const mockTargetEntity: Entity = {
				id: 'entity-1' as any,
				body: {
					position: vectorUtils.createVector(130, 100), // 거리 30
				},
			} as Entity;
			behavior.worldCharacterEntity.body = {
				position: vectorUtils.createVector(100, 100),
			} as any;
			behavior.worldCharacterEntity.worldContext.entities = {
				'entity-1': mockTargetEntity,
			};
			behavior.path = [vectorUtils.createVector(120, 100)];

			// When
			const result = behavior.tickFindAndGo(currentTick);

			// Then: 경로 초기화되고 false 반환 (계속 진행)
			expect(behavior.path).toEqual([]);
			expect(result).toBe(false);
		});

		it('도착 범위 밖이면 경로를 최신화하고 중단한다', () => {
			// Given: 도착 범위 밖 (거리 >= 50)
			const mockTargetEntity: Entity = {
				id: 'entity-1' as any,
				body: {
					position: vectorUtils.createVector(200, 100), // 거리 100
				},
			} as Entity;
			mockWorldCharacterEntity.worldContext!.entities = {
				'entity-1': mockTargetEntity,
			};
			const mockPath = [vectorUtils.createVector(150, 100)];
			mockPathfinder.findPath.mockReturnValue(mockPath);

			// When
			const result = behavior.tickFindAndGo(currentTick);

			// Then: 경로 최신화되고 true 반환 (중단)
			expect(mockPathfinder.findPath).toHaveBeenCalled();
			expect(behavior.path).toEqual(mockPath);
			expect(result).toBe(true);
		});
	});

	describe('타겟 엔티티가 없는 경우', () => {
		beforeEach(() => {
			behavior.behaviorTargetId = 'behavior-target-1' as any;
			behavior.targetEntityId = undefined;
			mockGetBehaviorAction.mockReturnValue({
				id: 'action-1',
				type: 'system-item-pick',
			} as BehaviorAction);
		});

		it('들고 있는 아이템 중 사용 가능한 것이 있으면 타겟으로 설정하고 계속 진행한다', () => {
			// Given: 들고 있는 아이템이 entity source에 포함됨
			const itemId = 'item-1' as ItemId;
			const entitySourceId = 'item-source-1' as EntitySourceId;
			mockWorldCharacterEntity.heldItemIds = ['held-item-1' as any];
			mockSearchEntitySources.mockReturnValue([{ id: entitySourceId }]);
			mockGetWorldItem.mockReturnValue({ item_id: entitySourceId });

			// When
			const result = behavior.tickFindAndGo(currentTick);

			// Then: 타겟으로 설정되고 false 반환 (계속 진행)
			expect(behavior.targetEntityId).toBe('held-item-1');
			expect(behavior.path).toEqual([]);
			expect(result).toBe(false);
		});

		it('target_selection_method가 explicit인 경우 entity source로 후보를 필터링한다', () => {
			// Given: explicit 방식
			const entitySourceId = 'source-1' as EntitySourceId;
			const mockBehaviorAction: BehaviorAction = {
				id: 'action-1',
				type: 'system-item-pick',
				target_selection_method: 'explicit',
			} as BehaviorAction;
			mockGetBehaviorAction.mockReturnValue(mockBehaviorAction);
			mockSearchEntitySources.mockReturnValue([{ id: entitySourceId }]);
			mockGetInteractionByBehaviorAction.mockReturnValue({ id: 'interaction-1' });
			mockGetEntitySourceId.mockReturnValue(entitySourceId);

			const mockEntity1: Entity = {
				id: 'entity-1' as any,
				sourceId: entitySourceId,
				body: { position: vectorUtils.createVector(150, 100) },
			} as Entity;
			const mockEntity2: Entity = {
				id: 'entity-2' as any,
				sourceId: 'other-source' as EntitySourceId,
				body: { position: vectorUtils.createVector(120, 100) },
			} as Entity;
			mockWorldCharacterEntity.worldContext!.entities = {
				'character-1': mockWorldCharacterEntity as any,
				'entity-1': mockEntity1,
				'entity-2': mockEntity2,
			};

			// When
			const result = behavior.tickFindAndGo(currentTick);

			// Then: entity-1만 선택됨
			expect(behavior.targetEntityId).toBe('entity-1');
			expect(result).toBe(true);
		});

		it('target_selection_method가 search인 경우 entity sources로 후보를 필터링한다', () => {
			// Given: search 방식
			const entitySourceId1 = 'source-1' as EntitySourceId;
			const entitySourceId2 = 'source-2' as EntitySourceId;
			const mockBehaviorAction: BehaviorAction = {
				id: 'action-1',
				type: 'system-item-pick',
				target_selection_method: 'search',
			} as BehaviorAction;
			mockGetBehaviorAction.mockReturnValue(mockBehaviorAction);
			mockSearchEntitySources.mockReturnValue([{ id: entitySourceId1 }, { id: entitySourceId2 }]);

			const mockEntity1: Entity = {
				id: 'entity-1' as any,
				sourceId: entitySourceId1,
				body: { position: vectorUtils.createVector(150, 100) },
			} as Entity;
			const mockEntity2: Entity = {
				id: 'entity-2' as any,
				sourceId: entitySourceId2,
				body: { position: vectorUtils.createVector(120, 100) },
			} as Entity;
			const mockEntity3: Entity = {
				id: 'entity-3' as any,
				sourceId: 'other-source' as EntitySourceId,
				body: { position: vectorUtils.createVector(110, 100) },
			} as Entity;
			mockWorldCharacterEntity.worldContext!.entities = {
				'character-1': mockWorldCharacterEntity as any,
				'entity-1': mockEntity1,
				'entity-2': mockEntity2,
				'entity-3': mockEntity3,
			};

			// When
			const result = behavior.tickFindAndGo(currentTick);

			// Then: entity-1, entity-2만 후보가 되고 가장 가까운 entity-2 선택됨
			expect(behavior.targetEntityId).toBe('entity-2');
			expect(result).toBe(true);
		});

		it('후보가 있으면 가장 가까운 엔티티를 타겟으로 설정하고 중단한다', () => {
			// Given: 여러 후보 중 가장 가까운 것 선택
			const entitySourceId = 'source-1' as EntitySourceId;
			const mockBehaviorAction: BehaviorAction = {
				id: 'action-1',
				type: 'system-item-pick',
				target_selection_method: 'search',
			} as BehaviorAction;
			mockGetBehaviorAction.mockReturnValue(mockBehaviorAction);
			mockSearchEntitySources.mockReturnValue([{ id: entitySourceId }]);

			const mockEntity1: Entity = {
				id: 'entity-1' as any,
				sourceId: entitySourceId,
				body: { position: vectorUtils.createVector(200, 100) }, // 거리 100
			} as Entity;
			const mockEntity2: Entity = {
				id: 'entity-2' as any,
				sourceId: entitySourceId,
				body: { position: vectorUtils.createVector(120, 100) }, // 거리 20
			} as Entity;
			mockWorldCharacterEntity.worldContext!.entities = {
				'character-1': mockWorldCharacterEntity as any,
				'entity-1': mockEntity1,
				'entity-2': mockEntity2,
			};

			// When
			const result = behavior.tickFindAndGo(currentTick);

			// Then: 가장 가까운 entity-2 선택, true 반환 (중단)
			expect(behavior.targetEntityId).toBe('entity-2');
			expect(result).toBe(true);
		});

		it('후보가 없으면 초기화하고 중단한다', () => {
			// Given: 후보가 하나도 없음
			const mockBehaviorAction: BehaviorAction = {
				id: 'action-1',
				type: 'system-item-pick',
				target_selection_method: 'search',
			} as BehaviorAction;
			mockGetBehaviorAction.mockReturnValue(mockBehaviorAction);
			mockSearchEntitySources.mockReturnValue([]);
			mockWorldCharacterEntity.worldContext!.entities = {
				'character-1': mockWorldCharacterEntity as any,
			};

			// When
			const result = behavior.tickFindAndGo(currentTick);

			// Then: clear 호출되고 true 반환 (중단)
			expect(behavior.clear).toHaveBeenCalled();
			expect(result).toBe(true);
		});
	});
});
